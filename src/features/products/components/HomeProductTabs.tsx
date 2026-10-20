"use client";

import { DocumentType } from "@/gql";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ProductCard, ProductCardFragment } from "./ProductCard";

type Product = DocumentType<typeof ProductCardFragment>;

const MAX_PRODUCTS = 8;

const TABS = [
  { id: "all", label: "Todo" },
  { id: "new", label: "Novedades" },
  { id: "sale", label: "Ofertas" },
  { id: "best", label: "Más vendidos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function filterProducts(products: Product[], tab: TabId) {
  switch (tab) {
    case "new":
      return products.filter((p) => p.badge === "new_product");
    case "sale":
      return products.filter((p) => Number(p.discount || 0) > 0);
    case "best":
      return products.filter((p) => p.badge === "best_sale");
    default:
      return products;
  }
}

/** Home "Te encantarán": a single products grid with segmented filters. */
export function HomeProductTabs({
  products,
  title,
  description,
}: {
  products: Product[];
  title: string;
  description?: string;
}) {
  const [tab, setTab] = useState<TabId>("all");
  const shown = filterProducts(products, tab).slice(0, MAX_PRODUCTS);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[clamp(22px,2.2vw,30px)] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-1.5 text-[15px] text-neutral-500">{description}</p>
          )}
        </div>
        <div
          role="tablist"
          aria-label="Filtrar productos"
          className="no-scrollbar -mx-4 flex max-w-[calc(100%+2rem)] overflow-x-auto px-4 md:mx-0 md:max-w-full md:px-0"
        >
          <div className="flex shrink-0 rounded-full bg-surface-tint p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "h-[38px] whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors",
                  tab === t.id
                    ? "bg-white text-ink shadow-seg"
                    : "text-neutral-500 hover:text-ink",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-products gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
        {shown.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {shown.length === 0 && (
        <p className="py-12 text-center text-[15px] text-neutral-500">
          No hay productos en esta sección por ahora.
        </p>
      )}
    </>
  );
}

export default HomeProductTabs;
