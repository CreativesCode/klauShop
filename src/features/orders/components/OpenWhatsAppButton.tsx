"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";
import { generateWhatsAppUrl } from "../utils/whatsapp";

// Key where the checkout leaves the full wa.me URL of a just-created order
export const getWhatsAppUrlStorageKey = (orderId: string) =>
  `wa_url_${orderId}`;

type OpenWhatsAppButtonProps = {
  orderId: string;
  orderNumber: string;
};

/**
 * Plain link the customer taps to send the order over WhatsApp.
 * iOS Safari blocks window.open after an await, so the confirmation page must offer
 * a real tap target. Falls back to a short message when the full one is not stored
 * (other tab/device).
 */
export function OpenWhatsAppButton({
  orderId,
  orderNumber,
}: OpenWhatsAppButtonProps) {
  const [href, setHref] = useState(() =>
    generateWhatsAppUrl(`Hola, acabo de hacer el pedido *${orderNumber}*.`),
  );

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(getWhatsAppUrlStorageKey(orderId));
      if (stored) setHref(stored);
    } catch {
      // Storage unavailable (private mode): keep the short message
    }
  }, [orderId]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ size: "lg" }),
        "w-full h-14 text-base bg-[#25D366] hover:bg-[#1ebe5b] text-white",
      )}
    >
      <Image
        src="/assets/whatsapp.svg"
        alt=""
        width={20}
        height={20}
        className="mr-2 h-5 w-5"
      />
      Enviar pedido por WhatsApp
    </a>
  );
}

export default OpenWhatsAppButton;
