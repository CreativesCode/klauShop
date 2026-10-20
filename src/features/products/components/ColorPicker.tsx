"use client";

import { colorName } from "@/lib/colorName";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  colors?: string[] | null;
  selectedColor?: string;
  onColorSelect: (color: string) => void;
  className?: string;
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

export function ColorPicker({
  colors,
  selectedColor,
  onColorSelect,
  className,
}: ColorPickerProps) {
  const normalizedColors = normalizeToArray(colors);

  if (normalizedColors.length === 0) {
    return null;
  }

  return (
    <fieldset className={cn("space-y-2.5", className)}>
      <legend className="mb-2.5 text-sm font-bold text-ink">
        Color
        {selectedColor && (
          <>
            :{" "}
            <span className="font-semibold capitalize text-neutral-600">
              {colorName(selectedColor)}
            </span>
          </>
        )}
      </legend>
      <div className="flex flex-wrap gap-2">
        {normalizedColors.map((color) => {
          const selected = selectedColor === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => onColorSelect(color)}
              aria-pressed={selected}
              aria-label={`Color ${colorName(color)}`}
              className={cn(
                "flex size-11 items-center justify-center rounded-full border-2 p-[3px] transition-colors",
                selected
                  ? "border-ink"
                  : "border-neutral-200 hover:border-neutral-400",
              )}
            >
              <span
                className="size-full rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: color }}
              />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
