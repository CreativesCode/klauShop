"use client";

import { cn } from "@/lib/utils";

interface ProductStockDisplayProps {
  // Available stock (physical minus reservations); null while unknown
  availableStock: number | null;
  totalStock: number;
  isLoading?: boolean;
}

export function getStockLabel(stock: number) {
  if (stock === 0)
    return { text: "Sin stock disponible", className: "text-red-700" };
  if (stock === 1)
    return { text: "Última unidad disponible", className: "text-accent-700" };
  if (stock < 5)
    return { text: `Quedan ${stock} unidades`, className: "text-accent-700" };
  return {
    text: "En stock · listo para entregar",
    className: "text-emerald-700",
  };
}

export function ProductStockDisplay({
  availableStock,
  totalStock,
  isLoading = false,
}: ProductStockDisplayProps) {
  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm font-bold text-neutral-500">
        <span className="size-2 rounded-full bg-current" aria-hidden />
        Comprobando stock…
      </p>
    );
  }

  // Physical stock only as a fallback when the check failed
  const { text, className } = getStockLabel(availableStock ?? totalStock);

  return (
    <p className={cn("flex items-center gap-2 text-sm font-bold", className)}>
      <span className="size-2 rounded-full bg-current" aria-hidden />
      {text}
    </p>
  );
}
