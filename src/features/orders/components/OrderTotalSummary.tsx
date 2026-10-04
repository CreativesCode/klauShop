import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import {
  formatOrderTotal,
  formatShipping,
} from "@/features/orders/utils/pricing";

type OrderTotalSummaryProps = {
  subtotal: number;
  // 0 = pickup in store, null = agreed over WhatsApp
  shippingCost: number | null;
  zoneName?: string | null;
};

/** Subtotal / Envío / Total box shown before an order is sent (checkout and admin). */
export function OrderTotalSummary({
  subtotal,
  shippingCost,
  zoneName,
}: OrderTotalSummaryProps) {
  const hasZone = Boolean(zoneName?.trim());
  // No zone chosen yet: the cost is unknown, not "to agree"
  const cost = hasZone ? shippingCost : null;

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Envío</span>
        <span>
          {hasZone ? formatShipping(cost, zoneName) : "Elige tu zona"}
        </span>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatOrderTotal(subtotal + (cost ?? 0), cost)}</span>
      </div>
    </div>
  );
}

export default OrderTotalSummary;
