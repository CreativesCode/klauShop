"use client";

import { OrderStatus } from "@/lib/supabase/schema";
import { cn, formatCUP, relativeTimeEs } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { StatusPill } from "../StatusPill";
import { OrderNextActionButton } from "./OrderQuickActions";

export type RecentOrderRow = {
  id: string;
  number: string;
  name: string;
  createdAt: string;
  zone: string | null;
  items: number;
  status: OrderStatus;
  paymentStatus: string | null;
  total: number;
  shippingCost: number | null;
};

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes" },
  { id: "active", label: "En curso" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const PENDING: OrderStatus[] = ["pending_confirmation", "pending_payment"];
const ACTIVE: OrderStatus[] = ["paid", "processing", "shipped"];

function matches(row: RecentOrderRow, filter: FilterId) {
  if (filter === "pending") return PENDING.includes(row.status);
  if (filter === "active") return ACTIVE.includes(row.status);
  return true;
}

/** Dashboard "Órdenes recientes" with the next action one click away. */
export function RecentOrdersCard({ rows }: { rows: RecentOrderRow[] }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const shown = rows.filter((r) => matches(r, filter));

  const meta = (r: RecentOrderRow) =>
    [r.zone, `${r.items} artículo${r.items === 1 ? "" : "s"}`]
      .filter(Boolean)
      .join(" · ");

  const nextAction = (r: RecentOrderRow) => (
    <OrderNextActionButton
      orderId={r.id}
      status={r.status}
      paymentStatus={r.paymentStatus}
      shippingPending={r.shippingCost === null}
    />
  );

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-[18px] pt-[18px]">
        <h2 className="text-[15px] font-extrabold text-ink">
          Órdenes recientes
        </h2>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                "h-8 rounded-full border px-3 text-xs font-bold transition-colors",
                filter === f.id
                  ? "border-ink bg-ink text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-12 text-center text-[15px] text-neutral-500">
          No hay órdenes en esta vista.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <table className="mt-3 hidden w-full text-sm lg:table">
            <thead className="bg-surface-hover text-left text-xs font-bold uppercase tracking-[.05em] text-neutral-500">
              <tr>
                <th className="px-[18px] py-2.5 font-bold">Orden</th>
                <th className="px-3 py-2.5 font-bold">Cliente</th>
                <th className="px-3 py-2.5 font-bold">Estado</th>
                <th className="px-3 py-2.5 text-right font-bold">Total</th>
                <th className="px-[18px] py-2.5 text-right font-bold">
                  <span className="sr-only">Acción</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-line-soft hover:bg-surface-hover"
                >
                  <td className="px-[18px] py-3">
                    <Link
                      href={`/admin/orders/${r.id}`}
                      className="font-extrabold text-ink hover:text-primary"
                    >
                      {r.number}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {relativeTimeEs(r.createdAt)}
                    </p>
                  </td>
                  <td className="max-w-[220px] px-3 py-3">
                    <p className="truncate font-semibold text-ink">{r.name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {meta(r)}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-extrabold tabular-nums text-ink">
                    {formatCUP(r.total)}
                  </td>
                  <td className="px-[18px] py-3 text-right">{nextAction(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="mt-3 lg:hidden">
            {shown.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-1.5 border-t border-line-soft px-4 py-3.5"
              >
                <Link
                  href={`/admin/orders/${r.id}`}
                  className="flex flex-col gap-1.5"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[15px] font-extrabold text-ink">
                      {r.number} · {r.name}
                    </span>
                    <span className="shrink-0 font-extrabold tabular-nums text-ink">
                      {formatCUP(r.total)}
                    </span>
                  </span>
                  <span className="text-xs text-neutral-500">
                    {relativeTimeEs(r.createdAt)} · {meta(r)}
                  </span>
                </Link>
                {/* Outside the link: the confirm dialog's events bubble through the portal */}
                <div className="flex items-center justify-between gap-2">
                  <StatusPill status={r.status} />
                  {nextAction(r)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default RecentOrdersCard;
