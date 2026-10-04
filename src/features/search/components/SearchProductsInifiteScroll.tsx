"use client";
import { OrderByDirection, SearchQueryVariables } from "@/gql/graphql";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SearchResultPage from "./SearchResultPage";

const DEFAULT_PRICE_RANGE: [number, number] = [0, 10000];

// Without a price filter no bound is sent: products above the slider max must still show
function parsePriceRangeParam(param: string | null): [number, number] {
  if (!param) return DEFAULT_PRICE_RANGE;
  const parts = param.split("-");
  if (parts.length !== 2) return DEFAULT_PRICE_RANGE;
  const min = Number(parts[0]?.trim());
  const max = Number(parts[1]?.trim());
  if (!Number.isFinite(min) || !Number.isFinite(max))
    return DEFAULT_PRICE_RANGE;
  return min <= max ? [min, max] : [max, min];
}

interface SearchProductsInifiteScrollProps {
  collectionId?: string;
  collectionIds?: string[];
}

function SearchProductsInifiteScroll({
  collectionId,
  collectionIds,
}: SearchProductsInifiteScrollProps) {
  const searchParams = useSearchParams();

  // `useSearchParams()` can keep the same object reference between navigations.
  // Using a string key guarantees we react to actual param changes.
  const searchParamsKey = searchParams.toString();

  const collectionIdsKey = useMemo(
    () =>
      collectionIds && collectionIds.length > 0 ? collectionIds.join(",") : "",
    [collectionIds],
  );

  const baseVariables = useMemo(
    () =>
      searchParamsVariablesFactory(searchParams, collectionId, collectionIds),
    [searchParamsKey, collectionId, collectionIdsKey],
  );

  const baseVariablesKey = useMemo(
    () => JSON.stringify(baseVariables),
    [baseVariables],
  );

  // Keep pages as cursors; variables are derived from current filters.
  const [cursors, setCursors] = useState<Array<string | undefined>>([
    undefined,
  ]);

  useEffect(() => {
    // Reset paging when filters/search params change.
    setCursors([undefined]);
  }, [baseVariablesKey]);

  const loadMoreHandler = (after: string) => {
    setCursors((prev) => [...prev, after]);
  };

  return (
    <section>
      {cursors.map((after, i) => (
        <SearchResultPage
          key={`${i}:${after ?? "first"}`}
          variables={{
            ...baseVariables,
            after,
            first: i === 0 ? 16 : 24,
          }}
          isLastPage={i === cursors.length - 1}
          onLoadMore={loadMoreHandler}
        />
      ))}
    </section>
  );
}

export default SearchProductsInifiteScroll;

const searchParamsVariablesFactory = (
  searchParams: ReadonlyURLSearchParams,
  collectionId?: string,
  collectionIds?: string[],
) => {
  const priceRangeParam = searchParams.get("price_range");
  const [minPrice, maxPrice] = parsePriceRangeParam(priceRangeParam);
  const collections =
    (JSON.parse(searchParams.get("collections") || "null") as string[]) ?? [];
  const sort = searchParams.get("sort") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  let orderBy = undefined;

  switch (sort) {
    case "BEST_MATCH":
      orderBy = [
        { featured: OrderByDirection["DescNullsFirst"] },
        { created_at: OrderByDirection["DescNullsLast"] },
      ];
      break;
    case "PRICE_LOW_TO_HIGH":
      orderBy = [{ price: OrderByDirection["AscNullsLast"] }];
      break;
    case "PRICE_HIGH_TO_LOW":
      orderBy = [{ price: OrderByDirection["DescNullsLast"] }];
      break;
    case "NEWEST":
      orderBy = [{ created_at: OrderByDirection["DescNullsLast"] }];
      break;
    case "NAME_ASCE":
      orderBy = [{ name: OrderByDirection["AscNullsLast"] }];

      break;
    default:
      orderBy = undefined;
  }

  const varaibles: SearchQueryVariables = {
    search: search ? `%${search.trim()}%` : "%%",
    // Backend expects BigFloat inputs as string values. The slider max means "no upper limit".
    lower: priceRangeParam && minPrice > 0 ? String(minPrice) : undefined,
    upper:
      priceRangeParam && maxPrice < DEFAULT_PRICE_RANGE[1]
        ? String(maxPrice)
        : undefined,
    collections:
      collectionIds && collectionIds.length > 0
        ? collectionIds
        : collectionId
          ? [collectionId]
          : collections && collections.length > 0
            ? collections
            : undefined,
    orderBy,
    first: 16,
    after: undefined,
  };
  return varaibles;
};
