import { ProductCardSkeleton } from "./ProductCardSkeleton";

function WishlistProductsSkeleton() {
  return (
    <div className="grid grid-cols-products gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
      {[...Array(4)].map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default WishlistProductsSkeleton;
