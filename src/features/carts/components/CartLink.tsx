import { Icons } from "@/components/layouts/icons";
import { cn } from "@/lib/utils";
import Link from "next/link";

type CartLinkProps = {
  productCount: number;
  /** pill: dark "Carrito" button (desktop header); icon: 44px icon (mobile) */
  variant?: "pill" | "icon";
};

function CartLink({ productCount, variant = "pill" }: CartLinkProps) {
  const label =
    productCount > 0 ? `Carrito, ${productCount} productos` : "Carrito";
  const count = (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-accent font-extrabold tabular-nums text-ink transition-transform duration-200",
        variant === "pill"
          ? "h-[22px] min-w-[22px] px-1.5 text-xs"
          : "absolute right-0.5 top-0.5 h-[18px] min-w-[18px] px-1 text-[11px]",
        productCount === 0 && "scale-0",
      )}
      aria-hidden
    >
      {productCount}
    </span>
  );

  if (variant === "icon") {
    return (
      <Link
        href="/cart"
        aria-label={label}
        className="relative flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-muted"
      >
        <Icons.store className="size-[22px]" aria-hidden />
        {count}
      </Link>
    );
  }

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="flex h-11 items-center gap-2 rounded-full bg-ink pl-4 pr-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-950"
    >
      <Icons.store className="size-[18px]" aria-hidden />
      Carrito
      {count}
    </Link>
  );
}

export default CartLink;
