import { normalizePhone, phoneSchema, splitPhoneByCountry } from "../phone";

describe("normalizePhone", () => {
  it.each([
    ["53077035", "+53 53077035"],
    ["+53 53077035", "+53 53077035"],
    ["+5353077035", "+53 53077035"],
    ["5353077035", "+53 53077035"],
    ["+53 5353077035", "+53 53077035"], // double prefix from the old input
    ["+53 5307 7035", "+53 53077035"],
    ["+53 63077035", "+53 63077035"],
    ["+1 305 555 1234", "+1 3055551234"],
    ["+34 612345678", "+34 612345678"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    "1234",
    "+53 1234",
    "+53 42123456", // landline: WhatsApp needs a mobile
    "+53077035", // missing a digit after the dial code
    "+5",
    "",
    "+34 123",
  ])("rejects %s", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("splitPhoneByCountry", () => {
  it("keeps a partial dial code as unmatched", () => {
    expect(splitPhoneByCountry("+5").matched).toBe(false);
  });

  it("detects the longest dial code", () => {
    expect(splitPhoneByCountry("+593 991234567").country.iso2).toBe("EC");
  });
});

describe("phoneSchema", () => {
  it("returns the normalized phone", () => {
    expect(phoneSchema.parse("5353077035")).toBe("+53 53077035");
  });

  it("explains the Cuban format on error", () => {
    const result = phoneSchema.safeParse("1234");
    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.issues[0].message).toMatch(/8 dígitos/);
    }
  });
});
