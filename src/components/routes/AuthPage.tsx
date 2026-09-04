// migrated to TSX — minimal strict types (controlled)
import { useEffect } from "react";
import { useUIStore } from "../../store/uiStore";

export default function AuthPage({ modalType, children }: Record<string, unknown>) {
  useEffect(() => {
    if (modalType === "login") {
      useUIStore.getState().openAuth();
    } else if (modalType === "register") {
      useUIStore.getState().openRegister();
    }
  }, [modalType]);
  return children;
}
