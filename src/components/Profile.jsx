import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { updateProfile, deleteUser, signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";
import "../styles/Profile.css";

const Profile = () => {
  const { t } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    telegram: "",
    instagram: "",
    whatsapp: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const locations = [
    t("profile.choose_location"),
    "New York",
    "London",
    "Tokyo",
    "Moscow",
    "Sydney",
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/");
      return;
    }

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
    };

    setUserData(initialData);
    setFormData(initialData);

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/user/${user.uid}`);
        const result = await response.json();
        if (!result.error) {
          const updatedData = { ...initialData, ...result };
          setUserData(updatedData);
          setFormData(updatedData);
        }
      } catch {
        setError("Failed to fetch user data");
      }
    };

    fetchUserData();
  }, [navigate, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditProfile = async () => {
    if (!isEditing) {
      setIsEditing(true);
      setSuccess("");
      setError("");
      return;
    }

    try {
      await updateProfile(auth.currentUser, {
        displayName: formData.full_name,
        photoURL: userData.photoURL,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/user/${auth.currentUser.uid}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      if (!result.error) {
        setUserData(formData);
        setSuccess("Profile updated successfully");
      } else {
        setError(result.error);
      }
      setIsEditing(false);
    } catch {
      setError("Failed to update profile");
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData(userData);
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch {
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
            <img src={userData.photoURL} alt="User Avatar" className="profile-avatar" />
            <h2>{userData.full_name}</h2>
          </div>
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
                placeholder={t("profile.enter_full_name")}
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
                placeholder={t("profile.enter_phone")}
              />
            ) : (
              <p>{userData.phone || t("profile.not_provided")}</p>
            )}
          </div>

          <div className="info-field">
            <label>{t("profile.location")}</label>
            {isEditing ? (
              <select name="location" value={formData.location} onChange={handleInputChange}>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
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
                placeholder={t("profile.write_bio")}
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
    </div>
  );
};

export default Profile;
