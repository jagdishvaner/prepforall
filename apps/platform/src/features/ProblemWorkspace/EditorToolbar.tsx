import { useEditorStore, SUPPORTED_LANGUAGES } from '@/stores/editorStore';
import { Play, Send } from 'lucide-react';

interface EditorToolbarProps {
  slug: string;
  onRun: () => void;
  onSubmit: () => void;
}

export function EditorToolbar({ slug, onRun, onSubmit }: EditorToolbarProps) {
  const { language, setLanguage } = useEditorStore();

  return (
    <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="rounded border border-border bg-background px-2 py-1 text-sm"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>{lang.label}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          onClick={onRun}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <Play className="h-3.5 w-3.5" />
          Run
        </button>
        <button
          onClick={onSubmit}
          className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
        >
          <Send className="h-3.5 w-3.5" />
          Submit
        </button>
      </div>
    </div>
  );
}
