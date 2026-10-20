import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-extrabold tracking-[.02em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
        secondary: "bg-surface-soft text-neutral-700",
        destructive: "bg-red-50 text-red-700",
        new_product: "bg-white text-primary-700", // "Nuevo" (sobre imagen)
        featured:
          "bg-white text-primary-700 ring-1 ring-inset ring-primary-200", // "Destacado"
        best_sale: "bg-ink text-white", // "Mejor venta"
        discount: "bg-accent text-ink", // "-10%"
        count:
          "min-w-[20px] h-5 justify-center px-1.5 py-0 text-[11px] bg-accent text-ink",
        outline: "bg-white text-ink ring-1 ring-inset ring-line",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export const BADGE_LABEL: Record<string, string> = {
  new_product: "Nuevo",
  best_sale: "Mejor venta",
  featured: "Destacado",
};

export { Badge, badgeVariants };
