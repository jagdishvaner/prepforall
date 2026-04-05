import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";
import { IconClose } from "@prepforall/icons";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "bg-[var(--color-surface)] rounded-xl shadow-xl max-w-[500px] w-[90%] max-h-[85vh] overflow-y-auto p-6",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]"
              aria-label="Close"
            >
              <IconClose size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
