// migrated to TSX — minimal strict types (controlled)
import { useEffect } from "react";
import Profile from "../components/Profile";
import { usePageTitle } from "../components/pageTitleContext";
import { useTranslation } from "react-i18next";

function PgProfile() {
  const { t } = useTranslation();
  const setPageTitle = usePageTitle();
  useEffect(() => { setPageTitle(t("profile.my_profile", "Мой профиль")); }, [setPageTitle, t]);
  return (
    <>
      <Profile />
    </>
  );
}

export default PgProfile;
