import { Shell } from "@/components/layouts/Shell";
import { Icons } from "@/components/layouts/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OrderProgress } from "@/features/orders";
import { getOrderStatusInfo } from "@/features/orders/utils/orderStatus";
import { getPaymentStatusInfo } from "@/features/orders/utils/paymentStatus";
import { formatOrderNumber } from "@/features/orders/utils/whatsapp";
import db from "@/lib/supabase/db";
import {
  OrderStatus,
  inventoryReservations,
  medias,
  orderLines,
  orders,
  products,
} from "@/lib/supabase/schema";
import { createClient } from "@/lib/supabase/server";
import { cn, formatPrice, keytoUrl } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type TrackOrderProps = {
  params: { orderId: string };
};

async function TrackOrderPage({ params: { orderId } }: TrackOrderProps) {
  // Verificar autenticación del usuario
  const cookieStore = cookies();
  const supabase = createClient({ cookieStore });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/sign-in");
  }

  // Obtener orden desde la base de datos
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    return notFound();
  }

  // Verificar que la orden pertenezca al usuario autenticado
  if (order.user_id && order.user_id !== user.id) {
    return notFound();
  }

  // Obtener líneas de la orden con productos y medias
  const items = await db
    .select({
      id: orderLines.id,
      quantity: orderLines.quantity,
      price: orderLines.price,
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
      },
      media: {
        id: medias.id,
        key: medias.key,
        alt: medias.alt,
      },
    })
    .from(orderLines)
    .leftJoin(products, eq(orderLines.productId, products.id))
    .leftJoin(medias, eq(products.featuredImageId, medias.id))
    .where(eq(orderLines.orderId, order.id));

  // Obtener reservas de inventario (para color, size, material)
  const reservations = await db
    .select()
    .from(inventoryReservations)
    .where(eq(inventoryReservations.orderId, order.id));

  const orderNumber = formatOrderNumber(order.id);
  const customerData = order.customer_data as any;
  const rawOrderStatus = (order.order_status ||
    "pending_confirmation") as OrderStatus;
  // Evita inconsistencias visuales si existe alguna orden vieja desincronizada:
  // "paid" implica pago confirmado; si payment_status no es "paid", mostramos "pending_payment".
  const orderStatus =
    rawOrderStatus === "paid" && order.payment_status !== "paid"
      ? ("pending_payment" as const)
      : rawOrderStatus;
  const statusInfo = getOrderStatusInfo(orderStatus);
  const StatusIcon = statusInfo?.icon;
  const paymentInfo = getPaymentStatusInfo(order.payment_status);

  return (
    <Shell className="max-w-screen-2xl mx-auto">
      <div className="space-y-6">
        <div className="mb-4">
          <Link href="/orders">
            <Button variant="outline" className="gap-2">
              <Icons.chevronLeft className="h-4 w-4" />
              Ver todas las órdenes
            </Button>
          </Link>
        </div>
        {/* Header con estado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Orden {orderNumber}</h1>
            <p className="text-muted-foreground mt-1">
              Creada el{" "}
              {new Date(order.createdAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {statusInfo && (
            <Badge
              variant="outline"
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-base w-fit rounded-md",
                statusInfo.color,
                statusInfo.bgColor,
                statusInfo.borderColor,
              )}
            >
              {StatusIcon && <StatusIcon className="h-5 w-5" />}
              <span className="font-medium">{statusInfo.label}</span>
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        {statusInfo && <OrderProgress status={orderStatus} />}

        {/* Productos */}
        <Card>
          <CardHeader className="font-semibold text-lg">
            Productos de la Orden
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => {
              const reservation = reservations.find(
                (r) => r.productId === item.product?.id,
              );

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  {item.media && (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={keytoUrl(item.media.key)}
                        alt={item.media.alt}
                        width={96}
                        height={96}
                        className="object-cover w-24 h-24 rounded-md"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div>
                      <Link
                        href={`/shop/${item.product?.slug}`}
                        className="font-medium hover:underline text-blue-600"
                      >
                        {item.product?.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cantidad: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    {reservation && (
                      <div className="flex flex-wrap gap-3 text-sm">
                        {reservation.color && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">
                              Color:
                            </span>
                            <div
                              className="h-4 w-4 rounded-full border"
                              style={{ backgroundColor: reservation.color }}
                            />
                          </div>
                        )}
                        {reservation.size && (
                          <div>
                            <span className="text-muted-foreground">
                              Tamaño:
                            </span>{" "}
                            <span className="font-medium">
                              {reservation.size}
                            </span>
                          </div>
                        )}
                        {reservation.material && (
                          <div>
                            <span className="text-muted-foreground">
                              Material:
                            </span>{" "}
                            <span className="font-medium">
                              {reservation.material}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <CardHeader className="font-semibold">
              Información de Envío
            </CardHeader>
            <CardContent className="space-y-3">
              {customerData?.name && (
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{customerData.name}</p>
                </div>
              )}
              {customerData?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="text-sm">{customerData.phone}</p>
                </div>
              )}
              {customerData?.zone && (
                <div>
                  <p className="text-sm text-muted-foreground">Zona</p>
                  <p className="text-sm font-medium">{customerData.zone}</p>
                </div>
              )}
              {customerData?.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="text-sm">{customerData.address}</p>
                </div>
              )}
              {customerData?.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="text-sm italic">{customerData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="font-semibold">Resumen de Pago</CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatPrice(order.amount)}</span>
              </div>
              {order.shipping_cost && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío:</span>
                  <span>{formatPrice(order.shipping_cost)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total:</span>
                <span>
                  {formatPrice(
                    Number(order.amount) + Number(order.shipping_cost || 0),
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="font-semibold">Estado de Pago</CardHeader>
            <CardContent className="space-y-2">
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">Estado del pago</p>
                <Badge
                  variant={paymentInfo.badgeVariant}
                  className="text-sm mt-1"
                >
                  {paymentInfo.label}
                </Badge>
              </div>
              {order.payment_method && (
                <p className="text-sm text-muted-foreground mt-2">
                  Método: {order.payment_method}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

export default TrackOrderPage;
