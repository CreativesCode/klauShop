/**
 * Unit price after applying the product's percentage discount, rounded to
 * cents so that order_lines.price (decimal 8,2) times quantity adds up to the
 * order amount. Mirrors the formula used by the cart UI.
 */
export function getDiscountedUnitPrice(
  price: string | number | null | undefined,
  discount: string | number | null | undefined,
): number {
  const priceValue = Number(price || 0);
  const discountValue = Number(discount || 0);
  const unitPrice =
    discountValue > 0
      ? priceValue - (priceValue * discountValue) / 100
      : priceValue;
  return Math.round(unitPrice * 100) / 100;
}

/**
 * Totals of a stored order, shared by every order view.
 * `amount` already includes shipping; a null shipping cost means
 * "por definir" (unregistered zone), so the amount is just the subtotal.
 */
export function getOrderTotals(order: {
  amount?: string | number | null;
  shipping_cost?: string | number | null;
}): { subtotal: number; shippingCost: number | null; total: number } {
  const total = Number(order.amount || 0);
  const shippingCost =
    order.shipping_cost === null || order.shipping_cost === undefined
      ? null
      : Number(order.shipping_cost);
  return {
    subtotal: shippingCost === null ? total : total - shippingCost,
    shippingCost,
    total,
  };
}
