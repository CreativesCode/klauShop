"use client";
import { AddProductToCartForm } from "@/features/carts";
import { useAvailableStock } from "@/features/carts/hooks/useAvailableStock";
import { ProductStockDisplay } from "./ProductStockDisplay";

interface ProductStockAndFormWrapperProps {
  productId: string;
  totalStock: number;
  colors?: string[] | null;
  sizes?: string[] | null;
  materials?: string[] | null;
}

export function ProductStockAndFormWrapper({
  productId,
  totalStock,
  colors,
  sizes,
  materials,
}: ProductStockAndFormWrapperProps) {
  // One stock request shared by the header and the form (same number in both)
  const { availableStock, isLoading } = useAvailableStock(productId);

  return (
    <>
      <section className="mb-2">
        <ProductStockDisplay
          availableStock={availableStock}
          totalStock={totalStock}
          isLoading={isLoading}
        />
      </section>

      <section className="flex mb-2 items-end space-x-2">
        <AddProductToCartForm
          productId={productId}
          colors={colors}
          sizes={sizes}
          materials={materials}
          availableStock={availableStock}
          isLoadingStock={isLoading}
        />
      </section>
    </>
  );
}
