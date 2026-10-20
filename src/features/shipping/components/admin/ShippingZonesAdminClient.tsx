"use client";

import { Icons } from "@/components/layouts/icons";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { formatCUP } from "@/lib/utils";
import { useMemo, useState } from "react";

export type ShippingZoneRow = {
  id: string;
  name: string;
  cost: string;
  isActive: boolean;
};

type Props = {
  initialZones: ShippingZoneRow[];
};

export default function ShippingZonesAdminClient({ initialZones }: Props) {
  const { toast } = useToast();
  const [zones, setZones] = useState<ShippingZoneRow[]>(initialZones);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState<string>("0");
  const [newIsActive, setNewIsActive] = useState(true);

  const canCreate = useMemo(() => newName.trim().length >= 2, [newName]);

  const refresh = async () => {
    const res = await fetch("/api/admin/shipping-zones");
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "No se pudieron cargar las zonas");
    }
    setZones((data?.zones ?? []) as ShippingZoneRow[]);
  };

  const createZone = async () => {
    if (!canCreate) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/shipping-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          cost: Number(newCost || "0"),
          isActive: newIsActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear la zona");

      toast({
        title: "Zona creada",
        description: `${data?.zone?.name || "Zona"} creada correctamente.`,
      });

      setNewName("");
      setNewCost("0");
      setNewIsActive(true);

      await refresh();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No se pudo crear la zona",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveZone = async (zone: ShippingZoneRow) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/shipping-zones/${zone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: zone.name,
          cost: Number(zone.cost || "0"),
          isActive: zone.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "No se pudo actualizar la zona");

      toast({
        title: "Zona actualizada",
        description: `${zone.name} actualizada.`,
      });

      await refresh();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No se pudo actualizar la zona",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteZone = async (zoneId: string) => {
    const ok = window.confirm(
      "¿Eliminar esta zona? Esto no afecta órdenes ya creadas, pero dejará de aparecer en el checkout.",
    );
    if (!ok) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/shipping-zones/${zoneId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "No se pudo eliminar la zona");

      toast({ title: "Zona eliminada" });
      await refresh();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No se pudo eliminar la zona",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateZone = (id: string, patch: Partial<(typeof zones)[number]>) =>
    setZones((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="flex flex-col gap-[18px]">
      <section className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5">
        <div>
          <h2 className="text-[15px] font-extrabold text-ink">Nueva zona</h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Usa 0 si el envío a esa zona es gratis.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_auto]">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-neutral-600">
              Nombre
            </span>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Santa Clara"
              disabled={isSubmitting}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-neutral-600">
              Costo (CUP)
            </span>
            <Input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              disabled={isSubmitting}
            />
          </label>
          <div className="flex items-end gap-3">
            <label className="flex h-[46px] items-center gap-2 text-sm font-semibold text-ink">
              <Checkbox
                checked={newIsActive}
                onCheckedChange={(v) => setNewIsActive(Boolean(v))}
                disabled={isSubmitting}
              />
              Activa
            </label>
            <Button
              type="button"
              onClick={createZone}
              disabled={!canCreate || isSubmitting}
              className="h-[46px]"
            >
              <Icons.add className="size-4" aria-hidden />
              Crear zona
            </Button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-line bg-white">
        <h2 className="px-5 pb-3 pt-5 text-[15px] font-extrabold text-ink">
          Zonas ({zones.length})
        </h2>
        <ul>
          {zones.map((z) => (
            <li
              key={z.id}
              className="grid gap-3 border-t border-line-soft px-5 py-4 md:grid-cols-[minmax(0,1fr)_200px_auto_auto] md:items-end"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-neutral-600">
                  Zona
                </span>
                <Input
                  value={z.name}
                  onChange={(e) => updateZone(z.id, { name: e.target.value })}
                  disabled={isSubmitting}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-neutral-600">
                  Costo ·{" "}
                  <span className="font-semibold text-neutral-500">
                    {formatCUP(Number(z.cost || 0))}
                  </span>
                </span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={z.cost}
                  onChange={(e) => updateZone(z.id, { cost: e.target.value })}
                  disabled={isSubmitting}
                />
              </label>
              <label className="flex h-[46px] items-center gap-2 text-sm font-semibold text-ink">
                <Checkbox
                  checked={z.isActive}
                  onCheckedChange={(v) =>
                    updateZone(z.id, { isActive: Boolean(v) })
                  }
                  disabled={isSubmitting}
                />
                Activa
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="dark"
                  onClick={() => saveZone(z)}
                  disabled={isSubmitting || z.name.trim().length < 2}
                  className="h-[46px] flex-1 md:flex-none"
                >
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="destructiveSoft"
                  onClick={() => deleteZone(z.id)}
                  disabled={isSubmitting}
                  className="h-[46px]"
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}

          {zones.length === 0 && (
            <li className="border-t border-line-soft py-12 text-center text-[15px] text-neutral-500">
              Aún no hay zonas. Crea la primera arriba.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
