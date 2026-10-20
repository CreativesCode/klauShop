"use client";
import { DocumentType, gql } from "@/gql";

import Image from "next/image";
import React from "react";

import QuantityInput from "../../../components/layouts/QuantityInput";

import { colorName } from "@/lib/colorName";
import { formatCUP, keytoUrl, stripHtml } from "@/lib/utils";
import Link from "next/link";
import { Icons } from "../../../components/layouts/icons";
import { getDiscountedUnitPrice } from "@/features/orders/utils/pricing";

export const CartItemCardFragment = gql(/* GraphQL */ `
  fragment CartItemCardFragment on products {
    id
    slug
    name
    price
    discount
    description
    featuredImage: medias {
      id
      key
      alt
    }
  }
`);

type CartItemCardProps = React.HTMLAttributes<HTMLDivElement> & {
  product: DocumentType<typeof CartItemCardFragment>;
  disabled?: boolean;
  addOneHandler: () => void;
  minusOneHandler: () => void;
  removeHandler: () => void;
  quantity: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedMaterial?: string | null;
};

function CartItemCard({
  product,
  disabled,
  addOneHandler,
  minusOneHandler,
  removeHandler,
  quantity,
  selectedColor,
  selectedSize,
  selectedMaterial,
}: CartItemCardProps) {
  // Calcular el precio con descuento
  const discountValue = product.discount
    ? parseFloat(product.discount.toString())
    : 0;
  const hasDiscount = discountValue > 0;
  const priceValue = parseFloat(product.price.toString());
  // Same per-unit rounding as the server (order_lines.price)
  const discountedPrice = getDiscountedUnitPrice(priceValue, discountValue);

  const variant = [
    selectedSize && `Talla ${selectedSize}`,
    selectedColor && colorName(selectedColor),
    selectedMaterial,
  ].filter(Boolean);

  return (
    <div className="flex gap-3.5 border-b border-line-soft py-3.5 last:border-b-0">
      <Link
        href={`/shop/${product.slug}`}
        className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-xl bg-surface-tint"
      >
        <Image
          src={keytoUrl(product.featuredImage.key)}
          alt={product.featuredImage.alt || product.name}
          fill
          sizes="76px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start gap-2">
          <Link
            href={`/shop/${product.slug}`}
            className="line-clamp-2 flex-1 text-sm font-bold text-ink hover:text-primary"
          >
            {product.name}
          </Link>
          <button
            type="button"
            onClick={removeHandler}
            disabled={disabled}
            aria-label={`Quitar ${product.name} del carrito`}
            className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
          >
            <Icons.trash2 className="size-[18px]" aria-hidden />
          </button>
        </div>

        {variant.length > 0 ? (
          <p className="flex items-center gap-1.5 text-[13px] text-neutral-500">
            {selectedColor && (
              <span
                className="size-3 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: selectedColor }}
                aria-hidden
              />
            )}
            <span className="truncate first-letter:uppercase">
              {variant.join(" · ")}
            </span>
          </p>
        ) : (
          <p className="line-clamp-1 text-[13px] text-neutral-500">
            {stripHtml(product.description)}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <QuantityInput
            size="sm"
            value={quantity}
            addOneHandler={addOneHandler}
            minusOneHandler={minusOneHandler}
            disabled={disabled}
            maxValue={8}
          />
          <div className="text-right tabular-nums">
            <p className="text-[15px] font-extrabold text-ink">
              {formatCUP(discountedPrice * quantity)}
            </p>
            {(quantity > 1 || hasDiscount) && (
              <p className="text-xs text-neutral-500">
                {formatCUP(discountedPrice)} c/u
                {hasDiscount && (
                  <span className="ml-1 font-bold text-accent-700">
                    -{discountValue}%
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartItemCard;
