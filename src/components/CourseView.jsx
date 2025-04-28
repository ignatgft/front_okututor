import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import "../styles/Course.css";

const Course = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    days: "", // weekdays, weekends, specific
    specific_days: [], // массив дней, если days === "specific"
    group_size: "", // individual, group
    location_type: "", // offline, online
    experience: 0, // целое число
    price_per_hour: 0, // число с плавающей точкой
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Проверяем, авторизован ли пользователь
  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/");
    }
  }, [navigate]);

  // Опции для выпадающих списков
  const daysOptions = [
    { value: "weekdays", label: "Weekdays" },
    { value: "weekends", label: "Weekends" },
    { value: "specific", label: "Specific Days" },
  ];
  const specificDaysOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const groupSizeOptions = [
    { value: "individual", label: "Individual" },
    { value: "group", label: "Group" },
  ];
  const locationTypeOptions = [
    { value: "offline", label: "Offline" },
    { value: "online", label: "Online" },
  ];

  // Обработчик изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Преобразуем числовые поля
    let newValue = value;
    if (name === "experience") {
      newValue = parseInt(value) || 0;
    } else if (name === "price_per_hour") {
      newValue = parseFloat(value) || 0;
    } else if (name === "days" && value !== "specific") {
      // Если days не "specific", очищаем specific_days
      setFormData((prev) => ({ ...prev, specific_days: [] }));
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  // Обработчик выбора конкретных дней
  const handleSpecificDaysChange = (day) => {
    setFormData((prev) => {
      const specific_days = prev.specific_days.includes(day)
        ? prev.specific_days.filter((d) => d !== day)
        : [...prev.specific_days, day];
      return { ...prev, specific_days };
    });
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Валидация числовых полей
    if (formData.experience < 0) {
      setError("Experience must be a non-negative number");
      return;
    }
    if (formData.price_per_hour < 0) {
      setError("Price per hour must be a non-negative number");
      return;
    }

    const user_id = auth.currentUser.uid;
    const dataToSend = {
      user_id,
      title: formData.title,
      description: formData.description,
      days: formData.days,
      specific_days: formData.days === "specific" ? formData.specific_days.join(",") : null, // преобразуем массив в строку
      group_size: formData.group_size,
      location_type: formData.location_type,
      experience: formData.experience,
      price_per_hour: formData.price_per_hour,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess("Course created successfully!");
        navigate(`/course/${result.course_id}`);
      } else {
        setError(result.error || "Failed to create course");
      }
    } catch (err) {
      setError("Error creating course: " + err.message);
    }
  };

  // Обработчик отмены
  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="course-page">
      <div className="course-header">
        <h1>Create your Success & Start Earning</h1>
      </div>
      <div className="course-form-container">
        <h2>Create your Course!</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Course Information</h3>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <div className="form-field">
              <label>Name*</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="English language"
                required
              />
              <p className="field-description">Write down your course name</p>
            </div>

            <div className="form-field">
              <label>Days of week*</label>
              <select
                name="days"
                value={formData.days}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>
                  Choose when you can teach
                </option>
                {daysOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="field-description">Choose when you can teach</p>
            </div>

            {formData.days === "specific" && (
              <div className="form-field specific-days-field">
                <label>Specific Days*</label>
                <div className="multi-select">
                  {specificDaysOptions.map((day) => (
                    <div key={day} className="select-item">
                      <input
                        type="checkbox"
                        id={`specific-${day}`}
                        checked={formData.specific_days.includes(day)}
                        onChange={() => handleSpecificDaysChange(day)}
                      />
                      <label htmlFor={`specific-${day}`}>{day}</label>
                    </div>
                  ))}
                </div>
                <p className="field-description">Choose specific days you can teach</p>
              </div>
            )}

            <div className="form-field">
              <label>Group size*</label>
              <select
                name="group_size"
                value={formData.group_size}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>
                  Choose the type of course
                </option>
                {groupSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="field-description">Choose the type of course</p>
            </div>

            <div className="form-field">
              <label>Place for course*</label>
              <select
                name="location_type"
                value={formData.location_type}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>
                  Choose the format of your course
                </option>
                {locationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="field-description">Choose the format of your course</p>
            </div>

            <div className="form-field">
              <label>Description*</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Write something about the course"
                required
              />
              <p className="field-description">Brief description for your course</p>
            </div>

            <div className="form-field">
              <label>Experience (years)*</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                min="0"
                required
              />
              <p className="field-description">Write down your experience in years</p>
            </div>

            <div className="form-field">
              <label>Price per hour (som)*</label>
              <input
                type="number"
                name="price_per_hour"
                value={formData.price_per_hour}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
              <p className="field-description">How much will your course cost per hour</p>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="create-btn">
                Create
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Course;