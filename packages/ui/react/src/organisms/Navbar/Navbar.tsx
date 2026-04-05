import { type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";

export interface NavbarProps {
  brand: ReactNode;
  navigation?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Navbar({ brand, navigation, actions, className }: NavbarProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between h-14 px-6 border-b border-[var(--color-neutral-200)] bg-[var(--color-surface)]",
        className
      )}
    >
      <div className="flex-shrink-0">{brand}</div>
      {navigation && <nav className="flex items-center gap-6">{navigation}</nav>}
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
