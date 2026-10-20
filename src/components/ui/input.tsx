import * as React from "react";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  asChild?: boolean;
}

// Mobile text is 16px (absolute px, never rem) so iOS Safari does not zoom in
// when a field gets focus.
const inputVariants = cva(
  "flex h-[46px] w-full rounded-xl px-3.5 py-2 text-[16px] md:text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-neutral-300 bg-white placeholder:text-neutral-500 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-100 aria-[invalid=true]:border-red-300",
        ghost:
          "ring-0 border-0 focus:border-0 focus:ring-offset-0 focus-visible:ring-0 bg-transparent focus:ring-0 focus-visible:border-0 ",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
//   ({ className, variant, size, asChild = false, ...props }, ref) => {
//     const Comp = asChild ? Slot : "button"
//     return (
//       <Comp
//         className={cn(buttonVariants({ variant, size, className }))}
//         ref={ref}
//         {...props}
//       />
//     )
//   }
// )
// Button.displayName = "Button"

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "input";
    return (
      <Comp
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
      // <input
      //   type={type}
      //   className={cn(
      //     // "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      //     className
      //   )}
      //   ref={ref}
      //   {...props}
      // />
    );
  },
);

Input.displayName = "Input";

export { Input };
