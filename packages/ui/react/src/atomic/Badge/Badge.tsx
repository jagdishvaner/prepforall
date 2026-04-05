import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@prepforall/shared/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
        success: "bg-[var(--color-success-light)] text-[var(--color-success)]",
        error: "bg-[var(--color-error-light)] text-[var(--color-error)]",
        warning: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
        info: "bg-[var(--color-info-light)] text-[var(--color-info)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
