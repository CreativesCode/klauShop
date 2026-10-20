"use client";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import { Icons } from "@/components/layouts/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { OrderStatus } from "@/lib/supabase/schema";
import { cn, formatCUP } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isValidStatusTransition } from "../../utils/orderStatus";
import { getOrderTotals } from "../../utils/pricing";
import { formatOrderNumber } from "../../utils/whatsapp";
import { StalePill, StatusPill } from "../StatusPill";
import type { OrderRow } from "./OrdersColumns";
import {
  PaymentText,
  formatOrderDate,
  getStalePendingDays,
} from "./OrdersColumns";

interface DataTableProps<TValue> {
  columns: ColumnDef<OrderRow, TValue>[];
  data: OrderRow[];
}

const TABS = [
  { id: "all", label: "Todas", statuses: null },
  {
    id: "pending",
    label: "Pendientes",
    statuses: ["pending_confirmation", "pending_payment"],
  },
  { id: "paid", label: "Pagadas", statuses: ["paid"] },
  { id: "processing", label: "En preparación", statuses: ["processing"] },
  { id: "shipped", label: "Enviadas", statuses: ["shipped"] },
  { id: "delivered", label: "Entregadas", statuses: ["delivered"] },
  { id: "cancelled", label: "Canceladas", statuses: ["cancelled"] },
] as const satisfies readonly {
  id: string;
  label: string;
  statuses: readonly OrderStatus[] | null;
}[];

type TabId = (typeof TABS)[number]["id"];

// ?status= accepts a tab id or an exact pending status (dashboard links)
function parseStatusParam(value: string | null): {
  tab: TabId;
  exact: OrderStatus | null;
} {
  if (value === "pending_confirmation" || value === "pending_payment") {
    return { tab: "pending", exact: value };
  }
  const tab = TABS.find((t) => t.id === value);
  return { tab: tab ? tab.id : "all", exact: null };
}

function matchesSearch(order: OrderRow["node"], filterValue: string) {
  const search = filterValue.toLowerCase();
  // Order number, customer name or phone (digits only, so "5307 7035" matches)
  const orderNumber = formatOrderNumber(order.id).toLowerCase();
  const orderId = order.id.toLowerCase();
  const name = (order.name || "").toLowerCase();
  const digits = search.replace(/\D/g, "");
  const phoneDigits = (order.phone || "").replace(/\D/g, "");

  return (
    orderNumber.includes(search) ||
    orderId.includes(search) ||
    name.includes(search) ||
    (digits.length >= 3 && phoneDigits.includes(digits))
  );
}

