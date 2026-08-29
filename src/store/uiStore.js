import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isAuthOpen: false,
  isRegisterOpen: false,
  openAuth: () => set({ isAuthOpen: true }),
  closeAuth: () => set({ isAuthOpen: false }),
  openRegister: () => set({ isRegisterOpen: true }),
  closeRegister: () => set({ isRegisterOpen: false }),
}));