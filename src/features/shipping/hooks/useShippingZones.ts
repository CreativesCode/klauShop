"use client";

import { useEffect, useState } from "react";
import type { ShippingZoneOption } from "../utils/matchShippingZone";

/** Active shipping zones for selectors and cost previews. */
export function useShippingZones(enabled: boolean = true) {
  const [zones, setZones] = useState<ShippingZoneOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/shipping-zones");
        const data = await res.json();
        if (!cancelled) setZones((data?.zones ?? []) as ShippingZoneOption[]);
      } catch (e) {
        console.error("Error loading shipping zones:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { zones, isLoading };
}