function DataTable<TValue>({ columns, data }: DataTableProps<TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { tab, exact } = parseStatusParam(searchParams.get("status"));
  const shippingPendingOnly = searchParams.get("shipping") === "pending";
  const zone = searchParams.get("zone");

  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState(
    searchParams.get("search") || "",
  );
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkRunning, setBulkRunning] = React.useState(false);

  // The top bar search navigates here with ?search=
  const searchParam = searchParams.get("search");
  React.useEffect(() => {
    if (searchParam !== null) setGlobalFilter(searchParam);
  }, [searchParam]);

  const setParams = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setRowSelection({});
  };

  const tabCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of TABS) {
      counts[t.id] = t.statuses
        ? data.filter(({ node }) =>
            (t.statuses as readonly string[]).includes(node.order_status || ""),
          ).length
        : data.length;
    }
    return counts;
  }, [data]);

  const zones = React.useMemo(
    () =>
      Array.from(
        new Set(data.map(({ node }) => node.zone).filter(Boolean)),
      ) as string[],
    [data],
  );

  const filteredData = React.useMemo(() => {
    const statuses = TABS.find((t) => t.id === tab)?.statuses;
    return data.filter(({ node }) => {
      const status = node.order_status || "";
      if (exact && status !== exact) return false;
      if (statuses && !(statuses as readonly string[]).includes(status))
        return false;
      if (shippingPendingOnly) {
        const pending =
          status === "pending_confirmation" || status === "pending_payment";
        if (!pending || node.shipping_cost !== null) return false;
      }
      if (zone && node.zone !== zone) return false;
      return true;
    });
  }, [data, tab, exact, shippingPendingOnly, zone]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, rowSelection, globalFilter },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) =>
      matchesSearch(row.original.node, filterValue),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original.node);
  const shippable = selected.filter((o) =>
    isValidStatusTransition(
      (o.order_status || "pending_confirmation") as OrderStatus,
      "shipped",
    ),
  );

  const markShipped = async () => {
    setBulkRunning(true);
    let done = 0;
    const failed: string[] = [];
    // One by one: each change sends its own WhatsApp to the customer
    for (const order of shippable) {
      try {
        const res = await fetch(`/api/admin/orders/${order.id}/change-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newStatus: "shipped" }),
        });
        if (!res.ok) throw new Error();
        done++;
      } catch {
        failed.push(formatOrderNumber(order.id));
      }
    }
    const skipped = selected.length - shippable.length;
    toast({
      title: `${done} orden${done === 1 ? "" : "es"} marcada${done === 1 ? "" : "s"} como enviada${done === 1 ? "" : "s"}`,
      description:
        [
          skipped > 0 &&
            `${skipped} se saltaron (solo se envían las que están en preparación).`,
          failed.length > 0 && `Fallaron: ${failed.join(", ")}.`,
        ]
          .filter(Boolean)
          .join(" ") || undefined,
      variant: failed.length > 0 ? "destructive" : "default",
    });
    setBulkRunning(false);
    setBulkOpen(false);
    setRowSelection({});
    router.refresh();
  };

  const rows = table.getRowModel().rows;
  const chip = (active: boolean) =>
    cn(
      "h-9 shrink-0 rounded-full border px-3 text-xs font-bold transition-colors",
      active
        ? "border-ink bg-ink text-white"
        : "border-neutral-200 bg-white text-neutral-700 hover:border-ink",
    );

  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-white">
      {/* Status tabs */}
      <div
        role="tablist"
        aria-label="Estado de las órdenes"
        className="no-scrollbar flex overflow-x-auto border-b border-line px-2"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() =>
                setParams({ status: t.id === "all" ? null : t.id })
              }
              className={cn(
                "flex h-[52px] shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-bold transition-colors",
                active
                  ? "border-primary text-ink"
                  : "border-transparent text-neutral-500 hover:text-ink",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold tabular-nums",
                  active
                    ? "bg-primary text-white"
                    : t.id === "pending" && tabCounts[t.id] > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-surface-soft text-neutral-600",
                )}
              >
                {tabCounts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3">
        <label className="flex h-10 min-w-0 flex-[1_1_260px] items-center gap-2 rounded-[10px] bg-surface-admin px-3">
          <Icons.search
            className="size-4 shrink-0 text-neutral-500"
            aria-hidden
          />
          <input
            type="search"
            enterKeyHint="search"
            aria-label="Buscar órdenes"
            placeholder="Número, cliente o teléfono"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-neutral-500 md:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
        </label>
        <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto">
          <button
            type="button"
            className={chip(!zone)}
            onClick={() => setParams({ zone: null })}
          >
            Todas las zonas
          </button>
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              className={chip(zone === z)}
              onClick={() => setParams({ zone: zone === z ? null : z })}
            >
              {z}
            </button>
          ))}
        </div>
        {(exact || shippingPendingOnly) && (
          <button
            type="button"
            onClick={() =>
              setParams({
                status: exact ? "pending" : searchParams.get("status"),
                shipping: null,
              })
            }
            className="flex h-9 items-center gap-1.5 rounded-full bg-primary-50 px-3 text-xs font-bold text-primary-700"
          >
            {exact === "pending_confirmation"
              ? "Solo por confirmar"
              : exact === "pending_payment"
                ? "Solo esperando pago"
                : "Envío sin costo definido"}
            <Icons.close className="size-3.5" aria-hidden />
            <span className="sr-only">Quitar filtro</span>
          </button>
        )}
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="mx-3 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-sm text-white">
          <span className="font-bold">
            {selected.length} seleccionada{selected.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            disabled={shippable.length === 0}
            onClick={() => setBulkOpen(true)}
            className="h-8 rounded-[9px] bg-white px-3 text-xs font-extrabold text-ink disabled:opacity-50"
          >
            Marcar como enviadas
          </button>
          <button
            type="button"
            onClick={() => setRowSelection({})}
            className="ml-auto text-xs font-bold text-primary-300 hover:text-white"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-t-0">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-[15px] text-neutral-500"
                >
                  No hay órdenes con estos filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards: act from the detail page */}
      <ul className="lg:hidden">
        {rows.length ? (
          rows.map((row) => {
            const order = row.original.node;
            const { total, shippingCost } = getOrderTotals(order);
            const staleDays = getStalePendingDays(
              order.order_status,
              order.created_at,
            );
            return (
              <li key={row.id} className="border-t border-line-soft">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-col gap-1.5 px-4 py-3.5"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[15px] font-extrabold text-ink">
                      {formatOrderNumber(order.id)} · {order.name || "—"}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-extrabold tabular-nums text-ink">
                        {formatCUP(total)}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs text-neutral-500">
                    {[formatOrderDate(order.created_at), order.zone]
                      .filter(Boolean)
                      .join(" · ")}
                    {shippingCost === null && (
                      <span className="font-bold text-accent-700">
                        {" "}
                        · Envío por acordar
                      </span>
                    )}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {order.order_status && (
                      <StatusPill status={order.order_status} />
                    )}
                    {staleDays !== null && <StalePill days={staleDays} />}
                    <span className="ml-auto">
                      <PaymentText
                        paymentStatus={order.payment_status}
                        orderStatus={order.order_status}
                      />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })
        ) : (
          <li className="border-t border-line-soft py-12 text-center text-[15px] text-neutral-500">
            No hay órdenes con estos filtros.
          </li>
        )}
      </ul>

      <DataTablePagination table={table} itemLabel="órdenes" />

      <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Marcar {shippable.length} orden
              {shippable.length === 1 ? "" : "es"} como enviada
              {shippable.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cada cliente recibe su aviso por WhatsApp.
              {selected.length > shippable.length &&
                ` ${selected.length - shippable.length} de las seleccionadas no están en preparación y se saltarán.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkRunning}
              onClick={(e) => {
                e.preventDefault();
                markShipped();
              }}
            >
              {bulkRunning ? "Actualizando..." : "Marcar como enviadas"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DataTable;
