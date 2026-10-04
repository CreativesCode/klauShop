import { colorName } from "../colorName";

describe("colorName", () => {
  it.each([
    ["#FF1493", "fucsia"],
    ["#ff0000", "rojo"],
    ["#000080", "azul marino"],
    ["#FFFFFE", "blanco"],
    ["#3700ff", "azul"],
    ["#FF4500", "rojo"],
  ])("%s → %s", (hex, name) => {
    expect(colorName(hex)).toBe(name);
  });

  it("keeps values that are not hex", () => {
    expect(colorName("Rojo pasión")).toBe("Rojo pasión");
  });
});
