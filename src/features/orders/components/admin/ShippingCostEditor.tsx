"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  orderId: string;
  currentShippingCost: number | null;
};

export default function ShippingCostEditor({
  orderId,
  currentShippingCost,
}: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [raw, setRaw] = useState(
    currentShippingCost === null ? "" : String(currentShippingCost),
  );
  const [isSaving, setIsSaving] = useState(false);

  const parsed = useMemo(() => {
    if (raw.trim() === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  }, [raw]);

  const save = async (shippingCost: number | null) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/update-shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingCost }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "No se pudo actualizar",
        );
      }

      toast({
        title: "Envío actualizado",
        description:
          shippingCost === null
            ? "Envío marcado como a acordar."
            : `Envío guardado: ${formatPrice(shippingCost)}`,
      });

      router.refresh();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No se pudo actualizar el envío",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="Costo de envío (CUP)"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          disabled={isSaving}
        />
        <Button
          type="button"
          onClick={() => save(parsed)}
          disabled={isSaving || Number.isNaN(parsed)}
        >
          Guardar
        </Button>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => save(null)}
          disabled={isSaving}
        >
          Marcar “a acordar”
        </Button>
      </div>
    </div>
  );
}
