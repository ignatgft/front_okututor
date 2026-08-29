import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { useCourseSearch } from "./useCourseSearch";

const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({
  lng: "en",
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

const pageResponse = (content, total) =>
  new Response(
    JSON.stringify({
      content,
      page: 0,
      size: 20,
      total_elements: total,
      total_pages: Math.ceil(total / 20),
      first: true,
      last: true,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );

const renderSearchHook = (initialUrl) => {
  const fetchMock = vi.fn(() => Promise.resolve(pageResponse([{ id: "c1", title: "Python Programming" }], 1)));
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useCourseSearch(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[initialUrl]}>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </MemoryRouter>
    ),
  });
  return { result, fetchMock };
};

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useCourseSearch", () => {
  it("queries /api/v1/search/courses with q from the URL", async () => {
    const { result, fetchMock } = renderSearchHook("/search?q=python");

    await waitFor(() => expect(result.current.loading).toBe(false));

    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("/api/v1/search/courses");
    expect(calledUrl).toContain("q=python");
    expect(calledUrl).not.toContain("/api/v1/courses?");
    expect(result.current.courses).toHaveLength(1);
    expect(result.current.totalResults).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  it("maps UI filters to backend params (price_min/max_price/rating_min) and parses snake_case totals", async () => {
    const { result, fetchMock } = renderSearchHook(
      "/search?q=%D0%BF%D0%B0%D0%B9%D1%82%D0%BE%D0%BD&min_price=100&max_price=2000&rating=4&location_type=online,offline&days=weekdays&sort=price_asc"
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("price_min=100");
    expect(calledUrl).toContain("max_price=2000");
    expect(calledUrl).toContain("rating_min=4");
    expect(calledUrl).toContain("location_type=online");
    expect(calledUrl).not.toContain("min_price=");
    expect(calledUrl).not.toContain("days=");
    expect(calledUrl).not.toContain("sort=");
    expect(result.current.totalResults).toBe(1);
  });

  it("sends no auth header (public search)", async () => {
    sessionStorage.setItem("access_token", "at1");
    const { result, fetchMock } = renderSearchHook("/search?q=math");

    await waitFor(() => expect(result.current.loading).toBe(false));

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers.Authorization).toBeUndefined();
    sessionStorage.clear();
  });

  it("fetches suggestions after the type-ahead debounce", async () => {
    vi.useFakeTimers();
    const suggestionBody = new Response(
      JSON.stringify({ courses: [{ id: "c9", title: "Python Pro", subject: "IT" }], tutors: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    const fetchMock = vi.fn((url) =>
      String(url).includes("/search/suggestions")
        ? Promise.resolve(suggestionBody.clone())
        : Promise.resolve(pageResponse([], 0))
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useCourseSearch(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={["/search"]}>
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        </MemoryRouter>
      ),
    });

    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    act(() => {
      result.current.handlers.handleSearchChange({ target: { value: "pyt" } });
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(250); });

    const suggestionCalls = fetchMock.mock.calls
      .map((c) => String(c[0]))
      .filter((u) => u.includes("/search/suggestions"));
    expect(suggestionCalls).toHaveLength(1);
    expect(suggestionCalls[0]).toContain("q=pyt");
    expect(result.current.suggestions.courses).toHaveLength(1);
    expect(result.current.suggestionsOpen).toBe(true);

    vi.useRealTimers();
  });
});
