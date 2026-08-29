import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { ToastProvider, useToast } from "./Toast";

const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({
  lng: "en",
  resources: { en: { translation: { a11y: { dismiss: "Dismiss" } } } },
  interpolation: { escapeValue: false },
});

afterEach(cleanup);

function Trigger({ action }) {
  const toast = useToast();
  return <button type="button" onClick={() => toast[action]("Saved!")} />;
}

const renderWithProvider = (action) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ToastProvider>
        <Trigger action={action} />
      </ToastProvider>
    </I18nextProvider>
  );

describe("Toast", () => {
  it("shows a success toast and dismisses it via the close button", () => {
    renderWithProvider("success");
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Saved!")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Saved!")).toBe(null);
  });

  it("auto-dismisses after the given duration", async () => {
    vi.useFakeTimers();
    render(
      <I18nextProvider i18n={i18n}>
        <ToastProvider>
          <Trigger action="info" />
        </ToastProvider>
      </I18nextProvider>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Saved!")).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(4500);
    });
    expect(screen.queryByText("Saved!")).toBe(null);
    vi.useRealTimers();
  });
});
