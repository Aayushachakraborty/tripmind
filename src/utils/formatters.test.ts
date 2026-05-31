import { describe, expect, it } from "vitest";
import { formatINR } from "./formatters";

describe("formatINR", () => {
  it("formats rupee amounts with Indian grouping", () => {
    expect(formatINR(123456)).toBe("₹1,23,456");
  });
});
