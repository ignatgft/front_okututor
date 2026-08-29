import { describe, it, expect } from "vitest";
import { filtersToParams } from "./search";

const baseFilters = {
  subject: "",
  location_type: [],
  group_size: [],
  days: [],
  min_price: "",
  max_price: "",
  rating: 0,
  sort: "recommended",
  page: 0,
};

describe("filtersToParams (GET /api/v1/search/courses contract)", () => {
  it("returns empty params for default filters", () => {
    expect(filtersToParams(baseFilters).toString()).toBe("");
  });

  it("maps min_price to price_min and keeps max_price", () => {
    const params = filtersToParams({ ...baseFilters, min_price: "500", max_price: "2000" });
    expect(params.get("price_min")).toBe("500");
    expect(params.get("max_price")).toBe("2000");
    expect(params.get("min_price")).toBeNull();
  });

  it("maps rating to rating_min only when positive", () => {
    expect(filtersToParams({ ...baseFilters, rating: 0 }).get("rating_min")).toBeNull();
    expect(filtersToParams({ ...baseFilters, rating: 4 }).get("rating_min")).toBe("4");
  });

  it("sends subject as-is", () => {
    const params = filtersToParams({ ...baseFilters, subject: "MATHEMATICS" });
    expect(params.get("subject")).toBe("MATHEMATICS");
  });

  it("sends only the first selected location_type / group_size (backend single-value hard filters)", () => {
    const params = filtersToParams({
      ...baseFilters,
      location_type: ["online", "offline"],
      group_size: ["individual", "group"],
    });
    expect(params.get("location_type")).toBe("online");
    expect(params.get("group_size")).toBe("individual");
  });

  it("does not send days or sort (unsupported by the search backend)", () => {
    const params = filtersToParams({
      ...baseFilters,
      days: ["weekdays", "weekends"],
      sort: "price_asc",
    });
    expect(params.get("days")).toBeNull();
    expect(params.get("sort")).toBeNull();
  });

  it("keeps price_min=0 when explicitly set", () => {
    const params = filtersToParams({ ...baseFilters, min_price: "0" });
    expect(params.get("price_min")).toBe("0");
  });
});
