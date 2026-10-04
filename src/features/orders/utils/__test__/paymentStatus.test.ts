import { getPaymentStatusInfo, needsRefund } from "../paymentStatus";

describe("refund status", () => {
  it("flags cancelled orders that were paid", () => {
    expect(needsRefund("cancelled", "paid")).toBe(true);
    expect(getPaymentStatusInfo("paid", "cancelled").label).toBe(
      "Reembolso pendiente",
    );
  });

  it("does not flag other combinations", () => {
    expect(needsRefund("cancelled", "unpaid")).toBe(false);
    expect(needsRefund("cancelled", "refunded")).toBe(false);
    expect(needsRefund("delivered", "paid")).toBe(false);
    expect(getPaymentStatusInfo("paid", "delivered").label).toBe("Pagado");
  });

  it("labels refunded orders", () => {
    expect(getPaymentStatusInfo("refunded", "cancelled").label).toBe(
      "Reembolsado",
    );
  });
});
