import { describe, expect, it } from "vitest";
import { sanitiseInput, validatePreferences } from "./validators";

const validPreferences = {
  destination: "Jaipur",
  startDate: "2026-06-10",
  endDate: "2026-06-12",
  budgetPreset: "comfort",
  dietary: ["veg"],
  pace: "moderate",
  interests: ["History"],
  groupType: "couple",
  transport: "train",
  accessibilityNeeds: "Lift access"
};

describe("sanitiseInput", () => {
  it("strips scripts, tags, and javascript URLs", () => {
    expect(sanitiseInput("<script>alert(1)</script><b>Jaipur</b> javascript:bad")).toBe("Jaipur bad");
  });
});

describe("validatePreferences", () => {
  it("validates and sanitises preference strings", () => {
    const result = validatePreferences({
      ...validPreferences,
      destination: "<b>Jaipur</b>",
      accessibilityNeeds: "<i>Ramp</i>"
    });

    expect(result.destination).toBe("Jaipur");
    expect(result.accessibilityNeeds).toBe("Ramp");
  });
});
