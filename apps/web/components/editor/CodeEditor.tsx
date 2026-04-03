"use client";

import Editor from "@monaco-editor/react";
import { useEditorStore } from "@/store/editorStore";

interface Props {
  slug: string;
  defaultCode?: string;
}

export function CodeEditor({ slug, defaultCode = "" }: Props) {
  const { language, theme, fontSize, tabSize, getCode, setCode } = useEditorStore();
  const code = getCode(slug) || defaultCode;

  return (
    <Editor
      height="100%"
      language={monacoLanguage(language)}
      value={code}
      theme={theme}
      onChange={(value) => setCode(slug, value ?? "")}
      options={{
        fontSize,
        tabSize,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        formatOnPaste: true,
        suggestOnTriggerCharacters: true,
        lineNumbers: "on",
        renderLineHighlight: "all",
        smoothScrolling: true,
        cursorBlinking: "smooth",
      }}
    />
  );
}

function monacoLanguage(lang: string): string {
  const map: Record<string, string> = {
    cpp: "cpp",
    c: "c",
    java: "java",
    python: "python",
    javascript: "javascript",
    go: "go",
  };
  return map[lang] ?? lang;
}
