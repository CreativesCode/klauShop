import AdminShell from "@/components/admin/AdminShell";
import { Icons } from "@/components/layouts/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderLinePrice } from "@/features/orders";
import { DeleteOrderDialog } from "@/features/orders/components/admin/DeleteOrderDialog";
import OrderStatusChanger from "@/features/orders/components/admin/OrderStatusChanger";
import ShippingCostEditor from "@/features/orders/components/admin/ShippingCostEditor";
import { getOrderStatusInfo } from "@/features/orders/utils/orderStatus";
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
import { formatPrice, keytoUrl } from "@/lib/utils";
import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * Genera la URL de WhatsApp para un número de teléfono
 * @param phoneNumber - Número de teléfono (puede incluir caracteres especiales)
 * @returns URL de WhatsApp
 */
function getWhatsAppUrl(phoneNumber: string): string {
  // Remover todos los caracteres no numéricos excepto el +
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");
  // Si no tiene código de país, asumir que es de Cuba (+53)
  const phone = cleaned.startsWith("+") ? cleaned : `+53${cleaned}`;
  return `https://wa.me/${phone.replace(/\+/g, "")}`;
}

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
      listPrice: orderLines.listPrice,
      discount: orderLines.discount,
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

  // Obtener reservas de inventario (para color, size, material)
  const reservations = await db
    .select()
    .from(inventoryReservations)
    .where(eq(inventoryReservations.orderId, order.id));

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
  const subtotal = items.reduce((acc, item) => {
    return acc + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);
  const shippingCost =
    order.shipping_cost === null || order.shipping_cost === undefined
      ? null
      : Number(order.shipping_cost);

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
      <div className="grid gap-6 md:grid-cols-3 mb-6">
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
                    className={`mt-1 rounded-md px-2 py-1 ${statusInfo.color} ${statusInfo.borderColor}`}
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
                    className="mt-1 rounded-md px-2 py-1"
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
                        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={keytoUrl(item.media.key)}
                            alt={item.media.alt}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Cantidad: {item.quantity}
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
                        <OrderLinePrice
                          price={item.price}
                          listPrice={item.listPrice}
                          discount={item.discount}
                          className="font-medium justify-end"
                        />
                        <p className="text-sm text-muted-foreground">c/u</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span>
                    {shippingCost === null
                      ? "Por definir"
                      : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="pt-2">
                  <ShippingCostEditor
                    orderId={order.id}
                    currentShippingCost={shippingCost}
                  />
                </div>

                <Separator />
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

          {/* Eliminar Orden */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Peligrosas</CardTitle>
            </CardHeader>
            <CardContent>
              <DeleteOrderDialog orderId={order.id} variant="button" />
            </CardContent>
          </Card>

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
                  <a
                    href={getWhatsAppUrl(
                      customerData?.phone || order.phone || "",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                  >
                    {customerData?.phone || order.phone}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </a>
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
