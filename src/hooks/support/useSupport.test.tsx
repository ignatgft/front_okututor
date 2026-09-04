import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import useSupportTickets from "./useSupportTickets";
import useSupportUnread from "./useSupportUnread";
import { supportApi } from "../../api/support.api";

vi.mock("../../api/support.api", () => ({
  supportApi: {
    getTickets: vi.fn(),
    getTicket: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markRead: vi.fn(),
  },
  adminSupportApi: {
    getTickets: vi.fn(),
  },
}));

describe("useSupportTickets", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads tickets", async () => {
    const mockTickets = [{ id: 1, status: "OPEN", subject: "test", priority: "HIGH", category: "TECH" }];
    (supportApi.getTickets as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ response: { ok: true }, data: mockTickets });
    const { result } = renderHook(() => useSupportTickets(""));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tickets).toEqual(mockTickets);
    expect(result.current.error).toBeNull();
  });

  it("handles error", async () => {
    (supportApi.getTickets as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ response: { ok: false }, data: {} });
    const { result } = renderHook(() => useSupportTickets("OPEN"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to load tickets");
  });
});

describe("useSupportUnread", () => {
  beforeEach(() => vi.clearAllMocks());

  it("computes unread count", async () => {
    (supportApi.getTickets as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: { ok: true },
      data: [{ id: 1, unread_count: 2 }, { id: 2, unread_count: 3 }],
    });
    const { result } = renderHook(() => useSupportUnread());
    await waitFor(() => expect(result.current).toBe(5));
  });
});
