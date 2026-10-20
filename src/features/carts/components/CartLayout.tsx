import { Icons } from "@/components/layouts/icons";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCUP } from "@/lib/utils";
import Link from "next/link";
import { ReactNode } from "react";

export type CartVariant = "page" | "drawer";

export type CartSectionProps = {
  variant?: CartVariant;
  /** /cart?checkout=1 (from the drawer): open the delivery form on arrival */
  autoOpenCheckout?: boolean;
};

type CartLayoutProps = {
  productCount: number;
  subtotal: number;
  /** Lines of the cart (CartItemCard list) */
  children: ReactNode;
  /** The checkout button (WhatsAppCheckoutButton): rendered once. Page only. */
  checkout: ReactNode;
  variant?: CartVariant;
};

/**
 * Cart page: lines on the left, summary on the right (sticky).
 * On phones the same summary element becomes a fixed bottom bar, so the
 * checkout button (and its dialog state) exists only once.
 */
export function CartLayout({
  productCount,
  subtotal,
  children,
  checkout,
  variant = "page",
}: CartLayoutProps) {
  if (variant === "drawer") {
    return (
      <section aria-label="Carrito" className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5">{children}</div>
        <footer className="flex flex-col gap-3 border-t border-line bg-surface-hover px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-600">
                Subtotal · {productCount} producto
                {productCount === 1 ? "" : "s"}
              </dt>
              <dd className="font-bold tabular-nums text-ink">
                {formatCUP(subtotal)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-600">Envío</dt>
              <dd className="text-right font-bold text-accent-700">
                Según tu zona
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
              <dt className="text-lg font-extrabold text-ink">Total</dt>
              <dd className="text-lg font-extrabold tabular-nums text-ink">
                {formatCUP(subtotal)}
                <span className="text-sm font-bold text-neutral-500">
                  {" "}
                  + envío
                </span>
              </dd>
            </div>
          </dl>
          {/* The checkout runs on /cart: same tested flow (iOS WhatsApp hand-off) */}
          <Link
            href="/cart?checkout=1"
            className={cn(
              buttonVariants({ size: "xl", elevated: true }),
              "w-full",
            )}
          >
            <Icons.whatsapp className="size-5" aria-hidden />
            Hacer pedido por WhatsApp
          </Link>
          <Link
            href="/cart"
            className="text-center text-sm font-bold text-primary-700 hover:text-primary-800"
          >
            Ver carrito completo
          </Link>
          <p className="text-center text-xs text-neutral-500">
            El pago se coordina por WhatsApp, fuera de la tienda.
          </p>
        </footer>
      </section>
    );
  }

  return (
    <section
      aria-label="Carrito"
      className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_360px] lg:gap-8"
    >
      <div className="rounded-[18px] border border-line bg-white px-4 md:px-5">
        {children}
      </div>

      <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur md:sticky md:top-[150px] md:rounded-[18px] md:border md:bg-surface-hover md:p-5 md:backdrop-blur-none">
        <h2 className="mb-3 hidden text-[15px] font-extrabold text-ink md:block">
          Resumen
        </h2>
        <dl className="hidden flex-col gap-2 text-sm md:flex">
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-600">
              Subtotal · {productCount} producto{productCount === 1 ? "" : "s"}
            </dt>
            <dd className="font-bold tabular-nums text-ink">
              {formatCUP(subtotal)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-600">Envío</dt>
            <dd className="text-right font-bold text-accent-700">
              Según tu zona
            </dd>
          </div>
        </dl>

        <div className="flex items-center gap-3 md:mt-4 md:flex-col md:items-stretch md:gap-3 md:border-t md:border-line md:pt-4">
          <div className="shrink-0 whitespace-nowrap md:flex md:items-baseline md:justify-between">
            <p className="text-xs font-semibold text-neutral-500 md:text-[15px] md:font-extrabold md:text-ink">
              Total
              <span className="md:hidden"> + envío</span>
            </p>
            <p className="text-[17px] font-extrabold tabular-nums text-ink md:text-lg">
              {formatCUP(subtotal)}
              <span className="hidden text-sm font-bold text-neutral-500 md:inline">
                {" "}
                + envío
              </span>
            </p>
          </div>
          <div className="min-w-0 flex-1 md:flex-none">{checkout}</div>
        </div>

        <p className="mt-3 hidden text-center text-xs text-neutral-500 md:block">
          El pago se coordina por WhatsApp, fuera de la tienda.
        </p>
      </aside>
    </section>
  );
}

/** Loading state shared by the guest and user carts */
export function CartSkeleton({ variant = "page" }: { variant?: CartVariant }) {
  const lines = (
    <div
      className={cn(
        variant === "page" &&
          "rounded-[18px] border border-line bg-white px-4 md:px-5",
        variant === "drawer" && "px-5",
      )}
    >
      {[...Array(3)].map((_, index) => (
        <div
          className="flex gap-3.5 border-b border-line-soft py-3.5 last:border-b-0"
          key={index}
        >
          <Skeleton className="h-24 w-[76px] rounded-xl" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="mt-4 h-9 w-[104px] rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  if (variant === "drawer")
    return <div aria-label="Cargando carrito">{lines}</div>;

  return (
    <section
      className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_360px] lg:gap-8"
      aria-label="Cargando carrito"
    >
      {lines}
      <Skeleton className="hidden h-[240px] rounded-[18px] md:block" />
    </section>
  );
}

export default CartLayout;
