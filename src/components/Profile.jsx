import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, storage } from "../firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CardCourse from "../components/CardCourse";
import { updateProfile, signOut } from "firebase/auth";
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const navigate = useNavigate();

  const displayedCourses = showAllCourses ? courses : courses.slice(0, 2);
  const locations = [t("profile.choose_location"), "New York", "London", "Tokyo", "Moscow", "Sydney"];

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
      avatar: "",
    };

    setUserData(initialData);
    setFormData(initialData);

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/user/${user.uid}`);
        const result = await response.json();
        if (result.error) setError(result.error);
        else {
          const updatedData = { ...initialData, ...result };
          setUserData(updatedData);
          setFormData(updatedData);
        }
      } catch {
        setError("Failed to fetch user data");
      }
    };

    const fetchUserCourses = async () => {
      try {
        const idToken = await user.getIdToken(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/courses/${user.uid}`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        });
        const courses = await response.json();
        if (Array.isArray(courses) && courses.length > 0) {
          setHasCourses(true);
          setCourses(courses);
        } else {
          setHasCourses(false);
          setCourses([]);
        }
      } catch {
        setHasCourses(false);
        setCourses([]);
      }
    };

    fetchUserData();
    fetchUserCourses();
  }, [navigate, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (["telegram", "instagram", "whatsapp"].includes(name)) {
      const fieldName = name.charAt(0).toUpperCase() + name.slice(1);
      setErrors((prev) => ({ ...prev, [name]: validateUrl(value, fieldName) }));
    }
  };

  const handleAvatarUpload = async (file) => {
  try {
    console.log("Selected file:", file);
    setUploading(true);

    const uid = auth.currentUser.uid;
    const fileRef = ref(storage, `avatars/${uid}/${file.name}`);
    
    console.log("Uploading avatar...");
    await uploadBytes(fileRef, file);
    console.log("Uploaded.");

    const url = await getDownloadURL(fileRef);
    console.log("Download URL:", url);

    await updateProfile(auth.currentUser, { photoURL: url });

    const res = await fetch(`${import.meta.env.VITE_API_URL}/user/${uid}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar: url }),
    });

    const result = await res.json();
    console.log("Profile updated in backend:", result);

    setUserData((prev) => ({ ...prev, avatar: url, photoURL: url }));
    setFormData((prev) => ({ ...prev, avatar: url, photoURL: url }));
    setAvatarPreview(url);
    setSuccess("Avatar uploaded successfully!");
  } catch (err) {
    console.error("Upload failed:", err);
    setError("Failed to upload avatar.");
  } finally {
    setUploading(false);
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
      await updateProfile(auth.currentUser, {
        displayName: formData.full_name,
        photoURL: formData.avatar || userData.photoURL,
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/user/${auth.currentUser.uid}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.error) setError(result.error);
      else {
        setUserData(formData);
        setSuccess("Profile updated successfully");
      }
      setIsEditing(false);
    } catch {
      setError("Failed to update profile");
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
            {isEditing && (
              <div>
                <input type="file" accept="image/png, image/jpeg" onChange={(e) => handleAvatarUpload(e.target.files[0])} />
                {uploading && <p>Uploading...</p>}
              </div>
            )}
          </div>

          <div className="social-links">
            <h3>On the Web</h3>
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
                  userData[name] && <a href={userData[name]}>Link</a>
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
          <h2>My Courses</h2>
          <div className="courses-grid">
            {displayedCourses.map((course) => (
              <CardCourse key={course.id} course={course} userData={userData} />
            ))}
          </div>

          <div className="courses-actions">
            <button className="btn green" onClick={handleCreateCourseClick}>Create new</button>
            <button className="btn light" onClick={() => setShowAllCourses(prev => !prev)}>
              {showAllCourses ? "Show less" : "Show all"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
