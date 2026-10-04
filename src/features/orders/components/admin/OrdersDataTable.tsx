"use client";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatus } from "@/lib/supabase/schema";
import { Search } from "lucide-react";
import { getOrderStatusInfo } from "../../utils/orderStatus";
import { formatOrderNumber } from "../../utils/whatsapp";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

// Hook para detectar si es vista móvil
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // Verificar que estamos en el cliente
    if (typeof window === "undefined") return;

    // Usar el breakpoint md de Tailwind (768px)
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    // Establecer el valor inicial
    setIsMobile(mediaQuery.matches);

    // Función para actualizar el estado cuando cambie el tamaño
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Escuchar cambios
    mediaQuery.addEventListener("change", handleChange);

    // Limpiar listener al desmontar
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isMobile;
}

type OrderStatusFilter = "all" | OrderStatus;
type PaymentStatusFilter = "all" | "paid" | "unpaid" | "no_payment_required";

function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [orderStatusFilter, setOrderStatusFilter] =
    React.useState<OrderStatusFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    React.useState<PaymentStatusFilter>("all");
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Contar órdenes por estado
  const orderStatusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: data.length,
    };
    const statuses: OrderStatus[] = [
      "pending_confirmation",
      "pending_payment",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    statuses.forEach((status) => {
      counts[status] = data.filter((row: any) => {
        return row.node?.order_status === status;
      }).length;
    });

    return counts;
  }, [data]);

  // Contar órdenes por estado de pago
  const paymentStatusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: data.length,
      paid: 0,
      unpaid: 0,
      no_payment_required: 0,
    };

    data.forEach((row: any) => {
      const status = row.node?.payment_status;
      if (status && Object.prototype.hasOwnProperty.call(counts, status)) {
        counts[status]++;
      }
    });

    return counts;
  }, [data]);

  // Filtrar datos por estado de orden y estado de pago
  const filteredData = React.useMemo(() => {
    return data.filter((row: any) => {
      const order = row.node;

      // Filtro por estado de orden
      if (
        orderStatusFilter !== "all" &&
        order.order_status !== orderStatusFilter
      ) {
        return false;
      }

      // Filtro por estado de pago
      if (
        paymentStatusFilter !== "all" &&
        order.payment_status !== paymentStatusFilter
      ) {
        return false;
      }

      return true;
    });
  }, [data, orderStatusFilter, paymentStatusFilter]);

  // Actualizar visibilidad de columnas basado en el tamaño de pantalla
  React.useEffect(() => {
    if (isMobile) {
      // En móvil, ocultar columnas menos importantes
      setColumnVisibility({
        payment_status: false,
        created_at: false,
      });
    } else {
      // En desktop, mostrar todas las columnas
      setColumnVisibility({});
    }
  }, [isMobile]);

  // Función de filtro global personalizada
  const globalFilterFn = React.useCallback(
    (row: any, _columnId: string, filterValue: string) => {
      const search = filterValue.toLowerCase();
      const order = row.original.node;

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
    },
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Obtener todos los estados de orden disponibles
  const orderStatuses: OrderStatus[] = [
    "pending_confirmation",
    "pending_payment",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente o teléfono..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filtros por estado de orden */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={orderStatusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setOrderStatusFilter("all")}
        >
          Todas ({orderStatusCounts.all})
        </Button>
        {orderStatuses.map((status) => {
          const statusInfo = getOrderStatusInfo(status);
          if (!statusInfo) return null;

          return (
            <Button
              key={status}
              type="button"
              variant={orderStatusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setOrderStatusFilter(status)}
              className="gap-2"
            >
              <statusInfo.icon size={14} />
              {statusInfo.label} ({orderStatusCounts[status] || 0})
            </Button>
          );
        })}
      </div>

      {/* Filtros por estado de pago */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={paymentStatusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setPaymentStatusFilter("all")}
        >
          Todos los pagos ({paymentStatusCounts.all})
        </Button>
        <Button
          type="button"
          variant={paymentStatusFilter === "paid" ? "default" : "outline"}
          size="sm"
          onClick={() => setPaymentStatusFilter("paid")}
          className="text-green-600 border-green-600 hover:bg-green-50"
        >
          Pagado ({paymentStatusCounts.paid})
        </Button>
        <Button
          type="button"
          variant={paymentStatusFilter === "unpaid" ? "default" : "outline"}
          size="sm"
          onClick={() => setPaymentStatusFilter("unpaid")}
          className="text-red-600 border-red-600 hover:bg-red-50"
        >
          Sin pagar ({paymentStatusCounts.unpaid})
        </Button>
        <Button
          type="button"
          variant={
            paymentStatusFilter === "no_payment_required"
              ? "default"
              : "outline"
          }
          size="sm"
          onClick={() => setPaymentStatusFilter("no_payment_required")}
        >
          Sin pago requerido ({paymentStatusCounts.no_payment_required})
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
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
                  className="h-24 text-center"
                >
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

export default DataTable;
