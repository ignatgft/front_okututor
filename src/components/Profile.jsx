import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CardCourse from "../components/CardCourse";
import { updateProfile, signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";
import "../styles/Profile.css";

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [hasCourses, setHasCourses] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const displayedCourses = showAllCourses ? courses : courses.slice(0, 2);

  const locations = [
    t("profile.choose_location"),
    "New York", "London", "Tokyo", "Moscow", "Sydney"
  ];

  const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+\/?|localhost)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;

  const validateUrl = (url, fieldName) => {
    if (!url) return "";
    return urlRegex.test(url) ? "" : `${fieldName} ${t("profile.invalid_link")}`;
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return navigate("/");

    const initialData = {
      full_name: user.displayName || t("profile.not_provided"),
      email: user.email || t("profile.not_provided"),
      photoURL: user.photoURL || "https://via.placeholder.com/150",
      phone: "",
      location: t("profile.choose_location"),
      bio: "",
      telegram: "",
      instagram: "",
      whatsapp: "",
      avatar: "",
    };

    setUserData(initialData);
    setFormData(initialData);

    const fetchUserData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/user/${user.uid}`);
        const result = await res.json();
        if (!result.error) {
          const updated = { ...initialData, ...result };
          setUserData(updated);
          setFormData(updated);
        }
      } catch {
        setError(t("profile.fetch_error"));
      }
    };

    const fetchCourses = async () => {
      try {
        const token = await user.getIdToken(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/courses/${user.uid}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
        setHasCourses(Array.isArray(data) && data.length > 0);
      } catch {
        setCourses([]);
        setHasCourses(false);
      }
    };

    fetchUserData();
    fetchCourses();
  }, [navigate, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (["telegram", "instagram", "whatsapp"].includes(name)) {
      setErrors(prev => ({ ...prev, [name]: validateUrl(value, name) }));
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      const uid = auth.currentUser.uid;
      const storage = getStorage();
      const refPath = ref(storage, `avatars/${uid}`);
      setUploading(true);
      await uploadBytes(refPath, file);
      const url = await getDownloadURL(refPath);

      await updateProfile(auth.currentUser, { photoURL: url });
      setAvatarPreview(url);
      setFormData(prev => ({ ...prev, avatar: url }));
      setSuccess(t("profile.avatar_success"));
    } catch {
      setError(t("profile.avatar_error"));
    } finally {
      setUploading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const newErrors = {
      telegram: validateUrl(formData.telegram, "Telegram"),
      instagram: validateUrl(formData.instagram, "Instagram"),
      whatsapp: validateUrl(formData.whatsapp, "WhatsApp"),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      setError(t("profile.fix_errors"));
      return;
    }

    try {
      await updateProfile(auth.currentUser, {
        displayName: formData.full_name,
        photoURL: formData.avatar || userData.photoURL,
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/user/${auth.currentUser.uid}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!result.error) {
        setUserData(formData);
        setSuccess(t("profile.update_success"));
        setIsEditing(false);
      }
    } catch {
      setError(t("profile.update_fail"));
    }
  };

  const handleCancelEdit = () => {
    setFormData(userData);
    setErrors({});
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch {
      setError(t("profile.logout_fail"));
    }
  };

  const handleCreateCourseClick = () => navigate("/course");

  if (!userData) return <div>{t("profile.loading")}</div>;

  return (
    <div className="profile-page">
      <h1>{t("profile.my_profile")}</h1>
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <img
              src={
                avatarPreview || formData.avatar || userData.avatar ||
                userData.photoURL || "https://via.placeholder.com/150"
              }
              alt="avatar"
              className="profile-avatar"
            />
            <h2>{userData.full_name}</h2>
            {isEditing && (
              <div>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => handleAvatarUpload(e.target.files[0])}
                />
                {uploading && <p>{t("profile.uploading")}</p>}
              </div>
            )}
          </div>

          {hasCourses && (
            <>
              <div className="premium-section">
                <p>{t("profile.premium_inactive")}</p>
                <button className="btn activate-btn">{t("profile.activate")}</button>
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
            </>
          )}
        </div>

        <div className="profile-info">
          <h2>{t("profile.personal_info")}</h2>

          <div className="info-field">
            <label>{t("profile.full_name")}</label>
            {isEditing ? (
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
              />
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
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            ) : (
              <p>{userData.phone || t("profile.not_provided")}</p>
            )}
          </div>

          <div className="info-field">
            <label>{t("profile.location")}</label>
            {isEditing ? (
              <>
                <input
                  list="locations"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
                <datalist id="locations">
                  {locations.map((loc) => <option key={loc} value={loc} />)}
                </datalist>
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
              />
            ) : (
              <p>{userData.bio || t("profile.not_provided")}</p>
            )}
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button className="btn update-btn" onClick={handleEditProfile}>
                  {t("profile.update")}
                </button>
                <button className="btn cancel-btn" onClick={handleCancelEdit}>
                  {t("profile.cancel")}
                </button>
              </>
            ) : (
              <>
                <button className="btn edit-btn" onClick={handleEditProfile}>
                  {t("profile.edit_profile")}
                </button>
                <button className="btn logout-btn" onClick={handleLogout}>
                  {t("profile.logout")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {hasCourses && (
        <div className="courses-section">
          <h2>{t("profile.my_courses")}</h2>
          <div className="courses-grid">
            {displayedCourses.map(course => (
              <CardCourse key={course.id} course={course} userData={userData} />
            ))}
          </div>
          <div className="courses-actions">
            <button className="btn green" onClick={handleCreateCourseClick}>
              {t("profile.create_new")}
            </button>
            <button className="btn light" onClick={() => setShowAllCourses(prev => !prev)}>
              {showAllCourses ? t("profile.show_less") : t("profile.show_all")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
