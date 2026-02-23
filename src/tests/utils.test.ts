import { describe, expect, it } from "vitest";
import { isFrontendJob } from "../lib/utils";

describe("isFrontendJob", () => {
  it("returns true for frontend keywords", () => {
    expect(isFrontendJob("Senior Frontend Engineer")).toBe(true);
    expect(isFrontendJob("Front-end Developer")).toBe(true);
    expect(isFrontendJob("React Developer")).toBe(true);
    expect(isFrontendJob("Vue Engineer")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isFrontendJob("FRONT END DEVELOPER")).toBe(true);
  });

  it("returns false for non-frontend roles", () => {
    expect(isFrontendJob("Backend Engineer")).toBe(false);
    expect(isFrontendJob("Data Platform Engineer")).toBe(false);
  });
});
