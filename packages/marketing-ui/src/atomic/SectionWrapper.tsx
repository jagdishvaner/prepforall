import { type ReactNode } from "react";

export interface SectionWrapperProps {
  children: ReactNode;
  background?: "white" | "gray" | "dark";
  className?: string;
  id?: string;
}

export function SectionWrapper({
  children,
  background = "white",
  className = "",
  id,
}: SectionWrapperProps) {
  const bgClasses = {
    white: "bg-white",
    gray: "bg-gray-50",
    dark: "bg-gray-900 text-white",
  };

  return (
    <section id={id} className={`py-20 ${bgClasses[background]} ${className}`}>
      <div className="mx-auto max-w-[1080px] px-6">{children}</div>
    </section>
  );
}
