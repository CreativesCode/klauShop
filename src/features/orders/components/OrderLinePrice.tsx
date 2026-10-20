import { cn, formatCUP } from "@/lib/utils";

type OrderLinePriceProps = {
  price: number | string;
  listPrice?: number | string | null;
  discount?: number | string | null;
  className?: string;
};

/**
 * Final unit price of an order line, plus the struck-through list price and
 * discount % when the line was bought on sale.
 */
export default function OrderLinePrice({
  price,
  listPrice,
  discount,
  className,
}: OrderLinePriceProps) {
  const discountValue = Number(discount || 0);
  const hasDiscount = discountValue > 0 && listPrice != null;

  return (
    <span
      className={cn("inline-flex flex-wrap items-center gap-1.5", className)}
    >
      <span className="tabular-nums">{formatCUP(price)}</span>
      {hasDiscount && (
        <>
          <span className="text-xs tabular-nums text-neutral-500 line-through">
            {formatCUP(listPrice)}
          </span>
          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-extrabold text-ink">
            -{discountValue}%
          </span>
        </>
      )}
    </span>
  );
}
