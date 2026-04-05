import { type ReactNode } from "react";

export interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: ReactNode;
  isLast?: boolean;
}

export function StepCard({
  stepNumber,
  title,
  description,
  icon,
  isLast = false,
}: StepCardProps) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[calc(50%+36px)] top-8 hidden h-[2px] w-[calc(100%-72px)] bg-gradient-to-r from-brand-primary/30 to-brand-primary/10 lg:block" />
      )}
      <div className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary text-2xl font-bold text-white shadow-lg shadow-brand-primary/25">
        {stepNumber}
      </div>
      <div className="mb-4 text-brand-primary">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="max-w-[200px] text-sm leading-relaxed text-text-secondary">{description}</p>
    </div>
  );
}
