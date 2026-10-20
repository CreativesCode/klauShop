"use client";
import { Icons } from "@/components/layouts/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import useWishlistStore from "../useWishlistStore";

/** Header favorites link with a violet counter. */
function WishlistNavLink() {
  const count = useWishlistStore((s) => Object.keys(s.wishlist).length);
  // The store is persisted in localStorage: render the count only after hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const shown = mounted ? count : 0;

  return (
    <Link
      href="/wish-list"
      aria-label={shown > 0 ? `Favoritos, ${shown}` : "Favoritos"}
      className="relative flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-muted"
    >
      <Icons.heart className="size-[20px]" aria-hidden />
      {shown > 0 && (
        <span
          className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-extrabold tabular-nums text-white"
          aria-hidden
        >
          {shown}
        </span>
      )}
    </Link>
  );
}

export default WishlistNavLink;
