import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTutorAvailability } from "./useTutorAvailability";
import { tutorsApi } from "../api/tutors.api";

vi.mock("../api/tutors.api", () => ({
  tutorsApi: {
    availabilityByTeacher: vi.fn(),
  },
}));

const mockedApi = vi.mocked(tutorsApi.availabilityByTeacher);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTutorAvailability", () => {
  it("loads and normalizes availability for a tutor id", async () => {
    mockedApi.mockResolvedValue({
      response: { ok: true },
      data: [{ weekday: "Monday", start_time: "10:00", end_time: "12:00" }],
    });
    const { result } = renderHook(() => useTutorAvailability(7));
    await waitFor(() => expect(result.current.availability.length).toBe(1));
    expect(result.current.loading).toBe(false);
    expect(mockedApi).toHaveBeenCalledWith(7);
  });

  it("falls back to [] when the request fails", async () => {
    mockedApi.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useTutorAvailability(7));
    await waitFor(() => expect(result.current.availability).toEqual([]));
    expect(result.current.error).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });

  it("returns [] and does not call the api when no tutor id", async () => {
    const { result } = renderHook(() => useTutorAvailability(undefined));
    await waitFor(() => expect(result.current.availability).toEqual([]));
    expect(mockedApi).not.toHaveBeenCalled();
  });
});
