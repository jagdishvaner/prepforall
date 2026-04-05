import { type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyMessage = "No data available",
  className,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto border border-[var(--color-neutral-200)] rounded-lg", className)}>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[var(--color-neutral-50)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left font-medium text-[var(--color-neutral-600)] border-b border-[var(--color-neutral-200)] whitespace-nowrap",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[var(--color-neutral-500)]">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[var(--color-neutral-500)]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  "border-b border-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-50)]",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render ? col.render(row, i) : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
