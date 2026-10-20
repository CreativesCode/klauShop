"use client";

import { cn } from "@/lib/utils";

interface SizeSelectorProps {
  sizes?: string[] | null;
  selectedSize?: string;
  onSizeSelect: (size: string) => void;
  className?: string;
  /** Group label (the material picker reuses this component) */
  label?: string;
}

// Helper function to normalize JSON values to array
function normalizeToArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Option chips: size and material pickers of the product page. */
export function SizeSelector({
  sizes,
  selectedSize,
  onSizeSelect,
  className,
  label = "Talla",
}: SizeSelectorProps) {
  const normalizedSizes = normalizeToArray(sizes);

  if (normalizedSizes.length === 0) {
    return null;
  }

  return (
    <fieldset className={cn("space-y-2.5", className)}>
      <legend className="mb-2.5 text-sm font-bold text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {normalizedSizes.map((size) => {
          const selected = selectedSize === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => onSizeSelect(size)}
              aria-pressed={selected}
              className={cn(
                "h-12 min-w-14 rounded-xl border-[1.5px] px-4 text-[15px] font-bold transition-colors",
                selected
                  ? "border-ink bg-ink text-white"
                  : "border-neutral-300 bg-white text-ink hover:border-ink",
              )}
            >
              {size}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
