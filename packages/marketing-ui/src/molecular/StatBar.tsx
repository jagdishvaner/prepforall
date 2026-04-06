"use client";

import { AnimatedCounter } from "../atomic/AnimatedCounter";

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

export interface StatBarProps {
  stats: StatItem[];
}

export function StatBar({ stats }: StatBarProps) {
  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`text-center ${
            index < stats.length - 1
              ? "md:border-r md:border-white/15"
              : ""
          }`}
        >
          <p className="text-5xl font-bold text-white md:text-6xl">
            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
          </p>
          <p className="mt-3 text-sm font-medium uppercase tracking-wider text-gray-400">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
