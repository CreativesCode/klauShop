"use client";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/products";
import type { ProductCardImage } from "@/features/products/components/ProductCard";
import { gql } from "@/gql";
import { SearchQuery, SearchQueryVariables } from "@/gql/graphql";
import { useQuery } from "@urql/next";
import { useEffect, useMemo, useState } from "react";
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
          { name: { ilike: $search } }
          { price: { gt: $lower, lt: $upper } }
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
  const [result] = useQuery<SearchQuery, SearchQueryVariables>({
    query: ProductSearch,
    variables,
  });

  const { data, fetching, error } = result;

  const products = data?.productsCollection;

  const productIds = useMemo(
    () => (products?.edges ?? []).map(({ node }) => node.id).filter(Boolean),
    [products?.edges],
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

  return (
    <div>
      {shouldShowError && <p>Oh no... {error.message}</p>}

      {fetching && <SearchProductsGridSkeleton />}

      {products && (
        <>
          {products.edges.length === 0 && (
            <p>
              {`There is no Products with name `}
              <span className="font-bold">
                {(variables.search || []).slice(1, -2)}
              </span>
              {"."}
            </p>
          )}
          <section className="grid grid-cols-2 lg:grid-cols-4 w-full gap-y-8 gap-x-3 py-5">
            {products.edges.map(({ node }) => (
              <ProductCard
                key={node.id}
                product={node}
                hoverImage={hoverByProductId[node.id]}
              />
            ))}
          </section>

          {isLastPage && products.pageInfo.hasNextPage && (
            <div className="w-full flex justify-center items-center mt-3">
              <Button onClick={() => onLoadMore(products.pageInfo.endCursor)}>
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
