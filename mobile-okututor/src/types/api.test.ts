import { describe, it, expect } from "vitest";
import { toList, totalElementsOf } from "./api";

describe("toList", () => {
  it("returns [] for null/undefined", () => {
    expect(toList(null)).toEqual([]);
    expect(toList(undefined)).toEqual([]);
  });

  it("passes arrays through", () => {
    expect(toList([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("extracts content from a paginated envelope", () => {
    expect(toList({ content: ["a", "b"] })).toEqual(["a", "b"]);
  });

  it("returns [] for an empty envelope", () => {
    expect(toList({ content: [] })).toEqual([]);
  });
});

describe("totalElementsOf", () => {
  it("counts arrays", () => {
    expect(totalElementsOf([1, 2, 3])).toBe(3);
  });

  it("from a paginated envelope", () => {
    expect(totalElementsOf({ content: [1, 2], total_elements: 99 })).toBe(99);
    expect(totalElementsOf({ content: [1, 2] })).toBe(2);
  });

  it("0 for empty input", () => {
    expect(totalElementsOf(null)).toBe(0);
  });
});