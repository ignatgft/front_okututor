import { describe, it, expect } from "vitest";
import { useUIStore } from "./uiStore";

describe("uiStore", () => {
  it("toggles auth modal", () => {
    const { openAuth, closeAuth, openRegister, closeRegister } = useUIStore.getState();
    expect(useUIStore.getState().isAuthOpen).toBe(false);
    openAuth();
    expect(useUIStore.getState().isAuthOpen).toBe(true);
    closeAuth();
    expect(useUIStore.getState().isAuthOpen).toBe(false);
    expect(useUIStore.getState().isRegisterOpen).toBe(false);
    openRegister();
    expect(useUIStore.getState().isRegisterOpen).toBe(true);
    closeRegister();
    expect(useUIStore.getState().isRegisterOpen).toBe(false);
  });
});
