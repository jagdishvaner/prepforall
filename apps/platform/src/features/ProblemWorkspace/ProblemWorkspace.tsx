import { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { CodeEditor } from '@prepforall/platform-ui/organisms';
import { useEditorStore, DEFAULT_STARTER_CODE } from '@/stores/editorStore';
import { useProblem } from '@/lib/hooks/useProblems';
import { useTestCases } from '@/lib/hooks/useTestCases';
import { useSubmission } from '@/lib/hooks/useSubmission';
import { ProblemDescription } from './ProblemDescription';
import { EditorToolbar } from './EditorToolbar';
import { EditorStatusBar } from './EditorStatusBar';
import { TestCasePanel } from './TestCasePanel';

interface Props {
  slug: string;
}

export function ProblemWorkspace({ slug }: Props) {
  const { data: problem, isLoading } = useProblem(slug);
  const { data: rawTestCases } = useTestCases(slug);
  const testCases = rawTestCases ?? [];
  const { language, theme, fontSize, tabSize, getCode, setCode } = useEditorStore();
  const { run, submit, result, isJudging, mode } = useSubmission(slug);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load starter code if no saved code exists
  // Wait for problem to load before setting code — otherwise generic template
  // gets saved before the API returns problem-specific starter code
  let code = getCode(slug, language);
  if (!code && problem) {
    const starter = problem.starterCode?.[language] ?? DEFAULT_STARTER_CODE[language] ?? '';
    if (starter) {
      code = starter;
      setCode(slug, language, code);
    }
  }

  const handleRun = useCallback(() => {
    run(getCode(slug, language), language);
  }, [run, getCode, slug, language]);

  const handleSubmit = useCallback(() => {
    submit(getCode(slug, language), language);
  }, [submit, getCode, slug, language]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (mod && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if (mod && e.key === 's') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, handleSubmit]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading problem...
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Problem not found.
      </div>
    );
  }

  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* Left: Problem description */}
      {!isFullscreen && (
        <>
          <Panel defaultSize={40} minSize={25}>
            <ProblemDescription
              title={problem.title}
              difficulty={problem.difficulty ?? 'easy'}
              tags={problem.tags ?? []}
              acceptanceRate={problem.acceptanceRate}
              description={problem.description ?? ''}
            />
          </Panel>
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
        </>
      )}

      {/* Right: Editor + Test cases */}
      <Panel defaultSize={isFullscreen ? 100 : 60} minSize={30}>
        <PanelGroup direction="vertical">
          {/* Editor */}
          <Panel defaultSize={65} minSize={30}>
            <div className="flex h-full flex-col">
              <EditorToolbar
                slug={slug}
                starterCode={problem.starterCode}
                isJudging={isJudging}
                isFullscreen={isFullscreen}
                onRun={handleRun}
                onSubmit={handleSubmit}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  value={code}
                  language={language}
                  theme={theme}
                  fontSize={fontSize}
                  tabSize={tabSize}
                  onChange={(val) => setCode(slug, language, val ?? '')}
                  onCursorChange={(line, col) => setCursorPos({ line, col })}
                />
              </div>
              <EditorStatusBar line={cursorPos.line} column={cursorPos.col} />
            </div>
          </Panel>

          <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Test Cases / Results */}
          <Panel defaultSize={35} minSize={15}>
            <TestCasePanel
              testCases={testCases}
              result={result}
              isJudging={isJudging}
              mode={mode}
            />
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
