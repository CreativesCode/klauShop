import { stripUnsafeChars } from "../safeText";

describe("stripUnsafeChars", () => {
  it("removes bidi overrides and control characters", () => {
    expect(stripUnsafeChars("Calle \u202Eadreuq 5\u0007")).toBe(
      "Calle adreuq 5",
    );
  });

  it("keeps line breaks, tabs and accents", () => {
    expect(stripUnsafeChars("Línea 1\nLínea\t2 ñ")).toBe("Línea 1\nLínea\t2 ñ");
  });
});
