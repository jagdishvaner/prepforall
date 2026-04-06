import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { useProblems, type ProblemsFilter } from '@/lib/hooks/useProblems';
import { DifficultyTag } from '@prepforall/platform-ui/atomic';

type Tab = 'all' | 'dsa' | 'sql' | 'assigned';

const tabs: { value: Tab; label: string }[] = [
  { value: 'all', label: 'All Problems' },
  { value: 'dsa', label: 'DSA' },
  { value: 'sql', label: 'SQL' },
  { value: 'assigned', label: 'Assigned' },
];

export function ProblemListPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();

  const filter: ProblemsFilter = { q: search, difficulty: difficultyFilter, tab: activeTab };
  const { data, isLoading } = useProblems(filter);
  const problems = Array.isArray(data) ? data : [];

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => (
      <span className="font-medium cursor-pointer hover:text-primary">{row.original.title}</span>
    )},
    { accessorKey: 'difficulty', header: 'Difficulty', cell: ({ row }) => (
      <DifficultyTag difficulty={row.original.difficulty} />
    )},
    { accessorKey: 'acceptanceRate', header: 'Acceptance', cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.acceptanceRate?.toFixed(1)}%</span>
    )},
  ];

  const table = useReactTable({
    data: problems, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold font-heading">Problems</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input type="text" placeholder="Search..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">All</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-3 text-left font-medium cursor-pointer"
                    onClick={h.column.getToggleSortingHandler()}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">Loading...</td></tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate({ to: '/problems/$slug', params: { slug: row.original.slug } })}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
