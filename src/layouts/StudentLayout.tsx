import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../components/DashboardLayout";
import { getPageTitle } from "../config/navigation";

export default function StudentLayout(): JSX.Element {
  const { t } = useTranslation();
  const location = useLocation();
  const titleKey = getPageTitle("student", location.pathname);
  const title = titleKey ? t(titleKey) : "";
  return <DashboardLayout title={title} />;
}
