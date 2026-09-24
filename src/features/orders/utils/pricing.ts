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
