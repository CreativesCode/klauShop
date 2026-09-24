import {
  ORDER_STATUS_ACTIONS,
  VALID_STATUS_TRANSITIONS,
  isValidStatusTransition,
} from "../orderStatus";

describe("order status transitions", () => {
  it("lets the admin confirm, mark paid or cancel a new order", () => {
    expect(VALID_STATUS_TRANSITIONS.pending_confirmation).toEqual([
      "pending_payment",
      "paid",
      "cancelled",
    ]);
  });

  it("allows cancelling paid and processing orders", () => {
    expect(isValidStatusTransition("paid", "cancelled")).toBe(true);
    expect(isValidStatusTransition("processing", "cancelled")).toBe(true);
  });

  it("does not allow cancelling shipped or final orders", () => {
    expect(isValidStatusTransition("shipped", "cancelled")).toBe(false);
    expect(VALID_STATUS_TRANSITIONS.delivered).toEqual([]);
    expect(VALID_STATUS_TRANSITIONS.cancelled).toEqual([]);
  });

  it("has an admin action label for every reachable status", () => {
    Object.values(VALID_STATUS_TRANSITIONS)
      .flat()
      .forEach((status) => {
        expect(
          ORDER_STATUS_ACTIONS[status as keyof typeof ORDER_STATUS_ACTIONS],
        ).toBeDefined();
      });
  });
});
