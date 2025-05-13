import React, { useState, useEffect } from "react";
import CardCourse from "../../components/CardCourse";
import "../../styles/SearchCss/SearchBar.css";
import searchIcon from '../../assets/SearchPg/search-icon.svg';

const SearchBar = () => {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    days: [],
    group_size: [],
    location_type: []
  });

  useEffect(() => {
    const fetchCoursesAndUsers = async () => {
      try {
        const coursesResponse = await fetch(`${import.meta.env.VITE_API_URL}/courses`);
        const coursesData = await coursesResponse.json();
        if (!Array.isArray(coursesData)) throw new Error("Invalid course format");
        setCourses(coursesData);

        const userIds = [...new Set(coursesData.map(course => course.teacher_id))];
        const usersData = {};
        for (const userId of userIds) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/user/${userId}`);
          const data = await res.json();
          if (res.ok && !data.error) usersData[userId] = data;
        }
        setUsers(usersData);
      } catch (err) {
        setError("Error loading courses: " + err.message);
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

  const matchesFilters = (course) => {
    const { days, group_size, location_type } = filters;
    return (
      (days.length === 0 || days.includes(course.days)) &&
      (group_size.length === 0 || group_size.includes(course.group_size)) &&
      (location_type.length === 0 || location_type.includes(course.location_type))
    );
  };

  const filteredCourses = courses.filter(course => {
    const user = users[course.teacher_id];
    const query = searchQuery.toLowerCase();
    return (
      matchesFilters(course) &&
      (course.title?.toLowerCase().includes(query) ||
       user?.full_name?.toLowerCase().includes(query))
    );
  });

  return (
    <div className="search-page">
      <h1>Studying Online is now much easier!</h1>
      <div className="search-layout">
        <div className="search-main">
          <div className="search-wrapper">
            <div className="search-input-wrapper">
              <img src={searchIcon} alt="search icon" className="search-icon" />
              <input
                type="text"
                placeholder="Find your tutor"
                className="search-input"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <button className="search-btn">Search</button>
          </div>
          <div className="search-content">
            <aside className="filter-panel">
              <h4>Filter by Days</h4>
              {["weekdays", "weekends", "specific"].map(opt => (
                <label key={opt}><input type="checkbox" onChange={() => handleCheckboxChange("days", opt)} /> {opt}</label>
              ))}
    
              <h4>Group Size</h4>
              {["individual", "group"].map(opt => (
                <label key={opt}><input type="checkbox" onChange={() => handleCheckboxChange("group_size", opt)} /> {opt}</label>
              ))}
    
              <h4>Location</h4>
              {["online", "offline"].map(opt => (
                <label key={opt}><input type="checkbox" onChange={() => handleCheckboxChange("location_type", opt)} /> {opt}</label>
              ))}
            </aside>
            <div className="card-courses-content">
              <h3>All Tutor list</h3>
              {filteredCourses.length === 0 && !error && <p>No courses found.</p>}
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
