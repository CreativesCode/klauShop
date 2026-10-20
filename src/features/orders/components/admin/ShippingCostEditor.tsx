"use client";

import { Icons } from "@/components/layouts/icons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useShippingZones } from "@/features/shipping";
import { cn, formatCUP } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  orderId: string;
  currentShippingCost: number | null;
};

/** Shipping cost form of a pending order (final once it is paid). */
export default function ShippingCostEditor({
  orderId,
  currentShippingCost,
}: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const { zones } = useShippingZones();
  const [raw, setRaw] = useState(
    currentShippingCost === null ? "" : String(currentShippingCost),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const parsed = useMemo(() => {
    if (raw.trim() === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  }, [raw]);

  // Quick amounts: free + the costs of the active zones
  const quickAmounts = useMemo(() => {
    const costs = zones
      .map((z) => (z.cost === null ? null : Number(z.cost)))
      .filter((c): c is number => c !== null && Number.isFinite(c) && c > 0);
    return [0, ...Array.from(new Set(costs)).sort((a, b) => a - b)];
  }, [zones]);

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
            : `Envío guardado: ${formatCUP(shippingCost)}`,
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsed === null) {
      setError("Escribe un monto (0 si es gratis).");
      return;
    }
    if (Number.isNaN(parsed)) {
      setError("El monto debe ser un número mayor o igual que 0.");
      return;
    }
    setError(null);
    save(parsed);
  };

  const missing = currentShippingCost === null;

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-[18px] border bg-white p-5",
        missing ? "border-orange-200" : "border-line",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
          <Icons.truck className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-[15px] font-extrabold text-ink">
            Costo de envío
          </h2>
          <p className="text-[13px] text-neutral-500">
            Usa 0 si es gratis. Así el cliente recibe el total correcto. No se
            puede cambiar una vez pagada.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={isSaving}
            onClick={() => {
              setRaw(String(amount));
              setError(null);
            }}
            className={cn(
              "h-9 rounded-full border px-3.5 text-[13px] font-bold transition-colors disabled:opacity-50",
              parsed === amount
                ? "border-ink bg-ink text-white"
                : "border-neutral-200 bg-white text-ink hover:border-ink",
            )}
          >
            {amount === 0 ? "Gratis" : formatCUP(amount)}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-1.5">
        <label
          htmlFor={`shipping-${orderId}`}
          className="text-[13px] font-bold text-ink"
        >
          Monto (CUP)
        </label>
        <div className="flex gap-2">
          <input
            id={`shipping-${orderId}`}
            type="number"
            inputMode="numeric"
            min={0}
            step="0.01"
            placeholder="Ej. 300"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setError(null);
            }}
            disabled={isSaving}
            aria-invalid={!!error}
            className={cn(
              "h-[46px] min-w-0 flex-1 rounded-xl border bg-white px-3.5 text-[16px] font-bold tabular-nums text-ink outline-none placeholder:font-medium placeholder:text-neutral-500 focus:border-primary focus:ring-4 focus:ring-primary-100",
              error ? "border-red-300" : "border-neutral-300",
            )}
          />
          <Button
            type="submit"
            variant="dark"
            disabled={isSaving}
            className="h-[46px] rounded-xl px-5 text-sm"
          >
            {isSaving ? "Guardando…" : "Guardar envío"}
          </Button>
        </div>
        {error && <p className="text-[13px] font-bold text-red-700">{error}</p>}
      </form>

      {!missing && (
        <button
          type="button"
          onClick={() => save(null)}
          disabled={isSaving}
          className="w-fit text-[13px] font-bold text-primary-700 hover:underline disabled:opacity-50"
        >
          Volver a “a acordar por WhatsApp”
        </button>
      )}
    </section>
  );
}
