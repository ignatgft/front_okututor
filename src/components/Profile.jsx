import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { updateProfile, deleteUser, signOut } from "firebase/auth";
import "../styles/Profile.css";

const Profile = () => {
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

  // Список местоположений для выпадающего списка
  const locations = ["Choose location", "New York", "London", "Tokyo", "Moscow", "Sydney"];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/");
      return;
    }

    // Устанавливаем базовые данные пользователя из Firebase
    const initialData = {
      full_name: user.displayName || "No Name",
      email: user.email || "No Email",
      photoURL: user.photoURL || "https://via.placeholder.com/150",
      phone: "",
      location: "Choose location",
      bio: "",
      telegram: "",
      instagram: "",
      whatsapp: "",
    };
    setUserData(initialData);
    setFormData(initialData);

    // Запрашиваем дополнительные данные пользователя с бэкенда
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/user/${user.uid}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();
        if (result.error) {
          setError(result.error);
        } else {
          const updatedData = { ...initialData, ...result };
          setUserData(updatedData);
          setFormData(updatedData);
        }
      } catch (err) {
        setError("Failed to fetch user data");
      }
    };

    fetchUserData();
  }, [navigate]);

  // Обработчик изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Редактирование профиля
  const handleEditProfile = async () => {
    if (!isEditing) {
      setIsEditing(true);
      setSuccess("");
      setError("");
      return;
    }

    try {
      // Обновляем данные в Firebase
      await updateProfile(auth.currentUser, {
        displayName: formData.full_name,
        photoURL: userData.photoURL, // Фото пока не редактируем через форму
      });

      // Обновляем данные в Firestore через бэкенд
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user/${auth.currentUser.uid}/profile`, {
        method: "PUT", // Предполагаем, что у вас есть эндпоинт для обновления данных
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.error) {
        setError(result.error);
      } else {
        setUserData(formData);
        setSuccess("Profile updated successfully");
      }
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update profile");
      setIsEditing(false);
    }
  };

  // Отмена редактирования
  const handleCancelEdit = () => {
    setFormData(userData);
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  // Выход из аккаунта
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      setError("Failed to log out");
    }
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      <div className="profile-container">
        {/* Левая часть: аватар, статус, соцсети */}
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <img src={userData.photoURL} alt="User Avatar" className="profile-avatar" />
            <h2>{userData.full_name}</h2>
          </div>

          {/* <div className="premium-section">
            <p>Premium is inactive</p>
            <button className="btn activate-btn">Activate</button>
          </div> */}

          {/* <div className="social-links"> */}
            {/* <h3>On the Web</h3>
            <div className="social-item">
              <span>Telegram</span>
              {isEditing ? (
                <input
                  type="text"
                  name="telegram"
                  value={formData.telegram}
                  onChange={handleInputChange}
                  placeholder="Link"
                  className="social-input"
                />
              ) : (
                <a href={userData.telegram || "#"}>{userData.telegram || "Link"}</a>
              )}
            </div> */}
            {/* <div className="social-item">
              <span>Instagram</span>
              {isEditing ? (
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  placeholder="Link"
                  className="social-input"
                />
              ) : (
                <a href={userData.instagram || "#"}>{userData.instagram || "Link"}</a>
              )}
            </div> */}
            {/* <div className="social-item">
              <span>WhatsApp</span>
              {isEditing ? (
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  placeholder="Link"
                  className="social-input"
                />
              ) : (
                <a href={userData.whatsapp || "#"}>{userData.whatsapp || "Link"}</a>
              )}
            </div> */}
          {/* </div> */}
        </div>

        {/* Правая часть: информация о пользователе */}
        <div className="profile-info">
          <h2>Personal Information</h2>

          <div className="info-field">
            <label>Full name</label>
            {isEditing ? (
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter full name"
              />
            ) : (
              <p>{userData.full_name}</p>
            )}
          </div>

          <div className="info-field">
            <label>Email address</label>
            <p>{userData.email}</p> {/* Email не редактируется */}
          </div>

          <div className="info-field">
            <label>Phone</label>
            {isEditing ? (
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            ) : (
              <p>{userData.phone || "Not provided"}</p>
            )}
          </div>

          <div className="info-field">
            <label>Location</label>
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
            <label>Bio</label>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Write something about you"
              />
            ) : (
              <p>{userData.bio || "Not provided"}</p>
            )}
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button className="btn update-btn" onClick={handleEditProfile}>
                  Update
                </button>
                <button className="btn cancel-btn" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="btn edit-btn" onClick={handleEditProfile}>
                  Edit Profile
                </button>
                <button className="btn logout-btn" onClick={handleLogout}>
                  Logout
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