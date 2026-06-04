import { describe, expect, it } from "vitest";
import { track } from "../lib/analytics";

describe("track", () => {
  it("fires without throwing", () => {
    expect(() => track("page_viewed", { page: "test" })).not.toThrow();
  });
});
