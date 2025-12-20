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
import { Search, Shield, User as UserIcon } from "lucide-react";

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

type RoleFilter = "all" | "admin" | "user";

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
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>("all");
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Contar usuarios por rol
  const roleCounts = React.useMemo(() => {
    let admin = 0;
    let user = 0;

    data.forEach((row: any) => {
      const isAdmin = row.app_metadata?.isAdmin === true;
      if (isAdmin) {
        admin += 1;
      } else {
        user += 1;
      }
    });

    return {
      all: data.length,
      admin,
      user,
    };
  }, [data]);

  // Actualizar visibilidad de columnas basado en el tamaño de pantalla
  React.useEffect(() => {
    if (isMobile) {
      // En móvil, ocultar columnas menos importantes
      setColumnVisibility({
        role: false,
      });
    } else {
      // En desktop, mostrar todas las columnas
      setColumnVisibility({});
    }
  }, [isMobile]);

  // Actualizar filtro de rol cuando cambia
  React.useEffect(() => {
    if (roleFilter === "all") {
      setColumnFilters((prev) => prev.filter((f) => f.id !== "role"));
    } else {
      setColumnFilters((prev) => {
        const filtered = prev.filter((f) => f.id !== "role");
        return [...filtered, { id: "role", value: roleFilter }];
      });
    }
  }, [roleFilter]);

  // Función de filtro global personalizada
  const globalFilterFn = React.useCallback(
    (row: any, _columnId: string, filterValue: string) => {
      const search = filterValue.toLowerCase();
      const user = row.original;

      // Buscar en nombre, email
      const name = (user.user_metadata?.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();

      return name.includes(search) || email.includes(search);
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
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filtros rápidos por rol */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={roleFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setRoleFilter("all")}
        >
          Todos ({roleCounts.all})
        </Button>
        <Button
          type="button"
          variant={roleFilter === "admin" ? "default" : "outline"}
          size="sm"
          onClick={() => setRoleFilter("admin")}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          Administradores ({roleCounts.admin})
        </Button>
        <Button
          type="button"
          variant={roleFilter === "user" ? "default" : "outline"}
          size="sm"
          onClick={() => setRoleFilter("user")}
          className="gap-2"
        >
          <UserIcon className="h-4 w-4" />
          Usuarios ({roleCounts.user})
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
