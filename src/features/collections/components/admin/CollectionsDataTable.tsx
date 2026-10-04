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
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Actualizar visibilidad de columnas basado en el tamaño de pantalla
  React.useEffect(() => {
    if (isMobile) {
      // En móvil, ocultar columnas menos importantes
      setColumnVisibility({
        slug: false,
        title: false,
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
      const collection = row.original.node;

      // Buscar en label, slug, title
      const label = (collection.label || "").toLowerCase();
      const slug = (collection.slug || "").toLowerCase();
      const title = (collection.title || "").toLowerCase();
      const parentLabel = (collection.collections?.label || "").toLowerCase();

      return (
        label.includes(search) ||
        slug.includes(search) ||
        title.includes(search) ||
        parentLabel.includes(search)
      );
    },
    [],
  );

  const table = useReactTable({
    data,
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
      {/* Barra de búsqueda */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar colecciones..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
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
