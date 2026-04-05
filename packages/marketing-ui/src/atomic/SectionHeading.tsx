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
  const colorClass = light ? "text-white" : "text-text-primary";
  const subtitleColor = light ? "text-gray-300" : "text-text-secondary";

  return (
    <div className={`mb-16 ${alignClass}`}>
      <h2
        className={`font-heading text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl ${colorClass}`}
      >
        {children}
      </h2>
      {subtitle && (
        <p className={`mx-auto mt-6 max-w-2xl text-lg leading-relaxed md:text-xl ${subtitleColor}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
