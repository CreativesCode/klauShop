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
import { getZoneCost, matchShippingZone } from "../utils/matchShippingZone";

const OTHER_VALUE = "__other__";

export type ShippingZoneValue = {
  zoneId: string | null;
  zoneName: string;
};

type ShippingZoneSelectProps = {
  value: ShippingZoneValue;
  onChange: (value: ShippingZoneValue) => void;
  disabled?: boolean;
};

/**
 * Zone picker shared by checkout, saved addresses and admin order creation.
 * Registered zones carry their id and cost; "Otro" keeps a free-text name
 * and leaves the shipping cost to be defined by the admin.
 */
export function ShippingZoneSelect({
  value,
  onChange,
  disabled = false,
}: ShippingZoneSelectProps) {
  const { zones, isLoading } = useShippingZones();
  const [selectValue, setSelectValue] = useState<string>(OTHER_VALUE);
  const [otherZone, setOtherZone] = useState<string>(
    value.zoneId ? "" : value.zoneName,
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
      setSelectValue(OTHER_VALUE);
      setOtherZone(value.zoneName);
      if (value.zoneId) onChange({ zoneId: null, zoneName: value.zoneName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  const selectedZone =
    selectValue === OTHER_VALUE
      ? null
      : zones.find((z) => z.id === selectValue) ?? null;
  const selectedCost = getZoneCost(selectedZone);

  return (
    <div className="space-y-2">
      <Select
        value={selectValue}
        onValueChange={(next) => {
          setSelectValue(next);

          if (next === OTHER_VALUE) {
            onChange({ zoneId: null, zoneName: otherZone.trim() });
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
          <SelectItem value={OTHER_VALUE}>Otro / no aparece</SelectItem>
        </SelectContent>
      </Select>

      {selectValue === OTHER_VALUE ? (
        <>
          <Input
            placeholder="Escribe tu zona (ej: Camajuaní...)"
            value={otherZone}
            onChange={(e) => {
              setOtherZone(e.target.value);
              onChange({ zoneId: null, zoneName: e.target.value });
            }}
            disabled={disabled}
          />
          <Alert>
            <AlertTitle>Envío por definir</AlertTitle>
            <AlertDescription>
              El costo de envío para esta zona <b>se confirmará por WhatsApp</b>{" "}
              antes de coordinar el pago.
            </AlertDescription>
          </Alert>
        </>
      ) : (
        selectedZone &&
        selectedCost !== null && (
          <p className="text-sm text-muted-foreground">
            Costo de envío para <b>{selectedZone.name}</b>:{" "}
            <b>{formatPrice(selectedCost)}</b>
          </p>
        )
      )}
    </div>
  );
}

export default ShippingZoneSelect;
