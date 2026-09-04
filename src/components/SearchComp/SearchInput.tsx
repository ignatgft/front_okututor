// migrated to TSX — minimal strict types (controlled)
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import searchIcon from "../../assets/SearchPg/search-icon.svg";

export default function SearchInput({
  value,
  onChange,
  onSubmit,
  suggestions = { courses: [], tutors: [] },
  suggestionsOpen = false,
  onSuggestionSelect,
  onSuggestionsClose,
}) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(-1);

  const items = useMemo(
    () => [
      ...(suggestions.courses || []).map((c) => ({
        type: "course",
        id: c.id,
        title: c.title,
        meta: c.subject,
      })),
      ...(suggestions.tutors || []).map((tutor) => ({
        type: "tutor",
        id: tutor.id,
        title: tutor.full_name,
        meta: "",
      })),
    ],
    [suggestions]
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, [items]);

  const open = suggestionsOpen && items.length > 0;

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      onSuggestionSelect(items[activeIndex]);
    } else if (e.key === "Escape") {
      onSuggestionsClose();
    }
  };

  const courseItems = items.filter((item) => item.type === "course");
  const tutorItems = items.filter((item) => item.type === "tutor");

  const renderItem = (item) => {
    const index = items.indexOf(item);
    return (
      <li
        key={`${item.type}-${item.id}`}
        id={`search-suggestion-${index}`}
        role="option"
        aria-selected={index === activeIndex}
        className={`suggestion-item ${index === activeIndex ? "active" : ""}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onSuggestionSelect(item)}
        onMouseEnter={() => setActiveIndex(index)}
      >
        <span className="suggestion-title">{item.title}</span>
        {item.meta && <span className="suggestion-meta">{item.meta}</span>}
      </li>
    );
  };

  return (
    <form className="search-wrapper" onSubmit={onSubmit}>
      <div className="search-input-wrapper">
        <img src={searchIcon} alt="" className="search-icon" />
        <input
          type="search"
          placeholder={t("search.placeholder")}
          className="search-input"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(onSuggestionsClose, 120)}
          aria-label={t("search.placeholder")}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `search-suggestion-${activeIndex}` : undefined}
        />
        {open && (
          <div id="search-suggestions" className="suggestions-dropdown" role="listbox">
            {courseItems.length > 0 && (
              <div className="suggestions-group">
                <div className="suggestions-group-label">{t("search.suggestions_courses", "Courses")}</div>
                <ul className="suggestions-list">{courseItems.map(renderItem)}</ul>
              </div>
            )}
            {tutorItems.length > 0 && (
              <div className="suggestions-group">
                <div className="suggestions-group-label">{t("search.suggestions_tutors", "Tutors")}</div>
                <ul className="suggestions-list">{tutorItems.map(renderItem)}</ul>
              </div>
            )}
          </div>
        )}
      </div>
      <button type="submit" className="search-btn">{t("search.button")}</button>
    </form>
  );
}
