"use client";

import type { Problem, TestCase } from "@/types";

interface Props {
  problem: Problem;
  testCases: TestCase[];
}

const difficultyColor = {
  easy: "text-green-500",
  medium: "text-yellow-500",
  hard: "text-red-500",
};

export function ProblemStatement({ problem, testCases }: Props) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold">{problem.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm">
          <span className={difficultyColor[problem.difficulty]}>
            {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
          </span>
          <span className="text-muted-foreground">
            Acceptance: {problem.acceptanceRate.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">
            Time: {problem.timeLimitMs}ms | Memory: {problem.memoryLimitMb}MB
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {problem.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: problem.description ?? "" }}
      />

      {testCases.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold">Examples</h3>
          {testCases.map((tc, i) => (
            <div key={tc.id} className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Example {i + 1}</p>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <span className="font-semibold">Input:</span>
                  <pre className="mt-1 rounded bg-background p-2">{tc.input}</pre>
                </div>
                <div>
                  <span className="font-semibold">Output:</span>
                  <pre className="mt-1 rounded bg-background p-2">{tc.output}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
