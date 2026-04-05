# Workstream C: Platform App + Authentication -- Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `apps/platform` Vite SPA with TanStack Router/Query, the `packages/platform-ui` component library, a production-grade JWT + OAuth authentication system (modal login, invite-only registration, httpOnly refresh cookies, RBAC guards), and the corresponding Go API auth endpoints.

**Architecture:** The platform app (`apps/platform`) is a Vite-powered SPA deployed to Cloudflare Pages at `app.prepforall.com`. All presentational components live in `packages/platform-ui` (`@prepforall/platform-ui`); page orchestration (data fetching, Zustand stores, WebSocket, API calls) lives in `apps/platform/src/features/`. Authentication uses a dual-token strategy: short-lived access JWTs (15min, stored in Zustand memory) and long-lived refresh tokens (7d, httpOnly secure cookie). OAuth flows use a popup window with `postMessage` relay. RBAC is enforced at both the Go API middleware layer and the TanStack Router `beforeLoad` guards.

**Tech Stack:** Vite 6, React 19, TanStack Router v1, TanStack Query v5, TanStack Table v8, TanStack Virtual v3, Zustand 5, Monaco Editor, Tailwind CSS, Radix UI, react-resizable-panels, Recharts, Go 1.23, chi v5, pgx v5, golang-jwt/v5, golang.org/x/oauth2

**Prerequisites:** Workstream A (monorepo + Turborepo setup) and Workstream B (design system `packages/ui`) should be complete, providing `turbo.json`, `@prepforall/react`, `@prepforall/tokens`, `@prepforall/css`, and `@prepforall/icons`. If they are not yet complete, Tasks 1-4 can still proceed by using local Tailwind classes and stubbing `@prepforall/react` imports.

---

## Task 1: packages/platform-ui setup (package scaffolding + build config)

**Files:**
- Create: `packages/platform-ui/package.json`
- Create: `packages/platform-ui/tsconfig.json`
- Create: `packages/platform-ui/tsconfig.build.json`
- Create: `packages/platform-ui/src/index.ts`
- Create: `packages/platform-ui/src/atomic/index.ts`
- Create: `packages/platform-ui/src/molecular/index.ts`
- Create: `packages/platform-ui/src/organisms/index.ts`
- Modify: Root `package.json` (add workspace if Turborepo is set up)

**Steps:**

- [ ] Create the directory structure `packages/platform-ui/src/{atomic,molecular,organisms}`
- [ ] Create `packages/platform-ui/package.json`:
```json
{
  "name": "@prepforall/platform-ui",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./atomic": "./src/atomic/index.ts",
    "./molecular": "./src/molecular/index.ts",
    "./organisms": "./src/organisms/index.ts"
  },
  "scripts": {
    "lint": "eslint src/",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "@monaco-editor/react": "^4.7.0",
    "@tanstack/react-table": "^8.21.0",
    "@tanstack/react-virtual": "^3.12.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.469.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "jsdom": "^25.0.0",
    "typescript": "^5",
    "vitest": "^3.0.0"
  }
}
```
- [ ] Create `packages/platform-ui/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.*"]
}
```
- [ ] Create `packages/platform-ui/src/index.ts` that re-exports all layers:
```ts
export * from './atomic';
export * from './molecular';
export * from './organisms';
```
- [ ] Create empty barrel exports for `src/atomic/index.ts`, `src/molecular/index.ts`, `src/organisms/index.ts`
- [ ] Run `yarn install` from the monorepo root
- [ ] Run `cd packages/platform-ui && npx tsc --noEmit` -- expect 0 errors

**Commit point:** `feat(platform-ui): scaffold package with atomic design structure`

---

## Task 2: Platform UI atomic components (VerdictBadge, DifficultyTag, LanguageIcon)

**Files:**
- Create: `packages/platform-ui/src/atomic/VerdictBadge.tsx`
- Create: `packages/platform-ui/src/atomic/VerdictBadge.test.tsx`
- Create: `packages/platform-ui/src/atomic/DifficultyTag.tsx`
- Create: `packages/platform-ui/src/atomic/DifficultyTag.test.tsx`
- Create: `packages/platform-ui/src/atomic/LanguageIcon.tsx`
- Create: `packages/platform-ui/src/atomic/LanguageIcon.test.tsx`
- Modify: `packages/platform-ui/src/atomic/index.ts`

**Steps:**

- [ ] Create `VerdictBadge.tsx` -- renders verdict labels (AC, WA, TLE, MLE, RE, CE, PENDING, RUNNING) with color-coded styling using `class-variance-authority`:
```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const verdictVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
  {
    variants: {
      verdict: {
        AC: 'bg-green-500/15 text-green-600 dark:text-green-400',
        WA: 'bg-red-500/15 text-red-600 dark:text-red-400',
        TLE: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
        MLE: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
        RE: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
        CE: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
        PENDING: 'bg-muted text-muted-foreground',
        RUNNING: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      },
    },
    defaultVariants: { verdict: 'PENDING' },
  }
);

const verdictLabels: Record<string, string> = {
  AC: 'Accepted', WA: 'Wrong Answer', TLE: 'Time Limit Exceeded',
  MLE: 'Memory Limit Exceeded', RE: 'Runtime Error', CE: 'Compilation Error',
  PENDING: 'Pending', RUNNING: 'Running',
};

export type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'PENDING' | 'RUNNING';

export interface VerdictBadgeProps extends VariantProps<typeof verdictVariants> {
  verdict: Verdict;
  className?: string;
  showLabel?: boolean;
}

export function VerdictBadge({ verdict, className, showLabel = true }: VerdictBadgeProps) {
  return (
    <span className={cn(verdictVariants({ verdict }), className)}>
      {showLabel ? verdictLabels[verdict] : verdict}
    </span>
  );
}
```
- [ ] Create `packages/platform-ui/src/lib/cn.ts` (shared utility):
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
- [ ] Write `VerdictBadge.test.tsx` -- test all 8 verdict variants render correct label text and have correct CSS classes
- [ ] Create `DifficultyTag.tsx` -- renders Easy/Medium/Hard with green/yellow/red colors using CVA variants
```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const difficultyVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      difficulty: {
        easy: 'bg-green-500/15 text-green-600 dark:text-green-400',
        medium: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
        hard: 'bg-red-500/15 text-red-600 dark:text-red-400',
      },
    },
  }
);

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyTagProps extends VariantProps<typeof difficultyVariants> {
  difficulty: Difficulty;
  className?: string;
}

export function DifficultyTag({ difficulty, className }: DifficultyTagProps) {
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return <span className={cn(difficultyVariants({ difficulty }), className)}>{label}</span>;
}
```
- [ ] Write `DifficultyTag.test.tsx` -- test label capitalization and variant classes
- [ ] Create `LanguageIcon.tsx` -- renders language-specific icons/labels for C++, Java, Python, JavaScript, Go, PostgreSQL:
```tsx
import { cn } from '../lib/cn';

export type Language = 'cpp' | 'c' | 'java' | 'python' | 'javascript' | 'go' | 'postgresql';

const languageConfig: Record<Language, { label: string; color: string }> = {
  cpp: { label: 'C++', color: 'text-blue-500' },
  c: { label: 'C', color: 'text-gray-500' },
  java: { label: 'Java', color: 'text-orange-500' },
  python: { label: 'Python', color: 'text-yellow-500' },
  javascript: { label: 'JS', color: 'text-yellow-400' },
  go: { label: 'Go', color: 'text-cyan-500' },
  postgresql: { label: 'SQL', color: 'text-indigo-500' },
};

export interface LanguageIconProps {
  language: Language;
  className?: string;
  showLabel?: boolean;
}

export function LanguageIcon({ language, className, showLabel = true }: LanguageIconProps) {
  const config = languageConfig[language] ?? { label: language, color: 'text-muted-foreground' };
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-mono font-medium', config.color, className)}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {showLabel && config.label}
    </span>
  );
}
```
- [ ] Write `LanguageIcon.test.tsx`
- [ ] Update `packages/platform-ui/src/atomic/index.ts` to export all three components
- [ ] Run `cd packages/platform-ui && npx vitest run` -- expect all tests pass

**Commit point:** `feat(platform-ui): add VerdictBadge, DifficultyTag, LanguageIcon atomic components`

---

## Task 3: Platform UI molecular components (StatCards, TimerDisplay, ProblemListItem)

**Files:**
- Create: `packages/platform-ui/src/molecular/StatCard.tsx`
- Create: `packages/platform-ui/src/molecular/StatCard.test.tsx`
- Create: `packages/platform-ui/src/molecular/TimerDisplay.tsx`
- Create: `packages/platform-ui/src/molecular/TimerDisplay.test.tsx`
- Create: `packages/platform-ui/src/molecular/ProblemListItem.tsx`
- Create: `packages/platform-ui/src/molecular/ProblemListItem.test.tsx`
- Modify: `packages/platform-ui/src/molecular/index.ts`

**Steps:**

