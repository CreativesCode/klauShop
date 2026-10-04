import { formatOrderTotal, formatShipping, getOrderTotals } from "../pricing";

describe("getOrderTotals", () => {
  it("splits amount into subtotal and shipping", () => {
    expect(
      getOrderTotals({ amount: "8300.00", shipping_cost: "300.00" }),
    ).toEqual({
      subtotal: 8000,
      shippingCost: 300,
      total: 8300,
    });
  });

  it("treats null shipping as 'por definir' (amount is the subtotal)", () => {
    expect(getOrderTotals({ amount: "460.00", shipping_cost: null })).toEqual({
      subtotal: 460,
      shippingCost: null,
      total: 460,
    });
  });

  it("keeps free shipping (0) distinct from undefined shipping", () => {
    expect(
      getOrderTotals({ amount: 150, shipping_cost: "0.00" }).shippingCost,
    ).toBe(0);
  });
});

describe("formatShipping / formatOrderTotal", () => {
  it("shows shipping to agree and a partial total while the cost is null", () => {
    expect(formatShipping(null, "Camajuaní")).toBe("A acordar por WhatsApp");
    expect(formatOrderTotal(500, null)).toMatch(/\+ envío$/);
  });

  it("labels pickup in store and keeps a plain total", () => {
    expect(formatShipping(0, "Recogida en tienda")).toBe("Recogida en tienda");
    expect(formatOrderTotal(500, 0)).not.toMatch(/envío/);
  });
});
