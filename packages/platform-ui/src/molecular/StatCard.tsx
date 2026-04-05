import { cn } from '../lib/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const statCardVariants = cva(
  'rounded-xl border p-6',
  {
    variants: {
      variant: {
        default: 'border-border bg-card',
        success: 'border-green-500/20 bg-green-500/5',
        warning: 'border-yellow-500/20 bg-yellow-500/5',
        destructive: 'border-red-500/20 bg-red-500/5',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface StatCardProps extends VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, variant, className }: StatCardProps) {
  return (
    <div className={cn(statCardVariants({ variant }), className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {(subtitle || trend) && (
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <span className={cn(trend.value >= 0 ? 'text-green-500' : 'text-red-500')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
