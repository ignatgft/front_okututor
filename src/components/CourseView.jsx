// CourseView.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import "../styles/CourseView.css";
import { useTranslation } from "react-i18next";

const CourseView = () => {
  const { t } = useTranslation();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [userData, setUserData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    days: "",
    specific_days: [],
    group_size: "",
    location_type: "",
    experience: 0,
  });
  const [reviewForm, setReviewForm] = useState({ rating: "", comment: "" });
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const daysOptions = [
    { value: "weekdays", label: t("weekdays") },
    { value: "weekends", label: t("weekends") },
    { value: "specific", label: t("specificDays") },
  ];

  const specificDaysOptions = [
    t("monday"),
    t("tuesday"),
    t("wednesday"),
    t("thursday"),
    t("friday"),
    t("saturday"),
    t("sunday"),
  ];

  const groupSizeOptions = [
    { value: "individual", label: t("individual") },
    { value: "group", label: t("group") },
    { value: "private", label: t("private") },
  ];

  const locationTypeOptions = [
    { value: "online", label: t("online") },
    { value: "offline", label: t("offline") },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError(t("pleaseLogin"));
        navigate("/");
        return;
      }

      const idToken = await user.getIdToken(true);
      const userId = user.uid;

      const courseRes = await fetch(`${import.meta.env.VITE_API_URL}/courses/${userId}`);
      const courses = await courseRes.json();
      const selected = courses.find((c) => c.id === courseId);
      if (!selected) {
        setError(t("courseNotFound"));
        return;
      }
      setCourse(selected);
      setFormData({
        title: selected.title,
        price: selected.price,
        description: selected.description,
        days: selected.days,
        specific_days: selected.specific_days || [],
        group_size: selected.group_size,
        location_type: selected.location_type,
        experience: selected.experience,
      });
      setIsOwner(selected.user_id === userId);

      const userRes = await fetch(`${import.meta.env.VITE_API_URL}/user/${userId}`);
      const userData = await userRes.json();
      setUserData(userData);

      const reviewsRes = await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}/reviews`);
      const reviewData = await reviewsRes.json();
      setReviews(reviewData);
    };
    fetchData();
  }, [courseId]);

  const handleEditCourse = async () => {
    // simplified for brevity
  };

  return (
    <div className="course-view-page">
      <div className="course-header">
        <h1>{t("courseDetails")}</h1>
      </div>
      <h2>{course?.title}</h2>
      <div className="course-container">
        <div className="course-sidebar">
          <div className="teacher-info">
            <img src={userData?.avatar || "https://via.placeholder.com/100"} alt="Tutor" />
            <h3>{userData?.full_name}</h3>
            <p>{userData?.location}</p>
            <p>{userData?.email}</p>
            <p>{t("reviewsCount", { count: reviews.length })}</p>
          </div>
        </div>

        <div className="course-info">
          <span className="price">{course?.price}</span>
          <div className="bio">
            <h4>{t("bio")}</h4>
            <p>{course?.description}</p>
          </div>
          {/* fields omitted for brevity */}
        </div>
      </div>
    </div>
  );
};

export default CourseView;