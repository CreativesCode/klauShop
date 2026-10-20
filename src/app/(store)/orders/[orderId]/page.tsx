import { signInRedirect } from "@/lib/safeRedirect";
import { Shell } from "@/components/layouts/Shell";
import { OrderLinePrice, OrderProgress, StatusPill } from "@/features/orders";
import { getOrderStatusInfo } from "@/features/orders/utils/orderStatus";
import {
  formatOrderTotal,
  formatShipping,
  getOrderTotals,
} from "@/features/orders/utils/pricing";
import {
  getPaymentMethodLabel,
  getPaymentStatusInfo,
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
import { createClient } from "@/lib/supabase/server";
import { cn, formatCUP, keytoUrl } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RefreshOnFocus } from "@/features/orders/components/RefreshOnFocus";

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
    redirect(signInRedirect(`/orders/${orderId}`));
  }

  // Obtener orden desde la base de datos
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    return notFound();
  }

  // Only the owner (or an admin) sees it; guest orders have no owner to match
  if (order.user_id !== user.id && !user.app_metadata?.isAdmin) {
    return notFound();
  }

  // Obtener líneas de la orden con productos y medias
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
  const paymentInfo = getPaymentStatusInfo(
    order.payment_status,
    order.order_status,
  );
  const { subtotal, shippingCost, total: amountNumber } = getOrderTotals(order);

  const details = [
    { label: "Nombre", value: customerData?.name },
    { label: "Teléfono", value: customerData?.phone },
    { label: "Zona", value: customerData?.zone },
    { label: "Dirección", value: customerData?.address },
  ].filter((d) => d.value);

  return (
    <Shell>
      <RefreshOnFocus />
      <nav
        aria-label="Ruta"
        className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-500"
      >
        <Link href="/orders" className="hover:text-primary-700">
          Mis órdenes
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink">{orderNumber}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h1 className="text-[clamp(24px,2.6vw,34px)] font-extrabold tracking-[-0.02em] text-ink">
          Orden {orderNumber}
        </h1>
        {statusInfo && <StatusPill status={orderStatus} size="md" />}
        <p className="w-full text-sm text-neutral-500 sm:w-auto">
          Creada el{" "}
          {new Date(order.createdAt).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {statusInfo && <OrderProgress status={orderStatus} />}

      <div className="flex flex-wrap items-start gap-[18px]">
        <section className="min-w-0 flex-[2_1_520px] overflow-hidden rounded-[18px] border border-line bg-white">
          <h2 className="px-5 pb-3 pt-5 text-[15px] font-extrabold text-ink">
            Productos de la orden
          </h2>
          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3.5 border-t border-line-soft px-5 py-3.5"
              >
                <span className="relative h-[72px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-surface-tint">
                  {item.media && (
                    <Image
                      src={keytoUrl(item.media.key)}
                      alt={item.media.alt || item.product?.name || ""}
                      fill
                      sizes="60px"
                      className="object-cover"
                    />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Link
                    href={`/shop/${item.product?.slug}`}
                    className="text-sm font-bold text-ink hover:text-primary"
                  >
                    {item.product?.name}
                  </Link>
                  <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-neutral-700">
                    {item.size && (
                      <span className="rounded-md bg-surface-soft px-2 py-0.5">
                        Talla {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className="flex items-center gap-1 rounded-md bg-surface-soft px-2 py-0.5 capitalize">
                        <span
                          className="size-2.5 rounded-full ring-1 ring-inset ring-black/10"
                          style={{ backgroundColor: item.color }}
                          aria-hidden
                        />
                        {colorName(item.color)}
                      </span>
                    )}
                    {item.material && (
                      <span className="rounded-md bg-surface-soft px-2 py-0.5">
                        {item.material}
                      </span>
                    )}
                    <span className="rounded-md bg-surface-soft px-2 py-0.5">
                      Cant. {item.quantity}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    <OrderLinePrice
                      price={item.price}
                      listPrice={item.listPrice}
                      discount={item.discount}
                    />{" "}
                    c/u
                  </p>
                </div>
                <span className="shrink-0 text-sm font-extrabold tabular-nums text-ink">
                  {formatCUP(Number(item.price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-2 border-t border-line bg-surface-hover px-5 py-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="tabular-nums text-ink">{formatCUP(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-600">Envío</dt>
              <dd
                className={cn(
                  "text-right",
                  shippingCost === null
                    ? "font-bold text-accent-700"
                    : "text-ink",
                )}
              >
                {formatShipping(shippingCost, order.zone)}
              </dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line pt-3">
              <dt className="text-lg font-extrabold text-ink">Total</dt>
              <dd className="text-lg font-extrabold tabular-nums text-ink">
                {formatOrderTotal(amountNumber, shippingCost)}
              </dd>
            </div>
          </dl>
        </section>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-[18px]">
          {details.length > 0 && (
            <section className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5">
              <h2 className="text-[15px] font-extrabold text-ink">Entrega</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {details.map((d) => (
                  <div key={d.label} className="contents">
                    <dt className="font-semibold text-neutral-500">
                      {d.label}
                    </dt>
                    <dd className="min-w-0 break-words font-semibold text-ink">
                      {d.value}
                    </dd>
                  </div>
                ))}
              </dl>
              {customerData?.notes && (
                <div className="rounded-xl bg-cream px-3.5 py-3 text-sm">
                  <p className="font-bold text-ink">Tu nota</p>
                  <p className="mt-0.5 whitespace-pre-line text-neutral-600">
                    {customerData.notes}
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="flex flex-col gap-2 rounded-[18px] border border-line bg-white p-5 text-sm">
            <h2 className="mb-1 text-[15px] font-extrabold text-ink">Pago</h2>
            {order.payment_method && (
              <div className="flex justify-between gap-3">
                <span className="text-neutral-600">Método</span>
                <span className="font-semibold text-ink">
                  {getPaymentMethodLabel(order.payment_method)}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-neutral-600">Estado</span>
              <span
                className={cn(
                  "font-bold",
                  order.payment_status === "paid"
                    ? "text-green-700"
                    : paymentInfo.className
                      ? "text-amber-700"
                      : "text-neutral-700",
                )}
              >
                {paymentInfo.label}
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              El pago se coordina por WhatsApp, fuera de la tienda.
            </p>
          </section>
        </div>
      </div>
    </Shell>
  );
}

export default TrackOrderPage;
