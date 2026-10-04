"use client";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/products";
import type { ProductCardImage } from "@/features/products/components/ProductCard";
import { gql } from "@/gql";
import { SearchQuery, SearchQueryVariables } from "@/gql/graphql";
import { useQuery } from "@urql/next";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import SearchProductsGridSkeleton from "./SearchProductsGridSkeleton";

const ProductSearch = gql(/* GraphQL */ `
  query Search(
    $search: String
    $lower: BigFloat
    $upper: BigFloat
    $collections: [String!]
    $first: Int!
    $after: Cursor
    $orderBy: [productsOrderBy!]
  ) {
    productsCollection(
      filter: {
        and: [
          { search_name: { ilike: $search } }
          { price: { gte: $lower, lte: $upper } }
          { collection_id: { in: $collections } }
        ]
      }
      first: $first
      after: $after
      orderBy: $orderBy
    ) {
      edges {
        node {
          id

          ...ProductCardFragment
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

const SearchResultPage = ({
  variables,
  onLoadMore,
  isLastPage,
}: {
  variables: SearchQueryVariables;
  onLoadMore: (cursor: string) => void;
  isLastPage: boolean;
}) => {
  const MAX_AUTOFILL_PAGES = 20;
  // The query variable holds the normalized term; show what the customer typed
  const searchParams = useSearchParams();

  const variablesKey = useMemo(() => {
    // We intentionally exclude `after` because this component manages it
    // internally to "autofill" in-stock products.
    const { after: _after, ...rest } = variables as any;
    return JSON.stringify(rest);
  }, [variables]);

  const [after, setAfter] = useState<SearchQueryVariables["after"]>(
    variables.after,
  );
  const [accEdges, setAccEdges] = useState<
    NonNullable<SearchQuery["productsCollection"]>["edges"]
  >([]);
  const [pageInfo, setPageInfo] = useState<
    NonNullable<SearchQuery["productsCollection"]>["pageInfo"] | null
  >(null);

  const autoFillPagesCountRef = useRef(0);
  const lastProcessedCursorRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset when search/filter params change (new "page" context)
    setAfter(variables.after);
    setAccEdges([]);
    setPageInfo(null);
    autoFillPagesCountRef.current = 0;
    lastProcessedCursorRef.current = null;
  }, [variablesKey, variables.after]);

  const queryVariables = useMemo(
    () => ({
      ...variables,
      after,
    }),
    [variables, after],
  );

  const [result] = useQuery<SearchQuery, SearchQueryVariables>({
    query: ProductSearch,
    variables: queryVariables,
  });

  const { data, fetching, error } = result;

  const products = data?.productsCollection;
  const targetCount = variables.first ?? 0;

  useEffect(() => {
    if (!products) return;

    const cursor = products.pageInfo?.endCursor ?? null;
    if (cursor && lastProcessedCursorRef.current === cursor) return;
    lastProcessedCursorRef.current = cursor;

    const incomingInStock = (products.edges ?? []).filter(
      ({ node }) => (node.stock ?? 0) > 0,
    );

    let nextCount = accEdges.length;
    setAccEdges((prev) => {
      if (incomingInStock.length === 0) return prev;
      const seen = new Set(prev.map((e) => e.node.id));
      const next = [...prev];
      for (const e of incomingInStock) {
        if (!seen.has(e.node.id)) next.push(e);
      }
      nextCount = next.length;
      return next;
    });

    setPageInfo(products.pageInfo);

    // Autocomplete: if we filtered out-of-stock items, keep fetching
    // subsequent cursor pages until we fill `first` (or run out).
    if (
      targetCount > 0 &&
      nextCount < targetCount &&
      products.pageInfo.hasNextPage &&
      products.pageInfo.endCursor &&
      autoFillPagesCountRef.current < MAX_AUTOFILL_PAGES
    ) {
      autoFillPagesCountRef.current += 1;
      setAfter(products.pageInfo.endCursor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const inStockEdges = accEdges.slice(0, Math.max(0, targetCount));

  const productIds = useMemo(
    () => inStockEdges.map(({ node }) => node.id).filter(Boolean),
    [inStockEdges],
  );

  const productIdsKey = useMemo(() => productIds.join(","), [productIds]);

  const [hoverByProductId, setHoverByProductId] = useState<
    Record<string, ProductCardImage | null>
  >({});

  useEffect(() => {
    if (productIds.length === 0) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/products/additional-images?productIds=${encodeURIComponent(
            productIds.join(","),
          )}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const json = (await res.json()) as Record<
          string,
          { id: string; key: string; alt: string }[]
        >;

        const next: Record<string, ProductCardImage | null> = {};
        for (const [productId, medias] of Object.entries(json)) {
          // first additional image is used as hover image
          next[productId] = medias?.[0]
            ? { key: medias[0].key, alt: medias[0].alt }
            : null;
        }

        setHoverByProductId((prev) => ({ ...prev, ...next }));
      } catch (e) {
        // ignore abort / network errors: hover image is optional
      }
    })();

    return () => controller.abort();
  }, [productIdsKey]);

  const shouldShowError =
    !!error &&
    !error.graphQLErrors?.every((e) =>
      e.message.toLowerCase().includes("product_medias"),
    );

  const isAutoFilling =
    fetching &&
    targetCount > 0 &&
    inStockEdges.length < targetCount &&
    (pageInfo?.hasNextPage ?? false);

  return (
    <div>
      {shouldShowError && <p>Oh no... {error.message}</p>}

      {fetching && inStockEdges.length === 0 && <SearchProductsGridSkeleton />}

      {(products || inStockEdges.length > 0) && (
        <>
          {!fetching && inStockEdges.length === 0 && (
            <p>
              {`No encontramos productos con el nombre `}
              <span className="font-bold">{searchParams.get("search")}</span>
              {"."}
            </p>
          )}
          <section className="grid grid-cols-2 lg:grid-cols-4 w-full gap-y-8 gap-x-3 py-5">
            {inStockEdges.map(({ node }) => (
              <ProductCard
                key={node.id}
                product={node}
                hoverImage={hoverByProductId[node.id]}
              />
            ))}
          </section>

          {isLastPage && !isAutoFilling && pageInfo?.hasNextPage && (
            <div className="w-full flex justify-center items-center mt-3">
              <Button
                onClick={() => {
                  if (!pageInfo?.endCursor) return;
                  onLoadMore(pageInfo.endCursor);
                }}
              >
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResultPage;
