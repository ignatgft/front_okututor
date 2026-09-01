import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../store/authStore";
import { apiClient } from "../api/http";
import { endpoints } from "../api/endpoints";
import { bookingApi } from "../api/booking.api";
import { usePageTitle } from "../components/pageTitleContext";
import ConfirmModal from "../components/ui/ConfirmModal";
import ScheduleModal from "../components/ScheduleModal";
import { Skeleton, ErrorState, EmptyState } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import "../styles/Dashboard.css";

const TABS = ["overview", "requests", "bookings"];

export default function PgTutorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = TABS.includes(tabParam) ? tabParam : "overview";
  const setTab = (next) => setSearchParams(next === "overview" ? {} : { tab: next });
  const [bookings, setBookings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [scheduleModal, setScheduleModal] = useState(null); // { enrollment } | null
  const [messageOffer, setMessageOffer] = useState(null); // { studentName } | null
  const setPageTitle = usePageTitle();
  useEffect(() => { setPageTitle(t("tutor_dashboard.title", "Tutor Dashboard")); }, [setPageTitle, t]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "bookings" || tab === "overview") {
        const { response, data } = await bookingApi.teacher();
        if (response.ok) setBookings(data.content || []);
        else setError(data.error || t("errors.default", "Something went wrong."));
      }
      if (tab === "requests" || tab === "overview") {
          const { response: enrRes, data: enrData } = await apiClient.get(
              endpoints.enrollments.tutorRequests
          );
          if (enrRes.ok) setEnrollments(enrData.content || []);
      }
      if (tab === "overview" && user?.id) {
        const { response, data } = await apiClient.get(endpoints.courses.byTeacher(user.id));
        if (response.ok) setCourses(Array.isArray(data) ? data : data.content || []);
      }
    } catch (e) {
      setError(t("errors.network", "Network error") + ": " + e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, user, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const runBookingAction = async (action, id) => {
    setActionLoading(true);
    try {
      await action(id);
      setConfirmAction(null);
      await loadData();
      toast.success(t("tutor_dashboard.action_success", "Action completed"));
    } catch (e) {
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setActionLoading(false);
    }
  };

  const confirmBooking = (id) => runBookingAction(bookingApi.confirm, id);
  const rejectBooking = (id) => runBookingAction(bookingApi.reject, id);
  const completeBooking = (id) => runBookingAction(bookingApi.complete, id);

  const rejectEnrollment = async (enrollmentId) => {
      setActionLoading(true);
      try {
          const { response } = await apiClient.post(endpoints.enrollments.reject(enrollmentId));
          if (response.ok) {
              toast.success(t("student_requests.cancel_success", "Request rejected"));
              await loadData();
          } else {
              toast.error(t("errors.default", "Something went wrong"));
          }
      } catch (e) {
          toast.error(e.message || t("errors.default", "Something went wrong"));
      } finally {
          setActionLoading(false);
      }
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");

  return (
    <>
      <div className="dashboard-tabs">
        {TABS.map((t2) => (
          <button key={t2} className={`tab ${tab === t2 ? "active" : ""}`} onClick={() => setTab(t2)}>
            {t(`tutor_dashboard.${t2}`) || t2.charAt(0).toUpperCase() + t2.slice(1)}
          </button>
        ))}
      </div>

      {error && !loading && (
        <ErrorState message={error} onRetry={loadData} />
      )}

      {loading && (
        <>
          <Skeleton count={3} className="skeleton-card" />
          <Skeleton count={2} className="skeleton-card" />
        </>
      )}

      {!loading && !error && (
        <>
          {tab === "overview" && (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{courses.length}</h3>
                  <p>{t("tutor_dashboard.total_courses")}</p>
                </div>
                <div className="stat-card">
                  <h3>{pendingBookings.length}</h3>
                  <p>{t("tutor_dashboard.pending_bookings")}</p>
                </div>
                <div className="stat-card">
                  <h3>{confirmedBookings.length}</h3>
                  <p>{t("tutor_dashboard.confirmed_bookings")}</p>
                </div>
                <div className="stat-card">
                    <h3>{enrollments.filter(e => e.status === "PENDING").length}</h3>
                    <p>{t("tutor_dashboard.pending_requests", "New applications")}</p>
                </div>
              </div>

              {pendingBookings.length > 0 && (
                <div className="pending-section">
                  <h2>{t("tutor_dashboard.pending_requests")}</h2>
                  {pendingBookings.map((b) => (
                    <div key={b.id} className="booking-card">
                      <div className="booking-info">
                        <h3>{b.course_title}</h3>
                        <p>{b.student_name}</p>
                        <p className="booking-time">
                          {new Date(b.start_at).toLocaleDateString()} {new Date(b.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="booking-actions">
                        <button className="btn-primary" onClick={() => confirmBooking(b.id)}>
                          {t("tutor_dashboard.confirm")}
                        </button>
                        <button className="btn-secondary" onClick={() => setConfirmAction({ type: "reject", booking: b })}>
                          {t("tutor_dashboard.reject")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingBookings.length === 0 && (
                <EmptyState
                  title={t("tutor_dashboard.no_pending", "No pending requests")}
                  hint={t("tutor_dashboard.no_pending_hint", "All caught up! New booking requests will appear here.")}
                />
              )}

              <div className="pending-section">
                <h2>{t("admin.quick_actions", "Quick actions")}</h2>
                <div className="booking-actions">
                  <Link to="/tutor/courses/create" className="btn-primary">{t("tutor_dashboard.create_course") || "Create Course"}</Link>
                  <Link to="/tutor/courses" className="btn-secondary">{t("profile.my_courses") || "My Courses"}</Link>
                  <Link to="/tutor/students" className="btn-secondary">{t("tutor_dashboard.students", "Students")}</Link>
                </div>
              </div>
            </div>
          )}

          {tab === "requests" && (
              <div className="bookings-section">
                  {enrollments.filter((e) => e.status === "PENDING").length === 0 ? (
                      <EmptyState
                          title={t("tutor_dashboard.no_pending", "No pending requests")}
                          hint={t("tutor_dashboard.no_pending_hint", "New requests from students will appear here.")}
                      />
                  ) : (
                      enrollments
                          .filter((e) => e.status === "PENDING")
                          .map((e) => (
                              <div key={e.id} className="booking-card">
                                  <div className="booking-info">
                                      <h3>{e.course_title}</h3>
                                      <p>{e.student_name}</p>
                                      {e.preferred_schedule && (
                                          <p>{t("schedule_modal.preferred", "Preferred")}: {e.preferred_schedule}</p>
                                      )}
                                      {e.message && (
                                          <p>{e.message}</p>
                                      )}
                                  </div>
                                  <div className="booking-actions">
                                      <button
                                          className="btn-primary"
                                          onClick={() => setScheduleModal({ enrollment: e })}
                                      >
                                          {t("schedule_modal.submit", "Confirm and Schedule")}
                                      </button>
                                      <button
                                          className="btn-secondary"
                                          onClick={() => rejectEnrollment(e.id)}
                                          disabled={actionLoading}
                                      >
                                          {t("tutor_dashboard.reject", "Reject")}
                                      </button>
                                  </div>
                              </div>
                          ))
                  )}
              </div>
          )}

          {tab === "bookings" && (
            <div className="bookings-section">
              {bookings.length === 0 ? (
                <EmptyState
                  title={t("tutor_dashboard.no_bookings", "No bookings yet")}
                  hint={t("tutor_dashboard.no_bookings_hint", "Your bookings will appear here once students enroll.")}
                />
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="booking-card">
                    <div className="booking-info">
                      <h3>{b.course_title}</h3>
                      <p>{b.student_name} - {b.teacher_name}</p>
                      <p className="booking-time">
                        {new Date(b.start_at).toLocaleDateString()} {new Date(b.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <span className={`status-badge status-${b.status.toLowerCase()}`}>{t(`statuses.${b.status}`, b.status)}</span>
                    </div>
                    <div className="booking-actions">
                      {b.status === "PENDING" && (
                        <>
                          <button className="btn-primary" onClick={() => confirmBooking(b.id)}>
                            {t("tutor_dashboard.confirm")}
                          </button>
                          <button className="btn-secondary" onClick={() => setConfirmAction({ type: "reject", booking: b })}>
                            {t("tutor_dashboard.reject")}
                          </button>
                        </>
                      )}
                      {b.status === "CONFIRMED" && (
                        <>
                          <button className="btn-primary" onClick={() => navigate(`/lesson/${b.id}`)}>
                            {t("dashboard.join_lesson")}
                          </button>
                          <button className="btn-secondary" onClick={() => setConfirmAction({ type: "complete", booking: b })}>
                            {t("tutor_dashboard.complete")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {scheduleModal && (
          <ScheduleModal
              enrollment={scheduleModal.enrollment}
              onClose={() => setScheduleModal(null)}
              onSuccess={() => {
                  const studentName =
                      scheduleModal.enrollment.student_name ||
                      scheduleModal.enrollment.student?.full_name ||
                      "";
                  setScheduleModal(null);
                  setMessageOffer({ studentName });
                  toast.success(t("success.action_completed", "Action completed"));
                  loadData();
              }}
          />
      )}

      <ConfirmModal
        isOpen={!!confirmAction}
        title={
          confirmAction?.type === "reject"
            ? t("booking.reject_title", "Reject booking request?")
            : t("booking.complete_title", "Complete this lesson?")
        }
        message={
          confirmAction?.type === "reject"
            ? t("booking.reject_message", "The student will be notified that you declined this booking.")
            : t("booking.complete_message", "The lesson will be marked as completed and the student will be able to leave a review.")
        }
        confirmLabel={confirmAction?.type === "reject" ? t("tutor_dashboard.reject") : t("tutor_dashboard.complete")}
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.type === "reject") rejectBooking(confirmAction.booking.id);
          else completeBooking(confirmAction.booking.id);
        }}
      />

      <ConfirmModal
        isOpen={!!messageOffer}
        title={t("tutor_dashboard.request_accepted", "Request accepted")}
        message={t("tutor_dashboard.message_student_offer", "You can now message {{name}} with details about the lesson.", {
          name: messageOffer?.studentName || "",
        })}
        confirmLabel={t("tutor_dashboard.message_student", "Message student")}
        cancelLabel={t("common.done", "Done")}
        danger={false}
        onCancel={() => setMessageOffer(null)}
        onConfirm={() => {
          setMessageOffer(null);
          navigate("/tutor/messages");
        }}
      />
    </>
  );
}
