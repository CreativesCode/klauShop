"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <div className="space-y-6">
      <div className="rounded-md border p-4 space-y-3">
        <div className="font-medium">Nueva zona</div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Nombre</div>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Santa Clara"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Costo (CUP)</div>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm">
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
            >
              Crear
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zona</TableHead>
              <TableHead className="w-[180px]">Costo</TableHead>
              <TableHead className="w-[120px]">Activa</TableHead>
              <TableHead className="w-[220px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((z) => (
              <TableRow key={z.id}>
                <TableCell>
                  <Input
                    value={z.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setZones((prev) =>
                        prev.map((x) =>
                          x.id === z.id ? { ...x, name: v } : x,
                        ),
                      );
                    }}
                    disabled={isSubmitting}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={z.cost}
                      onChange={(e) => {
                        const v = e.target.value;
                        setZones((prev) =>
                          prev.map((x) =>
                            x.id === z.id ? { ...x, cost: v } : x,
                          ),
                        );
                      }}
                      disabled={isSubmitting}
                    />
                    <div className="text-xs text-muted-foreground">
                      Vista: {formatCUP(Number(z.cost || 0))}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={z.isActive}
                    onCheckedChange={(v) => {
                      setZones((prev) =>
                        prev.map((x) =>
                          x.id === z.id ? { ...x, isActive: Boolean(v) } : x,
                        ),
                      );
                    }}
                    disabled={isSubmitting}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => saveZone(z)}
                      disabled={isSubmitting || z.name.trim().length < 2}
                    >
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deleteZone(z.id)}
                      disabled={isSubmitting}
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {zones.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-sm text-muted-foreground"
                >
                  Aún no hay zonas. Crea la primera arriba.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
