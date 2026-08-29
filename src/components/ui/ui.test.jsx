import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { StatusBadge } from "./StatusBadge";
import { Avatar } from "./Avatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { MetricCard } from "./MetricCard";
import { LoadingState } from "./LoadingState";
import { DateTimePicker } from "./DateTimePicker";

const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({
  lng: "en",
  resources: { en: { translation: { common: { loading: "Loading..." } } } },
  interpolation: { escapeValue: false },
});

afterEach(cleanup);

const renderI18n = (ui) => render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);

describe("StatusBadge", () => {
  it("renders with the resolved tone class", () => {
    renderI18n(<StatusBadge status="PENDING" translate={false} />);
    const el = screen.getByText("PENDING");
    expect(el.className).toContain("status-badge-warning");
  });
});

describe("Avatar", () => {
  it("renders an image when src is provided", () => {
    const { container } = render(<Avatar name="John Doe" src="/a.png" alt="JD" />);
    expect(container.querySelector("img")).toBeTruthy();
    expect(screen.getByAltText("JD")).toBeTruthy();
  });

  it("falls back to initials when no src is given", () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText("JD")).toBeTruthy();
  });
});

describe("VerifiedBadge", () => {
  it("renders nothing when not verified", () => {
    const { container } = render(<VerifiedBadge verified={false} />);
    expect(container.querySelector(".verified-badge")).toBeNull();
  });

  it("renders when verified", () => {
    const { container } = render(<VerifiedBadge verified label="OK" />);
    expect(container.querySelector(".verified-badge")).toBeTruthy();
  });
});

describe("MetricCard", () => {
  it("renders label and value", () => {
    render(<MetricCard label="Lessons" value={12} />);
    expect(screen.getByText("Lessons")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });
});

describe("LoadingState", () => {
  it("renders a loading label", () => {
    renderI18n(<LoadingState label="Fetching" />);
    expect(screen.getByText("Fetching")).toBeTruthy();
  });
});

describe("DateTimePicker", () => {
  it("calls onChange with updated value", () => {
    const onChange = vi.fn();
    render(<DateTimePicker value={{ date: "", time: "" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("date"), { target: { value: "2026-09-01" } });
    expect(onChange).toHaveBeenCalledWith({ date: "2026-09-01", time: "" });
  });
});
