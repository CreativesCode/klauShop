"use client";
import { useEffect, useState } from "react";
import { checkAvailableStock } from "../api";

/**
 * Available stock of a product (physical stock minus active reservations).
 * Stock is tracked per product, so variants do not change it: one request per product.
 */
export function useAvailableStock(productId: string, enabled: boolean = true) {
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setAvailableStock(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchStock() {
      try {
        setIsLoading(true);
        setError(null);

        // Solo queremos saber cuánto stock hay disponible
        const result = await checkAvailableStock(productId, 1);

        if (!cancelled) setAvailableStock(result.availableStock);
      } catch (err) {
        console.error("Error fetching stock:", err);
        if (!cancelled) {
          setError("No se pudo obtener el stock disponible");
          setAvailableStock(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchStock();

    return () => {
      cancelled = true;
    };
  }, [productId, enabled]);

  return { availableStock, isLoading, error };
}
