"use client";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import {
  AdminSearchField,
  AdminTableView,
  adminChip,
} from "@/components/admin/AdminTable";
import { Icons } from "@/components/layouts/icons";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { getNameInitials } from "@/lib/utils";
import { User } from "@supabase/supabase-js";
import Link from "next/link";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

type RoleFilter = "all" | "admin" | "user";

function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
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

  const roleTabs: { id: RoleFilter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "admin", label: "Administradores" },
    { id: "user", label: "Clientes" },
  ];

  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-white">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <AdminSearchField
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Buscar por nombre o email"
        />
        <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto">
          {roleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={roleFilter === t.id}
              onClick={() => setRoleFilter(t.id)}
              className={adminChip(roleFilter === t.id)}
            >
              {t.label} ({roleCounts[t.id]})
            </button>
          ))}
        </div>
      </div>

      <AdminTableView
        table={table}
        emptyText="No hay usuarios con estos filtros."
        renderMobileRow={(row) => {
          const user = row as User;
          const name = (user.user_metadata?.name as string | undefined) || "";
          const isAdmin = user.app_metadata?.isAdmin === true;
          return (
            <Link
              href={`/admin/users/${user.id}`}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-extrabold text-primary-700">
                {getNameInitials(name || user.email || "?")}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-extrabold text-ink">
                  {name || "Sin nombre"}
                </span>
                <span className="truncate text-xs text-neutral-500">
                  {user.email}
                </span>
              </span>
              {isAdmin && (
                <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700">
                  Admin
                </span>
              )}
              <Icons.chevronRight
                className="size-4 shrink-0 text-neutral-400"
                aria-hidden
              />
            </Link>
          );
        }}
      />

      <DataTablePagination table={table} itemLabel="usuarios" />
    </div>
  );
}

export default DataTable;
