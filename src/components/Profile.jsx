import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CardCourse from "../components/CardCourse";
import { getCurrentUser, logoutClient } from "../api/auth";
import { endpoints } from "../api/endpoints";
import { apiFetch } from "../api/http";
import { useTranslation } from "react-i18next";
import "../styles/Profile.css";

const Profile = () => {
  const { t } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasCourses, setHasCourses] = useState(false);
  const [courses, setCourses] = useState([]);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    telegram: "",
    instagram: "",
    whatsapp: "",
    avatar: "",
  });
  const [errors, setErrors] = useState({ telegram: "", instagram: "", whatsapp: "" });
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState(""); // Добавляем состояние для ошибок
  const [success, setSuccess] = useState(""); // Добавляем состояние для успеха
  const navigate = useNavigate();

  const displayedCourses = showAllCourses ? courses : courses.slice(0, 2);
  const locations = [t("profile.choose_location"), "Нарын", "Иссык-Кол", "Ош", "Талас", "Чуй", "Джалал-Абад", "Баткен"];

  const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+\/?|localhost)([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?$/;

  const validateUrl = (url, fieldName) => {
    if (!url) return "";
    if (!urlRegex.test(url)) return `${fieldName} link is invalid`;
    return "";
  };

  const handleCreateCourseClick = () => {
    navigate("/course");
  };

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate("/");
        return;
      }
      const initialData = {
        full_name: user.full_name || user.displayName || t("profile.not_provided"),
        email: user.email || t("profile.not_provided"),
        photoURL: user.avatar || user.photoURL || "https://via.placeholder.com/150",
        phone: user.phone || "",
        location: user.location || t("profile.choose_location"),
        bio: user.bio || "",
        telegram: user.telegram || "",
        instagram: user.instagram || "",
        whatsapp: user.whatsapp || "",
        avatar: user.avatar || "",
      };
      setUserData(initialData);
      setFormData(initialData);

      try {
        const { data: courses } = await apiFetch(endpoints.coursesByTeacher(user.uid), {
          auth: true,
        });
        if (Array.isArray(courses) && courses.length > 0) {
          setHasCourses(true);
          setCourses(courses);
        } else {
          setHasCourses(false);
          setCourses([]);
        }
      } catch (err) {
        setHasCourses(false);
        setCourses([]);
      }
    })();
  }, [navigate, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (["telegram", "instagram", "whatsapp"].includes(name)) {
      const fieldName = name.charAt(0).toUpperCase() + name.slice(1);
      setErrors((prev) => ({ ...prev, [name]: validateUrl(value, fieldName) }));
    }
  };

  const handleEditProfile = async () => {
    if (!isEditing) {
      setIsEditing(true);
      setSuccess("");
      setError("");
      return;
    }

    const validationErrors = {
      telegram: validateUrl(formData.telegram, "Telegram"),
      instagram: validateUrl(formData.instagram, "Instagram"),
      whatsapp: validateUrl(formData.whatsapp, "WhatsApp"),
    };
    setErrors(validationErrors);
    if (Object.values(validationErrors).some((err) => err !== "")) {
      setError("Please fix the errors before saving");
      return;
    }

    try {
      const user = await getCurrentUser();
      const { data: result } = await apiFetch(endpoints.userProfile(user.uid), {
        method: "PUT",
        auth: true,
        body: formData,
      });
      if (result.error) setError(result.error);
      else {
        setUserData(formData);
        setSuccess("Profile updated successfully");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData(userData);
    setErrors({ telegram: "", instagram: "", whatsapp: "" });
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleLogout = async () => {
    try {
      logoutClient();
      navigate("/");
    } catch (err) {
      console.error("Error logging out:", err);
      setError("Failed to log out");
    }
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div className="profile-page">
      <h1>{t("profile.my_profile")}</h1>
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <img
              src={
                avatarPreview ||
                formData.avatar ||
                userData.avatar ||
                userData.photoURL ||
                "https://via.placeholder.com/150"
              }
              alt="User Avatar"
              className="profile-avatar"
            />
            <h2>{userData.full_name}</h2>
          </div>

          <div className="social-links">
            <h3>{t("profile.on_the_web")}</h3>
            {["telegram", "instagram", "whatsapp"].map((name) => (
              <div key={name} className="social-item">
                <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name={name}
                      value={formData[name]}
                      onChange={handleInputChange}
                      placeholder="Link"
                      className="social-input"
                    />
                    {errors[name] && <p className="error-message">{errors[name]}</p>}
                  </>
                ) : (
                  userData[name] && <a href={userData[name]}>{userData[name]}</a>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-content">
            <h2>{t("profile.personal_info")}</h2>

            <div className="info-field">
              <label>{t("profile.full_name")}</label>
              {isEditing ? (
                <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} />
              ) : (
                <p>{userData.full_name}</p>
              )}
            </div>

            <div className="info-field">
              <label>{t("profile.email")}</label>
              <p>{userData.email}</p>
            </div>

            <div className="info-field">
              <label>{t("profile.phone")}</label>
              {isEditing ? (
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
              ) : (
                <p>{userData.phone || t("profile.not_provided")}</p>
              )}
            </div>

            <div className="info-field">
              <label>{t("profile.location")}</label>
              {isEditing ? (
                <>
                  <input list="locations" name="location" value={formData.location} onChange={handleInputChange} />
                  <datalist id="locations">{locations.map((loc) => <option key={loc} value={loc} />)}</datalist>
                </>
              ) : (
                <p>{userData.location}</p>
              )}
            </div>

            <div className="info-field">
              <label>{t("profile.bio")}</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  style={{ width: "100%", height: "100px", resize: "none" }}
                />
              ) : (
                <p>{userData.bio || t("profile.not_provided")}</p>
              )}
            </div>
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button className="btn update-btn" onClick={handleEditProfile}>{t("profile.update")}</button>
                <button className="btn cancel-btn" onClick={handleCancelEdit}>{t("profile.cancel")}</button>
              </>
            ) : (
              <>
                <button className="btn edit-btn" onClick={handleEditProfile}>{t("profile.edit_profile")}</button>
                <button className="btn logout-btn" onClick={handleLogout}>{t("profile.logout")}</button>
              </>
            )}
          </div>
        </div>
      </div>

      {hasCourses && (
        <div className="courses-section">
          <h2>{t("profile.my_courses")}</h2>
          <div className="courses-grid">
            {displayedCourses.map((course) => (
              <CardCourse key={course.id} course={course} userData={userData} />
            ))}
          </div>

          <div className="courses-actions">
            <button className="btn green" onClick={handleCreateCourseClick}>{t("profile.create_new")}</button>
            <button className="btn light" onClick={() => setShowAllCourses((prev) => !prev)}>
              {showAllCourses ? t("profile.show_less") : t("profile.show_all")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
