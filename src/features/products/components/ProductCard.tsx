import { DocumentType, gql } from "@/gql";
import { cn, formatCUP, keytoUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";

import { Icons } from "@/components/layouts/icons";
import { BADGE_LABEL, Badge } from "@/components/ui/badge";
import { QuickAddButton } from "@/features/carts";
import { AddToWishListButton } from "@/features/wishlists";
import { BadgeType } from "@/lib/supabase/schema";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

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

// Product grids: 2 columns on phones, 3 on tablets, 4 on desktop
export const PRODUCT_CARD_SIZES =
  "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw";

function getStockInfo(stock: number | null | undefined) {
  if (stock === 0) return { label: "Agotado", className: "text-red-700" };
  if (stock !== null && stock !== undefined && stock <= 1)
    return { label: "Última unidad", className: "text-accent-700" };
  if (stock !== null && stock !== undefined && stock < 5)
    return { label: `Quedan ${stock}`, className: "text-accent-700" };
  return { label: "En stock", className: "text-emerald-700" };
}

export function ProductCard({
  className,
  product,
  hoverImage,
  ...props
}: ProductCardProps) {
  const { name, slug, featuredImage, badge, price, discount, images, stock } =
    product;

  // Obtener la categoría principal (primera colección)
  const mainCategory = product.collections ?? null;

  // Obtener la segunda imagen si existe
  const secondImage = hoverImage ?? images?.edges?.[0]?.node?.media;
  const hasMultipleImages = !!secondImage;

  // Normalizar los colores y sizes (pueden venir como array o string JSON)
  const normalizedSizes = normalizeToArray(product.sizes);
  // Variants must be chosen on the product page before adding to the cart
  const hasVariants =
    normalizedSizes.length > 0 ||
    normalizeToArray(product.colors).length > 0 ||
    normalizeToArray(product.materials).length > 0;

  // Calcular el precio con descuento
  const discountValue = discount ? parseFloat(discount.toString()) : 0;
  const hasDiscount = discountValue > 0;
  const priceValue = parseFloat(price.toString());
  const discountedPrice = hasDiscount
    ? priceValue - (priceValue * discountValue) / 100
    : priceValue;

  const stockInfo = getStockInfo(stock);

  const imageClass =
    "object-cover object-center transition-[transform,opacity] [transition-duration:600ms] ease-soft group-hover:scale-[1.04] motion-reduce:transform-none";

  return (
    <div
      className={cn("group flex min-w-0 flex-col gap-3", className)}
      {...props}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-surface-tint">
        <Link
          href={`/shop/${slug}`}
          className="absolute inset-0"
          aria-label={name}
          tabIndex={-1}
        >
          <Image
            src={keytoUrl(featuredImage.key)}
            alt={featuredImage.alt || name}
            fill
            sizes={PRODUCT_CARD_SIZES}
            className={cn(
              imageClass,
              hasMultipleImages &&
                "[@media(hover:hover)]:group-hover:opacity-0",
            )}
          />
          {/* Segunda imagen que aparece en hover */}
          {hasMultipleImages && secondImage && (
            <Image
              src={keytoUrl(secondImage.key)}
              alt={secondImage.alt || featuredImage.alt || name}
              fill
              sizes={PRODUCT_CARD_SIZES}
              // Hidden (and so never downloaded, it is lazy) on touch screens without hover
              className={cn(
                imageClass,
                "hidden opacity-0 group-hover:opacity-100 [@media(hover:hover)]:block",
              )}
            />
          )}
        </Link>

        {(badge || hasDiscount) && (
          <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {badge && (
              <Badge variant={badge as BadgeType}>
                {BADGE_LABEL[badge] ?? "Destacado"}
              </Badge>
            )}
            {hasDiscount && <Badge variant="discount">-{discountValue}%</Badge>}
          </div>
        )}

        <div className="absolute right-2 top-2 z-10">
          <Suspense
            fallback={
              <span className="flex size-10 items-center justify-center rounded-full bg-white/90">
                <Icons.heart className="size-[19px]" aria-hidden />
              </span>
            }
          >
            <AddToWishListButton productId={product.id} />
          </Suspense>
        </div>

        {stock !== 0 && (
          <QuickAddButton
            productId={product.id}
            slug={slug}
            hasVariants={hasVariants}
            // Always visible on touch screens; on hover devices it shows on hover/focus
            className="absolute inset-x-2 bottom-2 z-10 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        {mainCategory && (
          <Link
            href={`/collections/${mainCategory.slug}`}
            className="truncate text-xs font-semibold uppercase tracking-[.06em] text-neutral-500 hover:text-primary-700"
          >
            {mainCategory.label}
          </Link>
        )}
        <Link
          href={`/shop/${slug}`}
          className="line-clamp-2 text-[15px] font-semibold leading-[1.35] text-ink hover:text-primary"
        >
          {name}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <span className="whitespace-nowrap text-base font-extrabold text-ink">
            {formatCUP(discountedPrice)}
          </span>
          {hasDiscount && (
            <span className="whitespace-nowrap text-[13px] text-neutral-500 line-through">
              {formatCUP(priceValue)}
            </span>
          )}
        </div>
        <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold">
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full bg-current",
              stockInfo.className,
            )}
            aria-hidden
          />
          <span className={cn("whitespace-nowrap", stockInfo.className)}>
            {stockInfo.label}
          </span>
          {normalizedSizes.length > 0 && (
            <span className="truncate font-medium text-neutral-500">
              · Tallas {normalizedSizes.join(" · ")}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export default ProductCard;
