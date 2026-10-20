import Header from "@/components/layouts/Header";
import { Shell } from "@/components/layouts/Shell";
import {
  WishlistProducts,
  WishlistProductsSkeleton,
} from "@/features/products";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type Props = {};

function WishListPage({}: Props) {
  return (
    <Shell>
      <Header
        as="h1"
        heading="Tus favoritos"
        className="pt-0"
        action={
          <Link
            href="/shop"
            className="text-sm font-bold text-primary-700 hover:text-primary-800"
          >
            Seguir comprando →
          </Link>
        }
      />
      {/*
      <Suspense fallback={<CartSectionSkeleton />}>
        <CartSection />
      </Suspense> */}

      <Suspense fallback={<WishlistProductsSkeleton />}>
        <WishlistProducts />
      </Suspense>
    </Shell>
  );
}

export default WishListPage;
