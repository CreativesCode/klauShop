// src/features/orders/components/StatusPill.tsx
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/supabase/schema";

// Colores = tailwind default *-50 / *-700 (coinciden con orderStatus.tsx). Sin borde.
export const STATUS_PILL: Record<
  OrderStatus,
  { short: string; className: string; dot: string }
> = {
  pending_confirmation: {
    short: "Por confirmar",
    className: "bg-yellow-50 text-yellow-700",
    dot: "#EAB308",
  },
  pending_payment: {
    short: "Pendiente de pago",
    className: "bg-orange-50 text-orange-700",
    dot: "#F97316",
  },
  paid: {
    short: "Pagada",
    className: "bg-green-50 text-green-700",
    dot: "#22C55E",
  },
  processing: {
    short: "Procesando",
    className: "bg-blue-50 text-blue-700",
    dot: "#3B82F6",
  },
  shipped: {
    short: "Enviada",
    className: "bg-indigo-50 text-indigo-700",
    dot: "#6366F1",
  },
  delivered: {
    short: "Entregada",
    className: "bg-emerald-50 text-emerald-700",
    dot: "#10B981",
  },
  cancelled: {
    short: "Cancelada",
    className: "bg-red-50 text-red-700",
    dot: "#EF4444",
  },
};

export function StatusPill({
  status,
  size = "sm",
  className,
}: {
  status: OrderStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const info = STATUS_PILL[status];
  if (!info) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-bold",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-[5px] text-[13px]",
        info.className,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {info.short}
    </span>
  );
}

export function StalePill({ days }: { days: number }) {
  return (
    <span
      title="Pendiente hace más de 48 h: el stock sigue reservado"
      className="whitespace-nowrap rounded-full bg-orange-50 px-2 py-1 text-[11px] font-extrabold text-orange-700"
    >
      ⏱ Hace {days} días
    </span>
  );
}
