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
    description
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
        "w-full border-0 rounded-lg hover:shadow-xl transition-all duration-300",
        className,
      )}
      {...props}
    >
      <CardContent className="relative p-0 overflow-hidden rounded-t-lg group">
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
            className={cn(
              "aspect-[1/1] object-cover rounded-t-lg object-center transition-all duration-500",
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
              className="aspect-[1/1] object-cover rounded-t-lg object-center absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
            />
          )}
        </Link>
        {badge && (
          <Badge className="absolute top-2 left-2" variant={badge as BadgeType}>
            {badge === "new_product"
              ? "Nuevo"
              : badge === "best_sale"
                ? "Mejor Venta"
                : "Destacado"}
          </Badge>
        )}
        {hasDiscount && (
          <Badge className="absolute bottom-2 left-2 bg-red-500 hover:bg-red-600 text-white">
            -{discountValue}%
          </Badge>
        )}
        <div className="absolute top-2 right-2">
          <Suspense
            fallback={
              <Button variant="ghost" disabled>
                <Icons.heart className={"w-4 h-4 md:w-6 md:h-6 fill-none"} />
              </Button>
            }
          >
            <AddToWishListButton productId={product.id} />
          </Suspense>
        </div>
      </CardContent>

      <CardHeader className="p-1 px-2 pb-2 md:pb-4 md:px-4 flex flex-col">
        <div>
          {mainCategory && (
            <Link
              href={`/collections/${mainCategory.slug}`}
              className="text-xs text-gray-600"
            >
              {mainCategory.label}
            </Link>
          )}
          <CardTitle>
            <Link
              href={`/shop/${slug}`}
              className="hover:underline text-base md:text-lg text-primary-800"
            >
              {name}
            </Link>
          </CardTitle>

          <div
            className={`flex md:justify-between flex-col ${hasDiscount ? "" : "md:flex-row"}`}
          >
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-md font-bold text-red-600">
                    {discountedPrice.toFixed(2)} CUP
                  </span>
                  <span className="text-xs text-gray-500 line-through">
                    {priceValue.toFixed(2)} CUP
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold">
                  {priceValue.toFixed(2)} CUP
                </span>
              )}
            </div>

            <div className="text-sm">
              {product.stock === 0 ? (
                <span className="text-red-500 font-semibold">Out of Stock</span>
              ) : product.stock && product.stock < 5 ? (
                <span className="text-yellow-600 font-semibold">
                  Low Stock ({product.stock} left)
                </span>
              ) : (
                <span className="text-green-600">
                  In Stock ({product.stock})
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:justify-between mt-0 gap-y-2">
          <div className="flex items-center gap-x-1 flex-wrap">
            {colorsToShow.length > 0 &&
              colorsToShow.map((color) => (
                <div
                  key={color}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color }}
                />
              ))}
            {remainingColors > 0 && (
              <span className="text-xs text-gray-500 font-medium">
                +{remainingColors}
              </span>
            )}
          </div>
          <div className="flex items-center gap-x-1 flex-wrap">
            {sizesToShow.length > 0 &&
              sizesToShow.map((size) => (
                <span
                  key={size}
                  className="text-xs px-1.5 py-0.5 rounded border border-gray-300 bg-gray-50 text-gray-700"
                >
                  {size}
                </span>
              ))}
            {remainingSizes > 0 && (
              <span className="text-xs text-gray-500 font-medium">
                +{remainingSizes}
              </span>
            )}
          </div>
          {/* <Suspense
            fallback={
              <Button className="rounded-full p-0 h-8 w-8" disabled>
                <Icons.basket className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            }
          >
            <AddToCartButton productId={id} />
          </Suspense> */}
        </div>
      </CardHeader>
    </Card>
  );
}

export default ProductCard;
