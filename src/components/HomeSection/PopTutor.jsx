import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import CardCourse from '../../components/CardCourse';
import '../../styles/HomeSectionCSS/PopTutor.css';

const PopTutor = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState({});
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const fetchCoursesAndUsers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/courses`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid course format");

        // Загружаем преподавателей
        const userIds = [...new Set(data.map(c => c.teacher_id).filter(Boolean))];
        const userMap = {};
        for (const id of userIds) {
          const resUser = await fetch(`${import.meta.env.VITE_API_URL}/user/${id}`);
          const userData = await resUser.json();
          if (resUser.ok && !userData.error) userMap[id] = userData;
        }

        setCourses(data);
        setUsers(userMap);
      } catch (err) {
        console.error("Failed to load courses:", err.message);
      }
    };

    fetchCoursesAndUsers();
  }, []);

  const topCourses = [...courses]
    .filter(c => typeof c.average_rating === "number")
    .sort((a, b) => b.average_rating - a.average_rating)
    .slice(0, 3);

  const handleClick = () => {
    setIsClicked(!isClicked);
  };

  return (
    <section className="category-section inter">
      <div className="category-header">
        <span className="category-subtitle">{t("pop.subtitle")}</span>
        <h2 className="category-title">{t("pop.title")}</h2>
      </div>

      <div className="category-grid">
        {topCourses.map(course => (
          <CardCourse key={course.id} course={course} userData={users[course.teacher_id]} />
        ))}
      </div>
    </section>
  );
};

export default PopTutor;
