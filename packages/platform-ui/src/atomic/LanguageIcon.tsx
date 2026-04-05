import { cn } from '../lib/cn';

export type Language = 'cpp' | 'c' | 'java' | 'python' | 'javascript' | 'go' | 'postgresql';

const languageConfig: Record<Language, { label: string; color: string }> = {
  cpp: { label: 'C++', color: 'text-blue-500' },
  c: { label: 'C', color: 'text-gray-500' },
  java: { label: 'Java', color: 'text-orange-500' },
  python: { label: 'Python', color: 'text-yellow-500' },
  javascript: { label: 'JS', color: 'text-yellow-400' },
  go: { label: 'Go', color: 'text-cyan-500' },
  postgresql: { label: 'SQL', color: 'text-indigo-500' },
};

export interface LanguageIconProps {
  language: Language;
  className?: string;
  showLabel?: boolean;
}

export function LanguageIcon({ language, className, showLabel = true }: LanguageIconProps) {
  const config = languageConfig[language] ?? { label: language, color: 'text-muted-foreground' };
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-mono font-medium', config.color, className)}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {showLabel && config.label}
    </span>
  );
}
