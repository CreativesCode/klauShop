"use client";

import { Icons } from "@/components/layouts/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import useCartActions from "../hooks/useCartActions";

type Props = {
  productId: string;
  slug: string;
  // Color/size/material must be chosen on the product page
  hasVariants: boolean;
  className?: string;
};

const base =
  "flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-ink/90 text-[13px] font-bold text-white backdrop-blur transition-colors hover:bg-primary";

/** "Añadir al carrito" overlay of the product card image. */
function QuickAddButton({ productId, slug, hasVariants, className }: Props) {
  const { user } = useAuth();
  const { addProductToCart, isLoading } = useCartActions(user, productId);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(t);
  }, [added]);

  if (hasVariants) {
    return (
      <Link href={`/shop/${slug}`} className={cn(base, className)}>
        <Icons.add className="size-4" aria-hidden />
        Elegir opciones
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={async () => {
        if (await addProductToCart(1)) setAdded(true);
      }}
      className={cn(base, "disabled:opacity-70", className)}
    >
      {added ? (
        <>
          Añadido
          <Icons.circleCheck className="size-4" aria-hidden />
        </>
      ) : (
        <>
          <Icons.add className="size-4" aria-hidden />
          Añadir al carrito
        </>
      )}
    </button>
  );
}

export default QuickAddButton;
