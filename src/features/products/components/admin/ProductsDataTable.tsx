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
import { Search } from "lucide-react";

type StockFilter = "all" | "out" | "low" | "in";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /**
   * Filtro inicial (útil para /admin/products?stock=out).
   */
  initialStockFilter?: StockFilter;
  /**
   * Cómo leer el stock desde la fila. Por defecto intenta `row.node.stock`.
   */
  getRowStock?: (row: TData) => number | null | undefined;
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

function DataTable<TData, TValue>({
  columns,
  data,
  initialStockFilter = "all",
  getRowStock,
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [stockFilter, setStockFilter] =
    React.useState<StockFilter>(initialStockFilter);
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Mantener sincronizado si el server cambia el filtro por URL
  React.useEffect(() => {
    setStockFilter(initialStockFilter);
  }, [initialStockFilter]);

  const readStock = React.useCallback(
    (row: TData) => {
      const value =
        getRowStock?.(row) ?? (row as any)?.node?.stock ?? (row as any)?.stock;
      if (value === null || value === undefined) return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    },
    [getRowStock]
  );

  const stockCounts = React.useMemo(() => {
    let out = 0;
    let low = 0;
    let inStock = 0;
    for (const row of data) {
      const s = readStock(row);
      if (s === null || s <= 0) out += 1;
      else if (s < 5) low += 1;
      else inStock += 1;
    }
    return { out, low, in: inStock, all: data.length };
  }, [data, readStock]);

  const filteredData = React.useMemo(() => {
    if (stockFilter === "all") return data;
    return data.filter((row) => {
      const s = readStock(row);
      if (stockFilter === "out") return s === null || s <= 0;
      if (stockFilter === "low") return s !== null && s > 0 && s < 5;
      return s !== null && s >= 5;
    });
  }, [data, readStock, stockFilter]);

  // Actualizar visibilidad de columnas basado en el tamaño de pantalla
  React.useEffect(() => {
    if (isMobile) {
      // En móvil, ocultar columnas menos importantes
      setColumnVisibility({
        slug: false,
        Collection: false,
        featured: false,
        showInSlider: false,
      });
    } else {
      // En desktop, mostrar todas las columnas
      setColumnVisibility({});
    }
  }, [isMobile]);

  // Función de filtro global personalizada
  const globalFilterFn = React.useCallback(
    (row: any, columnId: string, filterValue: string) => {
      const search = filterValue.toLowerCase();
      const product = row.original.node;

      // Buscar en múltiples campos
      const name = product.name?.toLowerCase() || "";
      const slug = product.slug?.toLowerCase() || "";
      const collection = product.collections?.label?.toLowerCase() || "";
      const description = product.description?.toLowerCase() || "";

      return (
        name.includes(search) ||
        slug.includes(search) ||
        collection.includes(search) ||
        description.includes(search)
      );
    },
    []
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={stockFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStockFilter("all")}
          >
            Todos ({stockCounts.all})
          </Button>
          <Button
            type="button"
            variant={stockFilter === "out" ? "default" : "outline"}
            size="sm"
            onClick={() => setStockFilter("out")}
          >
            Sin stock ({stockCounts.out})
          </Button>
          <Button
            type="button"
            variant={stockFilter === "low" ? "default" : "outline"}
            size="sm"
            onClick={() => setStockFilter("low")}
          >
            Stock bajo ({stockCounts.low})
          </Button>
          <Button
            type="button"
            variant={stockFilter === "in" ? "default" : "outline"}
            size="sm"
            onClick={() => setStockFilter("in")}
          >
            En stock ({stockCounts.in})
          </Button>
        </div>
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
                            header.getContext()
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
                        cell.getContext()
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
                  No results.
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
