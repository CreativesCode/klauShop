import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = () => (
  <div className="flex min-w-0 flex-col gap-3">
    <Skeleton className="aspect-[4/5] w-full rounded-[18px]" />
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-[40%]" />
      <Skeleton className="h-4 w-[90%]" />
      <Skeleton className="h-4 w-[30%]" />
    </div>
  </div>
);

export default ProductCardSkeleton;
