import { lazy } from "react";
import AuthPage from "./AuthPage";

const PgMain = lazy(() => import("../../pages/PgMain"));

export default function Login() {
  return (
    <AuthPage modalType="login">
      <PgMain />
    </AuthPage>
  );
}
