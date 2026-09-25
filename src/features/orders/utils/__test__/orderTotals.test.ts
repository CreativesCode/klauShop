import { getOrderTotals } from "../pricing";

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
