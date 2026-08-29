import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import useAuthStore from "../store/authStore";

const renderAt = (path, ui) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>HOME</div>} />
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route path="/403" element={<div>FORBIDDEN</div>} />
        <Route element={<ProtectedRoute roles={["TUTOR"]} />}>
          <Route path="/tutor/courses/new" element={<div>SECRET</div>} />
        </Route>
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, status: "unauthenticated" });
});

afterEach(() => {
  cleanup();
});

describe("ProtectedRoute", () => {
  it("renders children for an authenticated allowed role", () => {
    useAuthStore.setState({
      user: { id: 1, role: "TUTOR" },
      isAuthenticated: true,
    });
    renderAt("/tutor/courses/new");
    expect(screen.getByText("SECRET")).toBeTruthy();
  });

  it("redirects anonymous users away", () => {
    renderAt("/tutor/courses/new");
    expect(screen.queryByText("SECRET")).toBe(null);
    expect(screen.getByText("LOGIN")).toBeTruthy();
  });

  it("redirects users with a disallowed role", () => {
    useAuthStore.setState({
      user: { id: 2, role: "STUDENT" },
      isAuthenticated: true,
    });
    renderAt("/tutor/courses/new");
    expect(screen.queryByText("SECRET")).toBe(null);
    expect(screen.getByText("FORBIDDEN")).toBeTruthy();
  });
});
