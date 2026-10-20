import AdminShell from "@/components/admin/AdminShell";
import { Icons } from "@/components/layouts/icons";
import { OrderProgress, StatusPill } from "@/features/orders";
import { DeleteOrderDialog } from "@/features/orders/components/admin/DeleteOrderDialog";
import OrderStatusChanger from "@/features/orders/components/admin/OrderStatusChanger";
import ShippingCostEditor from "@/features/orders/components/admin/ShippingCostEditor";
import {
  formatOrderTotal,
  formatShipping,
  getOrderTotals,
} from "@/features/orders/utils/pricing";
import {
  getPaymentMethodLabel,
  getPaymentStatusInfo,
  needsRefund,
} from "@/features/orders/utils/paymentStatus";
import { formatOrderNumber } from "@/features/orders/utils/whatsapp";
import { colorName } from "@/lib/colorName";
import db from "@/lib/supabase/db";
import {
  OrderStatus,
  medias,
  orderLines,
  orders,
  products,
} from "@/lib/supabase/schema";
import { cn, formatCUP, getNameInitials, keytoUrl } from "@/lib/utils";
import { eq, sql } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * WhatsApp chat with the customer (api.whatsapp.com: wa.me breaks emojis)
 * @param phoneNumber - Número de teléfono (puede incluir caracteres especiales)
 */
function getWhatsAppUrl(phoneNumber: string): string {
  // Remover todos los caracteres no numéricos excepto el +
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");
  // Si no tiene código de país, asumir que es de Cuba (+53)
  const phone = cleaned.startsWith("+") ? cleaned : `+53${cleaned}`;
  return `https://api.whatsapp.com/send?phone=${phone.replace(/\+/g, "")}`;
}

