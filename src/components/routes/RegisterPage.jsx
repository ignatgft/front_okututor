import { lazy } from "react";
import AuthPage from "./AuthPage";

const PgMain = lazy(() => import("../../pages/PgMain"));

export default function RegisterPage() {
  return (
    <AuthPage modalType="register">
      <PgMain />
    </AuthPage>
  );
}
