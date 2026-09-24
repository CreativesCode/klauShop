import { cn, formatPrice } from "@/lib/utils";

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
      <span className={cn(hasDiscount && "text-red-600")}>
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-xs text-muted-foreground line-through">
            {formatPrice(listPrice)}
          </span>
          <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
            -{discountValue}%
          </span>
        </>
      )}
    </span>
  );
}
