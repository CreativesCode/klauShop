// Client-safe exports. The server resolver lives in
// "@/features/shipping/utils/resolveShippingZone" (imports the DB client).
export { ShippingZoneSelect } from "./components/ShippingZoneSelect";
export type { ShippingZoneValue } from "./components/ShippingZoneSelect";
export { useShippingZones } from "./hooks/useShippingZones";
export { getZoneCost, matchShippingZone } from "./utils/matchShippingZone";
export type { ShippingZoneOption } from "./utils/matchShippingZone";
