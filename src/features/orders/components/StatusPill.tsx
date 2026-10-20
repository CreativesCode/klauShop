import { cn } from "@/lib/utils";
import { getOrderStatusInfo } from "../utils/orderStatus";

/** Borderless order status pill: tinted background + text + 6px dot. */
export function StatusPill({
  status,
  size = "sm",
  className,
}: {
  status: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const info = getOrderStatusInfo(status);
  if (!info) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-bold",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-[5px] text-[13px]",
        info.bgColor,
        info.color,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {info.shortLabel}
    </span>
  );
}

/** Pending for more than 48 h: the stock is still reserved. */
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
