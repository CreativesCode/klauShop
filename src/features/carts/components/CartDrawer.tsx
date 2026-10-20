"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCartDrawer } from "../hooks/useCartDrawer";
import CartSection from "./CartSection";

/**
 * Right-side cart panel. Checkout itself stays on /cart (the WhatsApp flow is
 * tuned for iOS there): the drawer's main button goes to /cart?checkout=1,
 * which opens the delivery form right away.
 */
export function CartDrawer() {
  const { open, setOpen } = useCartDrawer();
  const pathname = usePathname();
  const { dismiss } = useToast();
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  // On opening only: "Producto agregado" toasts would cover the checkout button
  useEffect(() => {
    if (open) dismissRef.current();
  }, [open]);

  // Any navigation (product link, "Ver novedades", checkout) closes the panel
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]"
      >
        <header className="flex min-h-[80px] items-center border-b border-line-soft px-5 py-[18px] pr-16">
          <SheetTitle>Tu carrito</SheetTitle>
          <SheetDescription className="sr-only">
            Productos de tu carrito y total del pedido
          </SheetDescription>
        </header>
        {/* Mounted only while open: no cart requests for closed panels */}
        {open && (
          <div className="flex min-h-0 flex-1 flex-col">
            <CartSection variant="drawer" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default CartDrawer;
