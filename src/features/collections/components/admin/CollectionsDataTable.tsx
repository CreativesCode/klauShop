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
} from "@/components/admin/AdminTable";
import { Icons } from "@/components/layouts/icons";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DocumentType } from "@/gql";
import Link from "next/link";
import { CollectionColumnsFragment } from "../CollectionsColumns";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

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
  const [globalFilter, setGlobalFilter] = React.useState("");

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
    <div className="overflow-hidden rounded-[18px] border border-line bg-white">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <AdminSearchField
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Buscar por etiqueta, slug o colección padre"
        />
      </div>

      <AdminTableView
        table={table}
        emptyText="No hay colecciones con esta búsqueda."
        renderMobileRow={(row) => {
          const collection = (
            row as { node: DocumentType<typeof CollectionColumnsFragment> }
          ).node;
          return (
            <Link
              href={`/admin/collections/${collection.id}`}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-1.5 truncate text-[15px] font-extrabold capitalize text-ink">
                  {collection.label}
                  {collection.show_in_home && (
                    <Icons.house
                      className="size-4 shrink-0 text-primary"
                      aria-label="Visible en el inicio"
                    />
                  )}
                </span>
                <span className="truncate text-xs text-neutral-500">
                  {collection.collections
                    ? `Dentro de ${collection.collections.label}`
                    : "Colección raíz"}
                  {" · "}
                  {collection.slug}
                </span>
              </span>
              <Icons.chevronRight
                className="size-4 shrink-0 text-neutral-400"
                aria-hidden
              />
            </Link>
          );
        }}
      />

      <DataTablePagination table={table} itemLabel="colecciones" />
    </div>
  );
}

export default DataTable;
