import { DifficultyTag, type Difficulty } from '../atomic/DifficultyTag';
import { cn } from '../lib/cn';

export interface ProblemListItemProps {
  index: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  acceptanceRate: number;
  tags: string[];
  isSolved?: boolean;
  className?: string;
  onNavigate?: (slug: string) => void;
}

export function ProblemListItem({
  index, title, slug, difficulty, acceptanceRate, tags, isSolved, className, onNavigate,
}: ProblemListItemProps) {
  return (
    <tr
      className={cn('border-b border-border/50 hover:bg-muted/30 cursor-pointer', className)}
      onClick={() => onNavigate?.(slug)}
    >
      <td className="px-4 py-3 text-muted-foreground w-12">
        {isSolved ? <span className="text-green-500">{'\u2713'}</span> : index}
      </td>
      <td className="px-4 py-3 font-medium">{title}</td>
      <td className="px-4 py-3"><DifficultyTag difficulty={difficulty} /></td>
      <td className="px-4 py-3 text-muted-foreground">{acceptanceRate.toFixed(1)}%</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{tag}</span>
          ))}
        </div>
      </td>
    </tr>
  );
}
