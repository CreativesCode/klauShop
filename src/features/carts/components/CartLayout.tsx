import { formatCUP } from "@/lib/utils";
import { ReactNode } from "react";

type CartLayoutProps = {
  productCount: number;
  subtotal: number;
  /** Lines of the cart (CartItemCard list) */
  children: ReactNode;
  /** The checkout button (WhatsAppCheckoutButton): rendered once */
  checkout: ReactNode;
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
}: CartLayoutProps) {
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

export default CartLayout;
