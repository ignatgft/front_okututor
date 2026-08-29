import { create } from "zustand";

interface UIState {
  isAuthOpen: boolean;
  isRegisterOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  openRegister: () => void;
  closeRegister: () => void;
}

/**
 * Global, screen-independent UI flags. Kept intentionally tiny — layout and
 * navigation state stays local to screens, never global.
 */
export const useUIStore = create<UIState>((set) => ({
  isAuthOpen: false,
  isRegisterOpen: false,
  openAuth: () => set({ isAuthOpen: true }),
  closeAuth: () => set({ isAuthOpen: false }),
  openRegister: () => set({ isRegisterOpen: true }),
  closeRegister: () => set({ isRegisterOpen: false }),
}));