import { useTranslation } from "react-i18next";
import {
  SEARCH_SUBJECTS,
  SEARCH_SORT_OPTIONS,
} from "../../constants/search";

export default function SearchFilters({ filters, onApply, onCheckbox, onRating }) {
  const { t } = useTranslation();

  const renderFilterStars = (rating) => (
    <div className="filter-star-rating" role="radiogroup" aria-label={t("search.rating", "Rating")}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`filter-star ${i <= rating ? "active" : ""}`}
          onClick={() => onRating(i)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRating(i); } }}
          role="radio"
          tabIndex={0}
          aria-checked={i <= rating}
          aria-label={`${i} ${t("search.rating", "Rating")}`}
        >
          &#9733;
        </span>
      ))}
    </div>
  );

  return (
    <>
      <h3>{t("search.filter_by")}</h3>

      <h4>{t("search.sort_by", "Sort by")}</h4>
      <select
        value={filters.sort}
        onChange={(e) => onApply((prev) => ({ ...prev, sort: e.target.value, page: 0 }))}
        className="filter-select"
        aria-label={t("search.sort_by", "Sort by")}
      >
        {SEARCH_SORT_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{t(`search.sort_${opt}`, opt)}</option>
        ))}
      </select>

      <h4>{t("search.subject", "Subject")}</h4>
      <select
        value={filters.subject}
        onChange={(e) => onApply((prev) => ({ ...prev, subject: e.target.value, page: 0 }))}
        className="filter-select"
        aria-label={t("search.subject", "Subject")}
      >
        <option value="">{t("search.all_subjects", "All Subjects")}</option>
        {SEARCH_SUBJECTS.map((subj) => (
          <option key={subj.value} value={subj.value}>{t(subj.labelKey, subj.value)}</option>
        ))}
      </select>

      <h4>{t("search.price_max")}</h4>
      <div className="price-range">
        <input
          type="number"
          placeholder={t("search.price_min_placeholder", "Min")}
          defaultValue={filters.min_price}
          onBlur={(e) => onApply((prev) => ({ ...prev, min_price: e.target.value, page: 0 }))}
          className="price-input"
          aria-label={t("search.price_min", "Min price")}
          min="0"
        />
        <span>-</span>
        <input
          type="number"
          placeholder={t("search.price_max_placeholder", "Max")}
          defaultValue={filters.max_price}
          onBlur={(e) => onApply((prev) => ({ ...prev, max_price: e.target.value, page: 0 }))}
          className="price-input"
          aria-label={t("search.price_max", "Max price")}
          min="0"
        />
      </div>

      <h4>{t("search.rating", "Rating")}</h4>
      {renderFilterStars(filters.rating)}

      <h4>{t("search.days")}</h4>
      {["weekdays", "weekends", "specific"].map((opt) => (
        <label key={opt}>
          <input
            type="checkbox"
            checked={filters.days.includes(opt)}
            onChange={() => onCheckbox("days", opt)}
          />{" "}
          {t(`search.${opt}`)}
        </label>
      ))}

      <h4>{t("search.group_size")}</h4>
      {["individual", "group"].map((opt) => (
        <label key={opt}>
          <input
            type="checkbox"
            checked={filters.group_size.includes(opt)}
            onChange={() => onCheckbox("group_size", opt)}
          />{" "}
          {t(`search.${opt}`)}
        </label>
      ))}

      <h4>{t("search.location_type")}</h4>
      {["online", "offline"].map((opt) => (
        <label key={opt}>
          <input
            type="checkbox"
            checked={filters.location_type.includes(opt)}
            onChange={() => onCheckbox("location_type", opt)}
          />{" "}
          {t(`search.${opt}`)}
        </label>
      ))}
    </>
  );
}
