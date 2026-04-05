interface EditorStatusBarProps {
  line: number;
  column: number;
}

export function EditorStatusBar({ line, column }: EditorStatusBarProps) {
  return (
    <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
      <span>Saved</span>
      <span>
        Ln {line}, Col {column}
      </span>
    </div>
  );
}
