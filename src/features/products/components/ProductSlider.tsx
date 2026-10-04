"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { DocumentType, gql } from "@/gql";
import { cn } from "@/lib/utils";
import { ProductCard, ProductCardFragment } from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

export const ProductSliderQuery = gql(/* GraphQL */ `
  query ProductSliderQuery {
    products: productsCollection(
      filter: { show_in_slider: { eq: true }, stock: { gt: 0 } }
      first: 20
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          ...ProductCardFragment
        }
      }
    }
  }
`);

type ProductSliderProps = {
  products: { node: DocumentType<typeof ProductCardFragment> }[];
  title?: string;
  className?: string;
};

export function ProductSlider({
  products,
  title = "Productos Destacados",
  className,
}: ProductSliderProps) {
  const inStockProducts = (products ?? []).filter(
    ({ node }) => (node.stock ?? 0) > 0,
  );

  if (inStockProducts.length === 0) {
    return null;
  }

  return (
    <section className={cn("w-full pt-8 md:pt-12", className)}>
      {title && (
        <div className="mb-6 md:mb-8">
          <h2 className="font-semibold text-2xl md:text-3xl mb-1 md:mb-3">
            {title}
          </h2>
        </div>
      )}

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {inStockProducts.map(({ node }) => (
            <CarouselItem
              key={`product-slider-${node.id}`}
              className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pb-8"
            >
              <ProductCard product={node} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-12" />
        <CarouselNext className="hidden md:flex -right-12" />
      </Carousel>
    </section>
  );
}

export function ProductSliderSkeleton() {
  return (
    <section className="w-full py-8 md:py-12">
      <div className="mb-6 md:mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-3" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <ProductCardSkeleton key={`product-slider-skeleton-${index}`} />
        ))}
      </div>
    </section>
  );
}

export default ProductSlider;
