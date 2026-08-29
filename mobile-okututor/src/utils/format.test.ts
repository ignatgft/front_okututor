import { describe, it, expect } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("returns a placeholder for null/undefined", () => {
    expect(formatPrice(null)).toBe("—");
    expect(formatPrice(undefined)).toBe("—");
  });

  it("formats integers without decimals", () => {
    expect(formatPrice(1200)).toBe("1200 KGS");
  });

  it("formats non-integers with two decimals", () => {
    expect(formatPrice(1249.5)).toBe("1249.50 KGS");
  });

  it("uses the passed currency uppercased", () => {
    expect(formatPrice(100, "usd")).toBe("100 USD");
  });
});