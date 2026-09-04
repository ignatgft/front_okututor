import type { ReactNode } from "react";
import { ToastProvider } from "../../components/ui/Toast";
import ErrorBoundary from "../../components/ErrorBoundary";
import "../../styles/Toast.css";

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return (
    <ToastProvider>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ToastProvider>
  );
}
