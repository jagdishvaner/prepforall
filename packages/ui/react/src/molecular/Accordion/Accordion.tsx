import { useState, type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";
import { IconChevronDown } from "@prepforall/icons";

export interface AccordionItemData {
  id: string;
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItemData[];
  /** Allow multiple items to be open at once */
  multiple?: boolean;
  className?: string;
}

export function Accordion({ items, multiple = false, className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn("border border-[var(--color-neutral-200)] rounded-lg overflow-hidden", className)}>
      {items.map((item, i) => {
        const isOpen = openIds.has(item.id);
        return (
          <div key={item.id} className={cn(i < items.length - 1 && "border-b border-[var(--color-neutral-200)]")}>
            <button
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-left hover:bg-[var(--color-neutral-50)] transition-colors"
              aria-expanded={isOpen}
            >
              {item.title}
              <IconChevronDown
                size={16}
                className={cn("transition-transform", isOpen && "rotate-180")}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-4 text-sm text-[var(--color-neutral-600)]">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
