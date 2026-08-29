import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchApi } from "./search.api";
import { endpoints } from "./endpoints";
import { setTokens } from "./token";

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchApi", () => {
  it("hits the smart search endpoint with mapped query params", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ content: [], total_elements: 0, total_pages: 0 }))
    );
    vi.stubGlobal("fetch", fetchMock);

    const params = new URLSearchParams({ q: "python", price_min: "100", rating_min: "4" });
    const { response } = await searchApi.courses(params);

    expect(response.status).toBe(200);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain(endpoints.search.courses);
    expect(calledUrl).toContain("q=python");
    expect(calledUrl).toContain("price_min=100");
    expect(calledUrl).toContain("rating_min=4");
  });

  it("does not send auth credentials even when tokens exist (public search)", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ content: [] })));
    vi.stubGlobal("fetch", fetchMock);
    setTokens("at1", "rt1");

    await searchApi.courses(new URLSearchParams({ q: "math" }));

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("accepts a plain object of params", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ content: [] })));
    vi.stubGlobal("fetch", fetchMock);

    await searchApi.courses({ q: "англис тили", page: 0, size: 20 });

    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain(endpoints.search.courses);
    expect(calledUrl).toContain("q=%D0%B0%D0%BD%D0%B3%D0%BB%D0%B8%D1%81");
  });

  it("builds the suggestions endpoint with a q param", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ courses: [], tutors: [] })));
    vi.stubGlobal("fetch", fetchMock);

    await searchApi.suggestions("py");

    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain(endpoints.search.suggestions);
    expect(calledUrl).toContain("q=py");
  });
});
