import { Shell } from "@/components/layouts/Shell";
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
    <Shell className="max-w-screen-2xl mx-auto">
      <section className="flex justify-between items-center py-8">
        <h1 className="text-3xl">Tu carrito</h1>
        <Link href="/shop">Continuar comprando</Link>
      </section>

      <Suspense fallback={<CartSectionSkeleton />}>
        <CartSection />
      </Suspense>

      <Suspense fallback={<RecommendationProductsSkeleton />}>
        <RecommendationProducts />
      </Suspense>
    </Shell>
  );
}

export default CartPage;
