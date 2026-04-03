"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useProblem, useSampleTestCases } from "@/lib/hooks/useProblems";
import { useEditorStore } from "@/store/editorStore";
import { useSubmit, useSubmissionResult, verdictColor } from "@/lib/hooks/useSubmission";
import { useSubmissionStore } from "@/store/submissionStore";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { LanguageSelector } from "@/components/editor/LanguageSelector";
import { ProblemStatement } from "./ProblemStatement";
import { OutputPanel } from "./OutputPanel";
import { toast } from "sonner";

interface Props {
  slug: string;
}

export function ProblemWorkspace({ slug }: Props) {
  const { data: problem, isLoading } = useProblem(slug);
  const { data: testCases } = useSampleTestCases(slug);
  const { language, getCode } = useEditorStore();
  const { mutateAsync: submit, isPending } = useSubmit();
  const { activeSubmissionId, setActiveSubmission } = useSubmissionStore();
  const { result, isJudging } = useSubmissionResult(activeSubmissionId);

  const handleSubmit = async () => {
    const code = getCode(slug);
    if (!code.trim()) {
      toast.error("Write some code first!");
      return;
    }
    if (!problem) return;

    try {
      const sub = await submit({ problemId: problem.id, language, code });
      setActiveSubmission(sub.id);
      toast.info("Submitted! Waiting for judge...");
    } catch {
      toast.error("Submission failed. Try again.");
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!problem) {
    return <div className="flex h-full items-center justify-center text-destructive">Problem not found.</div>;
  }

  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* Left: Problem statement */}
      <Panel defaultSize={40} minSize={25}>
        <ProblemStatement problem={problem} testCases={testCases ?? []} />
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

      {/* Right: Editor + Output */}
      <Panel defaultSize={60} minSize={30}>
        <PanelGroup direction="vertical">
          <Panel defaultSize={65} minSize={30}>
            <div className="flex h-full flex-col">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <LanguageSelector />
                <div className="flex gap-2">
                  <button
                    className="rounded bg-secondary px-4 py-1.5 text-sm font-medium hover:bg-secondary/80"
                    disabled={isPending || isJudging}
                  >
                    Run
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isPending || isJudging}
                    className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isPending || isJudging ? "Judging..." : "Submit"}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeEditor slug={slug} />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />

          <Panel defaultSize={35} minSize={15}>
            <OutputPanel result={result} isJudging={isJudging} testCases={testCases ?? []} />
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
