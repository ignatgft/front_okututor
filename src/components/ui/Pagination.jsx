import { useTranslation } from "react-i18next";

export default function Pagination({ page, totalPages, onChange }) {
  const { t } = useTranslation();
  if (!totalPages || totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <nav className="pagination" aria-label={t("common.pagination", "Pagination")}>
      <button
        type="button"
        className="pagination-btn"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        {t("search.prev", "Previous")}
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`pagination-btn ${p === page ? "active" : ""}`}
          aria-current={p === page ? "page" : undefined}
          onClick={() => onChange(p)}
        >
          {p + 1}
        </button>
      ))}
      <button
        type="button"
        className="pagination-btn"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        {t("search.next", "Next")}
      </button>
    </nav>
  );
}
