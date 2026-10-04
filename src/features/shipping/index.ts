// Client-safe exports. The server resolver lives in
// "@/features/shipping/utils/resolveShippingZone" (imports the DB client).
export { ShippingZoneSelect } from "./components/ShippingZoneSelect";
export type { ShippingZoneValue } from "./components/ShippingZoneSelect";
export { useShippingZones } from "./hooks/useShippingZones";
export {
  PICKUP_ZONE_NAME,
  TO_AGREE_ZONE_NAME,
  getShippingCostFor,
  getZoneCost,
  isPickupZone,
  matchShippingZone,
} from "./utils/matchShippingZone";
export type { ShippingZoneOption } from "./utils/matchShippingZone";
