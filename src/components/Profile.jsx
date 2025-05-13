import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, storage } from "../firebaseConfig";
import { updateProfile, signOut } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CardCourse from "../components/CardCourse";
import "../styles/Profile.css";

const Profile = () => {
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

  const locations = ["Choose location", "New York", "London", "Tokyo", "Moscow", "Sydney"];

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
      full_name: user.displayName || "No Name",
      email: user.email || "No Email",
      photoURL: user.photoURL || "https://via.placeholder.com/150",
      phone: "",
      location: "Choose location",
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
  }, [navigate]);

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
      const storage = getStorage();
      const uid = auth.currentUser.uid;
      const storageRef = ref(storage, `avatars/${uid}`);
    
      await uploadBytes(storageRef, file); // безопасно
      const url = await getDownloadURL(storageRef); // получаем ссылку
    
      await updateProfile(auth.currentUser, { photoURL: url }); // обновляем в Firebase Auth
      setUserData((prev) => ({ ...prev, photoURL: url }));
      setFormData((prev) => ({ ...prev, photoURL: url }));
      setSuccess("Profile picture updated!");
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Failed to upload avatar.");
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
      <h1>My Profile</h1>
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

          {hasCourses && (
            <>
              <div className="premium-section">
                <p>Premium is inactive</p>
                <button className="btn activate-btn">Activate</button>
              </div>

              <div className="social-links">
                <h3>On the Web</h3>
                {['telegram', 'instagram', 'whatsapp'].map((name) => (
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
            </>
          )}
        </div>

        <div className="profile-info">
          <h2>Personal Information</h2>

          <div className="info-field">
            <label>Email address</label>
            <p>{userData.email}</p>
          </div>

          <div className="info-field">
            <label>Phone</label>
            {isEditing ? (
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
            ) : (
              <p>{userData.phone || "Not provided"}</p>
            )}
          </div>

          <div className="info-field">
            <label>Location</label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  list="locations"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter or select your location"
                />
                <datalist id="locations">
                  {locations.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </>
            ) : (
              <p>{userData.location}</p>
            )}
          </div>

          <div className="info-field">
            <label>Bio</label>
            {isEditing ? (
              <textarea name="bio" value={formData.bio} onChange={handleInputChange} />
            ) : (
              <p>{userData.bio || "Not provided"}</p>
            )}
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button className="btn update-btn" onClick={handleEditProfile}>Update</button>
                <button className="btn cancel-btn" onClick={handleCancelEdit}>Cancel</button>
              </>
            ) : (
              <>
                <button className="btn edit-btn" onClick={handleEditProfile}>Edit Profile</button>
                <button className="btn logout-btn" onClick={handleLogout}>Logout</button>
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
