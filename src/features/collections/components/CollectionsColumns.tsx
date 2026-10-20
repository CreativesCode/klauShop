"use client";

import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentType, gql } from "@/gql";
import { ColumnDef } from "@tanstack/react-table";
import { Home, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { DeleteCollectionDialog } from "./admin/DeleteCollectionDialog";

export const CollectionColumnsFragment = gql(/* GraphQL */ `
  fragment CollectionColumnsFragment on collections {
    id
    title
    label
    description
    slug
    parent_id
    show_in_home
    collections {
      id
      label
      title
    }
  }
`);

const CollectionsColumns: ColumnDef<{
  node: DocumentType<typeof CollectionColumnsFragment>;
}>[] = [
  {
    accessorFn: (row) => row.node.label || "",
    accessorKey: "label",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Etiqueta" />
    ),
    cell: ({ row }) => {
      const collection = row.original.node;

      return (
        <Link
          href={`/admin/collections/${collection.id}`}
          className="flex items-center gap-2 text-left font-bold capitalize text-ink hover:text-primary-700"
        >
          {collection.label}
          {collection.show_in_home && (
            <span
              className="inline-flex items-center"
              aria-label="Visible en el inicio"
            >
              <Home className="size-4 text-primary" aria-hidden />
            </span>
          )}
        </Link>
      );
    },
  },
  {
    accessorFn: (row) => row.node.slug || "",
    accessorKey: "slug",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Slug" />
    ),
    cell: ({ row }) => {
      const collection = row.original.node;

      return (
        <div className="text-[13px] text-neutral-500">{collection.slug}</div>
      );
    },
  },
  {
    accessorFn: (row) => row.node.title || "",
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Título" />
    ),
    cell: ({ row }) => {
      const collection = row.original.node;

      return <p className="text-neutral-700">{collection.title}</p>;
    },
  },
  {
    accessorFn: (row) => row.node.collections?.label || "",
    accessorKey: "parent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Padre" />
    ),
    cell: ({ row }) => {
      const collection = row.original.node;

      return (
        <div className="font-medium">
          {collection.collections ? (
            <Link
              href={`/admin/collections/${collection.collections.id}`}
              className="text-left font-semibold capitalize text-neutral-700 hover:text-primary-700"
            >
              {collection.collections.label}
            </Link>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => {
      const collection = row.original.node;

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
              <Link href={`/admin/collections/${collection.id}`}>
                Editar colección
              </Link>
            </DropdownMenuItem>
            <DeleteCollectionDialog
              collectionId={collection.id}
              collectionName={collection.label}
              variant="dropdown"
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default CollectionsColumns;
