import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CourseView from "./CourseView";
import { apiClient } from "../api/http";
import useAuthStore from "../store/authStore";
import { useUIStore } from "../store/uiStore";

vi.mock("../api/http", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}));

vi.mock("../store/authStore", () => ({
  default: vi.fn(),
}));

vi.mock("../store/uiStore", () => ({
  useUIStore: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k, fb) => fb || k }),
}));

describe("CourseView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.mockReturnValue({ user: { id: 1, role: "STUDENT" }, isAuthenticated: true });
    useUIStore.mockReturnValue({ openAuth: vi.fn() });
  });

  const renderView = (courseId = "1") => {
    return render(
      <MemoryRouter initialEntries={[`/course/${courseId}`]}>
        <Routes>
          <Route path="/course/:courseId" element={<CourseView />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("shows loading then course data", async () => {
    apiClient.get.mockImplementation((path) => {
      if (path.includes("/courses/1") && !path.includes("reviews") && !path.includes("enrollment") && !path.includes("can-review")) {
        return Promise.resolve({ response: { ok: true }, data: { id: 1, title: "Math", description: "Desc", teacher_id: 2, teacher_name: "Tutor", price_per_hour: 100 } });
      }
      if (path.includes("/reviews")) return Promise.resolve({ response: { ok: true }, data: [] });
      if (path.includes("/enrollment")) return Promise.resolve({ response: { ok: true }, data: { status: "PENDING", id: "e1" } });
      if (path.includes("can-review")) return Promise.resolve({ response: { ok: true }, data: { eligible: false } });
      return Promise.resolve({ response: { ok: true }, data: {} });
    });

    renderView("1");
    await waitFor(() => expect(screen.getByText("Math")).toBeInTheDocument());
  });

  it("shows not found when course missing", async () => {
    apiClient.get.mockResolvedValue({ response: { ok: false }, data: { error: "Not found" } });
    renderView("999");
    await waitFor(() => expect(screen.getByText("Not found")).toBeInTheDocument());
  });

  it("hides apply for owner", async () => {
    useAuthStore.mockReturnValue({ user: { id: 2, role: "TUTOR" }, isAuthenticated: true });
    apiClient.get.mockImplementation((path) => {
      if (path.includes("/courses/1") && !path.includes("reviews") && !path.includes("enrollment") && !path.includes("can-review")) {
        return Promise.resolve({ response: { ok: true }, data: { id: 1, title: "Math", description: "Desc", teacher_id: 2, teacher_name: "Tutor" } });
      }
      if (path.includes("/reviews")) return Promise.resolve({ response: { ok: true }, data: [] });
      return Promise.resolve({ response: { ok: true }, data: {} });
    });
    renderView("1");
    await waitFor(() => expect(screen.getByText("Math")).toBeInTheDocument());
    expect(screen.queryByText("Submit application")).not.toBeInTheDocument();
  });

  it("shows CTA for pending enrollment", async () => {
    apiClient.get.mockImplementation((path) => {
      if (path.includes("/courses/1") && !path.includes("reviews") && !path.includes("enrollment") && !path.includes("can-review")) {
        return Promise.resolve({ response: { ok: true }, data: { id: 1, title: "Math", description: "Desc", teacher_id: 2 } });
      }
      if (path.includes("/reviews")) return Promise.resolve({ response: { ok: true }, data: [] });
      if (path.includes("/enrollment")) return Promise.resolve({ response: { ok: true }, data: { status: "PENDING", id: "e1" } });
      if (path.includes("can-review")) return Promise.resolve({ response: { ok: true }, data: { eligible: false } });
      return Promise.resolve({ response: { ok: true }, data: {} });
    });
    renderView("1");
    await waitFor(() => expect(screen.getByText("Math")).toBeInTheDocument());
    expect(await screen.findByText("statuses.PENDING")).toBeInTheDocument();
  });
});
