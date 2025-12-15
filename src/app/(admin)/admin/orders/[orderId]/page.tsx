import AdminShell from "@/components/admin/AdminShell";
import { Icons } from "@/components/layouts/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import OrderStatusChanger from "@/features/orders/components/admin/OrderStatusChanger";
import { getOrderStatusInfo } from "@/features/orders/utils/orderStatus";
import { formatOrderNumber } from "@/features/orders/utils/whatsapp";
import db from "@/lib/supabase/db";
import {
  OrderStatus,
  medias,
  orderLines,
  orders,
  products,
} from "@/lib/supabase/schema";
import { formatPrice, keytoUrl } from "@/lib/utils";
import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type AdminOrderDetailPageProps = {
  params: {
    orderId: string;
  };
};

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  // Obtener orden directamente desde la base de datos
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, params.orderId),
  });

  if (!order) {
    return notFound();
  }

  // Obtener líneas de la orden con productos
  const items = await db
    .select({
      id: orderLines.id,
      quantity: orderLines.quantity,
      price: orderLines.price,
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
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

  const orderNumber = formatOrderNumber(order.id);
  const customerData = order.customer_data as any;
  const orderStatus = (order.order_status ||
    "pending_confirmation") as OrderStatus;
  const statusInfo = getOrderStatusInfo(orderStatus) || {
    label: "Desconocido",
    description: "Estado desconocido",
    icon: () => null,
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
  };
  const StatusIcon = statusInfo.icon;

  return (
    <AdminShell
      heading={`Orden ${orderNumber}`}
      description="Detalles y gestión de la orden"
    >
      <div className="mb-6">
        <Link href="/admin/orders">
          <Button variant="outline" className="gap-2">
            <Icons.chevronLeft className="h-4 w-4" />
            Ver todas las órdenes
          </Button>
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {/* Columna principal - Detalles */}
        <div className="md:col-span-2 space-y-6">
          {/* Información general */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Número de Orden
                  </p>
                  <p className="font-medium">{orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estado del Pedido
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${statusInfo.color} ${statusInfo.borderColor}`}
                  >
                    <StatusIcon size={14} className="mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estado de Pago
                  </p>
                  <Badge
                    variant={
                      order.payment_status === "paid" ? "default" : "secondary"
                    }
                    className="mt-1"
                  >
                    {order.payment_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Método de Pago
                  </p>
                  <p className="font-medium">{order.payment_method || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0"
                  >
                    {item.media && (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden">
                        <Image
                          src={keytoUrl(item.media.key)}
                          alt={item.media.alt}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(Number(item.price))}
                      </p>
                      <p className="text-sm text-muted-foreground">c/u</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                {order.shipping_cost && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>
                        {formatPrice(
                          Number(order.amount) - Number(order.shipping_cost),
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Envío</span>
                      <span>{formatPrice(Number(order.shipping_cost))}</span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(Number(order.amount))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral - Cliente y acciones */}
        <div className="space-y-6">
          {/* Cambiar Estado */}
          <OrderStatusChanger
            orderId={order.id}
            currentStatus={orderStatus}
            paymentStatus={order.payment_status}
          />

          {/* Información del cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">
                  {customerData?.name || order.name || "N/A"}
                </p>
              </div>
              {(customerData?.phone || order.phone) && (
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">
                    {customerData?.phone || order.phone}
                  </p>
                </div>
              )}
              {(customerData?.zone || order.zone) && (
                <div>
                  <p className="text-sm text-muted-foreground">Zona</p>
                  <p className="font-medium">
                    {customerData?.zone || order.zone}
                  </p>
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
                  <p className="text-sm">{customerData.notes}</p>
                </div>
              )}
              {order.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
