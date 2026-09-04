// migrated to TSX — minimal strict types (controlled)
import { useTranslation } from "react-i18next";
import SearchBar from "../components/SearchComp/SearchBar";

export default function PgStudentSearch() {
  const { t } = useTranslation();
  return (
    <div>
      <section className="search-hero">
        <h1>{t("search.hero_title", "Studying Online is now much easier!")}</h1>
        <p>{t("search.hero_subtitle", "Find the perfect tutor for any subject")}</p>
      </section>
      <SearchBar />
    </div>
  );
}
