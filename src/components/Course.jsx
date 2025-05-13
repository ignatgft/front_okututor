import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { auth } from "../firebaseConfig";
import "../styles/Course.css";

const Course = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    days: "",
    specific_days: [],
    group_size: "",
    location_type: "",
    experience: 0,
    price_per_hour: 0,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/");
    }
  }, [navigate]);

  const daysOptions = [
    { value: "weekdays", label: t("course.days.weekdays") },
    { value: "weekends", label: t("course.days.weekends") },
    { value: "specific", label: t("course.days.specific") },
  ];
  const specificDaysOptions = [
    t("days.monday"), t("days.tuesday"), t("days.wednesday"),
    t("days.thursday"), t("days.friday"), t("days.saturday"), t("days.sunday")
  ];
  const groupSizeOptions = [
    { value: "individual", label: t("course.group.individual") },
    { value: "group", label: t("course.group.group") },
  ];
  const locationTypeOptions = [
    { value: "offline", label: t("course.location.offline") },
    { value: "online", label: t("course.location.online") },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "experience") newValue = parseInt(value) || 0;
    if (name === "price_per_hour") newValue = parseFloat(value) || 0;
    if (name === "days" && value !== "specific") {
      setFormData((prev) => ({ ...prev, specific_days: [] }));
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSpecificDaysChange = (day) => {
    setFormData((prev) => {
      const updated = prev.specific_days.includes(day)
        ? prev.specific_days.filter((d) => d !== day)
        : [...prev.specific_days, day];
      return { ...prev, specific_days: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.experience < 0) {
      setError(t("course.errors.experience"));
      return;
    }
    if (formData.price_per_hour < 0) {
      setError(t("course.errors.price"));
      return;
    }

    const user_id = auth.currentUser.uid;
    const dataToSend = {
      user_id,
      title: formData.title,
      description: formData.description,
      days: formData.days,
      specific_days: formData.days === "specific" ? formData.specific_days.join(",") : null,
      group_size: formData.group_size,
      location_type: formData.location_type,
      experience: formData.experience,
      price_per_hour: formData.price_per_hour,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess(t("course.success"));
        navigate(`/course/${result.course_id}`);
      } else {
        setError(result.error || t("course.errors.default"));
      }
    } catch (err) {
      setError(t("course.errors.network") + err.message);
    }
  };

  const handleCancel = () => navigate("/");

  return (
    <div className="course-page">
      <div className="course-header">
        <h1>{t("course.page_title")}</h1>
      </div>
      <div className="course-form-container">
        <h2>{t("course.form_title")}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>{t("course.form_section")}</h3>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <div className="form-field">
              <label>{t("course.name")}</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={t("course.placeholders.name")}
                required
              />
              <p className="field-description">{t("course.description.name")}</p>
            </div>

            <div className="form-field">
              <label>{t("course.days_label")}</label>
              <select name="days" value={formData.days} onChange={handleInputChange} required>
                <option value="" disabled>{t("course.placeholders.days")}</option>
                {daysOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="field-description">{t("course.description.days")}</p>
            </div>

            {formData.days === "specific" && (
              <div className="form-field specific-days-field">
                <label>{t("course.specific_days")}</label>
                <div className="multi-select">
                  {specificDaysOptions.map((day, idx) => {
                    const val = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][idx];
                    return (
                      <div key={val} className="select-item">
                        <input
                          type="checkbox"
                          id={`specific-${val}`}
                          checked={formData.specific_days.includes(val)}
                          onChange={() => handleSpecificDaysChange(val)}
                        />
                        <label htmlFor={`specific-${val}`}>{day}</label>
                      </div>
                    );
                  })}
                </div>
                <p className="field-description">{t("course.description.specific_days")}</p>
              </div>
            )}

            <div className="form-field">
              <label>{t("course.group_label")}</label>
              <select name="group_size" value={formData.group_size} onChange={handleInputChange} required>
                <option value="" disabled>{t("course.placeholders.group")}</option>
                {groupSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="field-description">{t("course.description.group")}</p>
            </div>

            <div className="form-field">
              <label>{t("course.location_label")}</label>
              <select name="location_type" value={formData.location_type} onChange={handleInputChange} required>
                <option value="" disabled>{t("course.placeholders.location")}</option>
                {locationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="field-description">{t("course.description.location")}</p>
            </div>

            <div className="form-field">
              <label>{t("course.description_label")}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t("course.placeholders.description")}
                required
              />
              <p className="field-description">{t("course.description.description")}</p>
            </div>

            <div className="form-field">
              <label>{t("course.experience_label")}</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                min="0"
                required
              />
              <p className="field-description">{t("course.description.experience")}</p>
            </div>

            <div className="form-field">
              <label>{t("course.price_label")}</label>
              <input
                type="number"
                name="price_per_hour"
                value={formData.price_per_hour}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
              <p className="field-description">{t("course.description.price")}</p>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                {t("course.cancel")}
              </button>
              <button type="submit" className="create-btn">
                {t("course.create")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Course;
