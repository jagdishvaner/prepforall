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
        <div className="absolute left-[calc(50%+40px)] top-6 hidden h-0.5 w-[calc(100%-80px)] bg-gray-200 lg:block" />
      )}
      <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white">
        {stepNumber}
      </div>
      <div className="mb-3 text-brand-primary">{icon}</div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="max-w-[200px] text-sm text-gray-600">{description}</p>
    </div>
  );
}
