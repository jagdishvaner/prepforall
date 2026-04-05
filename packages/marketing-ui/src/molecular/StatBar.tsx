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
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="text-3xl font-bold text-white md:text-4xl">
            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
          </p>
          <p className="mt-2 text-sm text-gray-300">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
