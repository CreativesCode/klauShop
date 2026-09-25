export type ShippingZoneOption = {
  id: string;
  name: string;
  cost: string;
};

const normalize = (s: string) => s.trim().toLowerCase();

/**
 * Finds the registered zone for a (zoneId, zoneName) pair.
 * The id wins; the name is a fallback for legacy data saved before
 * shipping_zone_id existed (and for guests with an old saved address).
 * Returns null for unregistered zones ("Otro").
 */
export function matchShippingZone<T extends { id: string; name: string }>(
  zones: T[],
  value: { zoneId?: string | null; zoneName?: string | null },
): T | null {
  if (value.zoneId) {
    const byId = zones.find((z) => z.id === value.zoneId);
    if (byId) return byId;
  }

  const name = normalize(value.zoneName ?? "");
  if (!name) return null;
  return zones.find((z) => normalize(z.name) === name) ?? null;
}

/** Parsed cost of a zone, or null when it is not a valid number. */
export function getZoneCost(zone: { cost: string } | null): number | null {
  if (!zone) return null;
  const n = Number(zone.cost);
  return Number.isFinite(n) ? n : null;
}
