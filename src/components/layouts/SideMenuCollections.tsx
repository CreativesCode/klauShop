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
  onLinkClick,
}: {
  collection: Collection;
  pathname: string;
  level?: number;
  onLinkClick?: () => void;
}) {
  const isActive = pathname === `/collections/${collection.slug}`;
  const hasChildren = collection.children && collection.children.length > 0;

  if (!hasChildren) {
    return (
      <Link
        href={`/collections/${collection.slug}`}
        onClick={onLinkClick}
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-colors",
          isActive
            ? "bg-primary-50 text-primary-700"
            : "text-ink hover:bg-primary-50",
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
          "min-h-11 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-ink hover:no-underline [&[data-state=open]]:bg-primary-50 [&[data-state=open]]:text-primary-700",
          isActive && "bg-primary-50 text-primary-700",
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
            onClick={onLinkClick}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-700 hover:bg-primary-50",
            )}
            style={{ paddingLeft: `${1.5 + level * 0.75}rem` }}
          >
            <Icons.tag className="w-3.5 h-3.5 opacity-60" />
            <span>Ver todo en {collection.label}</span>
          </Link>
          {/* Render children */}
          {collection.children!.map((child) => (
            <CollectionTreeItem
              key={child.id}
              collection={child}
              pathname={pathname}
              level={level + 1}
              onLinkClick={onLinkClick}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

interface SideMenuCollectionsProps {
  collections: Collection[];
  onLinkClick?: () => void;
}

export default function SideMenuCollections({
  collections,
  onLinkClick,
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
            onLinkClick={onLinkClick}
          />
        ))}
      </div>
    </Accordion>
  );
}
