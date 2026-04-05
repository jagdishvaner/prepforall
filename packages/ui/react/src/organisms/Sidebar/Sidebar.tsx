import { type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";

export interface SidebarItem {
  id: string;
  icon?: ReactNode;
  label: string;
  href: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  activeId?: string;
  expanded?: boolean;
  className?: string;
  onItemClick?: (item: SidebarItem) => void;
  renderLink?: (props: { item: SidebarItem; children: ReactNode; className: string }) => ReactNode;
}

export function Sidebar({
  items,
  activeId,
  expanded = false,
  className,
  onItemClick,
  renderLink,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[var(--color-neutral-200)] bg-[var(--color-surface)] py-4 flex-shrink-0",
        expanded ? "w-60" : "w-14",
        className
      )}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        const itemClassName = cn(
          "flex items-center gap-2 px-4 py-2 rounded-md mx-1 transition-colors",
          isActive
            ? "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
            : "text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)]"
        );

        const content = (
          <>
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            {expanded && <span className="text-sm">{item.label}</span>}
          </>
        );

        if (renderLink) {
          return (
            <div key={item.id}>
              {renderLink({ item, children: content, className: itemClassName })}
            </div>
          );
        }

        return (
          <button
            key={item.id}
            className={itemClassName}
            onClick={() => onItemClick?.(item)}
            title={!expanded ? item.label : undefined}
          >
            {content}
          </button>
        );
      })}
    </aside>
  );
}
