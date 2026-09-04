// migrated to TSX — minimal strict types (controlled)
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CardCourse from "../../components/CardCourse";
import { endpoints } from "../../api/endpoints";
import { apiClient } from "../../api/http";
import "../../styles/HomeSectionCSS/PopTutor.css";

const PopTutor = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCoursesAndUsers = async () => {
      setIsLoading(true);
      setError("");
      try {
        const { data } = await apiClient.get(endpoints.courses.popular, false);
        if (!Array.isArray(data)) throw new Error("Invalid course format");

        const userIds = [...new Set(data.map((c) => c.teacher_id).filter(Boolean))];
        const userMap = {};
        for (const id of userIds) {
          const { response: resUser, data: userData } = await apiClient.get(endpoints.users.byId(id), false);
          if (resUser.ok && !userData.error) userMap[id] = userData;
        }

        setCourses(data);
        setUsers(userMap);
      } catch (err) {
        console.error("Failed to load courses:", err.message);
        setError(t("pop.error_loading"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoursesAndUsers();

    const intervalId = setInterval(fetchCoursesAndUsers, 30000);

    return () => clearInterval(intervalId);
  }, [t]);

  const topCourses = [...courses]
    .filter((c) => typeof c.average_rating === "number" && !isNaN(c.average_rating))
    .sort((a, b) => b.average_rating - a.average_rating)
    .slice(0, 3);

  return (
    <section className="category-section inter">
      <div className="category-header">
        <span className="category-subtitle">{t("pop.subtitle")}</span>
        <h2 className="category-title">{t("pop.title")}</h2>
      </div>

      {error && <p className="error-message">{error}</p>}

      {isLoading ? (
        <p>{t("pop.loading")}</p>
      ) : topCourses.length === 0 && !error ? (
        <p>{t("pop.no_courses")}</p>
      ) : (
        <div className="category-grid">
          {topCourses.map((course) => (
            <CardCourse
              key={course.id}
              course={{
                ...course,
                teacherName: users[course.teacher_id]
                  ? `${users[course.teacher_id].first_name || ""} ${users[course.teacher_id].last_name || ""}`.trim()
                  : "",
                teacherAvatar: users[course.teacher_id]?.avatar || "",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default PopTutor;
