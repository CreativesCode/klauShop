import {
  cartConflictResponse,
  invalidDataResponse,
  invalidJsonResponse,
} from "@/features/orders/utils/checkoutErrors";
import {
  assertCartStock,
  assertProductsFound,
  createReservation,
} from "@/features/orders/utils/inventory";
import { getDiscountedUnitPrice } from "@/features/orders/utils/pricing";
import {
  formatOrderNumber,
  generateWhatsAppOrderData,
  toCustomerData,
} from "@/features/orders/utils/whatsapp";
import { createWhatsAppOrderSchema } from "@/features/orders/validations";
import { resolveShippingZone } from "@/features/shipping/utils/resolveShippingZone";
import db from "@/lib/supabase/db";
import { ensureProfile } from "@/lib/supabase/ensureProfile";
import {
  CustomerData,
  orderLines,
  orders,
  products,
} from "@/lib/supabase/schema";
import { getURL } from "@/lib/utils";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type OrderMessageItem = Parameters<
  typeof generateWhatsAppOrderData
>[0]["items"][number];

// Response shared by a new order and a replayed request (same order number and WhatsApp link)
function buildOrderResponse(
  orderId: string,
  items: OrderMessageItem[],
  shippingCost: number | null,
  customerData: CustomerData,
) {
  const orderNumber = formatOrderNumber(orderId);
  // URL de redirección inteligente que redirige según el tipo de usuario
  const adminUrl = `${getURL()}order/${orderId}`;
  const subtotal = items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0,
  );
  const { message, url } = generateWhatsAppOrderData({
    orderNumber,
    items,
    subtotal,
    shippingCost,
    customerData,
    adminUrl,
  });

  return {
    success: true,
    orderId,
    orderNumber,
    whatsappUrl: url,
    whatsappMessage: message,
    adminUrl,
  };
}

// A retry of a checkout attempt that already created its order (e.g. the response was lost)
async function findReplayedOrder(clientRequestId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.client_request_id, clientRequestId),
  });
  if (!order) return null;

  const lines = await db
    .select({
      quantity: orderLines.quantity,
      price: orderLines.price,
      listPrice: orderLines.listPrice,
      discount: orderLines.discount,
      name: products.name,
    })
    .from(orderLines)
    .leftJoin(products, eq(products.id, orderLines.productId))
    .where(eq(orderLines.orderId, order.id));

  const items = lines.map((line) => ({
    name: line.name || "Producto",
    quantity: line.quantity,
    price: Number(line.price),
    listPrice: Number(line.listPrice || line.price),
    discount: Number(line.discount || 0),
  }));

  return buildOrderResponse(
    order.id,
    items,
    order.shipping_cost === null ? null : Number(order.shipping_cost),
    order.customer_data as CustomerData,
  );
}

