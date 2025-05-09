import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import "../styles/CourseView.css";

const CourseView = () => {
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
    { value: "weekdays", label: "Weekdays" },
    { value: "weekends", label: "Weekends" },
    { value: "specific", label: "Specific Days" },
  ];
  const specificDaysOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const groupSizeOptions = [
    { value: "individual", label: "Individual" },
    { value: "group", label: "Group" },
    { value: "private", label: "Private" },
  ];
  const locationTypeOptions = [
    { value: "online", label: "Online" },
    { value: "offline", label: "Offline" },
  ];

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Please log in to view course details.");
          navigate("/");
          return;
        }

        const idToken = await user.getIdToken(true);
        const userId = user.uid;

        // Получение данных курса
        const courseResponse = await fetch(`${import.meta.env.VITE_API_URL}/courses/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
        });
        const courses = await courseResponse.json();
        const selectedCourse = courses.find((c) => c.id === courseId);
        if (selectedCourse) {
          setCourse(selectedCourse);
          setFormData({
            title: selectedCourse.title || "English Language",
            price: selectedCourse.price || "7$/hour",
            description: selectedCourse.description || "",
            days: selectedCourse.days || "weekdays",
            specific_days: selectedCourse.specific_days || [],
            group_size: selectedCourse.group_size || "group",
            location_type: selectedCourse.location_type || "online",
            experience: selectedCourse.experience || 0,
          });
          setIsOwner(selectedCourse.user_id === userId);
        } else {
          setError("Course not found");
          return;
        }

        // Получение данных пользователя
        const userResponse = await fetch(`${import.meta.env.VITE_API_URL}/user/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
        });
        const userResult = await userResponse.json();
        if (userResult.error) {
          setError(userResult.error);
        } else {
          setUserData(userResult);
        }

        // Получение отзывов
        const reviewsResponse = await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}/reviews`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
        });
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
      } catch (err) {
        console.error("Error fetching course data:", err);
        setError("Failed to load course data.");
      }
    };

    fetchCourseData();
  }, [courseId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "experience" ? Number(value) : value,
    }));
  };

  const handleSpecificDaysChange = (day) => {
    const updatedDays = formData.specific_days.includes(day)
      ? formData.specific_days.filter((d) => d !== day)
      : [...formData.specific_days, day];
    setFormData((prev) => ({ ...prev, specific_days: updatedDays }));
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditCourse = async () => {
    if (!isEditing) {
      setIsEditing(true);
      setError("");
      setSuccess("");
      return;
    }

    try {
      const user = auth.currentUser;
      const idToken = await user.getIdToken(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          user_id: user.uid,
          title: formData.title,
          price: formData.price,
          description: formData.description,
          days: formData.days,
          specific_days: formData.specific_days,
          group_size: formData.group_size,
          location_type: formData.location_type,
          experience: formData.experience,
        }),
      });

      const result = await response.json();
      if (result.error) {
        setError(result.error);
      } else {
        setCourse({ ...course, ...formData });
        setSuccess("Course updated successfully");
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error updating course:", err);
      setError("Failed to update course.");
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      title: course.title || "English Language",
      price: course.price || "7$/hour",
      description: course.description || "",
      days: course.days || "weekdays",
      specific_days: course.specific_days || [],
      group_size: course.group_size || "group",
      location_type: course.location_type || "online",
      experience: course.experience || 0,
    });
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleDeleteCourse = async () => {
    try {
      const user = auth.currentUser;
      const idToken = await user.getIdToken(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
      });
      const result = await response.json();
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Course deleted successfully");
        navigate("/");
      }
    } catch (err) {
      setError("Failed to delete course");
    }
  };

  const handleSubmitReview = async () => {
    try {
      const user = auth.currentUser;
      const idToken = await user.getIdToken(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          student_id: user.uid,
          rating: parseInt(reviewForm.rating),
          comment: reviewForm.comment,
        }),
      });
      const result = await response.json();
      if (result.error) {
        setError(result.error);
      } else {
        const reviewsResponse = await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}/reviews`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
        });
        const reviewsResult = await reviewsResponse.json();
        setReviews(reviewsResult);
        setReviewForm({ rating: "", comment: "" });
        setSuccess("Review submitted successfully");
      }
    } catch (err) {
      setError("Failed to submit review");
    }
  };

  if (!course || !userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="course-view-page">
    <div className="course-header">
      <h1>Course Details</h1>
    </div>
    <h2>{course.title}</h2>
      <div className="course-container">
        <div className="course-sidebar">
          <div className="teacher-info">
            <img src={userData?.photo || "https://via.placeholder.com/100"} alt="Tutor" className="teacher-photo" />
            <h3>{userData?.full_name || "Subankulov Adil"}</h3>
            <p>📍 {userData?.location || "Bishkek, Kyrgyzstan"}</p>
            <p>📞 {userData?.phone || "777 24 32 34"}</p>
            <p>✉️ {userData?.email || "subankulov@aiuca.kg"}</p>
            <p>⭐ {reviews?.length || 11} Reviews</p>
          </div>
        </div>

        <div className="course-info">
          <div className="course-view-header">
            {isEditing ? (
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="edit-input price-input"
              />
            ) : (
              <span className="price">{course.price}</span>
            )}
          </div>

          <div className="tags">
            <span className={`tag ${formData.location_type.toUpperCase() === "ONLINE" ? "active" : ""}`}>
              {formData.location_type.toUpperCase()}
            </span>
            <span className={`tag ${formData.days.toUpperCase() === "WEEKDAYS" ? "active" : ""}`}>
              {formData.days.toUpperCase()}
            </span>
            <span className={`tag ${formData.group_size.toUpperCase() === "GROUP" ? "active" : ""}`}>
              {formData.group_size.toUpperCase()}
            </span>
          </div>

          <div className="bio">
            <h4>bio</h4>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="edit-textarea"
              />
            ) : (
              <p>{course.description || "An enthusiastic and skilled tutor specializing in personalized lessons to help students excel. Passionate about creating engaging and supportive learning experiences to help students reach their full potential. Experienced in teaching students from diverse backgrounds and levels."}</p>
            )}
          </div>

          <div className="additional-info">
            <div className="info-field">
              <label>Days</label>
              {isEditing ? (
                <select
                  name="days"
                  value={formData.days}
                  onChange={handleInputChange}
                  className="edit-input"
                >
                  {daysOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p>{daysOptions.find((opt) => opt.value === course.days)?.label || "Not provided"}</p>
              )}
            </div>

            {formData.days === "specific" && (
              <div className="info-field">
                <label>Specific Days</label>
                {isEditing ? (
                  <div className="specific-days">
                    {specificDaysOptions.map((day) => (
                      <label key={day} className="specific-day-label">
                        <input
                          type="checkbox"
                          checked={formData.specific_days.includes(day)}
                          onChange={() => handleSpecificDaysChange(day)}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p>{course.specific_days.join(", ") || "None"}</p>
                )}
              </div>
            )}

            <div className="info-field">
              <label>Group Size</label>
              {isEditing ? (
                <select
                  name="group_size"
                  value={formData.group_size}
                  onChange={handleInputChange}
                  className="edit-input"
                >
                  {groupSizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p>{groupSizeOptions.find((opt) => opt.value === course.group_size)?.label || "Not provided"}</p>
              )}
            </div>

            <div className="info-field">
              <label>Location Type</label>
              {isEditing ? (
                <select
                  name="location_type"
                  value={formData.location_type}
                  onChange={handleInputChange}
                  className="edit-input"
                >
                  {locationTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p>{locationTypeOptions.find((opt) => opt.value === course.location_type)?.label || "Not provided"}</p>
              )}
            </div>

            <div className="info-field">
              <label>Experience (years)</label>
              {isEditing ? (
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="edit-input"
                  placeholder="Enter experience"
                />
              ) : (
                <p>{course.experience || "0"}</p>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="edit-actions">
              {isEditing ? (
                <>
                  <button className="btn save-btn" onClick={handleEditCourse}>
                    Save
                  </button>
                  <button className="btn cancel-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="btn edit-btn" onClick={handleEditCourse}>
                    Edit Course
                  </button>
                  <button className="btn delete-btn" onClick={handleDeleteCourse}>
                    Delete Course
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="reviews-section">
        <h3>Reviews</h3>
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          <div className="reviews-grid">
            {(showAllReviews ? reviews : reviews.slice(0, 4)).map((review, index) => (
              <div key={index} className="review">
                <img src="https://via.placeholder.com/30" alt="Reviewer" className="reviewer-photo" />
                <div className="review-content">
                  <p>{review.comment || "I was glad to have courses with Adil."}</p>
                  <span className="review-date">{review.date || "November 28, 2024"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {reviews.length > 4 && (
          <button className="show-reviews-btn" onClick={() => setShowAllReviews(!showAllReviews)}>
            {showAllReviews ? "Show less reviews" : "SHOW ALL REVIEWS"}
          </button>
        )}
      </div>

      {!isOwner && (
        <div className="review-form">
          <h3>Leave a Review</h3>
          <div className="info-field">
            <label>Rating (1-5)</label>
            <input
              type="number"
              name="rating"
              value={reviewForm.rating}
              onChange={handleReviewChange}
              min="1"
              max="5"
              placeholder="Enter rating"
              className="edit-input"
              required
            />
          </div>
          <div className="info-field">
            <label>Comment</label>
            <textarea
              name="comment"
              value={reviewForm.comment}
              onChange={handleReviewChange}
              placeholder="Write your review..."
              className="edit-textarea"
              required
            />
          </div>
          <button className="btn submit-btn" onClick={handleSubmitReview}>
            Submit Review
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseView;