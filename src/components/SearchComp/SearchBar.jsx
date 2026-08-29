import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SearchInput from "./SearchInput";
import SearchFilters from "./SearchFilters";
import CourseResults from "./CourseResults";
import { useCourseSearch } from "../../hooks/useCourseSearch";
import "../../styles/SearchCss/SearchBar.css";

const SearchBar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const {
    courses, searchQuery, error, loading, totalPages, totalResults, filters,
    suggestions, suggestionsOpen, handlers,
  } = useCourseSearch();

  const handleSuggestionSelect = (suggestion) => {
    handlers.closeSuggestions();
    navigate(suggestion.type === "tutor" ? `/tutor/${suggestion.id}` : `/course/${suggestion.id}`);
  };

  const hasActiveFilters =
    filters.subject ||
    filters.location_type.length > 0 ||
    filters.group_size.length > 0 ||
    filters.days.length > 0 ||
    filters.min_price ||
    filters.max_price ||
    filters.rating > 0;

  const resetFilters = () => {
    handlers.applyFilters({
      subject: "",
      location_type: [],
      group_size: [],
      days: [],
      min_price: "",
      max_price: "",
      rating: 0,
      sort: "recommended",
      page: 0,
    });
  };

  return (
    <div className="search-page">
      <div className="search-layout">
        <div className="search-main">
          <SearchInput
            value={searchQuery}
            onChange={handlers.handleSearchChange}
            onSubmit={handlers.handleSearchSubmit}
            suggestions={suggestions}
            suggestionsOpen={suggestionsOpen}
            onSuggestionSelect={handleSuggestionSelect}
            onSuggestionsClose={handlers.closeSuggestions}
          />

          <button
            type="button"
            className="filters-toggle btn-secondary show-mobile"
            aria-expanded={isFiltersOpen}
            aria-controls="mobile-filter-panel"
            onClick={() => setIsFiltersOpen((open) => !open)}
          >
            {t("search.filters", "Filters")}
          </button>

          <div className={`mobile-filters-overlay ${isFiltersOpen ? "open" : ""}`} hidden={!isFiltersOpen}>
            <div
              className="mobile-filters-backdrop"
              onClick={() => setIsFiltersOpen(false)}
              onKeyDown={(e) => { if (e.key === "Escape") setIsFiltersOpen(false); }}
              role="button"
              tabIndex={-1}
              aria-hidden="true"
            />
            <aside id="mobile-filter-panel" className="filter-panel mobile-filter-panel" role="dialog" aria-label={t("search.filter_by")}>
              <div className="mobile-filters-header">
                <h3>{t("search.filter_by")}</h3>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setIsFiltersOpen(false)}
                  aria-label={t("common.close", "Close")}
                >
                  ✕
                </button>
              </div>
              <SearchFilters
                filters={filters}
                onApply={handlers.applyFilters}
                onCheckbox={handlers.handleCheckboxChange}
                onRating={handlers.handleRatingChange}
              />
            </aside>
          </div>

          <div className="search-content">
            <aside className="filter-panel hide-mobile">
              <SearchFilters
                filters={filters}
                onApply={handlers.applyFilters}
                onCheckbox={handlers.handleCheckboxChange}
                onRating={handlers.handleRatingChange}
              />
              {hasActiveFilters && (
                <button type="button" className="reset-filters-btn" onClick={resetFilters}>
                  {t("search.reset_all", "Reset all")}
                </button>
              )}
            </aside>

            <CourseResults
              courses={courses}
              loading={loading}
              error={error}
              totalPages={totalPages}
              page={filters.page}
              onPageChange={handlers.handlePageChange}
              resultCount={totalResults}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
