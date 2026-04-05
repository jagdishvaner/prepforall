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
