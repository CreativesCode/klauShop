"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const MIN_INTERVAL_MS = 15_000;

/**
 * Re-fetches the server-rendered page when the customer comes back to the tab, so an order
 * status changed by the admin shows up without a manual reload. No polling: no data is spent
 * while the tab is in the background (slow, metered connections).
 */
export function RefreshOnFocus() {
  const router = useRouter();
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefresh.current < MIN_INTERVAL_MS) return;
      lastRefresh.current = Date.now();
      router.refresh();
    };

    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);

  return null;
}

export default RefreshOnFocus;
