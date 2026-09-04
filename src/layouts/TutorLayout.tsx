import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../components/DashboardLayout";
import { getPageTitle } from "../config/navigation";

export default function TutorLayout(): JSX.Element {
  const { t } = useTranslation();
  const location = useLocation();
  const titleKey = getPageTitle("tutor", location.pathname);
  const title = titleKey ? t(titleKey) : "";
  return <DashboardLayout title={title} />;
}
