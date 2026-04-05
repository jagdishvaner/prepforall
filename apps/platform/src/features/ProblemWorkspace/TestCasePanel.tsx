import { useState } from 'react';
import { VerdictBadge, type Verdict } from '@prepforall/platform-ui/atomic';
import { cn } from '@/lib/cn';
import type { SampleTestCase } from '@/lib/hooks/useTestCases';

interface CaseResultItem {
  index: number;
  verdict: string;
  input: string;
  expected_output: string;
  actual_output: string;
  runtime_ms: number;
}

export interface SubmissionResult {
  submission_id: string;
  verdict: string;
  runtime_ms: number;
  memory_kb: number;
  passed_cases: number;
  total_cases: number;
  error_msg?: string;
  mode?: string;
  case_results?: CaseResultItem[];
}

interface TestCasePanelProps {
  testCases: SampleTestCase[];
  result: SubmissionResult | null;
  isJudging: boolean;
  mode: 'run' | 'submit' | null;
}

export function TestCasePanel({ testCases, result, isJudging, mode }: TestCasePanelProps) {
  const [activeTab, setActiveTab] = useState<'testcase' | 'result'>(
    result ? 'result' : 'testcase'
  );
  const [selectedCase, setSelectedCase] = useState(0);

  // Auto-switch to result tab when result arrives or judging starts
  const currentTab = isJudging || result ? 'result' : activeTab;

  return (
    <div className="flex h-full flex-col" role="region" aria-label="Test cases and results">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-muted/30 px-3" role="tablist">
        <button
          role="tab"
          id="tab-testcase"
          aria-selected={currentTab === 'testcase'}
          aria-controls="tabpanel-testcase"
          onClick={() => setActiveTab('testcase')}
          className={cn(
            'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            currentTab === 'testcase'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Testcase
        </button>
        <button
          role="tab"
          id="tab-result"
          aria-selected={currentTab === 'result'}
          aria-controls="tabpanel-result"
          onClick={() => setActiveTab('result')}
          className={cn(
            'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            currentTab === 'result'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Test Result
        </button>
      </div>

      {/* Content */}
      <div
        role="tabpanel"
        id={currentTab === 'testcase' ? 'tabpanel-testcase' : 'tabpanel-result'}
        aria-labelledby={currentTab === 'testcase' ? 'tab-testcase' : 'tab-result'}
        className="flex-1 overflow-y-auto p-4"
      >
        {currentTab === 'testcase' ? (
          <TestcaseTab
            testCases={testCases}
            selectedCase={selectedCase}
            onSelectCase={setSelectedCase}
          />
        ) : (
          <ResultTab result={result} isJudging={isJudging} mode={mode} />
        )}
      </div>
    </div>
  );
}

function TestcaseTab({
  testCases,
  selectedCase,
  onSelectCase,
}: {
  testCases: SampleTestCase[];
  selectedCase: number;
  onSelectCase: (i: number) => void;
}) {
  if (testCases.length === 0) {
    return <p className="text-sm text-muted-foreground">No sample test cases available.</p>;
  }

  const tc = testCases[selectedCase];
  const inputLines = tc?.input.trim().split('\n') ?? [];

  return (
    <div>
      {/* Case selector buttons */}
      <div className="flex gap-2 mb-4" role="group" aria-label="Select test case">
        {testCases.map((_, i) => (
          <button
            key={i}
            onClick={() => onSelectCase(i)}
            aria-pressed={selectedCase === i}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium',
              selectedCase === i
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            Case {i + 1}
          </button>
        ))}
      </div>

      {/* Input display */}
      {inputLines.map((line, i) => (
        <div key={i} className="mb-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Input {i + 1}
          </label>
          <div className="rounded bg-muted px-3 py-2 font-mono text-sm">{line}</div>
        </div>
      ))}

      {/* Expected output */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Expected Output
        </label>
        <div className="rounded bg-muted px-3 py-2 font-mono text-sm">
          {tc?.output.trim()}
        </div>
      </div>
    </div>
  );
}

function ResultTab({
  result,
  isJudging,
  mode,
}: {
  result: SubmissionResult | null;
  isJudging: boolean;
  mode: 'run' | 'submit' | null;
}) {
  if (isJudging) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground" aria-live="polite">
        <div
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          role="status"
          aria-label="Judging in progress"
        />
        <span>Judge is evaluating your code...</span>
      </div>
    );
  }

  if (!result) {
    return <p className="text-sm text-muted-foreground">Run or submit to see results.</p>;
  }

  // Compilation error
  if (result.verdict === 'CE') {
    return (
      <div aria-live="polite">
        <VerdictBadge verdict="CE" className="mb-3" />
        {result.error_msg && (
          <pre className="rounded bg-destructive/10 p-3 text-sm text-destructive font-mono whitespace-pre-wrap">
            {result.error_msg}
          </pre>
        )}
      </div>
    );
  }

  // Run mode -- per-case results
  if (mode === 'run' && result.case_results?.length) {
    return <RunModeResults result={result} />;
  }

  // Submit mode -- aggregate results
  return <SubmitModeResults result={result} />;
}

function RunModeResults({ result }: { result: SubmissionResult }) {
  const [selectedCase, setSelectedCase] = useState(0);
  const cases = result.case_results ?? [];
  const cr = cases[selectedCase];

  return (
    <div aria-live="polite">
      <div className="flex items-center gap-3 mb-4">
        <VerdictBadge verdict={result.verdict as Verdict} />
        <span className="text-sm text-muted-foreground">
          {result.passed_cases}/{result.total_cases} test cases passed
        </span>
      </div>

      {/* Case selector buttons */}
      <div className="flex gap-2 mb-4" role="group" aria-label="Select result case">
        {cases.map((c, i) => (
          <button
            key={i}
            onClick={() => setSelectedCase(i)}
            aria-pressed={selectedCase === i}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium flex items-center gap-1',
              selectedCase === i
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            <span
              className={c.verdict === 'AC' ? 'text-green-500' : 'text-red-500'}
              aria-hidden="true"
            >
              {c.verdict === 'AC' ? '\u2713' : '\u2717'}
            </span>
            Case {i + 1}
            <span className="sr-only">
              {c.verdict === 'AC' ? '(passed)' : '(failed)'}
            </span>
          </button>
        ))}
      </div>

      {cr && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Input</label>
            <pre className="rounded bg-muted px-3 py-2 font-mono text-sm whitespace-pre-wrap">
              {cr.input.trim()}
            </pre>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Expected Output
            </label>
            <pre className="rounded bg-muted px-3 py-2 font-mono text-sm whitespace-pre-wrap">
              {cr.expected_output.trim()}
            </pre>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Your Output
            </label>
            <pre
              className={cn(
                'rounded px-3 py-2 font-mono text-sm whitespace-pre-wrap',
                cr.verdict === 'AC' ? 'bg-green-500/10' : 'bg-red-500/10'
              )}
            >
              {cr.actual_output.trim() || '(no output)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmitModeResults({ result }: { result: SubmissionResult }) {
  return (
    <div aria-live="polite">
      <div className="flex items-center gap-4 mb-4">
        <VerdictBadge verdict={result.verdict as Verdict} />
        {result.runtime_ms != null && (
          <span className="text-sm text-muted-foreground">Runtime: {result.runtime_ms}ms</span>
        )}
        {result.memory_kb != null && (
          <span className="text-sm text-muted-foreground">
            Memory: {(result.memory_kb / 1024).toFixed(1)}MB
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          {result.passed_cases}/{result.total_cases} passed
        </span>
      </div>
      {result.error_msg && (
        <pre className="rounded bg-destructive/10 p-3 text-sm text-destructive font-mono whitespace-pre-wrap">
          {result.error_msg}
        </pre>
      )}
    </div>
  );
}
