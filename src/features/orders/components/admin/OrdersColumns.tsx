"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentType, gql } from "@/gql";
import { OrderStatus } from "@/lib/supabase/schema";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { getOrderStatusInfo } from "../../utils/orderStatus";
import { getPaymentStatusInfo } from "../../utils/paymentStatus";
import { formatOrderTotal, getOrderTotals } from "../../utils/pricing";
import { formatOrderNumber } from "../../utils/whatsapp";
import { DeleteOrderDialog } from "./DeleteOrderDialog";
import { OrderQuickActions } from "./OrderQuickActions";

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

function getStalePendingDays(
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

const OrdersColumns: ColumnDef<{
  node: DocumentType<typeof OrderColumnsFragment>;
}>[] = [
  {
    accessorFn: (row) => row.node.id,
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Número" />
    ),
    cell: ({ row }) => {
      const order = row.original.node;

      return (
        <Link href={`/admin/orders/${order.id}`} className="font-medium">
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
          <div className="font-medium truncate max-w-[180px]">
            {order.name || "—"}
          </div>
          {order.phone && (
            <a
              href={`tel:${order.phone.replace(/\s/g, "")}`}
              className="text-xs text-muted-foreground"
            >
              {order.phone}
            </a>
          )}
        </div>
      );
    },
  },
  {
    accessorFn: (row) => Number(row.node.amount || 0),
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const { total, shippingCost } = getOrderTotals(row.original.node);
      return (
        <div className="whitespace-nowrap">
          <div className="font-medium">
            {formatOrderTotal(total, shippingCost)}
          </div>
          {shippingCost === null && (
            <Badge
              variant="outline"
              className="mt-1 rounded-md px-1.5 py-0 text-[11px] text-amber-700 border-amber-500"
            >
              Envío por acordar
            </Badge>
          )}
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
    cell: ({ row }) => {
      const createdAt = row.original.node.created_at;
      return (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {createdAt ? dateFormatter.format(new Date(createdAt)) : "—"}
        </span>
      );
    },
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
        return <span className="text-muted-foreground">Sin estado</span>;
      }

      // Validar que el status existe en nuestro enum
      const statusInfo = getOrderStatusInfo(status);

      if (!statusInfo) {
        return (
          <Badge
            variant="outline"
            className="rounded-md px-2 py-1 text-muted-foreground"
          >
            {status}
          </Badge>
        );
      }

      const Icon = statusInfo.icon;
      const staleDays = getStalePendingDays(status, order.created_at);

      return (
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-md px-2 py-1",
              "font-medium flex items-center gap-2 w-fit",
              statusInfo.color,
              statusInfo.borderColor,
            )}
          >
            <Icon size={14} />
            {statusInfo.label}
          </Badge>
          {staleDays !== null && (
            <Badge
              variant="outline"
              className="rounded-md px-2 py-1 w-fit text-amber-700 border-amber-500"
              title="Pendiente hace más de 48 h: el stock sigue reservado"
            >
              Hace {staleDays} días
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.node.payment_status,
    accessorKey: "payment_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado de Pago" />
    ),
    cell: ({ row }) => {
      const order = row.original.node;
      const info = getPaymentStatusInfo(
        order.payment_status,
        order.order_status,
      );

      return (
        <div className="font-medium px-5 py-1 flex items-center">
          <Badge
            variant="outline"
            className={cn(
              "rounded-md px-2 py-1",
              info.className ??
                (order.payment_status === "unpaid"
                  ? "text-red-500 border-red-500"
                  : order.payment_status === "refunded"
                    ? "text-muted-foreground"
                    : "text-green-500 border-green-500"),
            )}
          >
            {info.label}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => {
      const order = row.original.node;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem asChild>
              <Link href={`/admin/orders/${order.id}`}>Ver orden</Link>
            </DropdownMenuItem>
            <OrderQuickActions
              orderId={order.id}
              status={
                (order.order_status || "pending_confirmation") as OrderStatus
              }
              paymentStatus={order.payment_status}
              shippingPending={
                order.shipping_cost === null ||
                order.shipping_cost === undefined
              }
            />
            <DeleteOrderDialog orderId={order.id} variant="dropdown" />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default OrdersColumns;