const PAYMENT_TEXT: Record<string, string> = {
  paid: "text-green-700",
  unpaid: "text-red-700",
};

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
      color: orderLines.color,
      size: orderLines.size,
      material: orderLines.material,
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

  // Registered customer: how many orders they placed
  const customerOrders = order.user_id
    ? Number(
        (
          await db
            .select({ total: sql<number>`COUNT(*)` })
            .from(orders)
            .where(eq(orders.user_id, order.user_id))
        )[0]?.total ?? 0,
      )
    : null;

  const orderNumber = formatOrderNumber(order.id);
  const customerData = order.customer_data as any;
  const orderStatus = (order.order_status ||
    "pending_confirmation") as OrderStatus;
  const paymentInfo = getPaymentStatusInfo(
    order.payment_status,
    order.order_status,
  );
  const { subtotal, shippingCost, total } = getOrderTotals(order);
  const isPending =
    orderStatus === "pending_confirmation" || orderStatus === "pending_payment";
  const isPaid = order.payment_status === "paid";

  const customerName = customerData?.name || order.name || "Cliente";
  const phone = customerData?.phone || order.phone;
  const zone = customerData?.zone || order.zone;
  const createdAt = new Date(order.createdAt);
  const longDate = `${createdAt.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Havana",
  })} · ${createdAt.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Havana",
  })}`;

  const details = [
    { label: "Teléfono", value: phone },
    { label: "Zona", value: zone },
    { label: "Dirección", value: customerData?.address },
    { label: "Email", value: order.email },
  ].filter((d) => d.value);

  return (
    <AdminShell
      breadcrumb={[
        { label: "Órdenes", href: "/admin/orders" },
        { label: orderNumber },
      ]}
      heading={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          Orden {orderNumber}
          <StatusPill status={orderStatus} size="md" />
          <span className="text-sm font-semibold tracking-normal text-neutral-500">
            {longDate}
          </span>
        </span>
      }
    >
      <OrderProgress status={orderStatus} />

      <div className="flex flex-wrap items-start gap-[18px]">
        {/* Main column */}
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-[18px]">
          <section className="overflow-hidden rounded-[18px] border border-line bg-white">
            <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
              <h2 className="text-[15px] font-extrabold text-ink">
                Productos{" "}
                <span className="font-semibold text-neutral-500">
                  ({items.length})
                </span>
              </h2>
              {orderStatus !== "cancelled" && (
                <span className="text-xs font-bold text-neutral-500">
                  {isPaid ? "Stock descontado" : "Stock reservado"}
                </span>
              )}
            </div>
            <ul>
              {items.map((item) => {
                const discount = Number(item.discount || 0);
                const unit = Number(item.price);
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3.5 border-t border-line-soft px-5 py-3.5"
                  >
                    <span className="relative h-[72px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-surface-tint">
                      {item.media && (
                        <Image
                          src={keytoUrl(item.media.key)}
                          alt={item.media.alt || ""}
                          fill
                          sizes="60px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      {item.product ? (
                        <Link
                          href={`/admin/products/${item.product.id}`}
                          className="text-sm font-bold text-ink hover:text-primary"
                        >
                          {item.product.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-bold text-neutral-500">
                          Producto eliminado
                        </span>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {item.size && (
                          <span className="rounded-md bg-surface-soft px-2 py-0.5 text-xs font-semibold text-neutral-700">
                            Talla {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="flex items-center gap-1 rounded-md bg-surface-soft px-2 py-0.5 text-xs font-semibold capitalize text-neutral-700">
                            <span
                              className="size-2.5 rounded-full ring-1 ring-inset ring-black/10"
                              style={{ backgroundColor: item.color }}
                              aria-hidden
                            />
                            {colorName(item.color)}
                          </span>
                        )}
                        {item.material && (
                          <span className="rounded-md bg-surface-soft px-2 py-0.5 text-xs font-semibold text-neutral-700">
                            {item.material}
                          </span>
                        )}
                        <span className="rounded-md bg-surface-soft px-2 py-0.5 text-xs font-semibold text-neutral-700">
                          Cant. {item.quantity}
                        </span>
                        {discount > 0 && (
                          <span className="rounded-md bg-accent-50 px-2 py-0.5 text-xs font-bold text-accent-700">
                            -{discount}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right tabular-nums">
                      <p className="text-sm font-extrabold text-ink">
                        {formatCUP(unit * item.quantity)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatCUP(unit)} c/u
                        {discount > 0 && item.listPrice != null && (
                          <span className="ml-1 line-through">
                            {formatCUP(item.listPrice)}
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="flex flex-col gap-2 border-t border-line bg-surface-hover px-5 py-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-600">Subtotal</dt>
                <dd className="tabular-nums text-ink">{formatCUP(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-600">
                  Envío{order.zone ? ` · ${order.zone}` : ""}
                </dt>
                <dd
                  className={cn(
                    "text-right tabular-nums",
                    shippingCost === null
                      ? "font-bold text-accent-700"
                      : "text-ink",
                  )}
                >
                  {shippingCost === null
                    ? "Por acordar"
                    : shippingCost === 0
                      ? formatShipping(shippingCost, order.zone) ===
                        "Recogida en tienda"
                        ? "Recogida en tienda"
                        : "Gratis"
                      : formatCUP(shippingCost)}
                </dd>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line pt-3">
                <dt className="text-lg font-extrabold text-ink">Total</dt>
                <dd className="text-lg font-extrabold tabular-nums text-ink">
                  {formatOrderTotal(total, shippingCost)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Shipping is final once the order is paid (the API rejects it too) */}
          {isPending && (
            <ShippingCostEditor
              orderId={order.id}
              currentShippingCost={shippingCost}
            />
          )}
        </div>

        {/* Side column: first on phones (it is what each order needs) */}
        <div className="order-first flex min-w-0 flex-[1_1_320px] flex-col gap-[18px] lg:order-none">
          <OrderStatusChanger
            orderId={order.id}
            currentStatus={orderStatus}
            paymentStatus={order.payment_status}
            shippingPending={shippingCost === null}
          />

          <section className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-extrabold text-primary-700">
                {getNameInitials(customerName) || "?"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold text-ink">
                  {customerName}
                </p>
                <p className="text-[13px] text-neutral-500">
                  {customerOrders === null
                    ? "Invitado"
                    : `Con cuenta · ${customerOrders} pedido${customerOrders === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>
            {phone && (
              <a
                href={getWhatsAppUrl(phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-50 text-sm font-extrabold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <Icons.whatsapp className="size-[18px]" aria-hidden />
                Escribir por WhatsApp
              </a>
            )}
            {details.length > 0 && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {details.map((d) => (
                  <div key={d.label} className="contents">
                    <dt className="font-semibold text-neutral-500">
                      {d.label}
                    </dt>
                    <dd className="min-w-0 break-words font-semibold text-ink">
                      {d.label === "Teléfono" ? (
                        <a href={`tel:${String(d.value).replace(/\s/g, "")}`}>
                          {d.value}
                        </a>
                      ) : (
                        d.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {customerData?.notes && (
              <div className="rounded-xl bg-cream px-3.5 py-3 text-sm">
                <p className="font-bold text-ink">Nota del cliente</p>
                <p className="mt-0.5 whitespace-pre-line text-neutral-600">
                  {customerData.notes}
                </p>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-2 rounded-[18px] border border-line bg-white p-5 text-sm">
            <h2 className="mb-1 text-[15px] font-extrabold text-ink">Pago</h2>
            <div className="flex justify-between gap-3">
              <span className="text-neutral-600">Método</span>
              <span className="font-semibold text-ink">
                {getPaymentMethodLabel(order.payment_method)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-neutral-600">Estado</span>
              <span
                className={cn(
                  "font-bold",
                  needsRefund(order.order_status, order.payment_status)
                    ? "text-amber-700"
                    : PAYMENT_TEXT[order.payment_status || "unpaid"] ??
                        "text-neutral-500",
                )}
              >
                {paymentInfo.label}
              </span>
            </div>
          </section>

          <div className="hidden justify-center lg:flex">
            <DeleteOrderDialog orderId={order.id} variant="text" />
          </div>
        </div>
      </div>

      {/* Delete stays at the very end on phones */}
      <div className="flex justify-center lg:hidden">
        <DeleteOrderDialog orderId={order.id} variant="text" />
      </div>
    </AdminShell>
  );
}
