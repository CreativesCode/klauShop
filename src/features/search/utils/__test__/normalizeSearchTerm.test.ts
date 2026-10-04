import { normalizeSearchTerm } from "../normalizeSearchTerm";

describe("normalizeSearchTerm", () => {
  it.each([
    ["Lápices", "lapices"],
    ["  JURÁSICOS ", "jurasicos"],
    ["corazón", "corazon"],
    ["piña", "pina"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeSearchTerm(input)).toBe(expected);
  });
});
