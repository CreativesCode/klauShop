import { getDiscountedUnitPrice } from "../pricing";

describe("getDiscountedUnitPrice", () => {
  it("returns the list price when there is no discount", () => {
    expect(getDiscountedUnitPrice("1500.00", null)).toBe(1500);
    expect(getDiscountedUnitPrice("1500.00", "0.00")).toBe(1500);
  });

  it("applies the percentage discount", () => {
    expect(getDiscountedUnitPrice("1500.00", "20.00")).toBe(1200);
  });

  it("rounds to cents", () => {
    expect(getDiscountedUnitPrice("99.99", "15.00")).toBe(84.99);
  });
});
