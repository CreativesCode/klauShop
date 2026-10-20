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

import {
  AdminSearchField,
  AdminTableView,
  adminChip,
} from "@/components/admin/AdminTable";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DocumentType } from "@/gql";
import { formatCUP, keytoUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ProductColumnFragment } from "./ProductsColumns";

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

function DataTable<TData, TValue>({
  columns,
  data,
  initialStockFilter = "all",
  getRowStock,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
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
    [getRowStock],
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

  const stockTabs: { id: StockFilter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "out", label: "Sin stock" },
    { id: "low", label: "Stock bajo" },
    { id: "in", label: "En stock" },
  ];

  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-white">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <AdminSearchField
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Buscar por nombre, slug o colección"
        />
        <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto">
          {stockTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={stockFilter === t.id}
              onClick={() => setStockFilter(t.id)}
              className={adminChip(stockFilter === t.id)}
            >
              {t.label} ({stockCounts[t.id]})
            </button>
          ))}
        </div>
      </div>

      <AdminTableView
        table={table}
        emptyText="No hay productos con estos filtros."
        renderMobileRow={(row) => (
          <ProductMobileRow
            product={
              (row as { node: DocumentType<typeof ProductColumnFragment> }).node
            }
          />
        )}
      />

      <DataTablePagination table={table} itemLabel="productos" />
    </div>
  );
}

function ProductMobileRow({
  product,
}: {
  product: DocumentType<typeof ProductColumnFragment>;
}) {
  const price = parseFloat(product.price?.toString() || "0");
  const discount = product.discount
    ? parseFloat(product.discount.toString())
    : 0;
  const finalPrice = discount > 0 ? price - (price * discount) / 100 : price;
  const stock = product.stock ?? 0;

  return (
    <Link
      href={`/admin/products/${product.id}`}
      className="flex items-center gap-3 px-4 py-3"
    >
      <span className="relative h-[60px] w-12 shrink-0 overflow-hidden rounded-lg bg-surface-tint">
        {product.featuredImage?.key && (
          <Image
            src={keytoUrl(product.featuredImage.key)}
            alt={product.featuredImage.alt || product.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-[15px] font-extrabold text-ink">
            {product.name}
          </span>
          <span className="shrink-0 font-extrabold tabular-nums text-ink">
            {formatCUP(finalPrice)}
          </span>
        </span>
        <span className="flex items-center justify-between gap-3 text-xs">
          <span className="truncate text-neutral-500">
            {product.collections?.label ?? "Sin colección"}
            {discount > 0 && (
              <span className="font-bold text-accent-700">
                {" "}
                · -{discount.toFixed(0)}%
              </span>
            )}
          </span>
          <StockText stock={stock} />
        </span>
      </span>
    </Link>
  );
}

function StockText({ stock }: { stock: number }) {
  return (
    <span
      className={
        stock <= 0
          ? "shrink-0 font-bold text-red-700"
          : stock < 5
            ? "shrink-0 font-bold text-amber-700"
            : "shrink-0 font-semibold text-neutral-600"
      }
    >
      {stock <= 0 ? "Sin stock" : `${stock} en stock`}
    </span>
  );
}

export default DataTable;
