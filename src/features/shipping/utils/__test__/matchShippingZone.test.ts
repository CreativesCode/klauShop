import { getZoneCost, matchShippingZone } from "../matchShippingZone";

const zones = [
  { id: "z1", name: "Placetas", cost: "150.00" },
  {
    id: "z2",
    name: "Santa Clara - Dentro de la Circumbalación",
    cost: "200.00",
  },
];

describe("matchShippingZone", () => {
  it("matches by id even if the stored name is outdated", () => {
    expect(
      matchShippingZone(zones, { zoneId: "z2", zoneName: "Santa Clara" })?.id,
    ).toBe("z2");
  });

  it("falls back to a case/space-insensitive name match", () => {
    expect(matchShippingZone(zones, { zoneName: "  placetas " })?.id).toBe(
      "z1",
    );
  });

  it("falls back to the name when the id is unknown (deleted/inactive zone)", () => {
    expect(
      matchShippingZone(zones, { zoneId: "gone", zoneName: "Placetas" })?.id,
    ).toBe("z1");
  });

  it("returns null for unregistered zones ('Otro')", () => {
    expect(matchShippingZone(zones, { zoneName: "Caibarién" })).toBeNull();
    expect(matchShippingZone(zones, { zoneName: "" })).toBeNull();
  });
});

describe("getZoneCost", () => {
  it("parses the decimal cost and returns null without a zone", () => {
    expect(getZoneCost(zones[0])).toBe(150);
    expect(getZoneCost(null)).toBeNull();
  });
});
