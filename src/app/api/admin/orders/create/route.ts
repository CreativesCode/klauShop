import {
  createReservation,
  getAvailableStock,
} from "@/features/orders/utils/inventory";
import { getDiscountedUnitPrice } from "@/features/orders/utils/pricing";
import {
  formatOrderNumber,
  generateWhatsAppOrderData,
} from "@/features/orders/utils/whatsapp";
import { createWhatsAppOrderSchema } from "@/features/orders/validations";
import db from "@/lib/supabase/db";
import {
  CustomerData,
  orderLines,
  orders,
  products,
} from "@/lib/supabase/schema";
import { getURL } from "@/lib/utils";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Verificar que el usuario sea admin
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!user.app_metadata?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();

    // Validar datos de entrada (mismo contrato que WhatsApp checkout)
    const parsed = createWhatsAppOrderSchema.safeParse(body);

    if (parsed.success === false) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.errors,
        },
        { status: 400 },
      );
    }

    const { cartItems, customerData, shippingCost } = parsed.data;

    // Transacción: crear orden + líneas + reservas
    const result = await db.transaction(async (tx) => {
      const productIds = cartItems.map((item) => item.productId);
      const uniqueProductIds = [...new Set(productIds)];

      // Lock pesimista de productos para evitar race conditions
      const productsData = await tx
        .select()
        .from(products)
        .where(inArray(products.id, uniqueProductIds))
        .for("update");

      if (productsData.length !== uniqueProductIds.length) {
        const foundIds = productsData.map((p) => p.id);
        const missingIds = uniqueProductIds.filter(
          (id) => !foundIds.includes(id),
        );
        throw new Error(`Productos no encontrados: ${missingIds.join(", ")}`);
      }

      // Verificar stock para cada ítem
      const stockChecks = await Promise.all(
        cartItems.map(async (item) => {
          const available = await getAvailableStock(item.productId, {
            color: item.color || null,
            size: item.size || null,
            material: item.material || null,
          });

          return {
            productId: item.productId,
            requested: item.quantity,
            available,
            hasStock: available >= item.quantity,
          };
        }),
      );

      const outOfStock = stockChecks.filter((check) => !check.hasStock);
      if (outOfStock.length > 0) {
        const product = productsData.find(
          (p) => p.id === outOfStock[0].productId,
        );
        throw new Error(
          `OUT_OF_STOCK: ${product?.name || "Producto"} - Disponible: ${outOfStock[0].available}, Solicitado: ${outOfStock[0].requested}`,
        );
      }

      const subtotal = cartItems.reduce((acc, item) => {
        const product = productsData.find((p) => p.id === item.productId);
        return (
          acc +
          item.quantity *
            getDiscountedUnitPrice(product?.price, product?.discount)
        );
      }, 0);

      const totalAmount = subtotal + (shippingCost || 0);

      const [order] = await tx
        .insert(orders)
        .values({
          // En admin no asociamos la orden al usuario admin
          user_id: null,
          currency: "cup",
          amount: totalAmount.toString(),
          order_status: "pending_confirmation",
          payment_status: "unpaid",
          payment_method: "whatsapp",
          customer_data: customerData as CustomerData,
          phone: customerData.phone,
          zone: customerData.zone,
          shipping_cost: shippingCost?.toString() || null,
          name: customerData.name,
        })
        .returning();

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

      await Promise.all(
        cartItems.map((item) =>
          createReservation(tx, order.id, item.productId, item.quantity, {
            color: item.color || null,
            size: item.size || null,
            material: item.material || null,
          }),
        ),
      );

      return { order, productsData };
    });

    // Generar mensaje/URL de WhatsApp (mismo formato que checkout)
    const orderNumber = formatOrderNumber(result.order.id);
    // URL de redirección inteligente que redirige según el tipo de usuario
    const orderRedirectUrl = `${getURL()}order/${result.order.id}`;

    const items = parsed.data.cartItems.map((item) => {
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

    const subtotal = items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0,
    );

    const { message, url } = generateWhatsAppOrderData({
      orderNumber,
      items,
      subtotal,
      shippingCost,
      customerData: customerData as CustomerData,
      adminUrl: orderRedirectUrl,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: result.order.id,
        orderNumber,
        whatsappUrl: url,
        whatsappMessage: message,
        adminUrl: orderRedirectUrl,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating admin order:", error);

    if (error.message?.startsWith("OUT_OF_STOCK")) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_STOCK",
          message: error.message,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Error al crear la orden",
        message: error.message || "Error desconocido",
      },
      { status: 500 },
    );
  }
}
