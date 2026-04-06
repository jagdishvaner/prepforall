import { type ReactNode } from "react";

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-salmon text-brand-primary">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-semibold text-text-primary">{title}</h3>
      <p className="text-[15px] leading-relaxed text-text-secondary">{description}</p>
    </div>
  );
}
