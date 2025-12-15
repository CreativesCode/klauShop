"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "./icons";

export interface Collection {
  id: string;
  label: string;
  slug: string;
  title: string;
  parent_id: string | null;
  order: number | null;
  children?: Collection[];
}

// Build hierarchical tree from flat array
function buildCategoryTree(collections: Collection[]): Collection[] {
  const map = new Map<string, Collection>();
  const roots: Collection[] = [];

  // Initialize map with all collections
  collections.forEach((col) => {
    map.set(col.id, { ...col, children: [] });
  });

  // Build tree structure
  collections.forEach((col) => {
    const node = map.get(col.id)!;
    if (col.parent_id && map.has(col.parent_id)) {
      const parent = map.get(col.parent_id)!;
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort by order
  const sortByOrder = (a: Collection, b: Collection) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    return orderB - orderA; // DESC order
  };

  roots.sort(sortByOrder);
  roots.forEach((root) => {
    if (root.children && root.children.length > 0) {
      root.children.sort(sortByOrder);
      // Sort nested children recursively
      root.children.forEach((child) => {
        if (child.children && child.children.length > 0) {
          child.children.sort(sortByOrder);
        }
      });
    }
  });

  return roots;
}

// Component to render collections recursively
function CollectionTreeItem({
  collection,
  pathname,
  level = 0,
}: {
  collection: Collection;
  pathname: string;
  level?: number;
}) {
  const isActive = pathname === `/collections/${collection.slug}`;
  const hasChildren = collection.children && collection.children.length > 0;

  if (!hasChildren) {
    return (
      <Link
        href={`/collections/${collection.slug}`}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm md:text-base transition-colors",
          isActive
            ? "bg-primary-100 text-primary font-semibold"
            : "hover:bg-primary-50 text-foreground",
        )}
        style={{ paddingLeft: `${1 + level * 0.75}rem` }}
      >
        <Icons.tag className="w-4 h-4 opacity-60" />
        <span>{collection.label}</span>
      </Link>
    );
  }

  return (
    <AccordionItem value={collection.id} className="border-none">
      <AccordionTrigger
        className={cn(
          "px-4 py-2.5 rounded-lg text-sm md:text-base font-medium hover:no-underline [&[data-state=open]]:bg-primary-50 [&[data-state=open]]:text-primary",
          isActive && "bg-primary-100 text-primary",
        )}
        style={{ paddingLeft: `${1 + level * 0.75}rem` }}
      >
        <div className="flex items-center gap-2">
          <Icons.folder className="w-4 h-4 opacity-60" />
          <span>{collection.label}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-0">
        <div className="space-y-1">
          {/* Link to parent collection */}
          <Link
            href={`/collections/${collection.slug}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-primary-100 text-primary font-semibold"
                : "hover:bg-primary-50 text-foreground",
            )}
            style={{ paddingLeft: `${1.5 + level * 0.75}rem` }}
          >
            <Icons.tag className="w-3.5 h-3.5 opacity-60" />
            <span className="text-xs md:text-sm">
              Ver todo en {collection.label}
            </span>
          </Link>
          {/* Render children */}
          {collection.children!.map((child) => (
            <CollectionTreeItem
              key={child.id}
              collection={child}
              pathname={pathname}
              level={level + 1}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

interface SideMenuCollectionsProps {
  collections: Collection[];
}

export default function SideMenuCollections({
  collections,
}: SideMenuCollectionsProps) {
  const pathname = usePathname();

  if (!collections || collections.length === 0) {
    return null;
  }

  const categoryTree = buildCategoryTree(collections);

  if (categoryTree.length === 0) {
    return null;
  }

  return (
    <Accordion type="multiple" className="w-full">
      <div className="space-y-1">
        {categoryTree.map((collection) => (
          <CollectionTreeItem
            key={collection.id}
            collection={collection}
            pathname={pathname}
          />
        ))}
      </div>
    </Accordion>
  );
}
