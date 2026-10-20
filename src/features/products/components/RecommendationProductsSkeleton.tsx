import Header from "@/components/layouts/Header";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

function RecommendationProductsSkeleton() {
  return (
    <Header heading={`Te puede interesar`}>
      <div className="grid grid-cols-products gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
        {[...Array(4)].map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </Header>
  );
}

export default RecommendationProductsSkeleton;
