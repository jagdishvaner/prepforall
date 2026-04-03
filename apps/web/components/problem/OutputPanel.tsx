"use client";

import type { Submission, TestCase } from "@/types";
import { verdictColor } from "@/lib/hooks/useSubmission";
import { Loader2 } from "lucide-react";

interface Props {
  result: Submission | null;
  isJudging: boolean;
  testCases: TestCase[];
}

export function OutputPanel({ result, isJudging, testCases }: Props) {
  if (isJudging) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Judge is evaluating your code...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full flex-col p-4">
        <h3 className="mb-3 font-semibold">Test Cases</h3>
        <div className="space-y-2">
          {testCases.map((tc, i) => (
            <button key={tc.id} className="w-full rounded border border-border px-3 py-2 text-left text-sm hover:bg-muted/50">
              Case {i + 1}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Submit to see your result.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center gap-4">
        <span className={`text-lg font-bold ${verdictColor(result.verdict)}`}>
          {verdictLabel(result.verdict)}
        </span>
        {result.runtimeMs && (
          <span className="text-sm text-muted-foreground">Runtime: {result.runtimeMs}ms</span>
        )}
        {result.memoryKb && (
          <span className="text-sm text-muted-foreground">Memory: {(result.memoryKb / 1024).toFixed(1)}MB</span>
        )}
        <span className="text-sm text-muted-foreground">
          {result.passedCases}/{result.totalCases} passed
        </span>
      </div>

      {result.errorMsg && (
        <pre className="rounded bg-destructive/10 p-3 text-sm text-destructive">
          {result.errorMsg}
        </pre>
      )}
    </div>
  );
}

function verdictLabel(verdict: string): string {
  const labels: Record<string, string> = {
    AC: "Accepted",
    WA: "Wrong Answer",
    TLE: "Time Limit Exceeded",
    MLE: "Memory Limit Exceeded",
    RE: "Runtime Error",
    CE: "Compilation Error",
    PENDING: "Pending",
    RUNNING: "Running",
  };
  return labels[verdict] ?? verdict;
}
