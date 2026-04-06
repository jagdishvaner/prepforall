import { useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/cn';

export interface TimerDisplayProps {
  endTime: Date;
  onExpire?: () => void;
  className?: string;
  warningThresholdMs?: number; // default 5 minutes
}

export function TimerDisplay({ endTime, onExpire, className, warningThresholdMs = 5 * 60 * 1000 }: TimerDisplayProps) {
  const calcRemaining = useCallback(() => Math.max(0, endTime.getTime() - Date.now()), [endTime]);
  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [calcRemaining, onExpire]);

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const isWarning = remaining > 0 && remaining <= warningThresholdMs;
  const isExpired = remaining <= 0;

  return (
    <div className={cn(
      'font-mono text-lg font-bold tabular-nums',
      isExpired && 'text-destructive',
      isWarning && !isExpired && 'text-yellow-500 animate-pulse',
      !isWarning && !isExpired && 'text-foreground',
      className
    )}>
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
