import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';

const difficultyColors: Record<string, string> = {
  easy: 'text-green-500',
  medium: 'text-yellow-500',
  hard: 'text-red-500',
};

interface ProblemDescriptionProps {
  title: string;
  difficulty: string;
  tags: string[];
  acceptanceRate?: number;
  description: string;
}

export function ProblemDescription({
  title,
  difficulty,
  tags,
  acceptanceRate,
  description,
}: ProblemDescriptionProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <h1 className="text-xl font-bold mb-2">{title}</h1>
        <div className="flex items-center gap-3 mb-4">
          <span
            className={cn(
              'text-sm font-semibold capitalize',
              difficultyColors[difficulty] || 'text-muted-foreground',
            )}
          >
            {difficulty}
          </span>
          {acceptanceRate != null && acceptanceRate > 0 && (
            <span className="text-sm text-muted-foreground">
              Acceptance: {acceptanceRate.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Tags */}
        {tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4" role="list" aria-label="Problem tags">
            {tags.map((tag) => (
              <span
                key={tag}
                role="listitem"
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <div
          className="prose prose-sm dark:prose-invert max-w-none
                     prose-pre:bg-muted prose-pre:text-foreground
                     prose-code:before:content-none prose-code:after:content-none
                     prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm"
        >
          <Markdown remarkPlugins={[remarkGfm]}>{description}</Markdown>
        </div>
      </div>
    </div>
  );
}
