import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const difficultyVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      difficulty: {
        easy: 'bg-green-500/15 text-green-600 dark:text-green-400',
        medium: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
        hard: 'bg-red-500/15 text-red-600 dark:text-red-400',
      },
    },
  }
);

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyTagProps extends VariantProps<typeof difficultyVariants> {
  difficulty: Difficulty;
  className?: string;
}

export function DifficultyTag({ difficulty, className }: DifficultyTagProps) {
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return <span className={cn(difficultyVariants({ difficulty }), className)}>{label}</span>;
}
