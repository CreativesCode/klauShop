export type ShippingZoneOption = {
  id: string;
  name: string;
  cost: string;
};

const normalize = (s: string) => s.trim().toLowerCase();

// Pickup in store: no shipping (cost 0). The WhatsApp SQL functions (drizzle/0019) compare
// orders.zone with this exact name, so change both together.
export const PICKUP_ZONE_NAME = "Recogida en tienda";
// Zone name saved when the customer picks "otra zona" without typing where.
export const TO_AGREE_ZONE_NAME = "Por acordar";

export const isPickupZone = (zoneName?: string | null) =>
  normalize(zoneName ?? "") === normalize(PICKUP_ZONE_NAME);

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

/**
 * Shipping cost for a (zoneId, zoneName) selection: the zone cost, 0 for pickup in store,
 * or null when it must be agreed over WhatsApp (unregistered zone).
 */
export function getShippingCostFor<
  T extends { id: string; name: string; cost: string },
>(
  zones: T[],
  value: { zoneId?: string | null; zoneName?: string | null },
): number | null {
  const zone = matchShippingZone(zones, value);
  if (zone) return getZoneCost(zone);
  return isPickupZone(value.zoneName) ? 0 : null;
}
