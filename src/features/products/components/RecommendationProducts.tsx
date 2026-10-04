"use client";
import Header from "@/components/layouts/Header";
import { ProductCard } from "@/features/products";
import { gql } from "@/gql";
import { useQuery } from "@urql/next";
import React from "react";
import ProductCardSkeleton from "./RecommendationProductsSkeleton";

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4">
          {[...Array(6)].map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </Header>
    );

  if (!data || error) return <></>;

  return (
    <Header heading={`Te puede interesar`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4">
        {data.recommendations &&
          data.recommendations.edges.map(({ node }) => (
            <ProductCard key={node.id} product={node} />
          ))}
      </div>
    </Header>
  );
}

export default RecommendationProducts;
