"use client";
import { DocumentType, gql } from "@/gql";
import React, { useRef, useState } from "react";

import { BADGE_LABEL, Badge } from "@/components/ui/badge";
import { BadgeType } from "@/lib/supabase/schema";
import { cn, keytoUrl } from "@/lib/utils";
import Image from "next/image";

type ProductImageShowcaseProps = React.HTMLAttributes<HTMLDivElement> & {
  data: DocumentType<typeof ProductImageShowcaseFragment>;
  name: string;
  badge?: string | null;
  discount?: number;
};

const ProductImageShowcaseFragment = gql(/* GraphQL */ `
  fragment ProductImageShowcaseFragment on products {
    id
    featuredImage: medias {
      id
      key
      alt
    }

    images: product_mediasCollection(orderBy: [{ priority: DescNullsLast }]) {
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
  }
`);

/**
 * Product gallery: swipeable main image (native scroll-snap, works with touch on iOS)
 * plus thumbnails (left column on desktop, row below on mobile).
 */
function ProductImageShowcase({
  data,
  name,
  badge,
  discount = 0,
  className,
}: ProductImageShowcaseProps) {
  const allImages = [
    data.featuredImage,
    ...(data.images?.edges.map(({ node }) => node.media) || []),
  ].filter(
    (image, index, list) =>
      image && list.findIndex((other) => other?.id === image.id) === index,
  );

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    setActiveImageIndex(index);
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== activeImageIndex) setActiveImageIndex(index);
  };

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col-reverse gap-3 md:flex-row",
        className,
      )}
    >
      {allImages.length > 1 && (
        <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto md:max-h-[640px] md:flex-col md:overflow-y-auto md:overflow-x-visible">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ver imagen ${index + 1}`}
              aria-current={activeImageIndex === index}
              className={cn(
                "relative h-[90px] w-[72px] shrink-0 overflow-hidden rounded-xl border-2 bg-surface-tint transition-colors",
                activeImageIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-line",
              )}
            >
              <Image
                src={keytoUrl(image.key)}
                alt=""
                fill
                sizes="72px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div className="relative min-w-0 flex-1">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-3xl bg-surface-tint"
        >
          {allImages.map((image, index) => (
            <div
              key={image.id}
              className="relative h-full w-full shrink-0 snap-center"
            >
              <Image
                src={keytoUrl(image.key)}
                alt={image.alt || name}
                fill
                // LCP image of the product page: load it first, at the rendered width
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 620px"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {(badge || discount > 0) && (
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {badge && (
              <Badge variant={badge as BadgeType}>
                {BADGE_LABEL[badge] ?? "Destacado"}
              </Badge>
            )}
            {discount > 0 && <Badge variant="discount">-{discount}%</Badge>}
          </div>
        )}

        {allImages.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
            {allImages.map((image, index) => (
              <span
                key={image.id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === activeImageIndex
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/60",
                )}
                aria-hidden
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductImageShowcase;
