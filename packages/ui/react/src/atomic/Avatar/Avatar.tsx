import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@prepforall/shared/utils";

const avatarVariants = cva(
  "inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 bg-[var(--color-neutral-200)] text-[var(--color-neutral-600)] font-medium",
  {
    variants: {
      size: {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface AvatarProps
  extends VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt, fallback, size, className }: AvatarProps) {
  return (
    <span className={cn(avatarVariants({ size }), className)} role="img" aria-label={alt || "avatar"}>
      {src ? (
        <img src={src} alt={alt || ""} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden="true">{fallback || "?"}</span>
      )}
    </span>
  );
}
