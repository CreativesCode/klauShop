"use client";

import { SizeSelector } from "./SizeSelector";

interface MaterialSelectorProps {
  materials?: string[] | null;
  selectedMaterial?: string;
  onMaterialSelect: (material: string) => void;
  className?: string;
}

/** Same chips as the size picker (a Radix Select caused ghost taps on iOS). */
export function MaterialSelector({
  materials,
  selectedMaterial,
  onMaterialSelect,
  className,
}: MaterialSelectorProps) {
  return (
    <SizeSelector
      label="Material"
      sizes={materials}
      selectedSize={selectedMaterial}
      onSizeSelect={onMaterialSelect}
      className={className}
    />
  );
}
