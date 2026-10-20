"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { Icons } from "./icons";

export interface QuantitiyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  onChange?: (...event: any[]) => void;
  value: number;
  addOneHandler: () => void;
  minusOneHandler: () => void;
  /** lg: product page (54px); sm: cart lines (36px) */
  size?: "lg" | "sm";
  /** Disables "+" once reached (available stock) */
  maxValue?: number;
}

const QuantityInput = React.forwardRef<HTMLInputElement, QuantitiyInputProps>(
  (
    {
      onChange,
      addOneHandler,
      minusOneHandler,
      value,
      className,
      size = "lg",
      maxValue,
      ...props
    },
    ref,
  ) => {
    const button = cn(
      "flex shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent",
      size === "lg" ? "size-12" : "size-[34px]",
    );
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-full border border-neutral-300 bg-white",
          size === "lg" ? "h-[54px] w-[150px] px-[3px]" : "h-9 w-[104px] px-px",
          className,
        )}
      >
        <button
          type="button"
          className={button}
          onClick={minusOneHandler}
          disabled={value <= 1}
          aria-label="Restar uno"
        >
          <Icons.minus className="size-4" aria-hidden />
        </button>
        <input
          {...props}
          aria-label="Cantidad"
          type="number"
          inputMode="numeric"
          value={value}
          ref={ref}
          onChange={(event) => onChange?.(event.target.valueAsNumber)}
          className={cn(
            "w-8 min-w-0 flex-1 bg-transparent text-center font-extrabold tabular-nums text-ink outline-none",
            // 16px: iOS zooms into smaller inputs
            size === "lg" ? "text-base" : "text-[16px] md:text-sm",
          )}
        />
        <button
          type="button"
          className={button}
          onClick={addOneHandler}
          disabled={maxValue !== undefined && value >= maxValue}
          aria-label="Sumar uno"
        >
          <Icons.add className="size-4" aria-hidden />
        </button>
      </div>
    );
  },
);

QuantityInput.displayName = "QuantityInput";

export { QuantityInput };
export default QuantityInput;
