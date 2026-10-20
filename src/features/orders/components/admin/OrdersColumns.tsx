"use client";

import { Icons } from "@/components/layouts/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DocumentType, gql } from "@/gql";
import { OrderStatus } from "@/lib/supabase/schema";
import { cn, formatCUP } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { getOrderStatusInfo } from "../../utils/orderStatus";
import { getPaymentStatusInfo, needsRefund } from "../../utils/paymentStatus";
import { getOrderTotals } from "../../utils/pricing";
import { formatOrderNumber } from "../../utils/whatsapp";
import { StalePill, StatusPill } from "../StatusPill";
import { OrderNextActionButton } from "./OrderQuickActions";

export const OrderColumnsFragment = gql(/* GraphQL */ `
  fragment OrderColumnsFragment on orders {
    id
    order_status
    payment_status
    created_at
    name
    phone
    zone
    amount
    shipping_cost
  }
`);

const dateFormatter = new Intl.DateTimeFormat("es-CU", {
  timeZone: "America/Havana",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

// Pending orders keep stock reserved: flag the old ones so the admin can follow up or cancel
const STALE_PENDING_HOURS = 48;

export function getStalePendingDays(
  status: string | null | undefined,
  createdAt: string | null | undefined,
): number | null {
  if (status !== "pending_confirmation" && status !== "pending_payment") {
    return null;
  }
  if (!createdAt) return null;
  const hours = (Date.now() - new Date(createdAt).getTime()) / 36e5;
  return hours > STALE_PENDING_HOURS ? Math.floor(hours / 24) : null;
}

export type OrderRow = { node: DocumentType<typeof OrderColumnsFragment> };

const PAYMENT_TEXT: Record<string, string> = {
  paid: "text-green-700",
  unpaid: "text-red-700",
  refunded: "text-neutral-500",
  no_payment_required: "text-neutral-500",
};

export function PaymentText({
  paymentStatus,
  orderStatus,
}: {
  paymentStatus: string | null | undefined;
  orderStatus: string | null | undefined;
}) {
  const info = getPaymentStatusInfo(paymentStatus, orderStatus);
  const color = needsRefund(orderStatus, paymentStatus)
    ? "text-amber-700"
    : PAYMENT_TEXT[paymentStatus || "unpaid"] ?? "text-neutral-500";
  return (
    <span className={cn("whitespace-nowrap text-[13px] font-bold", color)}>
      {info.label}
    </span>
  );
}

export function formatOrderDate(createdAt: string | null | undefined) {
  return createdAt ? dateFormatter.format(new Date(createdAt)) : "—";
}

const OrdersColumns: ColumnDef<OrderRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todas"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Seleccionar ${formatOrderNumber(row.original.node.id)}`}
      />
    ),
    enableSorting: false,
  },
  {
    accessorFn: (row) => row.node.id,
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Número" />
    ),
    cell: ({ row }) => {
      const order = row.original.node;

      return (
        <Link
          href={`/admin/orders/${order.id}`}
          className="whitespace-nowrap font-extrabold text-ink hover:text-primary"
        >
          {formatOrderNumber(order.id)}
        </Link>
      );
    },
  },
  {
    accessorFn: (row) => row.node.name || "",
    accessorKey: "customer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cliente" />
    ),
    cell: ({ row }) => {
      const order = row.original.node;
      return (
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink">
            {order.name || "—"}
          </div>
          <div className="truncate text-xs text-neutral-500">
            {[order.phone, order.zone].filter(Boolean).join(" · ")}
          </div>
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.node.created_at || "",
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha" />
    ),
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums text-neutral-600">
        {formatOrderDate(row.original.node.created_at)}
      </span>
    ),
  },
  {
    accessorFn: (row) => row.node.order_status || "",
    accessorKey: "order_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const order = row.original.node;
      const status = order.order_status as OrderStatus;

      if (!status) {
        return <span className="text-neutral-500">Sin estado</span>;
      }

      const staleDays = getStalePendingDays(status, order.created_at);

      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {getOrderStatusInfo(status) ? (
            <StatusPill status={status} />
          ) : (
            <span className="text-neutral-500">{status}</span>
          )}
          {staleDays !== null && <StalePill days={staleDays} />}
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.node.payment_status,
    accessorKey: "payment_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pago" />
    ),
    cell: ({ row }) => (
      <PaymentText
        paymentStatus={row.original.node.payment_status}
        orderStatus={row.original.node.order_status}
      />
    ),
  },
  {
    accessorFn: (row) => Number(row.node.amount || 0),
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Total"
        className="justify-end"
      />
    ),
    cell: ({ row }) => {
      const { total, shippingCost } = getOrderTotals(row.original.node);
      return (
        <div className="whitespace-nowrap text-right">
          <div className="font-extrabold tabular-nums text-ink">
            {formatCUP(total)}
          </div>
          {shippingCost === null && (
            <div className="text-[11px] font-bold text-accent-700">
              Envío por acordar
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Acción</span>,
    cell: ({ row }) => {
      const order = row.original.node;

      return (
        <div className="flex items-center justify-end gap-1.5">
          <OrderNextActionButton
            orderId={order.id}
            status={
              (order.order_status || "pending_confirmation") as OrderStatus
            }
            paymentStatus={order.payment_status}
            shippingPending={
              order.shipping_cost === null || order.shipping_cost === undefined
            }
          />
          <Link
            href={`/admin/orders/${order.id}`}
            aria-label={`Ver ${formatOrderNumber(order.id)}`}
            className="flex size-8 items-center justify-center rounded-[9px] text-neutral-500 hover:bg-surface-soft hover:text-ink"
          >
            <Icons.chevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      );
    },
  },
];

export default OrdersColumns;
