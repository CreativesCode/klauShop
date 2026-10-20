"use client";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard, ProductCardFragment } from "@/features/products";
import { DocumentType, gql } from "@/gql";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@urql/next";
import Link from "next/link";
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
      <div className="flex flex-col items-center gap-4 rounded-[18px] border border-line bg-white px-6 py-12 text-center">
        <p className="text-[15px] text-neutral-500">
          Inicia sesión para guardar y ver tus favoritos.
        </p>
        <Link
          href="/sign-in?redirect=/wish-list"
          className={buttonVariants({ size: "lg" })}
        >
          Entrar
        </Link>
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
      <div className="py-12 text-center">
        <p className="text-[15px] font-semibold text-red-700">
          No pudimos cargar tus favoritos. Revisa tu conexión.
        </p>
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
      <div className="flex flex-col items-center gap-4 rounded-[18px] border border-line bg-white px-6 py-12 text-center">
        <p className="text-[15px] text-neutral-500">
          Aún no tienes favoritos. Toca el corazón de un producto para guardarlo
          aquí.
        </p>
        <Link href="/shop" className={buttonVariants({ size: "lg" })}>
          Ver novedades
        </Link>
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
