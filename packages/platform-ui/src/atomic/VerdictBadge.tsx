import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const verdictVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
  {
    variants: {
      verdict: {
        AC: 'bg-green-500/15 text-green-600 dark:text-green-400',
        WA: 'bg-red-500/15 text-red-600 dark:text-red-400',
        TLE: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
        MLE: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
        RE: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
        CE: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
        PENDING: 'bg-muted text-muted-foreground',
        RUNNING: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      },
    },
    defaultVariants: { verdict: 'PENDING' },
  }
);

const verdictLabels: Record<string, string> = {
  AC: 'Accepted', WA: 'Wrong Answer', TLE: 'Time Limit Exceeded',
  MLE: 'Memory Limit Exceeded', RE: 'Runtime Error', CE: 'Compilation Error',
  PENDING: 'Pending', RUNNING: 'Running',
};

export type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'PENDING' | 'RUNNING';

export interface VerdictBadgeProps extends VariantProps<typeof verdictVariants> {
  verdict: Verdict;
  className?: string;
  showLabel?: boolean;
}

export function VerdictBadge({ verdict, className, showLabel = true }: VerdictBadgeProps) {
  return (
    <span className={cn(verdictVariants({ verdict }), className)}>
      {showLabel ? verdictLabels[verdict] : verdict}
    </span>
  );
}