- [ ] Create `StatCard.tsx` -- a presentational card displaying a title, numeric value, optional delta/trend icon, and optional subtitle. Uses CVA for variant styling (default, success, warning, destructive):
```tsx
import { cn } from '../lib/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const statCardVariants = cva(
  'rounded-xl border p-6',
  {
    variants: {
      variant: {
        default: 'border-border bg-card',
        success: 'border-green-500/20 bg-green-500/5',
        warning: 'border-yellow-500/20 bg-yellow-500/5',
        destructive: 'border-red-500/20 bg-red-500/5',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface StatCardProps extends VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, variant, className }: StatCardProps) {
  return (
    <div className={cn(statCardVariants({ variant }), className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {(subtitle || trend) && (
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <span className={cn(trend.value >= 0 ? 'text-green-500' : 'text-red-500')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
```
- [ ] Write `StatCard.test.tsx` -- test rendering with all prop combinations
- [ ] Create `TimerDisplay.tsx` -- a countdown timer that takes `endTime: Date` and `onExpire?: () => void`, uses `useEffect` + `setInterval` internally, renders HH:MM:SS. Pure presentational -- parent controls start/stop via mount/unmount:
```tsx
import { useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/cn';

export interface TimerDisplayProps {
  endTime: Date;
  onExpire?: () => void;
  className?: string;
  warningThresholdMs?: number; // default 5 minutes
}

export function TimerDisplay({ endTime, onExpire, className, warningThresholdMs = 5 * 60 * 1000 }: TimerDisplayProps) {
  const calcRemaining = useCallback(() => Math.max(0, endTime.getTime() - Date.now()), [endTime]);
  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [calcRemaining, onExpire]);

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const isWarning = remaining > 0 && remaining <= warningThresholdMs;
  const isExpired = remaining <= 0;

  return (
    <div className={cn(
      'font-mono text-lg font-bold tabular-nums',
      isExpired && 'text-destructive',
      isWarning && !isExpired && 'text-yellow-500 animate-pulse',
      !isWarning && !isExpired && 'text-foreground',
      className
    )}>
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
```
- [ ] Write `TimerDisplay.test.tsx` -- test initial render format, warning state class names (use fake timers)
- [ ] Create `ProblemListItem.tsx` -- a row component composing DifficultyTag and LanguageIcon, takes problem data as props:
```tsx
import { DifficultyTag, type Difficulty } from '../atomic/DifficultyTag';
import { cn } from '../lib/cn';

export interface ProblemListItemProps {
  index: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  acceptanceRate: number;
  tags: string[];
  isSolved?: boolean;
  className?: string;
  onNavigate?: (slug: string) => void;
}

export function ProblemListItem({
  index, title, slug, difficulty, acceptanceRate, tags, isSolved, className, onNavigate,
}: ProblemListItemProps) {
  return (
    <tr
      className={cn('border-b border-border/50 hover:bg-muted/30 cursor-pointer', className)}
      onClick={() => onNavigate?.(slug)}
    >
      <td className="px-4 py-3 text-muted-foreground w-12">
        {isSolved ? <span className="text-green-500">✓</span> : index}
      </td>
      <td className="px-4 py-3 font-medium">{title}</td>
      <td className="px-4 py-3"><DifficultyTag difficulty={difficulty} /></td>
      <td className="px-4 py-3 text-muted-foreground">{acceptanceRate.toFixed(1)}%</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{tag}</span>
          ))}
        </div>
      </td>
    </tr>
  );
}
```
- [ ] Write `ProblemListItem.test.tsx`
- [ ] Update `packages/platform-ui/src/molecular/index.ts` barrel exports
- [ ] Run tests: `cd packages/platform-ui && npx vitest run`

**Commit point:** `feat(platform-ui): add StatCard, TimerDisplay, ProblemListItem molecular components`

---

## Task 4: Platform UI organism components (CodeEditor Monaco wrapper, SubmissionPanel, LeaderboardTable)

**Files:**
- Create: `packages/platform-ui/src/organisms/CodeEditor.tsx`
- Create: `packages/platform-ui/src/organisms/CodeEditor.test.tsx`
- Create: `packages/platform-ui/src/organisms/SubmissionPanel.tsx`
- Create: `packages/platform-ui/src/organisms/SubmissionPanel.test.tsx`
- Create: `packages/platform-ui/src/organisms/LeaderboardTable.tsx`
- Create: `packages/platform-ui/src/organisms/LeaderboardTable.test.tsx`
- Modify: `packages/platform-ui/src/organisms/index.ts`

**Steps:**

- [ ] Create `CodeEditor.tsx` -- Monaco wrapper extracted from `apps/web/components/editor/CodeEditor.tsx`. Accepts all config as props (no store dependency). The key difference from the old component: this is presentational with no Zustand coupling:
```tsx
import Editor, { type OnChange, type OnMount } from '@monaco-editor/react';
import { cn } from '../lib/cn';

const monacoLangMap: Record<string, string> = {
  cpp: 'cpp', c: 'c', java: 'java', python: 'python',
  javascript: 'javascript', go: 'go', postgresql: 'pgsql',
};

export interface CodeEditorProps {
  value: string;
  language: string;
  theme?: 'vs-dark' | 'light';
  fontSize?: number;
  tabSize?: number;
  readOnly?: boolean;
  onChange?: OnChange;
  onMount?: OnMount;
  className?: string;
  height?: string;
}

export function CodeEditor({
  value, language, theme = 'vs-dark', fontSize = 14, tabSize = 4,
  readOnly = false, onChange, onMount, className, height = '100%',
}: CodeEditorProps) {
  return (
    <div className={cn('h-full w-full overflow-hidden', className)}>
      <Editor
        height={height}
        language={monacoLangMap[language] ?? language}
        value={value}
        theme={theme}
        onChange={onChange}
        onMount={onMount}
        options={{
          fontSize, tabSize, readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          formatOnPaste: true,
          suggestOnTriggerCharacters: !readOnly,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
        }}
      />
    </div>
  );
}
```
- [ ] Write `CodeEditor.test.tsx` -- test that the component renders without crashing (mock `@monaco-editor/react`), verify props passthrough
- [ ] Create `SubmissionPanel.tsx` -- renders submission result or test case selector. Extracted from `apps/web/components/problem/OutputPanel.tsx`, adapted to be store-free:
```tsx
import { VerdictBadge, type Verdict } from '../atomic/VerdictBadge';
import { cn } from '../lib/cn';

export interface SubmissionResult {
  verdict: Verdict;
  runtimeMs?: number;
  memoryKb?: number;
  passedCases: number;
  totalCases: number;
  errorMsg?: string;
}

export interface TestCaseItem {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface SubmissionPanelProps {
  result: SubmissionResult | null;
  isJudging: boolean;
  testCases: TestCaseItem[];
  selectedTestCase?: string;
  onSelectTestCase?: (id: string) => void;
  className?: string;
}

export function SubmissionPanel({
  result, isJudging, testCases, selectedTestCase, onSelectTestCase, className,
}: SubmissionPanelProps) {
  if (isJudging) {
    return (
      <div className={cn('flex h-full items-center justify-center gap-2 text-muted-foreground', className)}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Judge is evaluating your code...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={cn('flex h-full flex-col p-4', className)}>
        <h3 className="mb-3 text-sm font-semibold">Test Cases</h3>
        <div className="flex gap-2">
          {testCases.map((tc, i) => (
            <button
              key={tc.id}
              onClick={() => onSelectTestCase?.(tc.id)}
              className={cn(
                'rounded border px-3 py-1.5 text-sm',
                selectedTestCase === tc.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
              )}
            >
              Case {i + 1}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Run or submit to see results.</p>
      </div>
    );
  }

  return (
    <div className={cn('h-full overflow-y-auto p-4', className)}>
      <div className="mb-4 flex items-center gap-4">
        <VerdictBadge verdict={result.verdict} />
        {result.runtimeMs != null && (
          <span className="text-sm text-muted-foreground">Runtime: {result.runtimeMs}ms</span>
        )}
        {result.memoryKb != null && (
          <span className="text-sm text-muted-foreground">Memory: {(result.memoryKb / 1024).toFixed(1)}MB</span>
        )}
        <span className="text-sm text-muted-foreground">
          {result.passedCases}/{result.totalCases} passed
        </span>
      </div>
      {result.errorMsg && (
        <pre className="rounded bg-destructive/10 p-3 text-sm text-destructive font-mono whitespace-pre-wrap">
          {result.errorMsg}
        </pre>
      )}
    </div>
  );
}
```
- [ ] Write `SubmissionPanel.test.tsx` -- test judging state, empty state, result state
- [ ] Create `LeaderboardTable.tsx` -- uses TanStack Table for sortable columns (rank, username, score, problems solved, penalty):
```tsx
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
                  {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
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
```
- [ ] Write `LeaderboardTable.test.tsx` -- test rendering with mock data, sorting toggle
- [ ] Update `packages/platform-ui/src/organisms/index.ts` barrel exports
- [ ] Run all platform-ui tests: `cd packages/platform-ui && npx vitest run`

**Commit point:** `feat(platform-ui): add CodeEditor, SubmissionPanel, LeaderboardTable organism components`

---

## Task 5: apps/platform Vite setup

