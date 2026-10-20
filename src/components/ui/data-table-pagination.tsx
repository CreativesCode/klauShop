import { cn } from "@/lib/utils";
import { Table } from "@tanstack/react-table";
import { Icons } from "../layouts/icons";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  /** Noun for the counter: "Mostrando 10 de 42 órdenes" */
  itemLabel?: string;
}

// Page numbers around the current one (max 5 buttons)
function pageWindow(current: number, count: number) {
  const size = Math.min(5, count);
  const start = Math.max(0, Math.min(current - 2, count - size));
  return Array.from({ length: size }, (_, i) => start + i);
}

/** Table footer: "Mostrando N de T" + numbered pages (34px buttons). */
export function DataTablePagination<TData>({
  table,
  itemLabel = "resultados",
}: DataTablePaginationProps<TData>) {
  const total = table.getFilteredRowModel().rows.length;
  const shown = table.getRowModel().rows.length;
  const selected = table.getFilteredSelectedRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  const pageButton =
    "flex size-[34px] items-center justify-center rounded-[10px] text-[13px] font-bold tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 text-[13px] text-neutral-500">
      <p>
        Mostrando {shown} de {total} {itemLabel}
        {selected > 0 && (
          <span className="font-bold text-ink">
            {" "}
            · {selected} seleccionada{selected === 1 ? "" : "s"}
          </span>
        )}
      </p>
      <label className="ml-auto flex items-center gap-2">
        <span className="hidden sm:inline">Por página</span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          // Native select: 16px on phones so iOS does not zoom
          className="h-[34px] rounded-[10px] border border-line bg-white px-2 text-[16px] font-bold text-ink md:text-[13px]"
        >
          {[10, 20, 30, 40, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      {pageCount > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-1">
          <button
            type="button"
            className={cn(pageButton, "hover:bg-surface-soft")}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
          >
            <Icons.chevronLeft className="size-4" aria-hidden />
          </button>
          {pageWindow(pageIndex, pageCount).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => table.setPageIndex(page)}
              aria-current={page === pageIndex ? "page" : undefined}
              className={cn(
                pageButton,
                page === pageIndex
                  ? "bg-ink text-white"
                  : "text-ink hover:bg-surface-soft",
              )}
            >
              {page + 1}
            </button>
          ))}
          <button
            type="button"
            className={cn(pageButton, "hover:bg-surface-soft")}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Página siguiente"
          >
            <Icons.chevronRight className="size-4" aria-hidden />
          </button>
        </nav>
      )}
    </div>
  );
}
