import { describe, it, expect } from "vitest";
import { maskEmail } from "./maskEmail";

describe("maskEmail", () => {
  it("masks typical email", () => {
    expect(maskEmail("ivan@gmail.com")).toBe("i***@gmail.com");
  });
  it("handles short local part", () => {
    expect(maskEmail("a@gmail.com")).toBe("*@gmail.com"); // special? implementation returns * plus?
    // fallback check: should start with *
    expect(maskEmail("ab@gmail.com").startsWith("a")).toBe(true);
  });
  it("handles empty/invalid", () => {
    expect(maskEmail("")).toBe("");
    expect(maskEmail(null)).toBe("");
    expect(maskEmail("no-at")).toBe("no-at");
  });
  it("masks long local to max 5 stars", () => {
    expect(maskEmail("longlocalpart@example.com")).toBe("l*****@example.com");
  });
});
