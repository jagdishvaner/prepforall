import { cva, type VariantProps } from "class-variance-authority";
import { type ReactNode } from "react";

import { cn } from "@prepforall/shared/utils";
import { IconClose } from "@prepforall/icons";

const toastVariants = cva(
  "flex items-start gap-2 p-4 rounded-lg shadow-lg font-sans text-sm min-w-[300px] max-w-[420px]",
  {
    variants: {
      variant: {
        success: "bg-[var(--color-success-light)] border-l-4 border-l-[var(--color-success)]",
        error: "bg-[var(--color-error-light)] border-l-4 border-l-[var(--color-error)]",
        warning: "bg-[var(--color-warning-light)] border-l-4 border-l-[var(--color-warning)]",
        info: "bg-[var(--color-info-light)] border-l-4 border-l-[var(--color-info)]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export interface ToastProps extends VariantProps<typeof toastVariants> {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Toast({ variant, children, onClose, className }: ToastProps) {
  return (
    <div className={cn(toastVariants({ variant }), className)} role="alert">
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="p-0.5 flex-shrink-0" aria-label="Dismiss">
          <IconClose size={16} />
        </button>
      )}
    </div>
  );
}
