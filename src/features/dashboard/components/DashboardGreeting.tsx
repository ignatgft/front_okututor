import { useTranslation } from "react-i18next";
import useAuthStore from "../../../store/authStore";

export function DashboardGreeting(): JSX.Element {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user as Record<string, unknown> | null);
  const name = ((user?.["full_name"] as string | undefined) ?? "").split(" ")[0] || "";
  return (
    <div className="dashboard-greeting">
      <h2>{t("dashboard.greeting", "Hello, {{name}}", { name })}</h2>
    </div>
  );
}
