import CartSection from "@/features/carts/components/CartSection";
import CartSectionSkeleton from "@/features/carts/components/CartSectionSkeleton";
import {
  RecommendationProducts,
  RecommendationProductsSkeleton,
} from "@/features/products";

import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function CartPage() {
  return (
    <div className="mx-auto max-w-store px-4 pt-6 md:px-6 md:pt-10 xl:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[clamp(24px,2.6vw,34px)] font-extrabold tracking-[-0.02em] text-ink">
          Tu carrito
        </h1>
        <Link
          href="/shop"
          className="text-sm font-bold text-primary-700 hover:text-primary-800"
        >
          Seguir comprando →
        </Link>
      </div>

      <Suspense fallback={<CartSectionSkeleton />}>
        <CartSection />
      </Suspense>

      <Suspense fallback={<RecommendationProductsSkeleton />}>
        <RecommendationProducts />
      </Suspense>
    </div>
  );
}

export default CartPage;
