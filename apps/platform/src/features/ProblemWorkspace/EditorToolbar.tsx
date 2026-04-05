import { useEditorStore, SUPPORTED_LANGUAGES } from '@/stores/editorStore';
import { Play, Send, RotateCcw, Sun, Moon, Maximize2, Minimize2 } from 'lucide-react';

interface EditorToolbarProps {
  slug: string;
  starterCode?: Record<string, string>;
  isJudging: boolean;
  isFullscreen: boolean;
  onRun: () => void;
  onSubmit: () => void;
  onToggleFullscreen: () => void;
}

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20];

export function EditorToolbar({
  slug,
  starterCode,
  isJudging,
  isFullscreen,
  onRun,
  onSubmit,
  onToggleFullscreen,
}: EditorToolbarProps) {
  const { language, setLanguage, theme, setTheme, fontSize, setFontSize, resetCode } =
    useEditorStore();

  const handleReset = () => {
    const code = starterCode?.[language] ?? '';
    if (confirm('Reset code to starter template? Your changes will be lost.')) {
      resetCode(slug, language, code);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-1.5">
      {/* Left: Language selector */}
      <div className="flex items-center gap-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded border border-border bg-background px-2 py-1 text-sm"
          aria-label="Programming language"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Center: Editor controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleReset}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Reset to starter code"
          aria-label="Reset to starter code"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === 'vs-dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="rounded border border-border bg-background px-1.5 py-1 text-xs"
          title="Font size"
          aria-label="Font size"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
        <button
          onClick={onToggleFullscreen}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Right: Run + Submit */}
      <div className="flex gap-2">
        <button
          onClick={onRun}
          disabled={isJudging}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          Run
        </button>
        <button
          onClick={onSubmit}
          disabled={isJudging}
          className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          Submit
        </button>
      </div>
    </div>
  );
}