**Files:**
- Create: `apps/platform/package.json`
- Create: `apps/platform/vite.config.ts`
- Create: `apps/platform/tsconfig.json`
- Create: `apps/platform/tsconfig.node.json`
- Create: `apps/platform/index.html`
- Create: `apps/platform/src/main.tsx`
- Create: `apps/platform/src/globals.css`
- Create: `apps/platform/.env.example`
- Create: `apps/platform/tailwind.config.ts`
- Create: `apps/platform/postcss.config.js`

**Steps:**

- [ ] Create `apps/platform/` directory structure: `src/`, `src/routes/`, `src/features/`, `src/lib/`, `src/stores/`, `src/types/`
- [ ] Create `apps/platform/package.json`:
```json
{
  "name": "@prepforall/platform",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@monaco-editor/react": "^4.7.0",
    "@prepforall/platform-ui": "workspace:*",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.6",
    "@tanstack/react-query": "^5.69.0",
    "@tanstack/react-query-devtools": "^5.69.0",
    "@tanstack/react-router": "^1.95.0",
    "@tanstack/react-router-devtools": "^1.95.0",
    "@tanstack/router-vite-plugin": "^1.95.0",
    "axios": "^1.7.9",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.469.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.0",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.0",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```
- [ ] Create `apps/platform/vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```
- [ ] Create `apps/platform/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "vite-env.d.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```
- [ ] Create `apps/platform/tsconfig.node.json` for Vite config:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```
- [ ] Create `apps/platform/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PrepForAll Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body class="min-h-screen bg-background text-foreground antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
- [ ] Create `apps/platform/src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { routeTree } from './routeTree.gen';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```
- [ ] Create `apps/platform/src/globals.css` (copy existing design token variables from `apps/web/app/globals.css`, add Tailwind directives):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --border: 217.2 32.6% 17.5%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
  }
}

body {
  font-family: 'Inter', sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'DM Sans', sans-serif;
}

code, pre, .font-mono {
  font-family: 'JetBrains Mono', monospace;
}
```
- [ ] Create `apps/platform/tailwind.config.ts` (mirroring `apps/web/tailwind.config.ts` with paths updated):
```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/platform-ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        border: 'hsl(var(--border))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        card: 'hsl(var(--background))',
        ring: 'hsl(var(--primary))',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
```
- [ ] Create `apps/platform/postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```
- [ ] Create `apps/platform/.env.example`:
```
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```
- [ ] Run `yarn install` from monorepo root
- [ ] Run `cd apps/platform && npx vite build` -- expect successful build with empty routes
- [ ] Run `cd apps/platform && npx tsc --noEmit` -- expect 0 type errors

**Commit point:** `feat(platform): scaffold Vite app with TanStack Router, Query, and Tailwind`

---

## Task 6: TanStack Router setup (file-based routing, __root.tsx with auth guard)

**Files:**
- Create: `apps/platform/src/routes/__root.tsx`
- Create: `apps/platform/src/routes/index.tsx`
- Create: `apps/platform/src/routes/auth/login.tsx`
- Create: `apps/platform/src/routes/auth/setup.tsx`
- Create: `apps/platform/src/lib/auth.ts` (auth utility for route guards)
- Create: `apps/platform/src/types/auth.ts`

**Steps:**

- [ ] Create `apps/platform/src/types/auth.ts` with shared auth types:
```ts
export type UserRole = 'super_admin' | 'org_admin' | 'trainer' | 'student';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  orgId?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}
```
- [ ] Create `apps/platform/src/lib/auth.ts` with helper to check token validity:
```ts
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function parseJwtPayload(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}
```
- [ ] Create `apps/platform/src/routes/__root.tsx` -- root layout with auth guard:
```tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  );
}
```
- [ ] Create `apps/platform/src/routes/index.tsx` -- redirect to dashboard:
```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});
```
- [ ] Create placeholder `apps/platform/src/routes/auth/login.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

function LoginPage() {
  return <div className="flex h-screen items-center justify-center">Login page placeholder</div>;
}
```
- [ ] Create placeholder `apps/platform/src/routes/auth/setup.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/setup')({
  component: SetupPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
});

function SetupPage() {
  const { token } = Route.useSearch();
  return <div className="flex h-screen items-center justify-center">Setup page for token: {token}</div>;
}
```
- [ ] Run `cd apps/platform && npx vite` -- verify dev server starts and routes work at `http://localhost:5173`
- [ ] Verify TanStack Router generates `src/routeTree.gen.ts` automatically

**Commit point:** `feat(platform): add TanStack Router file-based routing with root layout`

---

## Task 7: Auth system -- login modal, OAuth popup flow, token management (Zustand store)

**Files:**
- Create: `apps/platform/src/stores/authStore.ts`
- Create: `apps/platform/src/features/Auth/LoginModal.tsx`
- Create: `apps/platform/src/features/Auth/OAuthPopup.ts`
- Create: `apps/platform/src/features/Auth/useAuth.ts`
- Create: `apps/platform/src/lib/apiClient.ts`
- Modify: `apps/platform/src/routes/__root.tsx` (add auth guard)

**Steps:**

- [ ] Create `apps/platform/src/stores/authStore.ts` -- Zustand store with JWT in memory (NOT localStorage):
```ts
import { create } from 'zustand';
import type { AuthUser, UserRole } from '@/types/auth';
import { parseJwtPayload } from '@/lib/auth';

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginModalOpen: boolean;

  setAuth: (token: string) => void;
  clearAuth: () => void;
  setLoginModalOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // true until initial refresh attempt completes
  loginModalOpen: false,

  setAuth: (token: string) => {
    const payload = parseJwtPayload(token);
    if (!payload) return;

    const user: AuthUser = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      orgId: payload.org_id,
      avatarUrl: payload.avatar_url,
    };

    set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  setLoginModalOpen: (open) => set({ loginModalOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),

  hasRole: (...roles) => {
    const { user } = get();
    return user != null && roles.includes(user.role);
  },
}));
```
- [ ] Create `apps/platform/src/lib/apiClient.ts` -- axios instance with JWT interceptor and silent refresh:
```ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send httpOnly cookies
});

// Attach access token to every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401: attempt silent refresh, then retry original request once
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${API_BASE}/api/v1/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken = data.access_token as string;
      useAuthStore.getState().setAuth(newToken);
      onTokenRefreshed(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch {
      useAuthStore.getState().clearAuth();
      useAuthStore.getState().setLoginModalOpen(true);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
```
- [ ] Create `apps/platform/src/features/Auth/OAuthPopup.ts` -- utility for OAuth popup window + postMessage relay:
```ts
const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 600;

export function openOAuthPopup(provider: 'google' | 'github'): Promise<string> {
  return new Promise((resolve, reject) => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    const url = `${apiBase}/api/v1/auth/${provider}`;
    const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
    const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;

    const popup = window.open(
      url,
      `${provider}_login`,
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},popup=yes`
    );

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      if (event.origin !== window.location.origin) return;

      const { type, access_token, error } = event.data ?? {};
      if (type !== 'oauth_callback') return;

      window.removeEventListener('message', handleMessage);
      clearInterval(pollTimer);

      if (error) {
        reject(new Error(error));
      } else if (access_token) {
        resolve(access_token as string);
      } else {
        reject(new Error('No token received'));
      }
    };

    window.addEventListener('message', handleMessage);

    // Poll to detect if popup was closed manually
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        window.removeEventListener('message', handleMessage);
        reject(new Error('Login cancelled'));
      }
    }, 500);
  });
}
```
- [ ] Create `apps/platform/src/routes/auth/oauth-callback.tsx` -- the page the OAuth popup lands on after redirect, sends postMessage to parent:
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/auth/oauth-callback')({
  component: OAuthCallback,
  validateSearch: (search: Record<string, unknown>) => ({
    access_token: (search.access_token as string) || '',
    error: (search.error as string) || '',
  }),
});

function OAuthCallback() {
  const { access_token, error } = Route.useSearch();

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage(
        { type: 'oauth_callback', access_token, error },
        window.location.origin
      );
      window.close();
    }
  }, [access_token, error]);

  return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Completing login...
    </div>
  );
}
```
- [ ] Create `apps/platform/src/features/Auth/LoginModal.tsx` -- modal login (LeetCode-style):
```tsx
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import { openOAuthPopup } from './OAuthPopup';
import { toast } from 'sonner';

export function LoginModal() {
  const { loginModalOpen, setLoginModalOpen, setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post('/api/v1/auth/login', { email, password });
      setAuth(data.access_token);
      setLoginModalOpen(false);
      toast.success('Welcome back!');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      const token = await openOAuthPopup(provider);
      setAuth(token);
      setLoginModalOpen(false);
      toast.success('Welcome back!');
    } catch (err) {
      if (err instanceof Error && err.message !== 'Login cancelled') {
        toast.error(err.message);
      }
    }
  };

  return (
    <Dialog.Root open={loginModalOpen} onOpenChange={setLoginModalOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-8 shadow-2xl">
          <Dialog.Title className="text-2xl font-bold font-heading">Sign In</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Welcome to PrepForAll. Sign in to continue.
          </Dialog.Description>

          {/* OAuth buttons */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuth('github')}
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Continue with GitHub
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <input
              type="email" placeholder="Email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password" placeholder="Password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit" disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => setShowForgotPassword(true)}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            No account? Contact your organization admin for an invite.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```
