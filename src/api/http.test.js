import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { apiClient } from "./http";
import { setTokens } from "./token";

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

let originalLocation;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

beforeAll(() => {
  originalLocation = window.location;
  delete window.location;
  window.location = { href: "" };
});

afterAll(() => {
  window.location = originalLocation;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiClient refresh flow", () => {
  it("refreshes once for concurrent 401s and retries both requests", async () => {
    let courseCalls = 0;
    const refreshMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ access_token: "at2", refresh_token: "rt2" }))
    );
    const fetchMock = vi.fn((url) => {
      const target = String(url);
      if (target.includes("/auth/refresh")) return refreshMock();
      if (target.includes("/courses")) {
        courseCalls += 1;
        return Promise.resolve(
          jsonResponse({ content: [] }, courseCalls <= 2 ? 401 : 200)
        );
      }
      return Promise.resolve(jsonResponse({}, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    setTokens("at1", "rt1");

    const [a, b] = await Promise.all([
      apiClient.request("GET", "/api/v1/courses"),
      apiClient.request("GET", "/api/v1/courses"),
    ]);

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(a.response.status).toBe(200);
    expect(b.response.status).toBe(200);
    expect(courseCalls).toBe(4);
    expect(localStorage.getItem("access_token")).toBe(null);
    expect(sessionStorage.getItem("access_token")).toBe("at2");
    expect(localStorage.getItem("refresh_token")).toBe("rt2");
  });

  it("replays the request that triggered the refresh itself (not just queued ones)", async () => {
    let coursesCalled = false;
    const refreshMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ access_token: "at2", refresh_token: "rt2" }))
    );
    const fetchMock = vi.fn((url) => {
      const target = String(url);
      if (target.includes("/auth/refresh")) return refreshMock();
      if (target.includes("/courses")) {
        if (!coursesCalled) {
          coursesCalled = true;
          return Promise.resolve(jsonResponse({}, 401));
        }
        return Promise.resolve(jsonResponse({ ok: true }, 200));
      }
      return Promise.resolve(jsonResponse({}, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    setTokens("at1", "rt1");

    const result = await apiClient.request("GET", "/api/v1/courses");

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.response.status).toBe(200);
    expect(result.data.ok).toBe(true);
  });

  it("clears tokens and dispatches auth:logout event when refresh fails", async () => {
    const fetchMock = vi.fn((url) => {
      const target = String(url);
      if (target.includes("/auth/refresh"))
        return Promise.resolve(jsonResponse({ error: "invalid" }, 401));
      return Promise.resolve(jsonResponse({}, 401));
    });
    vi.stubGlobal("fetch", fetchMock);
    setTokens("at1", "rt1");

    const eventSpy = vi.fn();
    window.addEventListener("auth:logout", eventSpy);

    const result = await apiClient.request("GET", "/api/v1/courses");

    expect(result.response.status).toBe(401);
    expect(localStorage.getItem("access_token")).toBe(null);
    expect(localStorage.getItem("refresh_token")).toBe(null);
    expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
      detail: { reason: "session_expired" }
    }));
  });

  it("does not retry indefinitely when the retry also returns 401", async () => {
    const refreshMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ access_token: "at2", refresh_token: "rt2" }))
    );
    let calls = 0;
    const fetchMock = vi.fn((url) => {
      if (String(url).includes("/auth/refresh")) return refreshMock();
      calls += 1;
      return Promise.resolve(jsonResponse({}, 401));
    });
    vi.stubGlobal("fetch", fetchMock);
    setTokens("at1", "rt1");

    const result = await apiClient.request("GET", "/api/v1/courses");

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(calls).toBe(2);
    expect(result.response.status).toBe(401);
  });

  it("throws a normalized ApiRequestError on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));

    await expect(apiClient.get("/api/v1/courses")).rejects.toMatchObject({
      name: "ApiRequestError",
      code: "NETWORK_ERROR",
      status: 0,
    });
  });
});
