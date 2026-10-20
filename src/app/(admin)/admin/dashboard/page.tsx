import { StatCard } from "@/components/admin/StatCard";
import { Icons } from "@/components/layouts/icons";
import { buttonVariants } from "@/components/ui/button";
import { DashboardRangePicker, Overview } from "@/features/cms";
import { RecentOrdersCard, RecentOrderRow } from "@/features/orders/admin";
import {
  ORDER_STATUS_INFO,
  getOrderStatusInfo,
} from "@/features/orders/utils/orderStatus";
import { formatOrderNumber } from "@/features/orders/utils/whatsapp";
import { getCurrentUser } from "@/features/users/actions";
import db from "@/lib/supabase/db";
import {
  OrderStatus,
  collections,
  medias,
  orderLines,
  orders,
  products,
} from "@/lib/supabase/schema";
import { cn, formatCUP, keytoUrl } from "@/lib/utils";
import {
  addDays,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  and,
  between,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Panel administrativo con métricas reales del sitio.",
};

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

type DashboardPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getSearchParam(
  searchParams: DashboardPageProps["searchParams"],
  key: string,
): string | null {
  const raw = searchParams?.[key];
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

const PENDING_STATUSES: OrderStatus[] = [
  "pending_confirmation",
  "pending_payment",
];

// Paid and not cancelled: what counts as revenue
const paidInRange = (from: Date, toExclusive: Date) =>
  and(
    eq(orders.payment_status, "paid"),
    ne(orders.order_status, "cancelled"),
    gte(orders.createdAt, from),
    lt(orders.createdAt, toExclusive),
  );

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const now = new Date();

  const fromStr = getSearchParam(searchParams, "from");
  const toStr = getSearchParam(searchParams, "to");

  const parsedFrom = fromStr ? parseISO(fromStr) : null;
  const parsedTo = toStr ? parseISO(toStr) : null;

  const rangeFrom = startOfDay(
    parsedFrom && isValid(parsedFrom) ? parsedFrom : startOfMonth(now),
  );

  // Si el usuario elige "to", lo tratamos como inclusivo por día (lt < to+1día).
  // Si no elige "to", usamos "ahora" (para ver el día en curso en tiempo real).
  const rangeToDisplay = startOfDay(
    parsedTo && isValid(parsedTo) ? parsedTo : now,
  );
  const rangeToExclusive =
    parsedTo && isValid(parsedTo) ? addDays(rangeToDisplay, 1) : now;

  // Evitar rangos invertidos
  const safeFrom = rangeToDisplay < rangeFrom ? rangeToDisplay : rangeFrom;
  const safeToDisplay = rangeToDisplay < rangeFrom ? rangeFrom : rangeToDisplay;
  const safeToExclusive =
    rangeToDisplay < rangeFrom ? addDays(rangeFrom, 1) : rangeToExclusive;

  const rangeDays =
    Math.max(1, differenceInCalendarDays(safeToDisplay, safeFrom) + 1) || 1;

  // Periodo anterior para comparar (misma duración)
  const prevFrom = subDays(safeFrom, rangeDays);
  const prevToExclusive = safeFrom;

  const inventorySelect = {
    id: products.id,
    name: products.name,
    stock: products.stock,
    imageKey: medias.key,
    collection: collections.label,
  };

  const [
    revenueCurrentRow,
    revenuePrevRow,
    shippingRevenueCurrentRow,
    shippingRevenuePrevRow,
    salesCurrentRow,
    salesPrevRow,
    outOfStockCountRow,
    outOfStockProducts,
    lowStockProducts,
    pendingByStatusRows,
    shippingPendingRow,
    periodStatusRows,
    recentOrders,
    topProductRows,
    overviewRows,
    currentUser,
  ] = await Promise.all([
    db
      .select({ total: sql<number>`COALESCE(SUM(${orders.amount}), 0)` })
      .from(orders)
      .where(paidInRange(safeFrom, safeToExclusive)),
    db
      .select({ total: sql<number>`COALESCE(SUM(${orders.amount}), 0)` })
      .from(orders)
      .where(paidInRange(prevFrom, prevToExclusive)),
    db
      .select({
        total: sql<number>`COALESCE(SUM(COALESCE(${orders.shipping_cost}, '0')::numeric), 0)`,
      })
      .from(orders)
      .where(paidInRange(safeFrom, safeToExclusive)),
    db
      .select({
        total: sql<number>`COALESCE(SUM(COALESCE(${orders.shipping_cost}, '0')::numeric), 0)`,
      })
      .from(orders)
      .where(paidInRange(prevFrom, prevToExclusive)),
    db
      .select({ total: sql<number>`COUNT(*)` })
      .from(orders)
      .where(paidInRange(safeFrom, safeToExclusive)),
    db
      .select({ total: sql<number>`COUNT(*)` })
      .from(orders)
      .where(paidInRange(prevFrom, prevToExclusive)),
    db
      .select({ total: sql<number>`COUNT(*)` })
      .from(products)
      .where(
        or(
          eq(products.stock, 0),
          lt(products.stock, 0),
          isNull(products.stock),
        ),
      ),
    db
      .select(inventorySelect)
      .from(products)
      .leftJoin(medias, eq(medias.id, products.featuredImageId))
      .leftJoin(collections, eq(collections.id, products.collectionId))
      .where(
        or(
          eq(products.stock, 0),
          lt(products.stock, 0),
          isNull(products.stock),
        ),
      )
      .orderBy(desc(products.createdAt))
      .limit(5),
    // ➕ Low stock (1–4 units)
    db
      .select(inventorySelect)
      .from(products)
      .leftJoin(medias, eq(medias.id, products.featuredImageId))
      .leftJoin(collections, eq(collections.id, products.collectionId))
      .where(between(products.stock, 1, 4))
      .orderBy(products.stock)
      .limit(5),
    // ➕ Pending orders split by status (all time)
    db
      .select({ status: orders.order_status, total: sql<number>`COUNT(*)` })
      .from(orders)
      .where(inArray(orders.order_status, PENDING_STATUSES))
      .groupBy(orders.order_status),
    // ➕ Pending orders whose shipping cost is still to be agreed
    db
      .select({ total: sql<number>`COUNT(*)` })
      .from(orders)
      .where(
        and(
          isNull(orders.shipping_cost),
          inArray(orders.order_status, PENDING_STATUSES),
        ),
      ),
    // ➕ Orders by status in the period
    db
      .select({ status: orders.order_status, total: sql<number>`COUNT(*)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, safeFrom),
          lt(orders.createdAt, safeToExclusive),
        ),
      )
      .groupBy(orders.order_status),
    db
      .select({
        id: orders.id,
        name: orders.name,
        customerData: orders.customer_data,
        zone: orders.zone,
        createdAt: orders.createdAt,
        status: orders.order_status,
        paymentStatus: orders.payment_status,
        amount: orders.amount,
        shippingCost: orders.shipping_cost,
        // Raw column names: inside the subquery drizzle would leave "id" unqualified
        items: sql<number>`(SELECT COALESCE(SUM(ol.quantity), 0) FROM order_lines ol WHERE ol."orderId" = "orders"."id")`,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(7),
    // ➕ Best sellers of the period (paid orders)
    db
      .select({
        id: products.id,
        name: products.name,
        units: sql<number>`SUM(${orderLines.quantity})`,
      })
      .from(orderLines)
      .innerJoin(orders, eq(orders.id, orderLines.orderId))
      .innerJoin(products, eq(products.id, orderLines.productId))
      .where(paidInRange(safeFrom, safeToExclusive))
      .groupBy(products.id, products.name)
      .orderBy(desc(sql`SUM(${orderLines.quantity})`))
      .limit(3),
    // Overview: por día si el rango es corto; por mes si es largo
    rangeDays <= 45
      ? db
          .select({
            bucket: sql<string>`date_trunc('day', ${orders.createdAt})`,
            total: sql<number>`COALESCE(SUM(${orders.amount}), 0)`,
          })
          .from(orders)
          .where(paidInRange(safeFrom, safeToExclusive))
          .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
          .orderBy(sql`date_trunc('day', ${orders.createdAt})`)
      : (() => {
          const startMonth = startOfMonth(safeFrom);
          const endMonth = startOfMonth(safeToDisplay);
          const monthsCount =
            differenceInCalendarMonths(endMonth, startMonth) + 1;
          const chartFrom =
            monthsCount > 24
              ? new Date(endMonth.getFullYear(), endMonth.getMonth() - 23, 1)
              : startMonth;

          return db
            .select({
              bucket: sql<string>`date_trunc('month', ${orders.createdAt})`,
              total: sql<number>`COALESCE(SUM(${orders.amount}), 0)`,
            })
            .from(orders)
            .where(paidInRange(chartFrom, safeToExclusive))
            .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
            .orderBy(sql`date_trunc('month', ${orders.createdAt})`);
        })(),
    getCurrentUser(),
  ]);

  const revenueCurrent = toNumber(revenueCurrentRow?.[0]?.total);
  const revenuePrev = toNumber(revenuePrevRow?.[0]?.total);
  const shippingRevenueCurrent = toNumber(
    shippingRevenueCurrentRow?.[0]?.total,
  );
  const shippingRevenuePrev = toNumber(shippingRevenuePrevRow?.[0]?.total);
  const salesCurrent = toNumber(salesCurrentRow?.[0]?.total);
  const salesPrev = toNumber(salesPrevRow?.[0]?.total);
  const outOfStockCount = toNumber(outOfStockCountRow?.[0]?.total);
  const ticketCurrent = salesCurrent ? revenueCurrent / salesCurrent : 0;
  const ticketPrev = salesPrev ? revenuePrev / salesPrev : 0;

  const pendingCount = (status: OrderStatus) =>
    toNumber(pendingByStatusRows.find((r) => r.status === status)?.total);
  const shippingPending = toNumber(shippingPendingRow?.[0]?.total);

  const totalsByBucket = new Map<string, number>();
  for (const r of overviewRows as Array<{ bucket: unknown; total: unknown }>) {
    const d = new Date(r.bucket as any);
    const key =
      rangeDays <= 45 ? format(d, "yyyy-MM-dd") : format(d, "yyyy-MM");
    totalsByBucket.set(key, toNumber(r.total));
  }

  const overviewData =
    rangeDays <= 45
      ? Array.from({ length: rangeDays }, (_, idx) => {
          const d = addDays(safeFrom, idx);
          const key = format(d, "yyyy-MM-dd");
          return {
            name: format(d, "d MMM", { locale: es }),
            total: totalsByBucket.get(key) ?? 0,
          };
        })
      : (() => {
          const startMonth = startOfMonth(safeFrom);
          const endMonth = startOfMonth(safeToDisplay);
          const monthsCount =
            differenceInCalendarMonths(endMonth, startMonth) + 1;
          const safeMonthsCount = Math.min(monthsCount, 24);
          const first =
            monthsCount > 24
              ? new Date(endMonth.getFullYear(), endMonth.getMonth() - 23, 1)
              : startMonth;

          return Array.from({ length: safeMonthsCount }, (_, idx) => {
            const d = new Date(first.getFullYear(), first.getMonth() + idx, 1);
            const key = format(d, "yyyy-MM");
            return {
              name: format(d, "MMM yy", { locale: es }),
              total: totalsByBucket.get(key) ?? 0,
            };
          });
        })();
  const series = overviewData.map((d) => d.total);

  const periodStatus = (Object.keys(ORDER_STATUS_INFO) as OrderStatus[]).map(
    (status) => ({
      status,
      total: toNumber(periodStatusRows.find((r) => r.status === status)?.total),
    }),
  );
  const periodTotal = periodStatus.reduce((acc, s) => acc + s.total, 0);
  const periodActive = periodStatus
    .filter((s) => !["delivered", "cancelled"].includes(s.status))
    .reduce((acc, s) => acc + s.total, 0);

  const recentRows: RecentOrderRow[] = recentOrders.map((o) => ({
    id: o.id,
    number: formatOrderNumber(o.id),
    name:
      o.name ||
      ((o.customerData as any)?.name as string | undefined) ||
      "Cliente",
    createdAt: new Date(o.createdAt as any).toISOString(),
    zone: o.zone,
    items: toNumber(o.items),
    status: o.status as OrderStatus,
    paymentStatus: o.paymentStatus,
    total: toNumber(o.amount),
    shippingCost: o.shippingCost === null ? null : toNumber(o.shippingCost),
  }));

  const inventory = [...outOfStockProducts, ...lowStockProducts].slice(0, 5);
  const maxUnits = Math.max(1, ...topProductRows.map((p) => toNumber(p.units)));

  const exportHref = `/api/admin/dashboard/export?from=${encodeURIComponent(
    format(safeFrom, "yyyy-MM-dd"),
  )}&to=${encodeURIComponent(format(safeToDisplay, "yyyy-MM-dd"))}`;

  const firstName = (
    (currentUser?.user_metadata?.name as string | undefined) || ""
  ).split(" ")[0];
  const longDate = now.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Havana",
  });
  const rangeLabel =
    rangeDays === 1
      ? format(safeFrom, "d 'de' MMMM", { locale: es })
      : `${format(safeFrom, "d MMM", { locale: es })} – ${format(safeToDisplay, "d MMM", { locale: es })}`;

  const attention = [
    {
      label: "Órdenes por confirmar",
      value: pendingCount("pending_confirmation"),
      href: "/admin/orders?status=pending_confirmation",
      Icon: Icons.clock,
      tone: "border-yellow-200 bg-yellow-50 text-yellow-700",
    },
    {
      label: "Esperando pago",
      value: pendingCount("pending_payment"),
      href: "/admin/orders?status=pending_payment",
      Icon: Icons.billing,
      tone: "border-orange-200 bg-orange-50 text-orange-700",
    },
    {
      label: "Productos sin stock",
      value: outOfStockCount,
      href: "/admin/products?stock=out",
      Icon: Icons.packageX,
      tone: "border-red-200 bg-red-50 text-red-700",
    },
    {
      label: "Envío sin costo definido",
      value: shippingPending,
      href: "/admin/orders?shipping=pending",
      Icon: Icons.truck,
      tone: "border-primary-200 bg-primary-50 text-primary-700",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-500 first-letter:uppercase">
            {longDate}
          </p>
          <h1 className="text-[clamp(24px,2.4vw,32px)] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
            {firstName ? `Hola, ${firstName}` : "Dashboard"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardRangePicker />
          <a
            href={exportHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-[#E7E4EF]",
            )}
          >
            <Icons.download className="size-4" aria-hidden />
            Exportar
          </a>
        </div>
      </div>

      <section className="rounded-[18px] border border-line bg-white p-[18px]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-ink">
            <span className="size-2 rounded-full bg-accent" aria-hidden />
            Requiere tu atención
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm font-bold text-primary-700 hover:text-primary-800"
          >
            Ver órdenes →
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-2.5">
          {attention.map(({ label, value, href, Icon, tone }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[14px] border p-3.5 transition-transform hover:-translate-y-px",
                tone,
              )}
            >
              <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[22px] font-extrabold leading-tight tabular-nums">
                  {value}
                </span>
                <span className="block text-[13px] font-semibold text-neutral-700">
                  {label}
                </span>
              </span>
              <Icons.chevronRight
                className="size-[18px] text-neutral-400"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3 lg:gap-4">
        <StatCard
          label="Ingresos pagados"
          value={formatCUP(revenueCurrent, { unit: false })}
          unit="CUP"
          deltaPct={percentChange(revenueCurrent, revenuePrev)}
          previous={formatCUP(revenuePrev)}
          series={series}
        />
        <StatCard
          label="Ventas pagadas"
          value={String(salesCurrent)}
          deltaPct={percentChange(salesCurrent, salesPrev)}
          previous={String(salesPrev)}
          series={series}
        />
        <StatCard
          label="Ticket promedio"
          value={formatCUP(ticketCurrent, { unit: false })}
          unit="CUP"
          deltaPct={percentChange(ticketCurrent, ticketPrev)}
          previous={formatCUP(ticketPrev)}
          series={series}
        />
        <StatCard
          label="Ingresos por envíos"
          value={formatCUP(shippingRevenueCurrent, { unit: false })}
          unit="CUP"
          deltaPct={percentChange(shippingRevenueCurrent, shippingRevenuePrev)}
          previous={formatCUP(shippingRevenuePrev)}
          series={series}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 rounded-[18px] border border-line bg-white p-[18px] lg:col-span-2">
          <Overview
            data={overviewData}
            subtitle={`${rangeLabel} · ${formatCUP(revenueCurrent)} en total`}
            bestLabel={rangeDays <= 45 ? "Mejor día" : "Mejor mes"}
          />
        </div>

        <div className="rounded-[18px] border border-line bg-white p-[18px]">
          <h2 className="text-[15px] font-extrabold text-ink">
            Estado de las órdenes
          </h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            {periodActive} órdenes activas en el período
          </p>
          {periodTotal > 0 && (
            <div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {periodStatus
                .filter((s) => s.total > 0)
                .map((s) => (
                  <span
                    key={s.status}
                    style={{
                      width: `${(s.total / periodTotal) * 100}%`,
                      backgroundColor: getOrderStatusInfo(s.status)?.dot,
                    }}
                  />
                ))}
            </div>
          )}
          <ul className="mt-3">
            {periodStatus.map((s) => (
              <li
                key={s.status}
                className="border-t border-surface-soft first:border-t-0"
              >
                <Link
                  href={`/admin/orders?status=${s.status}`}
                  className="flex items-center gap-2.5 py-2.5 hover:text-primary-700"
                >
                  <span
                    className="size-2.5 rounded-[3px]"
                    style={{
                      backgroundColor: getOrderStatusInfo(s.status)?.dot,
                    }}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm font-semibold">
                    {getOrderStatusInfo(s.status)?.shortLabel}
                  </span>
                  <span className="text-sm font-extrabold tabular-nums">
                    {s.total}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <RecentOrdersCard rows={recentRows} />
        </div>

        <div className="rounded-[18px] border border-line bg-white p-[18px]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-extrabold text-ink">Inventario</h2>
            <Link
              href="/admin/products"
              className="text-sm font-bold text-primary-700 hover:text-primary-800"
            >
              Productos →
            </Link>
          </div>
          {inventory.length === 0 ? (
            <p className="py-6 text-sm text-neutral-500">
              Todo el catálogo tiene stock suficiente.
            </p>
          ) : (
            <ul>
              {inventory.map((p) => {
                const stock = p.stock ?? 0;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex items-center gap-3 py-2 hover:text-primary-700"
                    >
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-[10px] bg-surface-tint">
                        {p.imageKey && (
                          <Image
                            src={keytoUrl(p.imageKey)}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {p.name}
                        </span>
                        {p.collection && (
                          <span className="block truncate text-xs text-neutral-500">
                            {p.collection}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-extrabold",
                          stock <= 0
                            ? "bg-red-50 text-red-700"
                            : "bg-orange-50 text-orange-700",
                        )}
                      >
                        {stock <= 0 ? "Agotado" : `${stock} und.`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {topProductRows.length > 0 && (
            <div className="mt-3 border-t border-line pt-3">
              <h3 className="mb-2 text-[13px] font-extrabold text-ink">
                Más vendidos del período
              </h3>
              <ul className="flex flex-col gap-2">
                {topProductRows.map((p) => {
                  const units = toNumber(p.units);
                  return (
                    <li key={p.id} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                        {p.name}
                      </span>
                      <span className="h-1.5 w-[72px] shrink-0 overflow-hidden rounded-full bg-surface-tint">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${(units / maxUnits) * 100}%` }}
                        />
                      </span>
                      <span className="w-6 shrink-0 text-right text-[13px] font-extrabold tabular-nums">
                        {units}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
