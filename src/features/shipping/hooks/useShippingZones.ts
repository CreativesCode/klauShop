"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShippingZoneOption } from "../utils/matchShippingZone";

const STORAGE_KEY = "shipping_zones_cache";
// Stale zones are only shown while the fresh list loads (the server resolves the real cost)
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000;

// One request per page load, shared by every consumer (checkout button + zone select)
let zonesPromise: Promise<ShippingZoneOption[]> | null = null;

function readStoredZones(): ShippingZoneOption[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Date.now() - saved.savedAt < STORAGE_TTL_MS) {
      return Array.isArray(saved.zones) ? saved.zones : [];
    }
  } catch {
    // Storage unavailable or corrupt: fall back to the network
  }
  return [];
}

function fetchZones(): Promise<ShippingZoneOption[]> {
  if (!zonesPromise) {
    zonesPromise = fetch("/api/shipping-zones")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const zones = (data?.zones ?? []) as ShippingZoneOption[];
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ zones, savedAt: Date.now() }),
          );
        } catch {
          // Storage unavailable: the in-memory promise still dedupes requests
        }
        return zones;
      })
      .catch((error) => {
        zonesPromise = null; // let the next consumer (or retry) try again
        throw error;
      });
  }
  return zonesPromise;
}

/** Active shipping zones for selectors and cost previews. */
export function useShippingZones(enabled: boolean = true) {
  const [zones, setZones] = useState<ShippingZoneOption[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const stored = readStoredZones();
    if (stored.length) setZones(stored);
    // With cached zones the UI is usable right away; the fresh list replaces them
    setIsLoading(stored.length === 0);
    setError(false);

    fetchZones()
      .then((fresh) => {
        if (!cancelled) setZones(fresh);
      })
      .catch((e) => {
        console.error("Error loading shipping zones:", e);
        if (!cancelled && !stored.length) setError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { zones, isLoading, error, retry };
}
