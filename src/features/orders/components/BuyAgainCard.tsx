"use client";
import { DocumentType, gql } from "@/gql";
import { formatCUP, keytoUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";

type BuyAgainCardProps = {
  products: DocumentType<typeof BuyAgainCardFragment>[];
};

export const BuyAgainCardFragment = gql(/* GraphQL */ `
  fragment BuyAgainCardFragment on productsEdge {
    node {
      id
      featured
      price
      discount
      name
      slug
      description
      featuredImage: medias {
        id
        key
        alt
      }
    }
  }
`);

function BuyAgainCard({ products }: BuyAgainCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-[15px] font-extrabold text-ink">
          Te puede interesar
        </h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-3.5">
        {products.map(({ node }) => {
          const discountValue = node.discount
            ? parseFloat(node.discount.toString())
            : 0;
          const hasDiscount = discountValue > 0;
          const priceValue = parseFloat(node.price.toString());
          const discountedPrice = hasDiscount
            ? priceValue - (priceValue * discountValue) / 100
            : priceValue;

          return (
            <div key={node.id} className="flex gap-3">
              <span className="relative h-[60px] w-12 shrink-0 overflow-hidden rounded-[10px] bg-surface-tint">
                <Image
                  fill
                  sizes="48px"
                  src={keytoUrl(node.featuredImage.key)}
                  alt={node.featuredImage.alt || node.name}
                  className="object-cover"
                />
              </span>

              <div className="flex min-w-0 flex-col gap-1">
                <Link
                  href={"/shop/" + node.slug}
                  className="line-clamp-2 text-sm font-semibold text-ink hover:text-primary"
                >
                  {node.name}
                </Link>
                <div className="flex items-baseline gap-2 tabular-nums">
                  <p className="text-sm font-extrabold text-ink">
                    {formatCUP(discountedPrice)}
                  </p>
                  {hasDiscount && (
                    <p className="text-xs text-neutral-500 line-through">
                      {formatCUP(priceValue)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default BuyAgainCard;
