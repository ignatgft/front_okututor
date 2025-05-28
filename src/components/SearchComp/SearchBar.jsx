// frontend/src/components/SearchComp/SearchBar.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CardCourse from "../../components/CardCourse";
import "../../styles/SearchCss/SearchBar.css";
import searchIcon from '../../assets/SearchPg/search-icon.svg';

const getSearchAliases = (query) => {
  const lowered = query.trim().toLowerCase();

  const aliasMap = {
    "english language": ["english language", "английский язык", "англис тили"],
    "английский язык": ["english language", "английский язык", "англис тили"],
    "англис тили": ["english language", "английский язык", "англис тили"],

    "mathematics": ["mathematics", "математика", "математика сабагы"],
    "математика": ["mathematics", "математика", "математика сабагы"],
    "математика сабагы": ["mathematics", "математика", "математика сабагы"],

    "russian language": ["russian language", "русский язык", "орус тили"],
    "русский язык": ["russian language", "русский язык", "орус тили"],
    "орус тили": ["russian language", "русский язык", "орус тили"],

    "design": ["design", "дизайн"],
    "дизайн": ["design", "дизайн"],

    "it": ["it", "программирование", "it адистиги"],
    "программирование": ["it", "программирование", "it адистиги"],
    "it адистиги": ["it", "программирование", "it адистиги"],

    "sales": ["sales", "продажи", "сатуу"],
    "продажи": ["sales", "продажи", "сатуу"],
    "сатуу": ["sales", "продажи", "сатуу"],

    "music": ["music", "музыка", "ырдоо"],
    "музыка": ["music", "музыка", "ырдоо"],
    "ырдоо": ["music", "музыка", "ырдоо"],

    "Preparation for ORT": ["Preparation for ORT", "Подготовка к ОРТ", "ЖРТга даярдануу"],
    "Подготовка к ОРТ": ["Preparation for ORT", "общереспубликанское тестирование", "ЖРТга даярдануу"],
    "жалпы республикалык тестирлөө": ["Preparation for ORT", "Подготовка к ОРТ", "ЖРТга даярдануу"],
  };

  return aliasMap[lowered] || [lowered];
};

const SearchBar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const qParam = queryParams.get("q") || "";

  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState({});
  const [searchQuery, setSearchQuery] = useState(qParam);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    days: [],
    group_size: [],
    location_type: [],
    price_max: "",
  });

  useEffect(() => {
    setSearchQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    const fetchCoursesAndUsers = async () => {
      try {
        const coursesResponse = await fetch(`${import.meta.env.VITE_API_URL}/courses`);
        const coursesData = await coursesResponse.json();
        if (!Array.isArray(coursesData)) throw new Error("Invalid course format");
        setCourses(coursesData);

        const userIds = [...new Set(coursesData.map(course => course.teacher_id).filter(Boolean))];
        const usersData = {};
        for (const userId of userIds) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/user/${userId}`);
          const data = await res.json();
          if (res.ok && !data.error) usersData[userId] = data;
        }
        setUsers(usersData);
      } catch (err) {
        setError(t("search.error_loading_courses") + ": " + err.message);
      }
    };

    fetchCoursesAndUsers();
  }, []);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleCheckboxChange = (category, value) => {
    setFilters(prev => {
      const isChecked = prev[category].includes(value);
      const updated = isChecked
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value];
      return { ...prev, [category]: updated };
    });
  };

  const filteredCourses = courses.filter((course) => {
    const user = users[course.teacher_id];
    const aliases = getSearchAliases(searchQuery);

    const queryMatch = aliases.some(alias =>
      course.title?.toLowerCase().includes(alias) ||
      user?.full_name?.toLowerCase().includes(alias)
    );

    const daysMatch = filters.days.length === 0 || filters.days.includes(course.days);
    const locationMatch = filters.location_type.length === 0 || filters.location_type.includes(course.location_type);
    const groupSizeMatch = filters.group_size.length === 0 || filters.group_size.includes(course.group_size);
    const priceMatch = !filters.price_max || course.price_per_hour <= parseFloat(filters.price_max);

    return queryMatch && daysMatch && locationMatch && groupSizeMatch && priceMatch;
  });

  return (
    <div className="search-page">
      <h1>{t("search.title")}</h1>
      <div className="search-layout">
        <div className="search-main">
          <div className="search-wrapper">
            <div className="search-input-wrapper">
              <img src={searchIcon} alt="search icon" className="search-icon" />
              <input
                type="text"
                placeholder={t("search.placeholder")}
                className="search-input"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <button className="search-btn">{t("search.button")}</button>
          </div>

          <div className="search-content">
            <aside className="filter-panel">
              <h3>{t("search.filter_by")}</h3>

              <h4>{t("search.price_max")}</h4>
              <input
                type="number"
                placeholder="e.g. 500"
                value={filters.price_max}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    price_max: e.target.value,
                  }))
                }
                className="price-input"
              />

              <h4>{t("search.days")}</h4>
              {["weekdays", "weekends", "specific"].map(opt => (
                <label key={opt}>
                  <input
                    type="checkbox"
                    onChange={() => handleCheckboxChange("days", opt)}
                  />{" "}
                  {t(`search.${opt}`)}
                </label>
              ))}

              <h4>{t("search.group_size")}</h4>
              {["individual", "group"].map(opt => (
                <label key={opt}>
                  <input
                    type="checkbox"
                    onChange={() => handleCheckboxChange("group_size", opt)}
                  />{" "}
                  {t(`search.${opt}`)}
                </label>
              ))}

              <h4>{t("search.location_type")}</h4>
              {["online", "offline"].map(opt => (
                <label key={opt}>
                  <input
                    type="checkbox"
                    onChange={() => handleCheckboxChange("location_type", opt)}
                  />{" "}
                  {t(`search.${opt}`)}
                </label>
              ))}
            </aside>

            <div className="card-courses-content">
              <h3>{t("search.all_tutor_list")}</h3>
              {filteredCourses.length === 0 && !error && <p>{t("search.no_courses")}</p>}
              <div className="courses-search-grid">
                {filteredCourses.map(course => (
                  <CardCourse key={course.id} course={course} userData={users[course.teacher_id]} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
