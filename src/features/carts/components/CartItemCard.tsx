"use client";
import { DocumentType, gql } from "@/gql";

import Image from "next/image";
import React from "react";

import QuantityInput from "../../../components/layouts/QuantityInput";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { keytoUrl, stripHtml } from "@/lib/utils";
import Link from "next/link";
import { Icons } from "../../../components/layouts/icons";
import { Button } from "../../../components/ui/button";

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

type CartItemCardProps = React.ComponentProps<typeof Card> & {
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
  const hasOptions = selectedColor || selectedSize || selectedMaterial;

  // Calcular el precio con descuento
  const discountValue = product.discount
    ? parseFloat(product.discount.toString())
    : 0;
  const hasDiscount = discountValue > 0;
  const priceValue = parseFloat(product.price.toString());
  const discountedPrice = hasDiscount
    ? priceValue - (priceValue * discountValue) / 100
    : priceValue;

  return (
    <Card className="flex items-center justify-between gap-x-6 gap-y-8 px-5 py-3 shadow-none border-0 border-b">
      <div className="flex items-center gap-x-6">
        <CardContent className="relative p-0 overflow-hidden ">
          <Image
            src={keytoUrl(product.featuredImage.key)}
            alt={product.featuredImage.alt}
            width={150}
            height={150}
            className="aspect-square object-cover rounded-md"
          />
        </CardContent>

        <CardHeader className="p-0 mb-3 md:mb-5 grow max-w-lg">
          <CardTitle>
            <Link href={`/shop/${product.slug}`} className="hover:underline">
              {product.name}
            </Link>
          </CardTitle>

          {hasOptions ? (
            <CardDescription className="grow space-y-1.5 mt-2">
              {selectedColor && (
                <div className="flex items-center gap-x-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">
                    Color:
                  </span>
                  <div className="flex items-center gap-x-1.5">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: selectedColor }}
                      title={selectedColor}
                    />
                    <span className="text-xs text-muted-foreground">
                      {selectedColor}
                    </span>
                  </div>
                </div>
              )}
              {selectedSize && (
                <div className="flex items-center gap-x-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">
                    Talla:
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded border border-gray-300 bg-gray-50 text-gray-700">
                    {selectedSize}
                  </span>
                </div>
              )}
              {selectedMaterial && (
                <div className="flex items-center gap-x-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">
                    Material:
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedMaterial}
                  </span>
                </div>
              )}
            </CardDescription>
          ) : (
            <CardDescription className="grow line-clamp-2">
              {stripHtml(product.description)}
            </CardDescription>
          )}

          <QuantityInput
            value={quantity}
            addOneHandler={addOneHandler}
            minusOneHandler={minusOneHandler}
            disabled={disabled}
          />
        </CardHeader>
      </div>

      <CardFooter className="gap-x-2 md:gap-x-5 p-0 flex-col items-end">
        <div className="flex flex-col items-end gap-1">
          {hasDiscount ? (
            <>
              <p className="text-lg font-bold text-red-600">
                ${discountedPrice.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 line-through">
                ${priceValue.toFixed(2)}
              </p>
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                -{discountValue}%
              </span>
            </>
          ) : (
            <p className="text-lg font-bold">${priceValue.toFixed(2)}</p>
          )}
        </div>

        <Button
          aria-label="Remove Item Button"
          variant="ghost"
          onClick={removeHandler}
        >
          <Icons.trash className="text-destructive" size={20} />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CartItemCard;
