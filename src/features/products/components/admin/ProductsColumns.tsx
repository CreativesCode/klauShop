"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentType, gql } from "@/gql";
import { formatCUP, keytoUrl } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, ImageOff, MoreHorizontal, XCircle } from "lucide-react";
import Image from "next/image";
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
    colors
    sizes
    materials
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
    accessorFn: (row) => row.node.featuredImage?.key || "",
    accessorKey: "image",
    header: () => <span className="sr-only">Imagen</span>,
    cell: ({ row }) => {
      const product = row.original.node;
      const imageKey = product.featuredImage?.key;

      return (
        <div className="flex">
          {imageKey ? (
            <div className="relative h-[55px] w-11 overflow-hidden rounded-lg bg-surface-tint">
              <Image
                src={keytoUrl(imageKey)}
                alt={product.featuredImage?.alt || product.name}
                fill
                className="object-cover"
                sizes="44px"
              />
            </div>
          ) : (
            <div className="flex h-[55px] w-11 items-center justify-center rounded-lg bg-surface-soft text-neutral-400">
              <ImageOff className="size-4" aria-hidden />
              <span className="sr-only">Sin imagen</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.node.name,
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre" />
    ),
    cell: ({ row }) => {
      const product = row.original.node;

      const hasDiscount =
        product.discount && parseFloat(product.discount.toString()) > 0;

      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/admin/products/${product.id}`}
            className="font-bold text-ink hover:text-primary-700"
          >
            {product.name}
          </Link>
          {hasDiscount && (
            <Badge variant="discount">
              -{parseFloat(product.discount.toString()).toFixed(0)}%
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.node.slug,
    accessorKey: "slug",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Slug" />
    ),
    cell: ({ row }) => {
      const product = row.original.node;

      return <div className="text-[13px] text-neutral-500">{product.slug}</div>;
    },
  },
  {
    accessorFn: (row) => row.node.collections?.label || "",
    accessorKey: "Collection",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Colección" />
    ),
    cell: ({ row }) => {
      const product = row.original.node;

      return (
        <div className="text-neutral-700">
          {product.collections ? product.collections.label : "—"}
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.node.featured,
    accessorKey: "featured",
    header: ({ column }) => (
      <div className="text-center">
        <DataTableColumnHeader column={column} title="Destacado" />
      </div>
    ),
    cell: ({ row }) => {
      const product = row.original.node;
      const isFeatured = product.featured;

      return (
        <div className="flex justify-center">
          {isFeatured ? (
            <CheckCircle2 className="size-5 text-emerald-600" aria-label="Sí" />
          ) : (
            <XCircle className="size-5 text-neutral-300" aria-label="No" />
          )}
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.node.show_in_slider,
    accessorKey: "showInSlider",
    header: ({ column }) => (
      <div className="text-center">
        <DataTableColumnHeader column={column} title="Slider" />
      </div>
    ),
    cell: ({ row }) => {
      const product = row.original.node;
      const showInSlider = product.show_in_slider;

      return (
        <div className="flex justify-center">
          {showInSlider ? (
            <CheckCircle2 className="size-5 text-emerald-600" aria-label="Sí" />
          ) : (
            <XCircle className="size-5 text-neutral-300" aria-label="No" />
          )}
        </div>
      );
    },
  },
  {
    accessorFn: (row) => {
      const priceValue = parseFloat(row.node.price?.toString() || "0");
      const discountValue = row.node.discount
        ? parseFloat(row.node.discount.toString())
        : 0;
      return discountValue > 0
        ? priceValue - (priceValue * discountValue) / 100
        : priceValue;
    },
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Precio" />
    ),
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
              <div className="text-xs text-neutral-500 line-through">
                {formatCUP(priceValue)}
              </div>
              <div className="font-extrabold tabular-nums text-ink">
                {formatCUP(finalPrice)}
              </div>
            </>
          ) : (
            <div className="font-extrabold tabular-nums text-ink">
              {formatCUP(priceValue)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.node.stock ?? 0,
    accessorKey: "stock",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock" />
    ),
    cell: ({ row }) => {
      const product = row.original.node;
      const stockValue = product.stock ?? 0;
      return (
        <div
          className={
            stockValue <= 0
              ? "font-bold text-red-700"
              : stockValue < 5
                ? "font-bold text-amber-700"
                : "font-semibold tabular-nums text-neutral-700"
          }
        >
          {stockValue <= 0 ? "Sin stock" : stockValue}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => {
      const product = row.original.node;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="iconAdmin">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${product.id}`}>
                Editar producto
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
