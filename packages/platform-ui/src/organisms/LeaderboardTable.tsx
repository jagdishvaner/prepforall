import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { cn } from '../lib/cn';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  problemsSolved?: number;
  penalty?: number;
}

export interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  onRowClick?: (entry: LeaderboardEntry) => void;
  className?: string;
}

const columns: ColumnDef<LeaderboardEntry>[] = [
  { accessorKey: 'rank', header: '#', size: 60 },
  { accessorKey: 'username', header: 'User' },
  { accessorKey: 'score', header: 'Score' },
  { accessorKey: 'problemsSolved', header: 'Solved' },
  { accessorKey: 'penalty', header: 'Penalty' },
];

export function LeaderboardTable({ data, onRowClick, className }: LeaderboardTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden', className)}>
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' \u2191', desc: ' \u2193' }[header.column.getIsSorted() as string] ?? ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
