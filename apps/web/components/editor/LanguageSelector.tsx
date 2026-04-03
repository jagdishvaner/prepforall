"use client";

import { useEditorStore, SUPPORTED_LANGUAGES } from "@/store/editorStore";

export function LanguageSelector() {
  const { language, setLanguage } = useEditorStore();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {SUPPORTED_LANGUAGES.map((l) => (
        <option key={l.value} value={l.value}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
