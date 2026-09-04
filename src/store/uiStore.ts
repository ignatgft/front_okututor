import { create } from "zustand";

export interface UIState {
  isAuthOpen: boolean;
  isRegisterOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  openRegister: () => void;
  closeRegister: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAuthOpen: false,
  isRegisterOpen: false,
  openAuth: () => set({ isAuthOpen: true }),
  closeAuth: () => set({ isAuthOpen: false }),
  openRegister: () => set({ isRegisterOpen: true }),
  closeRegister: () => set({ isRegisterOpen: false }),
}));

export default useUIStore;
