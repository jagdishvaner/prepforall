import { type ReactNode } from "react";

export interface SectionHeadingProps {
  children: ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
}

export function SectionHeading({
  children,
  subtitle,
  align = "center",
  light = false,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  const colorClass = light ? "text-white" : "text-gray-900";
  const subtitleColor = light ? "text-gray-300" : "text-gray-600";

  return (
    <div className={`mb-12 ${alignClass}`}>
      <h2
        className={`font-heading text-3xl font-bold tracking-tight md:text-4xl ${colorClass}`}
      >
        {children}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-lg ${subtitleColor}`}>{subtitle}</p>
      )}
    </div>
  );
}
