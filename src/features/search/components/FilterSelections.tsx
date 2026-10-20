"use client";
import { useCallback, useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SelectCollection } from "@/lib/supabase/schema";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Icons } from "@/components/layouts/icons";
import { cn } from "@/lib/utils";
import PriceRange from "@/components/ui/PriceRange";
import { useDebounce } from "@/features/cms/hooks/use-debounce";
import CollectionsSelection from "@/features/search/components/CollectionsSelection";
import { SearchQuery } from "@/features/search/hooks/useSearchStore";
import { SortEnum } from "@/validations/products";
import React from "react";
import FilterBadges from "./FilterBadges";
import SortSelection from "./SortSelection";

type Props = {
  collectionsSection?: SelectCollection[];
  shopLayout?: boolean;
};

const DEFAULT_PRICE_RANGE: [number, number] = [0, 10000];

function parsePriceRangeParam(
  param: string | null,
): [number, number] | undefined {
  if (!param) return undefined;
  const parts = param.split("-");
  if (parts.length !== 2) return undefined;
  const min = Number(parts[0]?.trim());
  const max = Number(parts[1]?.trim());
  if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
  return min <= max ? [min, max] : [max, min];
}

function FilterSelections({ collectionsSection, shopLayout = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const [query, setQuery] = useState<SearchQuery>({
    collections: [],
  });

  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const range = parsePriceRangeParam(searchParams.get("price_range"));

    const collections =
      (JSON.parse(searchParams.get("collections")) as string[]) ?? [];
    const sort = searchParams.get("sort") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    setQuery({
      sort: sort ? SortEnum[sort] : undefined,
      priceRange: range,
      collections,
      search,
    });
  }, [searchParams]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const removeQueryString = useCallback(
    (name: string, value?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      console.log("name", name);
      value ? params.set(name, value) : params.delete(name);
      return params.toString();
    },
    [searchParams],
  );

  const debouncedPrice = useDebounce(
    query.priceRange ?? DEFAULT_PRICE_RANGE,
    500,
  );

  React.useEffect(() => {
    const [min, max] = debouncedPrice;
    startTransition(() => {
      const isDefault =
        min === DEFAULT_PRICE_RANGE[0] && max === DEFAULT_PRICE_RANGE[1];
      const shouldRemove = query.priceRange === undefined || isDefault;

      const qs = shouldRemove
        ? removeQueryString("price_range")
        : createQueryString("price_range", `${min}-${max}`);

      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }, [
    debouncedPrice,
    pathname,
    router,
    startTransition,
    createQueryString,
    removeQueryString,
    query.priceRange,
  ]);

  const collectionChangeHandler = (collectionId: string) => {
    const oldValue = query.collections ?? [];

    if (oldValue.includes(collectionId)) {
      const collections = oldValue.filter((item) => item !== collectionId);
      setQuery({ ...query, collections });
      router.push(
        pathname +
          "?" +
          createQueryString("collections", JSON.stringify(collections)),
      );
    } else {
      const collections = [...oldValue, collectionId];
      setQuery({ ...query, collections });
      router.push(
        pathname +
          "?" +
          removeQueryString(
            "collections",
            collections.length > 0 ? JSON.stringify(collections) : undefined,
          ),
      );
    }
  };

  const chip =
    "inline-flex h-10 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 text-sm font-bold text-ink transition-colors hover:border-ink data-[state=open]:border-ink";

  const priceRange = (
    <PriceRange
      label={"Rango de precios (CUP)"}
      defaultValue={query.priceRange}
      value={query.priceRange}
      onMinChange={(data) => {
        const currentRange = query.priceRange ?? [0, 10000];
        setQuery({
          ...query,
          priceRange: [data, currentRange[1]],
        });
      }}
      onMaxChange={(data) => {
        const currentRange = query.priceRange ?? [0, 10000];
        setQuery({
          ...query,
          priceRange: [currentRange[0], data],
        });
      }}
      onValueChange={(priceRange) => setQuery({ ...query, priceRange })}
      onReset={() => {
        setQuery({ ...query, priceRange: undefined });
        startTransition(() => {
          const qs = removeQueryString("price_range");
          router.push(qs ? `${pathname}?${qs}` : pathname);
        });
      }}
    />
  );

  const sort = (
    <SortSelection
      id="sort"
      disabled={isLoading}
      onValueChange={(sort) => {
        setQuery({ ...query, sort: SortEnum[sort] });
        router.push(`${pathname}?${createQueryString("sort", sort)}`);
      }}
      defaultValue={query.sort}
      items={Object.entries(SortEnum).map(([key, value]) => ({
        value: key,
        label: value,
      }))}
      placeholder="Ordenar"
    />
  );

  return (
    <>
      <section className="hidden items-center justify-between gap-4 md:flex">
        <div className="flex flex-wrap items-center gap-2">
          {shopLayout && (
            <CollectionsSelection
              className={chip}
              value={query.collections}
              onCheckedChange={collectionChangeHandler}
              selections={collectionsSection}
            />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className={chip}>
              Precio
              <Icons.chevronDown className="size-4" aria-hidden />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="max-w-xl rounded-[18px] p-5">
              <DropdownMenuLabel>Rango de precios (CUP)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {priceRange}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="sort"
            className="text-nowrap text-sm font-semibold text-neutral-500"
          >
            Ordenar por
          </label>
          {sort}
        </div>
      </section>

      <Sheet>
        <SheetTrigger className={cn(chip, "w-fit md:hidden")}>
          <Icons.layoutGrid className="size-4" aria-hidden />
          Filtros y orden
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-[24px] px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-6"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription asChild>
              <div className="flex flex-col items-stretch gap-5 pt-2 text-ink">
                {shopLayout && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-bold">Categorías</span>
                    <CollectionsSelection
                      className={cn(chip, "w-fit")}
                      value={query.collections}
                      onCheckedChange={collectionChangeHandler}
                      selections={collectionsSection}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold">Rango de precios</span>
                  {priceRange}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="sort" className="text-sm font-bold">
                    Ordenar por
                  </label>
                  {sort}
                </div>
              </div>
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <FilterBadges
        query={query}
        collections={collectionsSection}
        onDeleteHandler={removeQueryString}
      />
    </>
  );
}

export default FilterSelections;
