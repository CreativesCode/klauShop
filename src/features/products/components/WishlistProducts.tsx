"use client";
import { ProductCard, ProductCardFragment } from "@/features/products";
import { DocumentType, gql } from "@/gql";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@urql/next";
import React, { useEffect } from "react";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

export type WishlistProductsProps = React.HTMLAttributes<HTMLDivElement> & {};

const WishlistProductsQuery = gql(/* GraphQL */ `
  query WishlistProductsQuery($user_id: UUID) {
    wishlistCollection(filter: { user_id: { eq: $user_id } }) {
      edges {
        node {
          product_id
          products {
            id
            ...ProductCardFragment
          }
        }
      }
    }
  }
`);

function WishlistProducts({}: WishlistProductsProps) {
  const { user } = useAuth();

  const [{ data, fetching, error }, refetch] = useQuery({
    query: WishlistProductsQuery,
    variables: {
      user_id: user?.id || null,
    },
    pause: !user, // Pausar la query si no hay usuario
    requestPolicy: "network-only", // Forzar recarga cada vez que se entra a la vista
  });

  // Recargar datos cuando el componente se monta o cuando el usuario cambia
  useEffect(() => {
    if (user) {
      refetch({ requestPolicy: "network-only" });
    }
  }, [user, refetch]);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Please sign in to view your wishlist.
        </p>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="grid grid-cols-products gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
        {[...Array(4)].map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading wishlist: {error.message}</p>
      </div>
    );
  }

  const wishlistProducts =
    data?.wishlistCollection?.edges
      ?.map((edge) => edge.node.products)
      .filter(
        (product): product is DocumentType<typeof ProductCardFragment> =>
          product !== null && product !== undefined,
      ) || [];

  if (wishlistProducts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Your wishlist is empty. Start adding products you love!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-products gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
      {wishlistProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default WishlistProducts;
