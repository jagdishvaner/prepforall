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
  onCursorChange?: (line: number, column: number) => void;
  className?: string;
  height?: string;
}

export function CodeEditor({
  value, language, theme = 'vs-dark', fontSize = 14, tabSize = 4,
  readOnly = false, onChange, onMount, onCursorChange, className, height = '100%',
}: CodeEditorProps) {
  return (
    <div className={cn('h-full w-full overflow-hidden', className)}>
      <Editor
        height={height}
        language={monacoLangMap[language] ?? language}
        value={value}
        theme={theme}
        onChange={onChange}
        onMount={(editor) => {
          onMount?.(editor, undefined as any);
          if (onCursorChange) {
            editor.onDidChangeCursorPosition((e) => {
              onCursorChange(e.position.lineNumber, e.position.column);
            });
          }
        }}
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
