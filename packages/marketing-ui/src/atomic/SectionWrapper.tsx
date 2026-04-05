import { type ReactNode } from "react";

export interface SectionWrapperProps {
  children: ReactNode;
  background?: "white" | "gray" | "dark" | "cream" | "salmon" | "brand-dark";
  className?: string;
  id?: string;
}

export function SectionWrapper({
  children,
  background = "white",
  className = "",
  id,
}: SectionWrapperProps) {
  const bgClasses: Record<string, string> = {
    white: "bg-surface-warm",
    gray: "bg-surface-cream",
    dark: "bg-brand-dark text-white",
    cream: "bg-surface-cream",
    salmon: "bg-surface-salmon",
    "brand-dark": "bg-brand-dark text-white",
  };

  return (
    <section id={id} className={`py-24 lg:py-32 ${bgClasses[background]} ${className}`}>
      <div className="mx-auto max-w-[1080px] px-6">{children}</div>
    </section>
  );
}