- [ ] Create `apps/platform/src/features/Auth/useAuth.ts` -- hook for initial silent refresh on app load:
```ts
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useInitAuth() {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const { data } = await axios.post(
          `${API_BASE}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAuth(data.access_token);
      } catch {
        clearAuth();
      }
    };

    tryRefresh();
  }, [setAuth, clearAuth, setLoading]);
}
```
- [ ] Update `apps/platform/src/routes/__root.tsx` to integrate auth:
```tsx
import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { LoginModal } from '@/features/Auth/LoginModal';
import { useInitAuth } from '@/features/Auth/useAuth';
import { useAuthStore } from '@/stores/authStore';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  useInitAuth();
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Outlet />
      <LoginModal />
      <Toaster richColors position="top-right" />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  );
}
```
- [ ] Run `cd apps/platform && npx tsc --noEmit` -- expect 0 errors
- [ ] Run `cd apps/platform && npx vite` -- verify login modal renders when navigating to protected routes

**Commit point:** `feat(platform): add auth system with login modal, OAuth popup, and Zustand token store`

---

## Task 8: Auth system -- invite setup page (/auth/setup?token=xxx)

**Files:**
- Modify: `apps/platform/src/routes/auth/setup.tsx`
- Create: `apps/platform/src/features/Auth/SetupForm.tsx`

**Steps:**

- [ ] Create `apps/platform/src/features/Auth/SetupForm.tsx`:
```tsx
import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { openOAuthPopup } from './OAuthPopup';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

interface SetupFormProps {
  token: string;
}

export function SetupForm({ token }: SetupFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post('/api/v1/auth/setup', {
        token, username, password,
      });
      setAuth(data.access_token);
      toast.success('Account activated! Welcome to PrepForAll.');
      navigate({ to: '/dashboard' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Setup failed. Your invite may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSetup = async (provider: 'google' | 'github') => {
    try {
      // OAuth setup links the invite token with the OAuth account
      const accessToken = await openOAuthPopup(provider);
      // After OAuth, complete setup by linking invite
      await apiClient.post('/api/v1/auth/setup-oauth', { token, provider });
      setAuth(accessToken);
      toast.success('Account activated!');
      navigate({ to: '/dashboard' });
    } catch (err) {
      if (err instanceof Error && err.message !== 'Login cancelled') {
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-lg">
      <h1 className="text-2xl font-bold font-heading">Set Up Your Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You have been invited to PrepForAll. Choose how you would like to sign in.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={() => handleOAuthSetup('google')}
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Link Google Account
        </button>
        <button
          onClick={() => handleOAuthSetup('github')}
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Link GitHub Account
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">OR set a password</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text" placeholder="Choose a username" required
          value={username} onChange={(e) => setUsername(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password" placeholder="Password (min 8 characters)" required
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password" placeholder="Confirm password" required
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit" disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Activating...' : 'Activate Account'}
        </button>
      </form>
    </div>
  );
}
```
- [ ] Update `apps/platform/src/routes/auth/setup.tsx` to use the form:
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { SetupForm } from '@/features/Auth/SetupForm';

export const Route = createFileRoute('/auth/setup')({
  component: SetupPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
});

function SetupPage() {
  const { token } = Route.useSearch();

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        Invalid or missing invite token.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <SetupForm token={token} />
    </div>
  );
}
```
- [ ] Run type-check: `cd apps/platform && npx tsc --noEmit`

**Commit point:** `feat(platform): add invite setup page with password and OAuth account linking`

---

## Task 9: Auth system -- password reset flow

**Files:**
- Create: `apps/platform/src/routes/auth/forgot-password.tsx`
- Create: `apps/platform/src/routes/auth/reset-password.tsx`
- Create: `apps/platform/src/features/Auth/ForgotPasswordForm.tsx`
- Create: `apps/platform/src/features/Auth/ResetPasswordForm.tsx`

**Steps:**

- [ ] Create `ForgotPasswordForm.tsx` -- simple email input form that calls `POST /api/v1/auth/forgot-password`:
```tsx
import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/api/v1/auth/forgot-password', { email });
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-8 text-center">
        <h2 className="text-xl font-bold font-heading">Check Your Email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for {email}, we sent a password reset link.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-8">
      <h2 className="text-xl font-bold font-heading">Forgot Password</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enter your email to receive a reset link.</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          type="email" placeholder="Email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit" disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}
```
- [ ] Create `ResetPasswordForm.tsx` -- takes token from URL, new password + confirm:
```tsx
import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

interface ResetPasswordFormProps { token: string; }

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setIsSubmitting(true);
    try {
      await apiClient.post('/api/v1/auth/reset-password', { token, password });
      toast.success('Password reset successfully. Please sign in.');
      navigate({ to: '/auth/login' });
    } catch {
      toast.error('Reset failed. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-8">
      <h2 className="text-xl font-bold font-heading">Reset Password</h2>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input type="password" placeholder="New password" required value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <input type="password" placeholder="Confirm password" required value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <button type="submit" disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
```
- [ ] Create route files `forgot-password.tsx` and `reset-password.tsx` that render these forms
- [ ] Type-check: `cd apps/platform && npx tsc --noEmit`

**Commit point:** `feat(platform): add password reset flow (forgot + reset pages)`

---

## Task 10: API client setup (TanStack Query, axios wrapper with JWT interceptor, refresh logic)

**Files:**
- Create: `apps/platform/src/lib/queryKeys.ts`
- Create: `apps/platform/src/lib/api/auth.ts`
- Create: `apps/platform/src/lib/api/problems.ts`
- Create: `apps/platform/src/lib/api/submissions.ts`
- Create: `apps/platform/src/lib/api/users.ts`

**Steps:**

- [ ] Create `apps/platform/src/lib/queryKeys.ts` -- centralized query key factory (following existing pattern from `apps/web`):
```ts
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  problems: {
    all: ['problems'] as const,
    list: (filter: Record<string, unknown>) => [...queryKeys.problems.all, 'list', filter] as const,
    detail: (slug: string) => [...queryKeys.problems.all, 'detail', slug] as const,
    testCases: (slug: string) => [...queryKeys.problems.all, 'testcases', slug] as const,
  },
  submissions: {
    all: ['submissions'] as const,
    byProblem: (slug: string) => [...queryKeys.submissions.all, 'problem', slug] as const,
    detail: (id: string) => [...queryKeys.submissions.all, 'detail', id] as const,
  },
  users: {
    profile: (username: string) => ['users', 'profile', username] as const,
    stats: (username: string) => ['users', 'stats', username] as const,
  },
  dashboard: {
    stats: (role: string) => ['dashboard', 'stats', role] as const,
  },
} as const;
```
- [ ] Create `apps/platform/src/lib/api/auth.ts` -- auth API layer:
```ts
import { apiClient } from '../apiClient';

export interface LoginRequest { email: string; password: string; }

export const authApi = {
  login: async (req: LoginRequest) => {
    const { data } = await apiClient.post('/api/v1/auth/login', req);
    return data as { access_token: string; expires_in: number };
  },
  refresh: async () => {
    const { data } = await apiClient.post('/api/v1/auth/refresh');
    return data as { access_token: string; expires_in: number };
  },
  logout: async () => {
    await apiClient.post('/api/v1/auth/logout');
  },
  setup: async (req: { token: string; username: string; password: string }) => {
    const { data } = await apiClient.post('/api/v1/auth/setup', req);
    return data as { access_token: string; expires_in: number };
  },
  forgotPassword: async (email: string) => {
    await apiClient.post('/api/v1/auth/forgot-password', { email });
  },
  resetPassword: async (req: { token: string; password: string }) => {
    await apiClient.post('/api/v1/auth/reset-password', req);
  },
};
```
- [ ] Create `apps/platform/src/lib/api/problems.ts` -- ported from `apps/web/lib/api/problems.ts`, using new apiClient
- [ ] Create `apps/platform/src/lib/api/submissions.ts` -- ported from `apps/web/lib/api/submissions.ts`
- [ ] Create `apps/platform/src/lib/api/users.ts`:
```ts
import { apiClient } from '../apiClient';

export const usersApi = {
  getProfile: async (username: string) => {
    const { data } = await apiClient.get(`/api/v1/users/${username}`);
    return data;
  },
  getStats: async (username: string) => {
    const { data } = await apiClient.get(`/api/v1/users/${username}/stats`);
    return data;
  },
  invite: async (req: { email: string; role: string; org_id: string; batch_id?: string }) => {
    const { data } = await apiClient.post('/api/v1/users/invite', req);
    return data;
  },
};
```
- [ ] Type-check: `cd apps/platform && npx tsc --noEmit`

**Commit point:** `feat(platform): add API client layer with query keys and auth/problem/user endpoints`

---

## Task 11: Dashboard routes (role-based: student, trainer, org admin, super admin)

**Files:**
- Create: `apps/platform/src/routes/dashboard/index.tsx`
- Create: `apps/platform/src/features/Dashboard/StudentDashboard.tsx`
- Create: `apps/platform/src/features/Dashboard/TrainerDashboard.tsx`
- Create: `apps/platform/src/features/Dashboard/OrgAdminDashboard.tsx`
- Create: `apps/platform/src/features/Dashboard/SuperAdminDashboard.tsx`

**Steps:**

- [ ] Create `apps/platform/src/routes/dashboard/index.tsx` with `beforeLoad` auth guard:
```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
import { StudentDashboard } from '@/features/Dashboard/StudentDashboard';
import { TrainerDashboard } from '@/features/Dashboard/TrainerDashboard';
import { OrgAdminDashboard } from '@/features/Dashboard/OrgAdminDashboard';
import { SuperAdminDashboard } from '@/features/Dashboard/SuperAdminDashboard';

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: () => {
    const { isAuthenticated, setLoginModalOpen } = useAuthStore.getState();
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      throw redirect({ to: '/' });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const role = useAuthStore((s) => s.user?.role);

  switch (role) {
    case 'super_admin': return <SuperAdminDashboard />;
    case 'org_admin': return <OrgAdminDashboard />;
    case 'trainer': return <TrainerDashboard />;
    case 'student': default: return <StudentDashboard />;
  }
}
```
- [ ] Create `StudentDashboard.tsx` using `StatCard` from `@prepforall/platform-ui`:
```tsx
import { StatCard } from '@prepforall/platform-ui/molecular';
import { Code2, Clock, Trophy, Target } from 'lucide-react';

export function StudentDashboard() {
  // TODO: wire up TanStack Query for actual data in sub-project 2
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Problems Solved" value={0} icon={<Code2 className="h-4 w-4" />} />
        <StatCard title="Tests Pending" value={0} icon={<Clock className="h-4 w-4" />} />
        <StatCard title="Contests Upcoming" value={0} icon={<Trophy className="h-4 w-4" />} />
        <StatCard title="Acceptance Rate" value="0%" icon={<Target className="h-4 w-4" />} />
      </div>
      <div className="rounded-xl border border-border p-6 text-muted-foreground">
        Recent activity feed will appear here.
      </div>
    </div>
  );
}
```
- [ ] Create placeholder `TrainerDashboard.tsx`, `OrgAdminDashboard.tsx`, `SuperAdminDashboard.tsx` following the same pattern with role-appropriate stat cards
- [ ] Type-check: `cd apps/platform && npx tsc --noEmit`

**Commit point:** `feat(platform): add role-based dashboard routes with StatCard placeholders`

---

## Task 12: Problem list page (TanStack Table, filterable, tabbed)

**Files:**
- Create: `apps/platform/src/routes/problems/index.tsx`
- Create: `apps/platform/src/features/ProblemList/ProblemListPage.tsx`
- Create: `apps/platform/src/lib/hooks/useProblems.ts`

**Steps:**

- [ ] Create `apps/platform/src/lib/hooks/useProblems.ts` -- ported from `apps/web/lib/hooks/useProblems.ts` to use new apiClient and queryKeys:
```ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { apiClient } from '../apiClient';

export interface ProblemsFilter {
  difficulty?: string;
  q?: string;
  page?: number;
  tab?: 'all' | 'dsa' | 'sql' | 'assigned';
}

export function useProblems(filter: ProblemsFilter = {}) {
  return useQuery({
    queryKey: queryKeys.problems.list(filter),
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/problems', { params: filter });
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useProblem(slug: string) {
  return useQuery({
    queryKey: queryKeys.problems.detail(slug),
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/v1/problems/${slug}`);
      return data;
    },
    staleTime: 10 * 60_000,
    enabled: !!slug,
  });
}
```
- [ ] Create `apps/platform/src/features/ProblemList/ProblemListPage.tsx` -- uses TanStack Table with column definitions for title, difficulty, acceptance rate, tags, and filterable tabs (All, DSA, SQL, Assigned):
```tsx
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
  const { data: problems = [], isLoading } = useProblems(filter);

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
```
- [ ] Create route file `apps/platform/src/routes/problems/index.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { ProblemListPage } from '@/features/ProblemList/ProblemListPage';

export const Route = createFileRoute('/problems/')({
  component: ProblemListPage,
});
```
- [ ] Type-check and verify

**Commit point:** `feat(platform): add problem list page with TanStack Table, tabs, and filters`

---

## Task 13: Problem workspace shell (split-pane, Monaco, output panel)

**Files:**
- Create: `apps/platform/src/routes/problems/$slug.tsx`
- Create: `apps/platform/src/features/ProblemWorkspace/ProblemWorkspace.tsx`
- Create: `apps/platform/src/features/ProblemWorkspace/EditorToolbar.tsx`

**Steps:**

- [ ] Create `apps/platform/src/features/ProblemWorkspace/ProblemWorkspace.tsx` -- orchestrates `CodeEditor` and `SubmissionPanel` from `@prepforall/platform-ui`, connects to Zustand editor store and TanStack Query hooks:
```tsx
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { CodeEditor } from '@prepforall/platform-ui/organisms';
import { SubmissionPanel } from '@prepforall/platform-ui/organisms';
import { useEditorStore } from '@/stores/editorStore';
import { useProblem } from '@/lib/hooks/useProblems';
import { EditorToolbar } from './EditorToolbar';
import { toast } from 'sonner';

interface Props { slug: string; }

export function ProblemWorkspace({ slug }: Props) {
  const { data: problem, isLoading } = useProblem(slug);
  const { language, theme, fontSize, tabSize, getCode, setCode } = useEditorStore();
  const code = getCode(slug, language);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading problem...</div>;
  }

  if (!problem) {
    return <div className="flex h-full items-center justify-center text-destructive">Problem not found.</div>;
  }

  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel defaultSize={40} minSize={25}>
        <div className="h-full overflow-y-auto p-6 prose prose-sm dark:prose-invert max-w-none">
          <h1>{problem.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: problem.description ?? '' }} />
        </div>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

      <Panel defaultSize={60} minSize={30}>
        <PanelGroup direction="vertical">
          <Panel defaultSize={65} minSize={30}>
            <div className="flex h-full flex-col">
              <EditorToolbar
                slug={slug}
                onRun={() => toast.info('Run: coming in Sub-project 2')}
                onSubmit={() => toast.info('Submit: coming in Sub-project 2')}
              />
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  value={code}
                  language={language}
                  theme={theme}
                  fontSize={fontSize}
                  tabSize={tabSize}
                  onChange={(val) => setCode(slug, language, val ?? '')}
                />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />

          <Panel defaultSize={35} minSize={15}>
            <SubmissionPanel result={null} isJudging={false} testCases={[]} />
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
```
- [ ] Create `EditorToolbar.tsx` -- language selector + Run/Submit buttons
- [ ] Create route file `apps/platform/src/routes/problems/$slug.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { ProblemWorkspace } from '@/features/ProblemWorkspace/ProblemWorkspace';

