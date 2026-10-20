"use client";

import * as React from "react";

import { Icons } from "@/components/layouts/icons";
import { Button } from "@/components/ui/button";
import { type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    return (
      <div className="relative flex items-center rounded-xl border border-neutral-300 bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-100">
        <Icons.lock
          className="absolute left-3.5 size-4 text-neutral-400"
          aria-hidden
        />
        <input
          {...props}
          ref={ref}
          className={cn(
            // 16px on mobile so iOS Safari does not zoom in on focus
            "h-[46px] w-full rounded-xl bg-transparent py-2 pl-10 pr-11 text-[16px] placeholder:text-neutral-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          type={showPassword ? "text" : "password"}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full rounded-xl px-3.5 hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={props.value === "" || props.disabled}
        >
          {showPassword ? (
            <Icons.hide
              className="h-4 w-4 text-neutral-500"
              aria-hidden="true"
            />
          ) : (
            <Icons.view
              className="h-4 w-4 text-neutral-500"
              aria-hidden="true"
            />
          )}
          <span className="sr-only">
            {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          </span>
        </Button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
