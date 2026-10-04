import { DocumentType, gql } from "@/gql";
import { cn, keytoUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";

import { Icons } from "@/components/layouts/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddToWishListButton } from "@/features/wishlists";
import { BadgeType } from "@/lib/supabase/schema";

type CardProps = React.ComponentProps<typeof Card>;

export type ProductCardImage = {
  key: string;
  alt?: string | null;
};

export type ProductCardProps = CardProps & {
  product: DocumentType<typeof ProductCardFragment>;
  /**
   * Optional hover image override (useful when the client can't query product_medias via GraphQL).
   */
  hoverImage?: ProductCardImage | null;
};

export const ProductCardFragment = gql(/* GraphQL */ `
  fragment ProductCardFragment on products {
    id
    name
    rating
    slug
    badge
    price
    discount
    stock
    colors
    sizes
    materials
    show_in_slider
    featuredImage: medias {
      id
      key
      alt
    }
    images: product_mediasCollection(
      first: 1
      orderBy: [{ priority: DescNullsLast }]
    ) {
      edges {
        node {
          media {
            id
            key
            alt
          }
        }
      }
    }
    collections {
      id
      label
      slug
    }
  }
`);

// Helper function to normalize JSON values to array
function normalizeToArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function ProductCard({
  className,
  product,
  hoverImage,
  ...props
}: ProductCardProps) {
  const { name, slug, featuredImage, badge, price, discount, images } = product;

  // Obtener la categoría principal (primera colección)
  const mainCategory = product.collections ?? null;

  // Obtener la segunda imagen si existe
  const secondImage = hoverImage ?? images?.edges?.[0]?.node?.media;
  const hasMultipleImages = !!secondImage;

  // Normalizar los colores y sizes (pueden venir como array o string JSON)
  const normalizedColors = normalizeToArray(product.colors);
  const normalizedSizes = normalizeToArray(product.sizes);

  // Limitar a 6 elementos y calcular el resto
  const MAX_DISPLAY = 6;
  const colorsToShow = normalizedColors.slice(0, MAX_DISPLAY);
  const remainingColors = normalizedColors.length - MAX_DISPLAY;
  const sizesToShow = normalizedSizes.slice(0, MAX_DISPLAY);
  const remainingSizes = normalizedSizes.length - MAX_DISPLAY;

  // Calcular el precio con descuento
  const discountValue = discount ? parseFloat(discount.toString()) : 0;
  const hasDiscount = discountValue > 0;
  const priceValue = parseFloat(price.toString());
  const discountedPrice = hasDiscount
    ? priceValue - (priceValue * discountValue) / 100
    : priceValue;

  return (
    <Card
      className={cn(
        "w-full border-0 rounded-lg hover:shadow-xl transition-all duration-300 flex flex-col min-w-0",
        className,
      )}
      {...props}
    >
      <CardContent className="relative p-0 overflow-hidden rounded-t-lg group w-full">
        <Link
          href={`/shop/${slug}`}
          className="block overflow-hidden rounded-t-lg relative"
        >
          {/* Imagen principal */}
          <Image
            src={keytoUrl(featuredImage.key)}
            alt={featuredImage.alt}
            width={400}
            height={400}
            // 2 columns on phones/tablets, 4 on desktop
            sizes={"(max-width: 1024px) 50vw, 25vw"}
            className={cn(
              "aspect-[1/1] w-full object-cover rounded-t-lg object-center transition-all duration-500",
              hasMultipleImages &&
                "group-hover:opacity-0 group-hover:scale-[1.02]",
            )}
          />
          {/* Segunda imagen que aparece en hover */}
          {hasMultipleImages && secondImage && (
            <Image
              src={keytoUrl(secondImage.key)}
              alt={secondImage.alt || featuredImage.alt}
              width={400}
              height={400}
              sizes={"(max-width: 1024px) 50vw, 25vw"}
              // Hidden (and so never downloaded, it is lazy) on touch screens without hover
              className="hidden [@media(hover:hover)]:block aspect-[1/1] w-full object-cover rounded-t-lg object-center absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
            />
          )}
        </Link>
        {badge && (
          <Badge
            className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-[10px] sm:text-xs md:text-sm px-1.5 py-0.5 sm:px-2 sm:py-1"
            variant={badge as BadgeType}
          >
            {badge === "new_product"
              ? "Nuevo"
              : badge === "best_sale"
                ? "Mejor Venta"
                : "Destacado"}
          </Badge>
        )}
        {hasDiscount && (
          <Badge className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 bg-red-500 hover:bg-red-600 text-white text-[10px] sm:text-xs md:text-sm px-1.5 py-0.5 sm:px-2 sm:py-1">
            -{discountValue}%
          </Badge>
        )}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
          <Suspense
            fallback={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                disabled
              >
                <Icons.heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 fill-none" />
              </Button>
            }
          >
            <AddToWishListButton productId={product.id} />
          </Suspense>
        </div>
      </CardContent>

      <CardHeader className="p-2 sm:p-3 pb-2 sm:pb-3 md:p-4 md:pb-4 flex flex-col gap-1.5 sm:gap-2 w-full min-w-0">
        <div className="flex flex-col gap-0.5 sm:gap-1 w-full min-w-0">
          {mainCategory && (
            <Link
              href={`/collections/${mainCategory.slug}`}
              className="text-[10px] sm:text-xs md:text-sm text-gray-600 hover:text-gray-800 truncate"
            >
              {mainCategory.label}
            </Link>
          )}
          <CardTitle className="leading-tight min-w-0 w-full">
            <Link
              href={`/shop/${slug}`}
              className="hover:underline text-xs sm:text-sm md:text-base lg:text-lg text-primary-800 line-clamp-2 block"
            >
              {name}
            </Link>
          </CardTitle>

          <div className="flex flex-col gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 w-full min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 flex-1">
              {hasDiscount ? (
                <>
                  <span className="text-xs sm:text-sm md:text-base font-bold text-red-600 whitespace-nowrap">
                    {discountedPrice.toFixed(2)} CUP
                  </span>
                  <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 line-through whitespace-nowrap">
                    {priceValue.toFixed(2)} CUP
                  </span>
                </>
              ) : (
                <span className="text-sm sm:text-base md:text-lg font-bold whitespace-nowrap">
                  {priceValue.toFixed(2)} CUP
                </span>
              )}
            </div>

            <div className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap flex-shrink-0">
              {product.stock === 0 ? (
                <span className="text-red-500 font-semibold">Agotado</span>
              ) : product.stock && product.stock < 5 ? (
                <span className="text-yellow-600 font-semibold">
                  ¡Quedan {product.stock}!
                </span>
              ) : (
                <span className="text-green-600">En stock</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 w-full min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap min-w-0 flex-1">
            {colorsToShow.length > 0 &&
              colorsToShow.map((color) => (
                <div
                  key={color}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
              ))}
            {remainingColors > 0 && (
              <span className="text-[10px] sm:text-xs text-gray-500 font-medium whitespace-nowrap">
                +{remainingColors}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap min-w-0 flex-1 sm:justify-end">
            {sizesToShow.length > 0 &&
              sizesToShow.map((size) => (
                <span
                  key={size}
                  className="text-[10px] sm:text-xs md:text-sm px-1 sm:px-1.5 py-0.5 rounded border border-gray-300 bg-gray-50 text-gray-700 whitespace-nowrap"
                >
                  {size}
                </span>
              ))}
            {remainingSizes > 0 && (
              <span className="text-[10px] sm:text-xs text-gray-500 font-medium whitespace-nowrap">
                +{remainingSizes}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default ProductCard;