export async function POST(request: Request) {
  let clientRequestId: string | undefined;

  try {
    const body = await request.json().catch(() => undefined);
    if (body === undefined) return invalidJsonResponse();

    // Validar datos de entrada
    const parsed = createWhatsAppOrderSchema.safeParse(body);

    if (parsed.success === false) {
      return invalidDataResponse(parsed.error);
    }

    const { cartItems, customerData } = parsed.data;
    clientRequestId = parsed.data.clientRequestId;

    if (clientRequestId) {
      const replayed = await findReplayedOrder(clientRequestId);
      if (replayed) return NextResponse.json(replayed, { status: 200 });
    }

    // Obtener usuario si está autenticado
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Realizar toda la operación en una transacción
    const result = await db.transaction(async (tx) => {
      // 1. Obtener información de los productos con lock para evitar race conditions
      const productIds = cartItems.map((item) => item.productId);
      const uniqueProductIds = [...new Set(productIds)]; // IDs únicos

      console.log("🔍 Buscando productos únicos:", uniqueProductIds);

      const productsData = await tx
        .select()
        .from(products)
        .where(inArray(products.id, uniqueProductIds))
        .for("update"); // SELECT FOR UPDATE - lock pesimista

      console.log("✅ Productos encontrados:", productsData.length);
      console.log(
        "📦 Productos:",
        productsData.map((p) => ({ id: p.id, name: p.name })),
      );

      // Verificar que todos los productos únicos fueron encontrados
      assertProductsFound(uniqueProductIds, productsData);

      // 2. Verificar stock (por producto, sumando variantes) dentro de la tx
      await assertCartStock(tx, cartItems, productsData);

      // Shipping cost always comes from shipping_zones, never from the client
      const shipping = await resolveShippingZone(tx, {
        zoneId: customerData.shippingZoneId,
        zoneName: customerData.zone,
      });

      // 3. Calcular subtotal
      const subtotal = cartItems.reduce((acc, item) => {
        const product = productsData.find((p) => p.id === item.productId);
        return (
          acc +
          item.quantity *
            getDiscountedUnitPrice(product?.price, product?.discount)
        );
      }, 0);

      const totalAmount = subtotal + (shipping.shippingCost ?? 0);

      // orders.user_id references profiles: make sure the logged-in customer has one
      if (user) await ensureProfile(tx, user);

      // 4. Crear la orden
      const [order] = await tx
        .insert(orders)
        .values({
          user_id: user?.id || null,
          currency: "cup",
          amount: totalAmount.toString(),
          order_status: "pending_confirmation",
          payment_status: "unpaid",
          payment_method: "whatsapp",
          customer_data: toCustomerData(customerData, shipping.zoneName),
          phone: customerData.phone,
          zone: shipping.zoneName,
          shipping_zone_id: shipping.shippingZoneId,
          shipping_cost: shipping.shippingCost?.toString() ?? null,
          name: customerData.name,
          client_request_id: clientRequestId ?? null,
        })
        .returning();

      // 5. Crear order lines
      const orderLinesData = cartItems.map((item) => {
        const product = productsData.find((p) => p.id === item.productId);
        return {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: getDiscountedUnitPrice(
            product?.price,
            product?.discount,
          ).toFixed(2),
          listPrice: product?.price || "0",
          discount: product?.discount || "0.00",
        };
      });

      await tx.insert(orderLines).values(orderLinesData);

      // 6. Crear reservas de inventario
      await Promise.all(
        cartItems.map((item) =>
          createReservation(tx, order.id, item.productId, item.quantity, {
            color: item.color || null,
            size: item.size || null,
            material: item.material || null,
          }),
        ),
      );

      return { order, productsData, shipping };
    });

    // 7. Generar mensaje de WhatsApp
    const items = cartItems.map((item) => {
      const product = result.productsData.find((p) => p.id === item.productId);
      return {
        name: product?.name || "Producto",
        quantity: item.quantity,
        price: getDiscountedUnitPrice(product?.price, product?.discount),
        listPrice: Number(product?.price || 0),
        discount: Number(product?.discount || 0),
        color: item.color || null,
        size: item.size || null,
        material: item.material || null,
      };
    });

    const response = buildOrderResponse(
      result.order.id,
      items,
      result.shipping.shippingCost,
      toCustomerData(customerData, result.shipping.zoneName),
    );

    // 8. Limpiar el carrito del usuario si está autenticado
    if (user?.id) {
      try {
        await supabase.from("carts").delete().eq("user_id", user.id);
        console.log("✅ Carrito limpiado para el usuario:", user.id);
      } catch (cartError) {
        console.error("⚠️ Error limpiando carrito (no crítico):", cartError);
        // No lanzamos error porque la orden ya fue creada exitosamente
      }
    }

    // 9. Responder con la información de la orden
    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error("Error creating WhatsApp order:", error);

    // Two retries of the same attempt raced: the other one created the order
    if (clientRequestId && error?.code === "23505") {
      const replayed = await findReplayedOrder(clientRequestId);
      if (replayed) return NextResponse.json(replayed, { status: 200 });
    }

    // Stock or catalog problems the customer can fix from the cart
    const conflict = cartConflictResponse(error);
    if (conflict) return conflict;

    // Never send raw database errors to the customer
    return NextResponse.json(
      {
        error: "Error al crear la orden",
        message:
          "No se pudo crear tu pedido. Inténtalo de nuevo en unos segundos.",
      },
      { status: 500 },
    );
  }
}
