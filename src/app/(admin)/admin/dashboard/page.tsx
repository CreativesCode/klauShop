import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarDateRangePicker, Overview, RecentSales } from "@/features/cms";
import db from "@/lib/supabase/db";
import { orders, products, profiles } from "@/lib/supabase/schema";
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
import {
  and,
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

function formatPercent(pct: number | null) {
  if (pct === null) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function moneyUSD(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "CUP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

  const [
    revenueCurrentRow,
    revenuePrevRow,
    shippingRevenueCurrentRow,
    shippingRevenuePrevRow,
    salesCurrentRow,
    salesPrevRow,
    productsTotalRow,
    outOfStockCountRow,
    outOfStockProducts,
    productsCurrentRow,
    pendingOrdersRow,
    usersTotalRow,
    recentPaidOrders,
    overviewRows,
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`COALESCE(SUM(${orders.amount}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.payment_status, "paid"),
          ne(orders.order_status, "cancelled"),
          gte(orders.createdAt, safeFrom),
          lt(orders.createdAt, safeToExclusive),
        ),
      ),
    db
      .select({
        total: sql<number>`COALESCE(SUM(${orders.amount}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.payment_status, "paid"),
          ne(orders.order_status, "cancelled"),
          gte(orders.createdAt, prevFrom),
          lt(orders.createdAt, prevToExclusive),
        ),
      ),
    db
      .select({
        total: sql<number>`COALESCE(SUM(COALESCE(${orders.shipping_cost}, '0')::numeric), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.payment_status, "paid"),
          ne(orders.order_status, "cancelled"),
          gte(orders.createdAt, safeFrom),
          lt(orders.createdAt, safeToExclusive),
        ),
      ),
    db
      .select({
        total: sql<number>`COALESCE(SUM(COALESCE(${orders.shipping_cost}, '0')::numeric), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.payment_status, "paid"),
          ne(orders.order_status, "cancelled"),
          gte(orders.createdAt, prevFrom),
          lt(orders.createdAt, prevToExclusive),
        ),
      ),
    db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.payment_status, "paid"),
          ne(orders.order_status, "cancelled"),
          gte(orders.createdAt, safeFrom),
          lt(orders.createdAt, safeToExclusive),
        ),
      ),
    db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.payment_status, "paid"),
          ne(orders.order_status, "cancelled"),
          gte(orders.createdAt, prevFrom),
          lt(orders.createdAt, prevToExclusive),
        ),
      ),
    db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(products),
    db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(products)
      .where(
        or(
          eq(products.stock, 0),
          lt(products.stock, 0),
          isNull(products.stock),
        ),
      ),
    db
      .select({
        id: products.id,
        name: products.name,
        stock: products.stock,
      })
      .from(products)
      .where(
        or(
          eq(products.stock, 0),
          lt(products.stock, 0),
          isNull(products.stock),
        ),
      )
      .orderBy(desc(products.createdAt))
      .limit(5),
    db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(products)
      .where(
        and(
          gte(products.createdAt, safeFrom),
          lt(products.createdAt, safeToExclusive),
        ),
      ),
    db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        inArray(orders.order_status, [
          "pending_confirmation",
          "pending_payment",
        ]),
      ),
    db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(profiles),
    db
      .select({
        id: orders.id,
        amount: orders.amount,
        name: orders.name,
        phone: orders.phone,
        createdAt: orders.createdAt,
        customerData: orders.customer_data,
      })
      .from(orders)
      .where(
        and(
          eq(orders.payment_status, "paid"),
          ne(orders.order_status, "cancelled"),
          gte(orders.createdAt, safeFrom),
          lt(orders.createdAt, safeToExclusive),
        ),
      )
      .orderBy(desc(orders.createdAt))
      .limit(5),
    // Overview: por día si el rango es corto; por mes si es largo
    rangeDays <= 45
      ? db
          .select({
            bucket: sql<string>`date_trunc('day', ${orders.createdAt})`,
            total: sql<number>`COALESCE(SUM(${orders.amount}), 0)`,
          })
          .from(orders)
          .where(
            and(
              eq(orders.payment_status, "paid"),
              ne(orders.order_status, "cancelled"),
              gte(orders.createdAt, safeFrom),
              lt(orders.createdAt, safeToExclusive),
            ),
          )
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
            .where(
              and(
                eq(orders.payment_status, "paid"),
                ne(orders.order_status, "cancelled"),
                gte(orders.createdAt, chartFrom),
                lt(orders.createdAt, safeToExclusive),
              ),
            )
            .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
            .orderBy(sql`date_trunc('month', ${orders.createdAt})`);
        })(),
  ]);

  const revenueCurrent = toNumber(revenueCurrentRow?.[0]?.total);
  const revenuePrev = toNumber(revenuePrevRow?.[0]?.total);
  const shippingRevenueCurrent = toNumber(
    shippingRevenueCurrentRow?.[0]?.total,
  );
  const shippingRevenuePrev = toNumber(shippingRevenuePrevRow?.[0]?.total);
  const salesCurrent = toNumber(salesCurrentRow?.[0]?.total);
  const salesPrev = toNumber(salesPrevRow?.[0]?.total);
  const productsTotal = toNumber(productsTotalRow?.[0]?.total);
  const outOfStockCount = toNumber(outOfStockCountRow?.[0]?.total);
  const productsCurrent = toNumber(productsCurrentRow?.[0]?.total);
  const pendingOrders = toNumber(pendingOrdersRow?.[0]?.total);
  const usersTotal = toNumber(usersTotalRow?.[0]?.total);

  const revenueDelta = percentChange(revenueCurrent, revenuePrev);
  const shippingRevenueDelta = percentChange(
    shippingRevenueCurrent,
    shippingRevenuePrev,
  );
  const salesDelta = percentChange(salesCurrent, salesPrev);

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
            name: format(d, "MMM dd"),
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
              name: format(d, "MMM yy"),
              total: totalsByBucket.get(key) ?? 0,
            };
          });
        })();

  const recentSalesItems = recentPaidOrders.map((o) => {
    const customerName =
      o.name ||
      ((o.customerData as any)?.name as string | undefined) ||
      "Cliente";
    const subtitle =
      o.phone || ((o.customerData as any)?.phone as string | undefined) || null;
    return {
      id: o.id,
      name: customerName,
      subtitle,
      amount: toNumber(o.amount),
    };
  });

  const exportHref = `/api/admin/dashboard/export?from=${encodeURIComponent(
    format(safeFrom, "yyyy-MM-dd"),
  )}&to=${encodeURIComponent(format(safeToDisplay, "yyyy-MM-dd"))}`;

  return (
    <>
      <div className="flex-col md:flex">
        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
              <CalendarDateRangePicker />
              <Button asChild>
                <a href={exportHref}>Descargar</a>
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos (pagados) - mes
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {moneyUSD(revenueCurrent)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(revenueDelta)} vs período anterior
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos por envíos (pagados) - mes
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M3 7h13v10H3z" />
                    <path d="M16 10h4l1 2v5h-5z" />
                    <path d="M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                    <path d="M18 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {moneyUSD(shippingRevenueCurrent)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(shippingRevenueDelta)} vs período anterior
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ventas (pagadas) - mes
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{salesCurrent}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(salesDelta)} vs período anterior
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Productos
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M20.91 8.84 8.56 21.19a2 2 0 0 1-2.83 0L3 18.46a2 2 0 0 1 0-2.83L15.35 3.28a2 2 0 0 1 1.41-.59H21a1 1 0 0 1 1 1v4.24a2 2 0 0 1-.09.91z" />
                    <path d="M7 17h.01" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{productsTotal}</div>
                  <p className="text-xs text-muted-foreground">
                    +{productsCurrent} creados en el período
                    {outOfStockCount > 0 ? (
                      <Link
                        href="/admin/products?stock=out"
                        className="text-red-600 font-medium hover:underline"
                      >
                        {" "}
                        • {outOfStockCount} sin stock
                      </Link>
                    ) : null}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Órdenes pendientes
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    Usuarios registrados: {usersTotal}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Ingresos (pagados)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview data={overviewData} />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Ventas recientes</CardTitle>
                  <CardDescription>
                    Has hecho {salesCurrent} ventas pagadas en el período.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales items={recentSalesItems} />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle>Productos sin stock</CardTitle>
                  <CardDescription>
                    Productos con existencia 0 (o sin valor de stock).
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/products?stock=out">Ver productos</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {outOfStockCount === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay productos sin stock ahora mismo.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(
                      outOfStockProducts as Array<{
                        id: string;
                        name: string;
                        stock: number | null;
                      }>
                    ).map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        <span className="text-sm text-red-600 font-semibold">
                          Stock: {p.stock ?? 0}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
