jest.mock("@/lib/supabase/db", () => ({}));
jest.mock("@/lib/supabase/schema", () => ({}));

import { sumQuantitiesByProduct } from "../inventory";

describe("sumQuantitiesByProduct", () => {
  it("adds up every variant of the same product", () => {
    const totals = sumQuantitiesByProduct([
      { productId: "pens", quantity: 2 }, // blue
      { productId: "pens", quantity: 3 }, // red
      { productId: "tablet", quantity: 1 },
    ]);
    expect(totals.get("pens")).toBe(5);
    expect(totals.get("tablet")).toBe(1);
    expect(totals.size).toBe(2);
  });
});
