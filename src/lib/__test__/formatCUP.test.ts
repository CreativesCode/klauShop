import { formatCUP } from "../utils";

describe("formatCUP", () => {
  it.each([
    [4500, "4.500 CUP"],
    ["5225.00", "5.225 CUP"],
    [262.5, "263 CUP"],
    [0, "0 CUP"],
    [1250000, "1.250.000 CUP"],
    [-1500, "-1.500 CUP"],
  ])("%s → %s", (value, expected) => {
    expect(formatCUP(value)).toBe(expected);
  });

  it("can omit the unit", () => {
    expect(formatCUP(18400, { unit: false })).toBe("18.400");
  });
});
