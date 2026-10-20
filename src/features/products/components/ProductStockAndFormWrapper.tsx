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
  /** Final unit price, shown in the mobile buy bar */
  price: number;
}

export function ProductStockAndFormWrapper({
  productId,
  totalStock,
  colors,
  sizes,
  materials,
  price,
}: ProductStockAndFormWrapperProps) {
  // One stock request shared by the header and the form (same number in both)
  const { availableStock, isLoading } = useAvailableStock(productId);

  return (
    <>
      <ProductStockDisplay
        availableStock={availableStock}
        totalStock={totalStock}
        isLoading={isLoading}
      />

      <AddProductToCartForm
        productId={productId}
        colors={colors}
        sizes={sizes}
        materials={materials}
        availableStock={availableStock}
        isLoadingStock={isLoading}
        price={price}
      />
    </>
  );
}
