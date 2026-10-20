import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

// Tienda: tamaños lg/xl → píldora. Admin: sm/default → rounded-[10px].
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-700",
        dark: "bg-ink text-white hover:bg-primary-950",
        outline: "border border-neutral-300 bg-white text-ink hover:border-ink",
        outlineDark:
          "border-[1.5px] border-ink bg-transparent text-ink hover:bg-ink hover:text-white",
        accent: "bg-accent text-ink font-extrabold hover:bg-accent-400",
        soft: "bg-surface-soft text-ink font-extrabold hover:bg-line",
        destructiveSoft:
          "border border-red-200 bg-white text-red-700 font-extrabold hover:bg-red-50",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        ghost: "bg-transparent hover:bg-surface-muted",
        link: "text-primary-700 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-[9px] px-3 text-xs font-extrabold",
        default: "h-10 rounded-[10px] px-4 text-[13px] font-extrabold",
        lg: "h-12 rounded-full px-6 text-[15px]",
        xl: "h-[52px] rounded-full px-[26px] text-[15px] font-extrabold",
        icon: "size-11 rounded-full",
        iconAdmin: "size-[42px] rounded-xl border border-[#E7E4EF] bg-white",
      },
      elevated: { true: "shadow-cta", false: "" },
    },
    defaultVariants: { variant: "default", size: "default", elevated: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, elevated, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, elevated, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

// Ejemplos:
// <Button size="xl" elevated asChild><Link href="/shop">Ver novedades <Icons.arrowRight /></Link></Button>
// <Button variant="accent" size="xl"><Icons.whatsapp /> Enviar link por WhatsApp</Button>
// <Button variant="soft" size="sm">Preparar</Button>   // admin, fila de tabla