export const Route = createFileRoute('/problems/$slug')({
  component: ProblemPage,
});

function ProblemPage() {
  const { slug } = Route.useParams();
  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <ProblemWorkspace slug={slug} />
    </div>
  );
}
```
- [ ] Type-check: `cd apps/platform && npx tsc --noEmit`

**Commit point:** `feat(platform): add problem workspace shell with split-pane Monaco editor`

---

## Task 14: Profile page

**Files:**
- Create: `apps/platform/src/routes/profile/index.tsx`
- Create: `apps/platform/src/features/Profile/ProfilePage.tsx`

**Steps:**

- [ ] Create `ProfilePage.tsx` with user info, solve stats (using `StatCard`), and recent submissions list
- [ ] Create route file that requires auth via `beforeLoad`
- [ ] Wire to `usersApi.getProfile` and `usersApi.getStats` via TanStack Query
- [ ] Type-check

**Commit point:** `feat(platform): add profile page with stats and recent submissions`

---

## Task 15: Sidebar + navigation layout

**Files:**
- Create: `apps/platform/src/features/Layout/AppLayout.tsx`
- Create: `apps/platform/src/features/Layout/AppSidebar.tsx`
- Create: `apps/platform/src/features/Layout/AppNavbar.tsx`
- Create: `apps/platform/src/routes/_authenticated.tsx` (layout route for authenticated pages)

**Steps:**

- [ ] Create `apps/platform/src/routes/_authenticated.tsx` -- layout route with sidebar + navbar + auth guard:
```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
import { AppLayout } from '@/features/Layout/AppLayout';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const { isAuthenticated, setLoginModalOpen } = useAuthStore.getState();
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      throw redirect({ to: '/' });
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
```
- [ ] Create `AppLayout.tsx` -- flex layout with sidebar + main content area:
```tsx
import { AppSidebar } from './AppSidebar';
import { AppNavbar } from './AppNavbar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppNavbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
```
- [ ] Create `AppSidebar.tsx` -- role-aware navigation with icons (Code2, Trophy, BarChart2, Users, Settings), collapsible. Uses Zustand for sidebar collapse state:
```tsx
import { useLocation, Link } from '@tanstack/react-router';
import { Code2, Trophy, BarChart2, Users, Settings, LayoutDashboard, GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/cn';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['student', 'trainer', 'org_admin', 'super_admin'] },
  { to: '/problems', icon: Code2, label: 'Problems', roles: ['student', 'trainer', 'org_admin', 'super_admin'] },
  { to: '/contests', icon: Trophy, label: 'Contests', roles: ['student', 'trainer', 'super_admin'] },
  { to: '/analytics', icon: BarChart2, label: 'Analytics', roles: ['trainer', 'org_admin', 'super_admin'] },
  { to: '/batches', icon: GraduationCap, label: 'Batches', roles: ['trainer', 'org_admin', 'super_admin'] },
  { to: '/org/members', icon: Users, label: 'Members', roles: ['org_admin', 'super_admin'] },
  { to: '/admin/organizations', icon: Settings, label: 'Admin', roles: ['super_admin'] },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const userRole = useAuthStore((s) => s.user?.role);

  const visibleItems = navItems.filter((item) =>
    userRole && item.roles.includes(userRole as any)
  );

  return (
    <aside className="hidden w-16 flex-shrink-0 flex-col items-center border-r border-border bg-muted/30 py-4 lg:flex">
      <Link to="/dashboard" className="mb-6 text-lg font-bold text-primary">P</Link>
      {visibleItems.map(({ to, icon: Icon, label }) => (
        <Link key={to} to={to} title={label}
          className={cn(
            'mb-1 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted transition-colors',
            location.pathname.startsWith(to) && 'bg-primary/10 text-primary'
          )}>
          <Icon className="h-5 w-5" />
        </Link>
      ))}
    </aside>
  );
}
```
- [ ] Create `AppNavbar.tsx` -- top bar with theme toggle, user avatar dropdown (Radix), logout:
```tsx
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import { Link, useNavigate } from '@tanstack/react-router';
import { Moon, Sun, User, LogOut } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export function AppNavbar() {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await apiClient.post('/api/v1/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    navigate({ to: '/' });
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <div />
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="rounded p-1.5 hover:bg-muted">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-muted">
            <User className="h-4 w-4" />
            {user?.username}
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-[160px] rounded-md border border-border bg-background p-1 shadow-md" sideOffset={8}>
              <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted" asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item onClick={handleLogout}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="h-3 w-3" /> Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
```
- [ ] Move dashboard, problems, profile, analytics, batches, org, admin routes to be children of `_authenticated` layout route
- [ ] Type-check and verify sidebar renders correctly

**Commit point:** `feat(platform): add sidebar navigation and layout with RBAC-aware menu items`

---

## Task 16: Zustand stores (editorStore, themeStore)

**Files:**
- Create: `apps/platform/src/stores/editorStore.ts`
- Create: `apps/platform/src/stores/themeStore.ts`
- Create: `apps/platform/src/lib/cn.ts`

**Steps:**

- [ ] Create `apps/platform/src/lib/cn.ts`:
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```
- [ ] Create `apps/platform/src/stores/editorStore.ts` -- improved from `apps/web/store/editorStore.ts`, stores code per-problem per-language:
```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EditorTheme = 'vs-dark' | 'light';

interface EditorState {
  language: string;
  theme: EditorTheme;
  fontSize: number;
  tabSize: number;
  // Map<slug, Map<language, code>>
  savedCodes: Record<string, Record<string, string>>;

  setLanguage: (lang: string) => void;
  setTheme: (theme: EditorTheme) => void;
  setFontSize: (size: number) => void;
  setCode: (slug: string, language: string, code: string) => void;
  getCode: (slug: string, language: string) => string;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      language: 'cpp',
      theme: 'vs-dark',
      fontSize: 14,
      tabSize: 4,
      savedCodes: {},

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setCode: (slug, language, code) =>
        set((state) => ({
          savedCodes: {
            ...state.savedCodes,
            [slug]: { ...state.savedCodes[slug], [language]: code },
          },
        })),
      getCode: (slug, language) => get().savedCodes[slug]?.[language] ?? '',
    }),
    { name: 'prepforall-editor' }
  )
);

export const SUPPORTED_LANGUAGES = [
  { value: 'cpp', label: 'C++', monacoId: 'cpp' },
  { value: 'c', label: 'C', monacoId: 'c' },
  { value: 'java', label: 'Java', monacoId: 'java' },
  { value: 'python', label: 'Python 3', monacoId: 'python' },
  { value: 'javascript', label: 'JavaScript', monacoId: 'javascript' },
  { value: 'go', label: 'Go', monacoId: 'go' },
  { value: 'postgresql', label: 'PostgreSQL', monacoId: 'pgsql' },
];
```
- [ ] Create `apps/platform/src/stores/themeStore.ts`:
```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },
    }),
    {
      name: 'prepforall-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.classList.toggle('dark', state.theme === 'dark');
        }
      },
    }
  )
);
```
- [ ] Type-check: `cd apps/platform && npx tsc --noEmit`

**Commit point:** `feat(platform): add editorStore and themeStore with localStorage persistence`

---

## Task 17: WebSocket client setup (connection shell for real-time verdict delivery)

**Files:**
- Create: `apps/platform/src/lib/ws.ts`
- Create: `apps/platform/src/lib/hooks/useSubmissionResult.ts`

**Steps:**

- [ ] Create `apps/platform/src/lib/ws.ts` -- WebSocket connection manager:
```ts
const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;

export function createSubmissionSocket(
  submissionId: string,
  onMessage: (data: unknown) => void,
  onError?: (err: Event) => void
): () => void {
  const ws = new WebSocket(`${WS_BASE}/ws?submission_id=${submissionId}`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch { /* ignore malformed */ }
  };

  ws.onerror = (e) => onError?.(e);

  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
}
```
- [ ] Create `apps/platform/src/lib/hooks/useSubmissionResult.ts`:
```ts
import { useEffect, useState, useCallback } from 'react';
import { createSubmissionSocket } from '../ws';

interface SubmissionResult {
  id: string;
  verdict: string;
  runtimeMs?: number;
  memoryKb?: number;
  passedCases: number;
  totalCases: number;
  errorMsg?: string;
}

export function useSubmissionResult(submissionId: string | null) {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isJudging, setIsJudging] = useState(false);

  useEffect(() => {
    if (!submissionId) return;
    setIsJudging(true);
    setResult(null);

    const cleanup = createSubmissionSocket(
      submissionId,
      (data) => {
        setResult(data as SubmissionResult);
        setIsJudging(false);
      },
      () => setIsJudging(false)
    );

    return cleanup;
  }, [submissionId]);

  return { result, isJudging };
}
```
- [ ] Type-check: `cd apps/platform && npx tsc --noEmit`

**Commit point:** `feat(platform): add WebSocket client shell for real-time verdict delivery`

---

## Task 18: Go backend -- Auth module updates (OAuth Google/GitHub, invite system, RBAC middleware)

**Files:**
- Modify: `services/api/internal/auth/handler.go`
- Modify: `services/api/internal/auth/service.go`
- Modify: `services/api/internal/auth/model.go`
- Modify: `services/api/internal/auth/repository.go`
- Create: `services/api/internal/auth/oauth.go`
- Create: `services/api/internal/auth/invite.go`
- Modify: `services/api/pkg/middleware/auth.go` (add RBAC)
- Create: `services/api/pkg/middleware/rbac.go`
- Modify: `services/api/config/config.go` (add OAuth config)
- Modify: `services/api/cmd/api/main.go` (wire new routes)
- Create: `services/api/internal/auth/handler_test.go`
- Create: `services/api/internal/auth/service_test.go`

**Steps:**

- [ ] Add OAuth config fields to `services/api/config/config.go`:
```go
type Config struct {
    // ... existing fields
    GoogleClientID     string
    GoogleClientSecret string
    GoogleRedirectURL  string
    GithubClientID     string
    GithubClientSecret string
    GithubRedirectURL  string
    FrontendURL        string
    RefreshExpiry       string // "168h" = 7 days
    AccessExpiry        string // "15m"
}
```
Add corresponding `viper.GetString` calls in `Load()`.

- [ ] Update `services/api/internal/auth/model.go` -- add new request/response types:
```go
type SetupRequest struct {
    Token    string `json:"token"`
    Username string `json:"username"`
    Password string `json:"password"`
}

type ForgotPasswordRequest struct {
    Email string `json:"email"`
}

type ResetPasswordRequest struct {
    Token    string `json:"token"`
    Password string `json:"password"`
}

type InviteRequest struct {
    Email   string `json:"email"`
    Role    string `json:"role"`
    OrgID   string `json:"org_id"`
    BatchID string `json:"batch_id,omitempty"`
}

type OAuthAccount struct {
    ID         string `json:"id"`
    UserID     string `json:"user_id"`
    Provider   string `json:"provider"`
    ProviderID string `json:"provider_id"`
    Email      string `json:"email"`
}

type UserInvite struct {
    ID        string     `json:"id"`
    Email     string     `json:"email"`
    OrgID     string     `json:"org_id"`
    BatchID   string     `json:"batch_id,omitempty"`
    Role      string     `json:"role"`
    Token     string     `json:"token"`
    InvitedBy string     `json:"invited_by"`
    ExpiresAt time.Time  `json:"expires_at"`
    AcceptedAt *time.Time `json:"accepted_at,omitempty"`
}

// Updated Claims to include org_id
type Claims struct {
    UserID    string `json:"sub"`
    Username  string `json:"username"`
    Email     string `json:"email"`
    Role      string `json:"role"`
    OrgID     string `json:"org_id,omitempty"`
    AvatarURL string `json:"avatar_url,omitempty"`
}
```

- [ ] Update `services/api/internal/auth/repository.go` -- add new methods:
```go
func (r *Repository) FindByID(ctx context.Context, id string) (*User, error) { ... }
func (r *Repository) FindOAuthAccount(ctx context.Context, provider, providerID string) (*OAuthAccount, error) { ... }
func (r *Repository) CreateOAuthAccount(ctx context.Context, userID, provider, providerID, email string) error { ... }
func (r *Repository) CreateInvite(ctx context.Context, invite *UserInvite) error { ... }
func (r *Repository) FindInviteByToken(ctx context.Context, token string) (*UserInvite, error) { ... }
func (r *Repository) AcceptInvite(ctx context.Context, inviteID string) error { ... }
func (r *Repository) CreateUserFromInvite(ctx context.Context, username, email, passwordHash, role, orgID string) (*User, error) { ... }
func (r *Repository) StoreResetToken(ctx context.Context, userID, token string, expiresAt time.Time) error { ... }
func (r *Repository) FindResetToken(ctx context.Context, token string) (userID string, err error) { ... }
func (r *Repository) InvalidateResetToken(ctx context.Context, token string) error { ... }
func (r *Repository) UpdatePassword(ctx context.Context, userID, passwordHash string) error { ... }
```

- [ ] Create `services/api/internal/auth/oauth.go` -- OAuth flow handlers using `golang.org/x/oauth2`:
```go
package auth

import (
    "context"
    "encoding/json"
    "net/http"
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
    "golang.org/x/oauth2/github"
)

// Google OAuth handler redirects to Google consent screen
func (h *Handler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
    url := h.service.googleOAuthConfig.AuthCodeURL("state", oauth2.AccessTypeOffline)
    http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// Google callback exchanges code for token, looks up user, issues JWT
func (h *Handler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
    code := r.URL.Query().Get("code")
    // Exchange code -> get profile -> find/link user -> issue tokens -> redirect to frontend callback
    result, err := h.service.HandleOAuthCallback(r.Context(), "google", code)
    if err != nil {
        // Redirect to frontend callback with error
        frontendCallback := h.service.frontendURL + "/auth/oauth-callback?error=" + err.Error()
        http.Redirect(w, r, frontendCallback, http.StatusTemporaryRedirect)
        return
    }
    // Set refresh token as httpOnly cookie
    setRefreshCookie(w, result.RefreshToken, h.service.refreshExpiry)
    // Redirect to frontend callback with access token
    frontendCallback := h.service.frontendURL + "/auth/oauth-callback?access_token=" + result.AccessToken
    http.Redirect(w, r, frontendCallback, http.StatusTemporaryRedirect)
}
```
- [ ] Similarly implement `GithubLogin` and `GithubCallback`

- [ ] Update `services/api/internal/auth/service.go` -- modify `generateTokens` to produce access + refresh tokens, set refresh as httpOnly cookie:
```go
func (s *Service) generateTokenPair(user *User) (*AuthResponse, string, *errors.AppError) {
    accessExpiry, _ := time.ParseDuration(s.accessExpiry) // 15m
    refreshExpiry, _ := time.ParseDuration(s.refreshExpiry) // 168h

    accessClaims := jwt.MapClaims{
        "sub": user.ID, "username": user.Username, "email": user.Email,
        "role": user.Role, "org_id": user.OrgID, "avatar_url": user.AvatarURL,
        "exp": time.Now().Add(accessExpiry).Unix(), "iat": time.Now().Unix(),
    }
    accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
    accessSigned, err := accessToken.SignedString([]byte(s.jwtSecret))
    if err != nil { return nil, "", errors.ErrInternal }

    refreshClaims := jwt.MapClaims{
        "sub": user.ID, "type": "refresh",
        "exp": time.Now().Add(refreshExpiry).Unix(), "iat": time.Now().Unix(),
    }
    refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
    refreshSigned, err := refreshToken.SignedString([]byte(s.jwtSecret))
    if err != nil { return nil, "", errors.ErrInternal }

    return &AuthResponse{
        AccessToken: accessSigned,
        ExpiresIn:   int(accessExpiry.Seconds()),
    }, refreshSigned, nil
}
```
- [ ] Update `Login` handler to set httpOnly refresh cookie:
```go
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
    var req LoginRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        errors.WriteError(w, errors.ErrBadRequest); return
    }
    resp, refreshToken, err := h.service.Login(r.Context(), req)
    if err != nil { errors.WriteError(w, err); return }
    setRefreshCookie(w, refreshToken, h.service.refreshExpiry)
    errors.WriteJSON(w, http.StatusOK, resp)
}

func setRefreshCookie(w http.ResponseWriter, token string, expiry time.Duration) {
    http.SetCookie(w, &http.Cookie{
        Name:     "refresh_token",
        Value:    token,
        Path:     "/api/v1/auth",
        HttpOnly: true,
        Secure:   true,
        SameSite: http.SameSiteStrictMode,
        MaxAge:   int(expiry.Seconds()),
    })
}
```
- [ ] Implement `Refresh` handler -- read refresh token from cookie, validate, reissue access token
- [ ] Implement `Logout` handler -- clear the refresh cookie and optionally blacklist in Redis

- [ ] Create `services/api/pkg/middleware/rbac.go`:
```go
package middleware

import "net/http"

// RequireRole returns middleware that checks the JWT role claim against allowed roles
func RequireRole(jwtSecret string, roles ...string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Extract role from context (set by Authenticate middleware)
            role, ok := r.Context().Value(RoleKey).(string)
            if !ok {
                http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
                return
            }
            for _, allowed := range roles {
                if role == allowed { next.ServeHTTP(w, r); return }
            }
            http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
        })
    }
}
```
- [ ] Update `Authenticate` middleware to also set `RoleKey` and `OrgIDKey` in context from JWT claims
- [ ] Update `services/api/cmd/api/main.go` to wire new OAuth routes and RBAC middleware
- [ ] Add `golang.org/x/oauth2` to `go.mod`: `cd services/api && go get golang.org/x/oauth2`
- [ ] Write unit tests for `service_test.go` covering `Login`, `Refresh`, `HandleOAuthCallback`
- [ ] Write integration test for `handler_test.go` covering HTTP endpoints
- [ ] Run `cd services/api && go test ./internal/auth/... -v`

**Commit point:** `feat(api): add OAuth Google/GitHub handlers, RBAC middleware, and token pair strategy`

---

## Task 19: Database migrations -- oauth_accounts, user_invites, password_resets, ALTER users

**Files:**
- Create: `services/api/migrations/005_add_organizations.up.sql`
- Create: `services/api/migrations/005_add_organizations.down.sql`
- Create: `services/api/migrations/006_add_oauth_and_invites.up.sql`
- Create: `services/api/migrations/006_add_oauth_and_invites.down.sql`
- Create: `services/api/migrations/007_add_password_resets.up.sql`
- Create: `services/api/migrations/007_add_password_resets.down.sql`

**Steps:**

- [ ] Create `005_add_organizations.up.sql`:
```sql
CREATE TABLE organizations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    slug       TEXT UNIQUE NOT NULL,
    logo_url   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE org_members (
    org_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    TEXT NOT NULL CHECK (role IN ('org_admin', 'trainer')),
    PRIMARY KEY (org_id, user_id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'student', 'trainer', 'org_admin', 'super_admin'));

CREATE INDEX idx_org_members_user ON org_members(user_id);
```
- [ ] Create `005_add_organizations.down.sql`:
```sql
DROP INDEX IF EXISTS idx_org_members_user;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP COLUMN IF EXISTS org_id;
DROP TABLE IF EXISTS org_members;
DROP TABLE IF EXISTS organizations;
```
- [ ] Create `006_add_oauth_and_invites.up.sql`:
```sql
CREATE TABLE oauth_accounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider    TEXT NOT NULL CHECK (provider IN ('google', 'github')),
    provider_id TEXT NOT NULL,
    email       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_id)
);

CREATE TABLE user_invites (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL,
    org_id     UUID REFERENCES organizations(id),
    batch_id   UUID,
    role       TEXT NOT NULL CHECK (role IN ('student', 'trainer', 'org_admin')),
    token      TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);
CREATE INDEX idx_invites_email ON user_invites(email);
CREATE INDEX idx_invites_token ON user_invites(token);
```
- [ ] Create `006_add_oauth_and_invites.down.sql`:
```sql
DROP INDEX IF EXISTS idx_invites_token;
DROP INDEX IF EXISTS idx_invites_email;
DROP INDEX IF EXISTS idx_oauth_user;
DROP TABLE IF EXISTS user_invites;
DROP TABLE IF EXISTS oauth_accounts;
```
- [ ] Create `007_add_password_resets.up.sql`:
```sql
CREATE TABLE password_resets (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_user ON password_resets(user_id);
```
- [ ] Create `007_add_password_resets.down.sql`:
```sql
DROP INDEX IF EXISTS idx_password_resets_user;
DROP INDEX IF EXISTS idx_password_resets_token;
DROP TABLE IF EXISTS password_resets;
```
- [ ] Test migrations: `make infra && make migrate-up` -- expect all migrations apply cleanly
- [ ] Verify rollback: `make migrate-down` three times -- expect clean drops

**Commit point:** `feat(api): add database migrations for organizations, OAuth accounts, invites, password resets`

---

## Task 20: Auth API endpoints (full implementation)

**Files:**
- Modify: `services/api/internal/auth/handler.go` (add all new route registrations)
- Create: `services/api/internal/auth/invite.go` (invite service logic)
- Create: `services/api/internal/auth/password_reset.go` (reset service logic)
- Modify: `services/api/internal/users/handler.go` (add invite endpoint)
- Create: `services/api/internal/auth/handler_test.go`

**Steps:**

- [ ] Update route registration in `handler.go`:
```go
func RegisterRoutes(r chi.Router, db *pgxpool.Pool, rdb *redis.Client, cfg *config.Config, log *zap.Logger) {
    repo := NewRepository(db)
    svc := NewService(repo, rdb, cfg, log)
    h := &Handler{service: svc}

    r.Route("/auth", func(r chi.Router) {
        r.Post("/login", h.Login)
        r.Post("/refresh", h.Refresh)
        r.Post("/logout", h.Logout)
        r.Post("/setup", h.Setup)
        r.Post("/forgot-password", h.ForgotPassword)
        r.Post("/reset-password", h.ResetPassword)

        // OAuth routes
        r.Get("/google", h.GoogleLogin)
        r.Get("/google/callback", h.GoogleCallback)
        r.Get("/github", h.GithubLogin)
        r.Get("/github/callback", h.GithubCallback)
    })

    // Invite endpoint (requires authenticated admin/org_admin)
    r.Route("/users", func(r chi.Router) {
        r.Group(func(r chi.Router) {
            r.Use(middleware.Authenticate(cfg.JWTSecret))
            r.Use(middleware.RequireRole(cfg.JWTSecret, "super_admin", "org_admin"))
            r.Post("/invite", h.Invite)
        })
    })
}
```

- [ ] Implement `Setup` handler -- validates invite token, creates user, issues tokens:
```go
func (h *Handler) Setup(w http.ResponseWriter, r *http.Request) {
    var req SetupRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        errors.WriteError(w, errors.ErrBadRequest); return
    }
    resp, refreshToken, appErr := h.service.Setup(r.Context(), req)
    if appErr != nil { errors.WriteError(w, appErr); return }
    setRefreshCookie(w, refreshToken, h.service.refreshExpiry)
    errors.WriteJSON(w, http.StatusCreated, resp)
}
```

- [ ] Implement `Setup` service method:
```go
func (s *Service) Setup(ctx context.Context, req SetupRequest) (*AuthResponse, string, *errors.AppError) {
    invite, err := s.repo.FindInviteByToken(ctx, req.Token)
    if err != nil { return nil, "", &errors.AppError{Code: 400, Message: "invalid or expired invite"} }
    if invite.AcceptedAt != nil { return nil, "", &errors.AppError{Code: 400, Message: "invite already used"} }
    if time.Now().After(invite.ExpiresAt) { return nil, "", &errors.AppError{Code: 400, Message: "invite expired"} }

    hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil { return nil, "", errors.ErrInternal }

    user, err := s.repo.CreateUserFromInvite(ctx, req.Username, invite.Email, string(hash), invite.Role, invite.OrgID)
    if err != nil { return nil, "", errors.ErrConflict }

    if err := s.repo.AcceptInvite(ctx, invite.ID); err != nil {
        s.log.Error("failed to mark invite as accepted", zap.Error(err))
    }

    return s.generateTokenPair(user)
}
```

- [ ] Implement `Invite` handler + service method -- generates crypto-random token, stores in DB, returns invite URL (email sending is a separate concern, can be stubbed with a log message for now)

- [ ] Implement `ForgotPassword` handler + service -- generates reset token, stores in `password_resets` table, logs the reset URL (email integration deferred)

- [ ] Implement `ResetPassword` handler + service -- validates reset token, updates password hash, invalidates token

- [ ] Implement `Refresh` handler:
```go
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
    cookie, err := r.Cookie("refresh_token")
    if err != nil {
        errors.WriteError(w, errors.ErrUnauthorized); return
    }
    resp, newRefreshToken, appErr := h.service.RefreshTokens(r.Context(), cookie.Value)
    if appErr != nil {
        clearRefreshCookie(w)
        errors.WriteError(w, appErr); return
    }
    setRefreshCookie(w, newRefreshToken, h.service.refreshExpiry)
    errors.WriteJSON(w, http.StatusOK, resp)
}
```

- [ ] Implement `Logout` handler -- clears cookie and optionally stores token in Redis blacklist:
```go
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
    cookie, _ := r.Cookie("refresh_token")
    if cookie != nil {
        // Optionally blacklist in Redis
        h.service.BlacklistToken(r.Context(), cookie.Value)
    }
    clearRefreshCookie(w)
    errors.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
```

- [ ] Write comprehensive handler tests:
  - `POST /auth/login` -- valid credentials, invalid credentials, missing fields
  - `POST /auth/refresh` -- valid cookie, expired cookie, missing cookie
  - `POST /auth/setup` -- valid invite, expired invite, used invite
  - `POST /auth/forgot-password` -- existing email, non-existing email (both return 200)
  - `POST /auth/reset-password` -- valid token, expired token, used token
  - `POST /users/invite` -- as super_admin, as student (forbidden)

- [ ] Run all Go tests: `cd services/api && go test ./... -race -count=1`

- [ ] Update `.env.example` to include new config vars:
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=http://localhost:8080/api/v1/auth/google/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URL=http://localhost:8080/api/v1/auth/github/callback
FRONTEND_URL=http://localhost:5173
ACCESS_EXPIRY=15m
REFRESH_EXPIRY=168h
```

- [ ] Update `docker-compose.yml` to pass new env vars to the `api` service

- [ ] Update `Makefile` to add `dev-platform` target:
```makefile
dev-platform:
	cd apps/platform && npx vite
```

**Commit point:** `feat(api): implement complete auth endpoints — login, refresh, OAuth, invite, setup, password reset`

---

## Summary: Dependency Graph

```
Task 1 (platform-ui scaffold)
  └─ Task 2 (atomic components)
  └─ Task 3 (molecular components)
  └─ Task 4 (organism components)

Task 5 (Vite scaffold)
  └─ Task 6 (TanStack Router)
     └─ Task 7 (Auth system frontend)
        └─ Task 8 (Invite setup page)
        └─ Task 9 (Password reset)
     └─ Task 10 (API client)
        └─ Task 11 (Dashboard routes)
        └─ Task 12 (Problem list)
        └─ Task 13 (Problem workspace)
        └─ Task 14 (Profile page)
     └─ Task 15 (Layout/sidebar)
     └─ Task 16 (Zustand stores) -- can start with Task 5
     └─ Task 17 (WebSocket shell)

Task 19 (DB migrations) -- independent, start anytime
  └─ Task 18 (Go auth module) -- depends on migrations
     └─ Task 20 (Full endpoint implementation)
```

**Parallelizable groups:**
- Group A: Tasks 1-4 (platform-ui) -- no backend dependency
- Group B: Tasks 5-6, 16 (Vite scaffold, router, stores) -- no backend dependency
- Group C: Tasks 19, 18, 20 (Backend auth) -- independent from frontend
- Group D: Tasks 7-15, 17 (Frontend features) -- after Group A+B, ideally after Group C for integration testing

---

### Critical Files for Implementation

- `/Users/sahilsharma/education/prepforall/services/api/internal/auth/handler.go` -- The main Go auth handler that needs to be extended with OAuth routes, refresh cookie logic, invite/setup handlers, and password reset. Currently only has basic email/password login.
- `/Users/sahilsharma/education/prepforall/services/api/internal/auth/service.go` -- The auth service layer that needs dual token generation (access + refresh), OAuth callback processing, invite validation, and reset token management. Currently returns JWT in response body with no refresh tokens.
- `/Users/sahilsharma/education/prepforall/services/api/pkg/middleware/auth.go` -- The JWT auth middleware that needs to be extended to extract role and org_id claims into context, and a new `rbac.go` sibling needs creation for `RequireRole` middleware.
- `/Users/sahilsharma/education/prepforall/apps/web/providers/AuthProvider.tsx` -- The existing auth provider (in the old Next.js app) that stores JWT in localStorage. Understanding this is critical for designing the replacement Zustand-based auth store in `apps/platform/src/stores/authStore.ts` that stores tokens in memory instead.
- `/Users/sahilsharma/education/prepforall/apps/web/components/editor/CodeEditor.tsx` -- The existing Monaco editor wrapper that needs to be extracted into `packages/platform-ui/src/organisms/CodeEditor.tsx` as a pure presentational component (no Zustand dependency), with the orchestration layer moved to `apps/platform/src/features/ProblemWorkspace/`.