import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ApplicationWizard from "./ApplicationWizard";
import { studentsApi } from "../../api/students.api";

vi.mock("../../api/students.api", () => ({
  studentsApi: { requestCourse: vi.fn() },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k, a, b) => {
    const opts = typeof a === "object" && a !== null ? a : b;
    const fb = typeof a === "string" ? a : typeof b === "string" ? b : undefined;
    if (k === "application.step_of" && opts) return `Step ${opts.step} of ${opts.total}`;
    if (k === "application.error_time_range") return fb || k;
    if (k === "errors.applicationAlreadyExists") return "You already sent an application";
    if (k === "errors.default") return "Something went wrong.";
    if (typeof k === "string" && k.startsWith("application.")) return k;
    return fb || k;
  }}),
}));

describe("ApplicationWizard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("disables next when format not chosen", async () => {
    render(<ApplicationWizard courseId="c1" isOpen onClose={vi.fn()} />);
    const nextBtn = screen.getByText("application.next");
    expect(nextBtn).toBeDisabled();
    // after choosing format, enabled
    fireEvent.click(screen.getByText("application.format_online"));
    expect(nextBtn).toBeEnabled();
  });

  it("allows progressing through steps with valid data", async () => {
    render(<ApplicationWizard courseId="c1" isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("application.format_online"));
    fireEvent.click(screen.getByText("application.next"));
    // step 1: pick days
    const mondayBtn = screen.getByText("application.days_monday");
    fireEvent.click(mondayBtn);
    fireEvent.click(screen.getByText("application.next"));
    // step 2: frequency/duration
    expect(screen.getByText("application.frequency_title")).toBeInTheDocument();
    fireEvent.click(screen.getByText("application.frequency_1"));
    fireEvent.click(screen.getByText("application.duration_60"));
    expect(screen.getByText("application.submit")).toBeInTheDocument();
  });

  it("validates startTime < endTime", async () => {
    render(<ApplicationWizard courseId="c1" isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("application.format_online"));
    fireEvent.click(screen.getByText("application.next"));
    // set bad times
    const startInput = document.getElementById("app-start");
    const endInput = document.getElementById("app-end");
    fireEvent.change(startInput, { target: { value: "20:00" } });
    fireEvent.change(endInput, { target: { value: "18:00" } });
    fireEvent.click(screen.getByText("application.days_monday"));
    fireEvent.click(screen.getByText("application.next"));
    expect(await screen.findByText("Start time must be before end time")).toBeInTheDocument();
  });

  it("submits successfully and shows success", async () => {
    studentsApi.requestCourse.mockResolvedValue({ response: { ok: true, status: 200 }, data: { id: "e1" } });
    render(<ApplicationWizard courseId="c1" isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByText("application.format_online"));
    fireEvent.click(screen.getByText("application.next"));
    fireEvent.click(screen.getByText("application.days_monday"));
    // keep default 18:00-20:00 valid
    fireEvent.click(screen.getByText("application.next"));
    fireEvent.click(screen.getByText("application.frequency_1"));
    fireEvent.click(screen.getByText("application.duration_60"));
    fireEvent.click(screen.getByText("application.submit"));
    await waitFor(() => expect(screen.getByText("application.success_title")).toBeInTheDocument());
  });

  it("handles 409 conflict", async () => {
    studentsApi.requestCourse.mockResolvedValue({ response: { ok: false, status: 409 }, data: {} });
    render(<ApplicationWizard courseId="c1" isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("application.format_online"));
    fireEvent.click(screen.getByText("application.next"));
    fireEvent.click(screen.getByText("application.days_monday"));
    fireEvent.click(screen.getByText("application.next"));
    fireEvent.click(screen.getByText("application.frequency_1"));
    fireEvent.click(screen.getByText("application.duration_60"));
    fireEvent.click(screen.getByText("application.submit"));
    await waitFor(() => expect(screen.getByText(/You already/)).toBeInTheDocument());
  });

  it("handles network error", async () => {
    studentsApi.requestCourse.mockRejectedValue(new Error("network fail"));
    render(<ApplicationWizard courseId="c1" isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("application.format_online"));
    fireEvent.click(screen.getByText("application.next"));
    fireEvent.click(screen.getByText("application.days_monday"));
    fireEvent.click(screen.getByText("application.next"));
    fireEvent.click(screen.getByText("application.frequency_1"));
    fireEvent.click(screen.getByText("application.duration_60"));
    fireEvent.click(screen.getByText("application.submit"));
    await waitFor(() => expect(screen.getByText("network fail")).toBeInTheDocument());
  });
});
