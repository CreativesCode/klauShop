import db from "@/lib/supabase/db";
import { orders } from "@/lib/supabase/schema";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import {
  addDays,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { getOrderStatusLabel } from "@/features/orders/utils/orderStatus";
import {
  getPaymentMethodLabel,
  getPaymentStatusInfo,
} from "@/features/orders/utils/paymentStatus";
import { formatOrderNumber } from "@/features/orders/utils/whatsapp";
import { and, desc, gte, lt } from "drizzle-orm";
import { cookies } from "next/headers";

function csvEscape(value: unknown) {
  let s = value === null || value === undefined ? "" : String(value);
  // A cell starting with = + - @ is run as a formula by Excel (names and notes come from customers)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  const escaped = s.replace(/"/g, '""');
  return `"${escaped}"`;
}

const havanaDate = new Intl.DateTimeFormat("es-CU", {
  timeZone: "America/Havana",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export async function GET(request: Request) {
  // Verificar que el usuario sea admin
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autenticado", { status: 401 });
  }

  if (!user.app_metadata?.isAdmin) {
    return new Response("No autorizado", { status: 403 });
  }

  const url = new URL(request.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  const now = new Date();
  const parsedFrom = fromStr ? parseISO(fromStr) : null;
  const parsedTo = toStr ? parseISO(toStr) : null;

  const from = startOfDay(
    parsedFrom && isValid(parsedFrom) ? parsedFrom : startOfMonth(now),
  );
  const toDay = startOfDay(parsedTo && isValid(parsedTo) ? parsedTo : now);
  const toExclusive = parsedTo && isValid(parsedTo) ? addDays(toDay, 1) : now;

  const safeFrom = toDay < from ? toDay : from;
  const safeToDay = toDay < from ? from : toDay;
  const safeToExclusive = toDay < from ? addDays(from, 1) : toExclusive;

  const rows = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      order_status: orders.order_status,
      payment_status: orders.payment_status,
      payment_method: orders.payment_method,
      amount: orders.amount,
      currency: orders.currency,
      name: orders.name,
      phone: orders.phone,
      zone: orders.zone,
      shipping_cost: orders.shipping_cost,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, safeFrom),
        lt(orders.createdAt, safeToExclusive),
      ),
    )
    .orderBy(desc(orders.createdAt));

  const header = [
    "Pedido",
    "Fecha (La Habana)",
    "Estado",
    "Pago",
    "Método de pago",
    "Total",
    "Moneda",
    "Envío",
    "Cliente",
    "Teléfono",
    "Zona",
    "ID",
  ];

  const csvLines = [
    header.map(csvEscape).join(","),
    ...rows.map((r) =>
      [
        formatOrderNumber(r.id),
        r.createdAt ? havanaDate.format(new Date(r.createdAt)) : "",
        r.order_status ? getOrderStatusLabel(r.order_status) : "",
        getPaymentStatusInfo(r.payment_status).label,
        r.payment_method ? getPaymentMethodLabel(r.payment_method) : "",
        r.amount,
        (r.currency || "").toUpperCase(),
        r.shipping_cost ?? "Por acordar",
        r.name,
        r.phone,
        r.zone,
        r.id,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  const fromLabel = format(safeFrom, "yyyy-MM-dd");
  const toLabel = format(safeToDay, "yyyy-MM-dd");
  const filename = `dashboard-orders_${fromLabel}_to_${toLabel}.csv`;

  // BOM para Excel (UTF-8)
  const csv = `\uFEFF${csvLines.join("\n")}\n`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
