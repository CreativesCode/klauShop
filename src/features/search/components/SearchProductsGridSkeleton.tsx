import React from "react";
import { Skeleton } from "../../../components/ui/skeleton";
import { ProductCardSkeleton } from "../../products/components/ProductCardSkeleton";

function SearchProductsGridSkeleton() {
  return (
    <div>
      <Skeleton className="mb-5" />

      <section className="grid grid-cols-products gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10 w-full py-5">
        {[...Array(24)].map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </section>
    </div>
  );
}

export default SearchProductsGridSkeleton;
