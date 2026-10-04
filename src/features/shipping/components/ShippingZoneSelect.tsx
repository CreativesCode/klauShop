"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useShippingZones } from "../hooks/useShippingZones";
import {
  PICKUP_ZONE_NAME,
  TO_AGREE_ZONE_NAME,
  getZoneCost,
  isPickupZone,
  matchShippingZone,
} from "../utils/matchShippingZone";

const OTHER_VALUE = "__other__";
const PICKUP_VALUE = "__pickup__";

export type ShippingZoneValue = {
  zoneId: string | null;
  zoneName: string;
};

type ShippingZoneSelectProps = {
  value: ShippingZoneValue;
  onChange: (value: ShippingZoneValue) => void;
  disabled?: boolean;
  // Saved addresses are for delivery, so they hide "Recoger en tienda"
  allowPickup?: boolean;
};

// Initial option before zones load: pickup, "otra zona" (free text) or nothing chosen yet
function getInitialSelectValue(value: ShippingZoneValue, allowPickup: boolean) {
  if (allowPickup && !value.zoneId && isPickupZone(value.zoneName)) {
    return PICKUP_VALUE;
  }
  if (value.zoneId) return value.zoneId;
  return value.zoneName.trim() ? OTHER_VALUE : "";
}

const getTypedZone = (zoneName: string) =>
  zoneName === TO_AGREE_ZONE_NAME || isPickupZone(zoneName) ? "" : zoneName;

/**
 * Zone picker shared by checkout, saved addresses and admin order creation.
 * Registered zones carry their id and cost; "Recoger en tienda" means no shipping (cost 0);
 * "Otra zona" keeps an optional free-text name and the cost is agreed over WhatsApp.
 */
export function ShippingZoneSelect({
  value,
  onChange,
  disabled = false,
  allowPickup = true,
}: ShippingZoneSelectProps) {
  const { zones, isLoading } = useShippingZones();
  const [selectValue, setSelectValue] = useState<string>(() =>
    getInitialSelectValue(value, allowPickup),
  );
  const [otherZone, setOtherZone] = useState<string>(
    value.zoneId ? "" : getTypedZone(value.zoneName),
  );

  // Once zones load, link the initial value (id or legacy name) to a zone
  useEffect(() => {
    if (zones.length === 0) return;

    const matched = matchShippingZone(zones, {
      zoneId: value.zoneId,
      zoneName: value.zoneName,
    });

    if (matched) {
      setSelectValue(matched.id);
      setOtherZone("");
      if (matched.id !== value.zoneId || matched.name !== value.zoneName) {
        onChange({ zoneId: matched.id, zoneName: matched.name });
      }
    } else {
      setSelectValue(
        getInitialSelectValue({ ...value, zoneId: null }, allowPickup),
      );
      setOtherZone(getTypedZone(value.zoneName));
      if (value.zoneId) onChange({ zoneId: null, zoneName: value.zoneName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  const selectedZone =
    selectValue === OTHER_VALUE || selectValue === PICKUP_VALUE
      ? null
      : zones.find((z) => z.id === selectValue) ?? null;
  const selectedCost = getZoneCost(selectedZone);

  return (
    <div className="space-y-2">
      <Select
        value={selectValue}
        onValueChange={(next) => {
          setSelectValue(next);

          if (next === PICKUP_VALUE) {
            onChange({ zoneId: null, zoneName: PICKUP_ZONE_NAME });
            return;
          }

          if (next === OTHER_VALUE) {
            onChange({
              zoneId: null,
              zoneName: otherZone.trim() || TO_AGREE_ZONE_NAME,
            });
            return;
          }

          const zone = zones.find((z) => z.id === next);
          if (zone) onChange({ zoneId: zone.id, zoneName: zone.name });
        }}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={isLoading ? "Cargando zonas..." : "Selecciona tu zona"}
          />
        </SelectTrigger>
        <SelectContent>
          {zones.map((z) => {
            const cost = getZoneCost(z);
            return (
              <SelectItem key={z.id} value={z.id}>
                {z.name}
                {cost !== null ? ` — ${formatPrice(cost)}` : ""}
              </SelectItem>
            );
          })}
          {allowPickup && (
            <SelectItem value={PICKUP_VALUE}>
              Recoger en tienda (sin envío)
            </SelectItem>
          )}
          <SelectItem value={OTHER_VALUE}>
            Otra zona — acordar envío por WhatsApp
          </SelectItem>
        </SelectContent>
      </Select>

      {selectValue === PICKUP_VALUE && (
        <p className="text-sm text-muted-foreground">
          Recoges tu pedido en la tienda. <b>Sin costo de envío.</b>
        </p>
      )}

      {selectValue === OTHER_VALUE && (
        <>
          <Input
            placeholder="¿Dónde? (opcional, ej: Camajuaní)"
            value={otherZone}
            onChange={(e) => {
              setOtherZone(e.target.value);
              onChange({
                zoneId: null,
                zoneName: e.target.value.trim() || TO_AGREE_ZONE_NAME,
              });
            }}
            disabled={disabled}
          />
          <Alert>
            <AlertTitle>Envío a acordar</AlertTitle>
            <AlertDescription>
              Acordaremos contigo el costo de envío <b>por WhatsApp</b> antes de
              confirmar el pedido.
            </AlertDescription>
          </Alert>
        </>
      )}

      {selectedZone && selectedCost !== null && (
        <p className="text-sm text-muted-foreground">
          Costo de envío para <b>{selectedZone.name}</b>:{" "}
          <b>{formatPrice(selectedCost)}</b>
        </p>
      )}
    </div>
  );
}

export default ShippingZoneSelect;
