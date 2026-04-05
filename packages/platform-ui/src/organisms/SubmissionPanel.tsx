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
