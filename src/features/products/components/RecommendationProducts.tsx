"use client";
import Header from "@/components/layouts/Header";
import { ProductCard } from "@/features/products";
import { gql } from "@/gql";
import { useQuery } from "@urql/next";
import React from "react";
import ProductCardSkeleton from "./ProductCardSkeleton";

export type RecommendationProductsProps =
  React.HTMLAttributes<HTMLDivElement> & {};

const RecomendationProductsQuery = gql(/* GraphQL */ `
  query RecomendationProductsQuery($first: Int!) {
    recommendations: productsCollection(
      first: $first
      filter: { stock: { gt: 0 } }
    ) {
      edges {
        node {
          id
          ...ProductCardFragment
        }
      }
    }
  }
`);

function RecommendationProducts({}: RecommendationProductsProps) {
  const [{ data, fetching, error }, refetch] = useQuery({
    query: RecomendationProductsQuery,
    variables: {
      first: 4,
    },
  });

  if (fetching)
    return (
      <Header heading={`Te puede interesar`}>
        <div className="grid grid-cols-products gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
          {[...Array(4)].map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </Header>
    );

  if (!data || error) return <></>;

  return (
    <Header heading={`Te puede interesar`}>
      <div className="grid grid-cols-products gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
        {data.recommendations &&
          data.recommendations.edges.map(({ node }) => (
            <ProductCard key={node.id} product={node} />
          ))}
      </div>
    </Header>
  );
}

export default RecommendationProducts;
