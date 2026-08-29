import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../api/http";
import { endpoints } from "../api/endpoints";
import { Spinner, Skeleton, EmptyState, ErrorState } from "./ui/Primitives";
import { useToast } from "./ui/Toast";
import "../styles/TutorProfile.css";

export default function TutorProfileContent() {
  const { tutorId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [tutor, setTutor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [userRes, coursesRes] = await Promise.all([
        apiClient.get(endpoints.users.byId(tutorId)),
        apiClient.get(endpoints.courses.byTeacher(tutorId)),
      ]);
      if (userRes.response.ok) setTutor(userRes.data);
      else setError(userRes.data.error || t("errors.default", "Something went wrong."));
      if (coursesRes.response.ok) setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.content || []);
    } catch (e) {
      setError(t("errors.network", "Network error") + ": " + e.message);
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setLoading(false);
    }
  }, [tutorId, t, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sanitizeHref = (url) => {
    if (!url) return "#";
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      if (["http:", "https:"].includes(parsed.protocol)) return parsed.href;
    } catch { /* fall through */ }
    return "#";
  };

  if (loading) {
    return (
      <div className="tutor-profile-page">
        <Spinner label={t("common.loading", "Loading...")} />
        <Skeleton count={3} variant="card" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="tutor-profile-page">
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }
  if (!tutor) {
    return (
      <div className="tutor-profile-page">
        <EmptyState
          icon="👤"
          title={t("tutor_profile.not_found", "Tutor not found")}
          hint={t("tutor_profile.not_found_hint", "This tutor profile does not exist or has been removed.")}
        />
      </div>
    );
  }

  return (
    <div className="tutor-profile-page">
      <div className="tutor-profile-container">
        <div className="tutor-card-full">
          <img src={tutor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.full_name)}&background=3563E9&color=fff`} alt={tutor.full_name} className="tutor-avatar" />
          <div className="tutor-info-full">
            <h1>{tutor.full_name}</h1>
            {tutor.verification_status === "VERIFIED" && <span className="verified-badge">✓ {t("tutor_profile.verified", "Verified")}</span>}
            <p className="tutor-location">{tutor.location}</p>
            {tutor.experience_years > 0 && <p>{t("profile.experience", "Experience")}: {tutor.experience_years} {t("profile.years", "years")}</p>}
            {tutor.bio && <p className="tutor-bio">{tutor.bio}</p>}
            {tutor.subjects && <p><strong>{t("profile.subjects", "Subjects")}:</strong> {tutor.subjects}</p>}
            <div className="social-links">
              {tutor.telegram && <a href={sanitizeHref(tutor.telegram)} target="_blank" rel="noopener noreferrer">Telegram</a>}
              {tutor.instagram && <a href={sanitizeHref(tutor.instagram)} target="_blank" rel="noopener noreferrer">Instagram</a>}
              {tutor.whatsapp && <a href={sanitizeHref(tutor.whatsapp)} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
            </div>
          </div>
        </div>

        <h2>{t("tutor_profile.courses", "Courses")}</h2>
        {courses.length === 0 ? (
          <EmptyState
            icon="📚"
            title={t("tutor_profile.no_courses", "No courses yet")}
            hint={t("tutor_profile.no_courses_hint", "This tutor hasn't published any courses yet.")}
          />
        ) : (
          <div className="courses-grid">
            {courses.map((c) => (
              <div key={c.id} className="course-card" onClick={() => navigate(`/course/${c.id}`)}>
                <h3>{c.title}</h3>
                <p>{c.description?.substring(0, 100)}...</p>
                <div className="course-meta">
                  <span>{c.price_per_hour} {c.currency || "KGS"}/hr</span>
                  <span>{c.average_rating?.toFixed(1) || "0.0"} ★</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
