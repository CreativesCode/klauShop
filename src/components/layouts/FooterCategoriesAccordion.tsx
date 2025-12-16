"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

interface Category {
  id: string;
  label: string;
  slug: string;
  parent_id: string | null;
  order: number | null;
  children?: Category[];
}

interface FooterCategoriesAccordionProps {
  categories: Category[];
}

// Build hierarchical tree from flat array
function buildCategoryTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>();
  const roots: Category[] = [];

  // Initialize map with all categories
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Build tree structure
  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      const parent = map.get(cat.parent_id)!;
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort by order
  const sortByOrder = (a: Category, b: Category) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    return orderB - orderA; // DESC order
  };

  roots.sort(sortByOrder);
  roots.forEach((root) => {
    if (root.children && root.children.length > 0) {
      root.children.sort(sortByOrder);
    }
  });

  return roots;
}

export default function FooterCategoriesAccordion({
  categories,
}: FooterCategoriesAccordionProps) {
  const rootCategories = buildCategoryTree(categories);

  if (rootCategories.length === 0) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {rootCategories.map((category) => (
        <AccordionItem
          key={category.id}
          value={category.id}
          className="border-b border-primary-200"
        >
          <AccordionTrigger className="text-sm font-semibold text-primary py-3 hover:no-underline">
            {category.label}
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-y-2 pl-2">
              <Link
                href={`/collections/${category.slug}`}
                className="text-sm text-primary-800 hover:text-primary transition-colors"
              >
                Ver todo en {category.label}
              </Link>
              {category.children && category.children.length > 0 && (
                <div className="flex flex-col gap-y-1 mt-1">
                  {category.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/collections/${child.slug}`}
                      className="text-sm text-primary-700 hover:text-primary transition-colors pl-2"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
