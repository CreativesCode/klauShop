"use client";

import { Icons } from "@/components/layouts/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Table as TanstackTable, flexRender } from "@tanstack/react-table";
import * as React from "react";

/** Filter chip used in admin list toolbars (zones, stock, roles…). */
export const adminChip = (active: boolean) =>
  cn(
    "h-9 shrink-0 rounded-full border px-3 text-xs font-bold transition-colors",
    active
      ? "border-ink bg-ink text-white"
      : "border-neutral-200 bg-white text-neutral-700 hover:border-ink",
  );

type AdminSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
};

export function AdminSearchField({
  value,
  onChange,
  placeholder,
  label = placeholder,
}: AdminSearchFieldProps) {
  return (
    <label className="flex h-10 min-w-0 flex-[1_1_260px] items-center gap-2 rounded-[10px] bg-surface-admin px-3">
      <Icons.search className="size-4 shrink-0 text-neutral-500" aria-hidden />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        // 16px on mobile so iOS Safari does not zoom in on focus
        className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-neutral-500 md:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
    </label>
  );
}

type AdminTableViewProps<TData> = {
  table: TanstackTable<TData>;
  emptyText: string;
  /** Card shown instead of the table below lg. Without it the table scrolls. */
  renderMobileRow?: (row: TData) => React.ReactNode;
};

/** Desktop table (≥ lg) + mobile cards, inside the white list card. */
export function AdminTableView<TData>({
  table,
  emptyText,
  renderMobileRow,
}: AdminTableViewProps<TData>) {
  const rows = table.getRowModel().rows;
  const colSpan = table.getVisibleLeafColumns().length;

  return (
    <>
      <div
        className={cn(
          renderMobileRow ? "hidden lg:block" : "overflow-x-auto",
          "border-t border-line",
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-t-0">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
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
                  colSpan={colSpan}
                  className="py-12 text-center text-[15px] text-neutral-500"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {renderMobileRow && (
        <ul className="border-t border-line lg:hidden">
          {rows.length ? (
            rows.map((row) => (
              <li
                key={row.id}
                className="border-t border-line-soft first:border-t-0"
              >
                {renderMobileRow(row.original)}
              </li>
            ))
          ) : (
            <li className="py-12 text-center text-[15px] text-neutral-500">
              {emptyText}
            </li>
          )}
        </ul>
      )}
    </>
  );
}
