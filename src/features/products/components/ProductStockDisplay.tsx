"use client";

interface ProductStockDisplayProps {
  // Available stock (physical minus reservations); null while unknown
  availableStock: number | null;
  totalStock: number;
  isLoading?: boolean;
}

export function ProductStockDisplay({
  availableStock,
  totalStock,
  isLoading = false,
}: ProductStockDisplayProps) {
  if (isLoading) {
    return (
      <div className="text-muted-foreground font-semibold">
        Comprobando stock…
      </div>
    );
  }

  // Physical stock only as a fallback when the check failed
  const displayStock = availableStock ?? totalStock;

  if (displayStock === 0) {
    return (
      <div className="text-red-500 font-semibold text-lg">
        Sin stock disponible
      </div>
    );
  }

  if (displayStock < 5) {
    return (
      <div className="text-yellow-600 font-semibold">
        Stock bajo - ¡Solo {displayStock} disponible
        {displayStock === 1 ? "" : "s"}!
      </div>
    );
  }

  return (
    <div className="text-green-600 font-semibold">
      En Stock ({displayStock} disponible{displayStock === 1 ? "" : "s"})
    </div>
  );
}
