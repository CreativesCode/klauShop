"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentType, gql } from "@/gql";
import { formatPrice } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, MoreHorizontal, Tag, XCircle } from "lucide-react";
import Link from "next/link";
import { DeleteProductDialog } from "./DeleteProductDialog";

export const ProductColumnFragment = gql(/* GraphQL */ `
  fragment ProductColumnFragment on products {
    id
    name
    description
    rating
    slug
    badge
    price
    discount
    stock
    badge
    featured
    show_in_slider
    featuredImage: medias {
      id
      key
      alt
    }
    collections {
      id
      label
      slug
    }
  }
`);

const ProductsColumns: ColumnDef<{
  node: DocumentType<typeof ProductColumnFragment>;
}>[] = [
  {
    accessorKey: "name",
    header: () => <div className="text-left capitalize">Nombre</div>,
    cell: ({ row }) => {
      const product = row.original.node;

      const hasDiscount =
        product.discount && parseFloat(product.discount.toString()) > 0;

      return (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/products/${product.id}`}
            className="text-center font-medium capitalize hover:underline"
          >
            {product.name}
          </Link>
          {hasDiscount && (
            <Badge className="bg-orange-500 text-white hover:bg-orange-600 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {parseFloat(product.discount.toString()).toFixed(0)}%
            </Badge>
          )}
          {(product.stock ?? 0) <= 0 ? (
            <Badge className="bg-red-600 text-white hover:bg-red-600">
              Sin stock
            </Badge>
          ) : (product.stock ?? 0) < 5 ? (
            <Badge className="bg-yellow-500 text-black hover:bg-yellow-500">
              Stock bajo
            </Badge>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "slug",
    header: () => <div className="">Slug</div>,
    cell: ({ row }) => {
      const product = row.original.node;

      return <div className="font-medium">{product.slug}</div>;
    },
  },
  {
    accessorKey: "Collection",
    header: () => <div className="">Colección</div>,
    cell: ({ row }) => {
      const product = row.original.node;

      return (
        <div className="font-medium">
          {product.collections ? product.collections.label : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "featured",
    header: () => <div className="text-center">Dest</div>,
    cell: ({ row }) => {
      const product = row.original.node;
      const isFeatured = product.featured;

      return (
        <div className="flex justify-center">
          {isFeatured ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-gray-400" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "showInSlider",
    header: () => <div className="text-center">Slid</div>,
    cell: ({ row }) => {
      const product = row.original.node;
      const showInSlider = product.show_in_slider;

      return (
        <div className="flex justify-center">
          {showInSlider ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-gray-400" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: () => <div className="">Precio</div>,
    cell: ({ row }) => {
      const product = row.original.node;
      const priceValue = parseFloat(product.price?.toString() || "0");
      const discountValue = product.discount
        ? parseFloat(product.discount.toString())
        : 0;
      const hasDiscount = discountValue > 0;
      const finalPrice = hasDiscount
        ? priceValue - (priceValue * discountValue) / 100
        : priceValue;

      return (
        <div className="flex flex-col gap-1">
          {hasDiscount ? (
            <>
              <div className="font-medium text-xs sm:text-base text-gray-500 line-through">
                {formatPrice(priceValue)}
              </div>
              <div className="font-bold text-xs sm:text-base text-green-600 dark:text-green-400">
                {formatPrice(finalPrice)}
              </div>
            </>
          ) : (
            <div className="font-medium text-xs sm:text-base">
              {formatPrice(priceValue)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "stock",
    header: () => <div className="">Stock</div>,
    cell: ({ row }) => {
      const product = row.original.node;
      const stockValue = product.stock ?? 0;
      const stockColor =
        stockValue === 0
          ? "text-red-500"
          : stockValue < 5
            ? "text-yellow-500"
            : "text-green-500";

      return <div className={`font-medium ${stockColor}`}>{stockValue}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center capitalize">Acc</div>,
    cell: ({ row }) => {
      const product = row.original.node;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${product.id}`}>
                Editar Producto
              </Link>
            </DropdownMenuItem>
            <DeleteProductDialog
              productId={product.id}
              productName={product.name}
              variant="dropdown"
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default ProductsColumns;
