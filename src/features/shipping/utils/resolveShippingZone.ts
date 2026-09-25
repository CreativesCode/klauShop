import db from "@/lib/supabase/db";
import { shippingZones } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { getZoneCost, matchShippingZone } from "./matchShippingZone";

export type ResolvedShipping = {
  shippingZoneId: string | null;
  zoneName: string;
  // null = unregistered zone: the admin sets the cost later ("por definir")
  shippingCost: number | null;
};

/**
 * Server-side source of truth for the shipping zone and its cost.
 * Never trust a cost sent by the client: it is always read from shipping_zones.
 */
export async function resolveShippingZone(
  executor: Pick<typeof db, "select">,
  value: { zoneId?: string | null; zoneName: string },
): Promise<ResolvedShipping> {
  const activeZones = await executor
    .select({
      id: shippingZones.id,
      name: shippingZones.name,
      cost: shippingZones.cost,
    })
    .from(shippingZones)
    .where(eq(shippingZones.isActive, true));

  const zone = matchShippingZone(activeZones, value);

  if (!zone) {
    return {
      shippingZoneId: null,
      zoneName: value.zoneName.trim(),
      shippingCost: null,
    };
  }

  return {
    shippingZoneId: zone.id,
    zoneName: zone.name,
    shippingCost: getZoneCost(zone),
  };
}
