"use client";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/products";
import type { ProductCardImage } from "@/features/products/components/ProductCard";
import { gql } from "@/gql";
import { SearchQuery, SearchQueryVariables } from "@/gql/graphql";
import { useQuery } from "@urql/next";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
          { stock: { gt: 0 } }
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
  // The query variable holds the normalized term; show what the customer typed
  const searchParams = useSearchParams();

  // Out-of-stock products are filtered on the server: one request per page
  const [result, reexecuteQuery] = useQuery<SearchQuery, SearchQueryVariables>({
    query: ProductSearch,
    variables,
  });

  const { data, fetching, error } = result;
  const products = data?.productsCollection;
  const edges = useMemo(() => products?.edges ?? [], [products]);
  const pageInfo = products?.pageInfo ?? null;
  const isOffline = !!error?.networkError;

  const retry = useCallback(
    () => reexecuteQuery({ requestPolicy: "network-only" }),
    [reexecuteQuery],
  );

  // Flaky connections: retry by itself as soon as the browser is back online
  useEffect(() => {
    if (!isOffline) return;
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [isOffline, retry]);

  const inStockEdges = edges;

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
    // Hover images are useless on touch screens: save the request and the bytes
    if (!window.matchMedia("(hover: hover)").matches) return;

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
    !isOffline &&
    !error.graphQLErrors?.every((e) =>
      e.message.toLowerCase().includes("product_medias"),
    );

  return (
    <div>
      {shouldShowError && (
        <p>No se pudieron cargar los productos. Inténtalo de nuevo.</p>
      )}

      {isOffline && (
        <div className="w-full flex flex-col items-center gap-2 py-5">
          <p className="text-sm text-muted-foreground">Sin conexión.</p>
          <Button variant="outline" onClick={retry} disabled={fetching}>
            Reintentar
          </Button>
        </div>
      )}

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

          {isLastPage && pageInfo?.hasNextPage && (
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
