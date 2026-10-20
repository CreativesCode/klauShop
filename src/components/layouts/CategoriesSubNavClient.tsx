"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

interface Collection {
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

// Dropdown width: SubcategoryList (400px) + viewport border
const SUBMENU_WIDTH = 402;

// Component to render subcategories recursively
function SubcategoryList({ categories }: { categories: Collection[] }) {
  return (
    <div className="grid w-[400px] gap-1 p-3">
      {categories.map((category) => (
        <div key={category.id} className="space-y-1">
          <Link
            href={`/collections/${category.slug}`}
            className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-primary-50 hover:text-primary-700 focus:bg-primary-50"
          >
            <div className="text-sm font-bold leading-none">
              {category.label}
            </div>
            {category.title && (
              <p className="line-clamp-2 text-[13px] leading-snug text-neutral-500">
                {category.title}
              </p>
            )}
          </Link>
          {category.children && category.children.length > 0 && (
            <div className="ml-4 border-l-2 border-line pl-3">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/collections/${child.slug}`}
                  className="block select-none rounded-[10px] p-2 text-sm font-semibold leading-none text-neutral-700 no-underline outline-none transition-colors hover:bg-primary-50 hover:text-primary-700"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface CategoriesSubNavClientProps {
  categories: Collection[];
}

function CategoriesSubNavClient({ categories }: CategoriesSubNavClientProps) {
  const categoryTree = buildCategoryTree(categories);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [viewportOffset, setViewportOffset] = React.useState(0);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const handleMouseEnter = (categoryId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveMenu(categoryId);
  };

  // Open the dropdown under the hovered category, kept inside the nav's width
  const placeViewport = (item: HTMLElement) => {
    const root = rootRef.current;
    if (!root) return;
    const rootRect = root.getBoundingClientRect();
    const left = item.getBoundingClientRect().left - rootRect.left;
    setViewportOffset(
      Math.max(0, Math.min(left, rootRect.width - SUBMENU_WIDTH)),
    );
  };

  const handleMouseLeave = () => {
    // Time to move the pointer from the category down to the dropdown
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 300);
  };

  if (categoryTree.length === 0) {
    return null;
  }

  const linkClass = (active: boolean) =>
    cn(
      "inline-flex w-max items-center border-b-2 px-3.5 pb-3 pt-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-ink focus:outline-none focus-visible:text-ink",
      active
        ? "border-primary text-ink"
        : "border-transparent text-neutral-600",
    );

  return (
    // The list scrolls (not the root) so the subcategory dropdown is not clipped
    <div className="-mx-3.5" ref={rootRef}>
      <NavigationMenu
        value={activeMenu || undefined}
        viewportOffset={viewportOffset}
        className="w-full max-w-none justify-start"
      >
        <NavigationMenuList className="min-w-0 justify-start gap-0 overflow-x-auto no-scrollbar">
          <NavigationMenuItem>
            <Link href="/shop" className={linkClass(pathname === "/shop")}>
              Ver todo
            </Link>
          </NavigationMenuItem>
          {categoryTree.map((category) => {
            const isActive = pathname === `/collections/${category.slug}`;
            const isHovered = activeMenu === category.id;
            const hasChildren =
              category.children && category.children.length > 0;

            return (
              <NavigationMenuItem
                key={category.id}
                value={category.id}
                onMouseEnter={(e) => {
                  placeViewport(e.currentTarget);
                  handleMouseEnter(category.id);
                }}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={`/collections/${category.slug}`}
                  className={linkClass(isActive || isHovered)}
                >
                  {category.label}
                </Link>
                {hasChildren && (
                  <NavigationMenuContent
                    onMouseEnter={() => handleMouseEnter(category.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <SubcategoryList categories={category.children!} />
                  </NavigationMenuContent>
                )}
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

export default CategoriesSubNavClient;
