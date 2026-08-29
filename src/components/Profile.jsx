import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CardCourse from "../components/CardCourse";
import useAuthStore from "../store/authStore";
import { endpoints } from "../api/endpoints";
import { apiClient } from "../api/http";
import { useTranslation } from "react-i18next";
import { useToast } from "./ui/Toast";
import { Spinner, Skeleton, EmptyState, ErrorState } from "../components/ui/Primitives";
import ConfirmModal from "../components/ui/ConfirmModal";
import { tutorsApi } from "../api/tutors.api";
import AvatarUploader from "./avatar/AvatarUploader";
import { isStudent } from "../constants/roles";
import { TUTOR_STATUS } from "../constants/enums";
import { COURSE_SUBJECTS as SUBJECTS, TUTOR_LANGUAGES as LANGUAGES } from "../constants/course";
import "../styles/Profile.css";

const Profile = () => {
  const { t } = useTranslation();
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [hasCourses, setHasCourses] = useState(false);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
    experience_years: 0,
    education: "",
  });
  const [errors, setErrors] = useState({ telegram: "", instagram: "", whatsapp: "" });

  const [tutorApp, setTutorApp] = useState(null);
  const [tutorAppLoading, setTutorAppLoading] = useState(false);
  const [tutorAppError, setTutorAppError] = useState("");
  const [appForm, setAppForm] = useState({
    full_name: "",
    phone: "",
    location: "",
    experience_years: 0,
    experience_description: "",
    education: "",
    subjects: [],
    languages: [],
    bio: "",
    id_document_name: "",
  });
  const [appSubmitting, setAppSubmitting] = useState(false);

  const displayedCourses = showAllCourses ? courses : courses.slice(0, 2);
  const locations = [t("profile.choose_location"), "Нарын", "Иссык-Кол", "Ош", "Талас", "Чуй", "Джалал-Абад", "Баткен"];

  const isStudentRole = isStudent(user?.role);

  const roleBadge = (role) => {
    const map = {
      STUDENT: { labelKey: "admin.role_student", className: "badge-student" },
      TUTOR: { labelKey: "admin.role_tutor", className: "badge-tutor" },
      ADMIN: { labelKey: "admin.role_admin", className: "badge-admin" },
    };
    const entry = map[role];
    return entry ? { label: t(entry.labelKey), className: entry.className } : { label: role, className: "" };
  };

  const validateUrl = (url, fieldName) => {
    if (!url) return "";
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      if (!["http:", "https:"].includes(parsed.protocol)) return `${fieldName} link is invalid`;
    } catch {
      return `${fieldName} link is invalid`;
    }
    return "";
  };

  const sanitizeHref = (url) => {
    if (!url) return "#";
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      if (["http:", "https:"].includes(parsed.protocol)) return parsed.href;
    } catch { /* fall through */ }
    return "#";
  };

  const handleCreateCourseClick = () => navigate("/tutor/courses/create");

  const loadTutorApplication = useCallback(async () => {
    if (!isStudentRole) return;
    setTutorAppLoading(true);
    setTutorAppError("");
    try {
      const { response, data } = await tutorsApi.myApplication();
      if (response.ok && data && Object.keys(data).length > 0) {
        setTutorApp(data);
        setAppForm((prev) => ({
          ...prev,
          full_name: data.full_name || user?.full_name || "",
          phone: data.phone || user?.phone || "",
          location: data.location || "",
          experience_years: data.experience_years || 0,
          experience_description: data.experience_description || "",
          education: data.education || "",
          subjects: (data.subjects ? String(data.subjects).split(",").filter(Boolean) : []),
          languages: (data.languages ? String(data.languages).split(",").filter(Boolean) : []),
          bio: data.bio || "",
          id_document_name: data.id_document_name || "",
        }));
      } else {
        setTutorApp(null);
        setAppForm((prev) => ({ ...prev, full_name: prev.full_name || user?.full_name || "", phone: prev.phone || user?.phone || "" }));
      }
    } catch (e) {
      setTutorAppError(e.message || t("errors.default", "Something went wrong"));
      setTutorApp(null);
    } finally {
      setTutorAppLoading(false);
    }
  }, [isStudentRole, user, t]);

  useEffect(() => {
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
      experience_years: user.experience_years || 0,
      education: user.education || "",
    };
    setFormData(initialData);
  }, [user, navigate, t]);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    setCoursesLoading(true);
    setCoursesError("");
    try {
      const { response, data } = await apiClient.get(endpoints.courses.byTeacher(user.id));
      if (response.ok && Array.isArray(data) && data.length > 0) {
        setHasCourses(true);
        setCourses(data);
      } else {
        setHasCourses(false);
        setCourses([]);
      }
    } catch (e) {
      setCoursesError(e.message || t("errors.default", "Something went wrong."));
      setHasCourses(false);
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (!isStudentRole) return;
    loadTutorApplication();
  }, [isStudentRole, loadTutorApplication]);

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
      return;
    }

    const validationErrors = {
      telegram: validateUrl(formData.telegram, "Telegram"),
      instagram: validateUrl(formData.instagram, "Instagram"),
      whatsapp: validateUrl(formData.whatsapp, "WhatsApp"),
    };
    setErrors(validationErrors);
    if (Object.values(validationErrors).some((err) => err !== "")) {
      return;
    }

    try {
      const { response, data } = await apiClient.put(endpoints.users.update, formData);
      if (response.ok) {
        const updated = { ...user, ...formData };
        setUser(updated);
        setFormData((prev) => ({ ...prev, ...formData }));
        toast.success(t("profile.saved", "Profile updated"));
      } else {
        toast.error(
          (data && (data.message || data.error)) ||
            t("errors.save_failed", "Failed to save. Please try again.")
        );
      }
    } catch (err) {
      toast.error(err.message || t("errors.save_failed", "Failed to save. Please try again."));
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      location: user.location || "",
      bio: user.bio || "",
      telegram: user.telegram || "",
      instagram: user.instagram || "",
      whatsapp: user.whatsapp || "",
      avatar: user.avatar || "",
      experience_years: user.experience_years || 0,
      education: user.education || "",
    });
    setErrors({ telegram: "", instagram: "", whatsapp: "" });
    setIsEditing(false);
  };

  const appField = (label, key, type = "text", props = {}) => (
    <div className="auth-form-field">
      <label htmlFor={`app-${key}`}>{label}</label>
      <input
        id={`app-${key}`}
        type={type}
        value={appForm[key] ?? ""}
        onChange={(e) =>
          setAppForm((prev) => ({
            ...prev,
            [key]: type === "number" ? Number(e.target.value) || 0 : e.target.value,
          }))
        }
        {...props}
      />
    </div>
  );

  const toggleAppValue = (field, value) =>
    setAppForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));

  const submitTutorApplication = async (e) => {
    e.preventDefault();
    if (!appForm.full_name.trim()) {
      toast.error(t("become_tutor.error_name", "Name is required"));
      return;
    }
    if (appForm.subjects.length === 0) {
      toast.error(t("become_tutor.error_subjects", "Select at least one subject"));
      return;
    }
    if (appForm.languages.length === 0) {
      toast.error(t("become_tutor.error_languages", "Select at least one language"));
      return;
    }
    setAppSubmitting(true);
    try {
      await tutorsApi.submitApplication({
        ...appForm,
        subjects: appForm.subjects.join(","),
        languages: appForm.languages.join(","),
      });
      toast.success(t("success.action_completed", "Action completed"));
      setTutorApp({ status: TUTOR_STATUS.PENDING, created_at: new Date().toISOString() });
    } catch (err) {
      toast.error(err.message || t("become_tutor.error_submit", "Failed to submit application"));
    } finally {
      setAppSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      toast.error(err.message || t("errors.default", "Something went wrong."));
    }
  };

  const handleAvatarSaved = (url) => {
    const updated = { ...user, avatar: url };
    setUser(updated);
    setFormData((prev) => ({ ...prev, avatar: url }));
  };

  const handleAvatarRemoved = () => {
    const updated = { ...user, avatar: "" };
    setUser(updated);
    setFormData((prev) => ({ ...prev, avatar: "" }));
  };

  if (!user) return null;

  const renderCoursesSection = () => {
    if (coursesLoading) {
      return (
        <div className="courses-section">
          <h2>{t("profile.my_courses")}</h2>
          <Spinner label={t("common.loading", "Loading...")} />
          <Skeleton count={4} variant="card" />
        </div>
      );
    }
    if (coursesError) {
      return (
        <div className="courses-section">
          <h2>{t("profile.my_courses")}</h2>
          <ErrorState message={coursesError} onRetry={fetchCourses} />
        </div>
      );
    }
    if (!hasCourses || courses.length === 0) {
      return (
        <div className="courses-section">
          <h2>{t("profile.my_courses")}</h2>
          <EmptyState
            icon="📚"
            title={t("profile.no_courses", "No courses yet")}
            hint={
              <button className="btn green" onClick={handleCreateCourseClick}>
                {t("profile.create_new", "Create course")}
              </button>
            }
          />
        </div>
      );
    }
    return (
      <div className="courses-section">
        <h2>{t("profile.my_courses")}</h2>
        <div className="courses-grid">
          {displayedCourses.map((course) => (
            <CardCourse key={course.id} course={course} />
          ))}
        </div>

        <div className="courses-actions">
          <button className="btn green" onClick={handleCreateCourseClick}>{t("profile.create_new")}</button>
          <button className="btn light" onClick={() => setShowAllCourses((prev) => !prev)}>
            {showAllCourses ? t("profile.show_less") : t("profile.show_all")}
          </button>
        </div>
      </div>
    );
  };

  const renderTutorApplication = () => {
    if (tutorAppError) {
      return (
        <div className="courses-section app-form-wrapper">
          <h2>{t("profile.become_tutor", "Become a tutor")}</h2>
          <ErrorState message={tutorAppError} onRetry={loadTutorApplication} />
        </div>
      );
    }

    if (tutorAppLoading) {
      return (
        <div className="courses-section app-form-wrapper">
          <h2>{t("profile.become_tutor", "Become a tutor")}</h2>
          <Spinner label={t("common.loading", "Loading...")} />
        </div>
      );
    }

    if (tutorApp?.status === TUTOR_STATUS.PENDING) {
      return (
        <div className="courses-section app-form-wrapper">
          <h2>{t("profile.become_tutor", "Become a tutor")}</h2>
          <EmptyState
            icon="⏳"
            title={t("profile.application_pending", "Application under review")}
            hint={
              tutorApp.created_at ? (
                <span className="empty-state-hint">
                  {t("common.submitted", "Submitted")}: {new Date(tutorApp.created_at).toLocaleDateString()}
                </span>
              ) : null
            }
          />
        </div>
      );
    }

    if (tutorApp?.status === TUTOR_STATUS.REJECTED) {
      return (
        <form className="courses-section app-form-wrapper" onSubmit={submitTutorApplication}>
          <h2>{t("profile.become_tutor", "Become a tutor")}</h2>
          {tutorApp.rejection_reason && (
            <p className="rejection-reason">
              <strong>{t("tutor_application.rejection_reason", "Reason")}:</strong> {tutorApp.rejection_reason}
            </p>
          )}
          {renderAppForm()}
        </form>
      );
    }

    if (tutorApp?.status === TUTOR_STATUS.APPROVED) {
      return (
        <div className="courses-section app-form-wrapper">
          <h2>{t("profile.become_tutor", "Become a tutor")}</h2>
          <EmptyState
            icon="🎉"
            title={t("tutor_application.approved", "Approved! Welcome aboard 🎉")}
            hint={
              <button className="btn-primary" onClick={() => navigate("/tutor/dashboard")}>
                {t("navbar.tutor_dashboard", "Tutor Dashboard")}
              </button>
            }
          />
        </div>
      );
    }

    // NOT_REQUESTED or no application -> show form
    return (
      <form className="courses-section app-form-wrapper" onSubmit={submitTutorApplication}>
        <h2>{t("profile.become_tutor", "Become a tutor")}</h2>
        {renderAppForm()}
      </form>
    );
  };

  const renderAppForm = () => (
    <div className="app-form">
      <p className="empty-state-hint">{t("become_tutor.verification_hint", "Your application will be reviewed by our team.")}</p>
      {appField(t("profile.full_name", "Full name"), "full_name", "text", { required: true })}
      {appField(t("profile.phone", "Phone"), "phone", "tel")}
      {appField(t("profile.location", "Location"), "location")}
      {appField(t("cr_course.experience_label", "Years of experience"), "experience_years", "number", { min: 0 })}
      <div className="auth-form-field">
        <label htmlFor="app-exp-desc">{t("become_tutor.experience_desc", "Describe your teaching experience")}</label>
        <textarea
          id="app-exp-desc"
          rows={3}
          value={appForm.experience_description || ""}
          onChange={(e) => setAppForm((prev) => ({ ...prev, experience_description: e.target.value }))}
          className="app-textarea"
        />
      </div>
      <div className="auth-form-field">
        <label htmlFor="app-education">{t("become_tutor.education", "University / degrees / certificates")}</label>
        <textarea
          id="app-education"
          rows={2}
          value={appForm.education || ""}
          onChange={(e) => setAppForm((prev) => ({ ...prev, education: e.target.value }))}
          className="app-textarea"
        />
      </div>
      <div className="auth-form-field">
        <label>{t("become_tutor.step_subjects", "Subjects")}</label>
        <div className="multi-select">
          {SUBJECTS.map((s) => (
            <div key={s.value} className="select-item">
              <input
                type="checkbox"
                id={`app-subj-${s.value}`}
                checked={appForm.subjects.includes(s.value)}
                onChange={() => toggleAppValue("subjects", s.value)}
              />
              <label htmlFor={`app-subj-${s.value}`}>{t(s.labelKey, s.value)}</label>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-form-field">
        <label>{t("become_tutor.step_languages", "Languages")}</label>
        <div className="multi-select">
          {LANGUAGES.map((l) => (
            <div key={l.value} className="select-item">
              <input
                type="checkbox"
                id={`app-lang-${l.value}`}
                checked={appForm.languages.includes(l.value)}
                onChange={() => toggleAppValue("languages", l.value)}
              />
              <label htmlFor={`app-lang-${l.value}`}>{t(l.labelKey, l.value)}</label>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-form-field">
        <label htmlFor="app-bio">{t("become_tutor.bio", "Short bio for students")}</label>
        <textarea
          id="app-bio"
          rows={4}
          value={appForm.bio || ""}
          onChange={(e) => setAppForm((prev) => ({ ...prev, bio: e.target.value }))}
          className="app-textarea"
        />
      </div>
      {appField(
        t("become_tutor.id_document", "ID document number"),
        "id_document_name",
        "text",
        { placeholder: t("become_tutor.id_document_hint", "Passport / ID series and number") }
      )}
      <button type="submit" className="btn-primary" disabled={appSubmitting}>
        {appSubmitting ? t("common.sending", "Sending...") : t("profile.apply", "Apply")}
      </button>
    </div>
  );

  return (
    <div className="profile-page">
      <h1>{t("profile.my_profile")}</h1>
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <AvatarUploader
              src={formData.avatar || user.avatar || user.photoURL || ""}
              name={user.full_name || user.email}
              onSaved={handleAvatarSaved}
              onRemoved={handleAvatarRemoved}
            />
            <h2>{user.full_name}</h2>
            {user.role && (
              <span className={`role-badge ${roleBadge(user.role).className}`}>
                {roleBadge(user.role).label}
              </span>
            )}
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
                      placeholder={t("profile.link_placeholder", "Link")}
                      className="social-input"
                    />
                    {errors[name] && <p className="error-message">{errors[name]}</p>}
                  </>
                ) : (
                  user[name] && <a href={sanitizeHref(user[name])} target="_blank" rel="noopener noreferrer">{user[name]}</a>
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
                <p>{user.full_name}</p>
              )}
            </div>

            <div className="info-field">
              <label>{t("profile.email")}</label>
              <p>{user.email}</p>
            </div>

            <div className="info-field">
              <label>{t("profile.phone")}</label>
              {isEditing ? (
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
              ) : (
                <p>{user.phone || t("profile.not_provided")}</p>
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
                <p>{user.location}</p>
              )}
            </div>

            <div className="info-field">
              <label>{t("profile.experience_years", "Experience (years)")}</label>
              {isEditing ? (
                <input type="number" name="experience_years" value={formData.experience_years} onChange={handleInputChange} min="0" />
              ) : (
                <p>{user.experience_years || 0}</p>
              )}
            </div>

            <div className="info-field">
              <label>{t("profile.education", "Education")}</label>
              {isEditing ? (
                <input type="text" name="education" value={formData.education} onChange={handleInputChange} placeholder={t("profile.education_placeholder", "e.g. BSc Computer Science")} />
              ) : (
                <p>{user.education || t("profile.not_provided")}</p>
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
                <p>{user.bio || t("profile.not_provided")}</p>
              )}
            </div>
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button className="btn btn-primary" onClick={handleEditProfile}>{t("profile.update")}</button>
                <button className="btn btn-secondary" onClick={handleCancelEdit}>{t("profile.cancel")}</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={handleEditProfile}>{t("profile.edit_profile")}</button>
                <button className="btn btn-ghost" onClick={() => setShowLogoutConfirm(true)}>{t("profile.logout")}</button>
              </>
            )}
          </div>
        </div>
      </div>

      {isStudentRole ? renderTutorApplication() : renderCoursesSection()}

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title={t("profile.logout_title", "Logout?")}
        message={t("profile.logout_message", "Are you sure you want to logout?")}
        confirmLabel={t("profile.logout", "Logout")}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default Profile;
