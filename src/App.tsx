// migrated to TSX — minimal strict types (controlled)
import { Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useAuthStore from "./store/authStore";
import { useUIStore } from "./store/uiStore";
import Auth from "./components/AuthRegister/Auth";
import Register from "./components/AuthRegister/Register";
import BottomNav from "./components/BottomNav";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";
import { ROLES, ADMIN_ROLES } from "./constants/roles";
import i18n from "./i18n";
import "./styles/Toast.css";
import RoleRedirect from "./components/routes/RoleRedirect";
import AuthPage from "./components/routes/AuthPage";
import Login from "./components/routes/Login";
import RegisterPage from "./components/routes/RegisterPage";
import CourseEditRedirect from "./components/routes/CourseEditRedirect";
import SupportTicketRedirect from "./components/routes/SupportTicketRedirect";

import StudentLayout from "./layouts/StudentLayout";
import TutorLayout from "./layouts/TutorLayout";
import AdminLayout from "./layouts/AdminLayout";

const PageLoader = () => <div className="loading-screen" role="status" aria-live="polite">{i18n.t("common.loading", "Loading...")}</div>;

const Lazy = (loader) =>
  lazy(loader);

// Per-route boundary keeps one broken page from killing the whole router (audit P2-17)
const withBoundary = (node) => <ErrorBoundary>{node}</ErrorBoundary>;

const PgMain = Lazy(() => import("./pages/PgMain"));
const PgProfile = Lazy(() => import("./pages/PgProfile"));
const PgCourse = Lazy(() => import("./pages/PgCourse"));
const PgCourseView = Lazy(() => import("./pages/PgCourseView"));
const PgSearch = Lazy(() => import("./pages/PgSearch"));
const PgDashboard = Lazy(() => import("./pages/PgDashboard"));
const PgTutorDashboard = Lazy(() => import("./pages/PgTutorDashboard"));
const PgTutorCourses = Lazy(() => import("./pages/PgTutorCourses"));
const PgTutorStudents = Lazy(() => import("./pages/PgTutorStudents"));
const PgLesson = Lazy(() => import("./pages/PgLesson"));
const PgTutorProfile = Lazy(() => import("./pages/PgTutorProfile"));
const PgAdmin = Lazy(() => import("./pages/PgAdmin"));
const PgAdminUsers = Lazy(() => import("./pages/PgAdminUsers"));
const PgSchedule = Lazy(() => import("./pages/Schedule/SchedulePage"));
const PgProgress = Lazy(() => import("./pages/PgProgress"));
const PgMessages = Lazy(() => import("./pages/PgMessages"));
const PgSettings = Lazy(() => import("./pages/PgSettings"));
const PgOAuthCallback = Lazy(() => import("./pages/PgOAuthCallback"));
const PgForgotPassword = Lazy(() => import("./pages/PgForgotPassword"));
const PgResetPassword = Lazy(() => import("./pages/PgResetPassword"));
const PgStudentCourses = Lazy(() => import("./pages/PgStudentCourses"));
const PgStudentTutors = Lazy(() => import("./pages/PgStudentTutors"));
const PgStudentRequests = Lazy(() => import("./pages/PgStudentRequests"));
const PgStudentRequestDetail = Lazy(() => import("./pages/PgStudentRequestDetail"));
const PgStudentSearch = Lazy(() => import("./pages/PgStudentSearch"));
const PgLessons = Lazy(() => import("./pages/PgLessons"));
const PgBecomeTutor = Lazy(() => import("./pages/PgBecomeTutor"));
const PgTutorApplication = Lazy(() => import("./pages/PgTutorApplication"));
const PgTutorRequests = Lazy(() => import("./pages/PgTutorRequests"));
const PgTutorRequestDetail = Lazy(() => import("./pages/PgTutorRequestDetail"));
const PgAdminTutors = Lazy(() => import("./pages/PgAdminTutors"));
const PgAdminCourses = Lazy(() => import("./pages/PgAdminCourses"));
const PgAdminReviews = Lazy(() => import("./pages/PgAdminReviews"));
const PgAdminReports = Lazy(() => import("./pages/PgAdminReports"));
const PgNotFound = Lazy(() => import("./pages/PgNotFound"));
const PgForbidden = Lazy(() => import("./pages/PgForbidden"));
const PgNotifications = Lazy(() => import("./pages/PgNotifications"));
const PgVerifyEmail = Lazy(() => import("./pages/PgVerifyEmail"));
const PgSupport = Lazy(() => import("./pages/PgSupport"));
const PgSupportNew = Lazy(() => import("./pages/PgSupportNew"));
const PgSupportTicket = Lazy(() => import("./pages/PgSupportTicket"));
const PgAdminSupport = Lazy(() => import("./pages/PgAdminSupport"));
const PgAdminSupportTicket = Lazy(() => import("./pages/PgAdminSupportTicket"));

function App() {
  const { t } = useTranslation();
  const { init, retryInit, status, initError, logout } = useAuthStore();
  const { isAuthOpen, isRegisterOpen, closeAuth, closeRegister } = useUIStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const handleAuthLogout = async () => {
      await logout();
    };
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, [logout]);

  if (status === "initializing")
    return <div className="loading-screen" role="status" aria-live="polite">{i18n.t("common.loading", "Loading...")}</div>;

  if (status === "offline")
    return (
      <div className="loading-screen" role="alert" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: 24, textAlign: "center" }}>
        <p>{initError || t("errors.network_error", "Network error. Check your connection.")}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn-primary" onClick={() => retryInit()}>
            {t("common.retry", "Retry")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
            {t("common.reload", "Reload")}
          </button>
        </div>
      </div>
    );

  return (
    <ToastProvider>
      <ErrorBoundary>
        <a href="#main-content" className="skip-nav">{t("a11y.skip_to_content", "Skip to content")}</a>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={withBoundary(<PgMain />)} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<PgForgotPassword />} />
            <Route path="/reset-password" element={<PgResetPassword />} />
            <Route path="/verify-email" element={<PgVerifyEmail />} />
            <Route path="/oauth/callback" element={<PgOAuthCallback />} />
            <Route path="/oauth2/redirect" element={<PgOAuthCallback />} />

            <Route path="/search" element={withBoundary(<PgSearch />)} />
            <Route path="/find-tutors" element={<Navigate to="/search" replace />} />
            <Route path="/course/:courseId" element={withBoundary(<PgCourseView />)} />
            <Route path="/tutor/:tutorId" element={<PgTutorProfile />} />

            <Route path="/403" element={<PgForbidden />} />

            {/* Student area — nested routes with shared layout */}
            <Route element={<ProtectedRoute roles={[ROLES.STUDENT]} />}>
              <Route element={<StudentLayout />}>
                <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
                <Route path="/student/dashboard" element={withBoundary(<PgDashboard />)} />
                <Route path="/student/search" element={<PgStudentSearch />} />
                <Route path="/student/courses" element={<PgStudentCourses />} />
                <Route path="/student/tutors" element={<PgStudentTutors />} />
                <Route path="/student/requests" element={<PgStudentRequests />} />
                <Route path="/student/requests/:id" element={<PgStudentRequestDetail />} />
                <Route path="/student/schedule" element={withBoundary(<PgSchedule />)} />
                <Route path="/student/lessons" element={<PgLessons />} />
                <Route path="/student/messages" element={withBoundary(<PgMessages />)} />
                <Route path="/student/notifications" element={<PgNotifications />} />
                <Route path="/student/progress" element={<PgProgress />} />
                <Route path="/student/profile" element={withBoundary(<PgProfile />)} />
                <Route path="/student/settings" element={<PgSettings />} />
              </Route>
            </Route>

            {/* Tutor area — nested routes with shared layout */}
            <Route element={<ProtectedRoute roles={[ROLES.TUTOR, ROLES.ADMIN]} />}>
              <Route element={<TutorLayout />}>
                <Route path="/tutor" element={<Navigate to="/tutor/dashboard" replace />} />
                <Route path="/tutor/application" element={<PgTutorApplication />} />
                <Route path="/tutor/dashboard" element={<PgTutorDashboard />} />
                <Route path="/tutor/requests" element={<PgTutorRequests />} />
                <Route path="/tutor/requests/:id" element={<PgTutorRequestDetail />} />
                <Route path="/tutor/courses" element={<PgTutorCourses />} />
                <Route path="/tutor/courses/new" element={<PgCourse />} />
                <Route path="/tutor/courses/create" element={<PgCourse />} />
                <Route path="/tutor/courses/edit/:courseId" element={<PgCourse editMode />} />
                <Route path="/tutor/students" element={<PgTutorStudents />} />
                <Route path="/tutor/schedule" element={withBoundary(<PgSchedule />)} />
                <Route path="/tutor/lessons" element={<PgLessons />} />
                <Route path="/tutor/messages" element={withBoundary(<PgMessages />)} />
                <Route path="/tutor/notifications" element={<PgNotifications />} />
                <Route path="/tutor/profile" element={withBoundary(<PgProfile />)} />
                <Route path="/tutor/settings" element={<PgSettings />} />
                <Route path="/tutor/progress" element={<PgProgress />} />
              </Route>
            </Route>

            {/* Shared lesson room */}
            <Route element={<ProtectedRoute />}>
              <Route path="/lesson/:bookingId" element={withBoundary(<PgLesson />)} />
              <Route path="/become-tutor" element={<PgBecomeTutor />} />
            </Route>

            {/* Support routes (any authenticated user) -> redirect to unified messages */}
            <Route element={<ProtectedRoute />}>
              <Route path="/support" element={<RoleRedirect student="/student/messages?filter=support" tutor="/tutor/messages?filter=support" />} />
              <Route path="/support/new" element={<RoleRedirect student="/student/messages?filter=support" tutor="/tutor/messages?filter=support" />} />
              <Route path="/support/tickets/:ticketId" element={<SupportTicketRedirect />} />
            </Route>

            {/* Admin area — nested routes with shared layout */}
            <Route element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={withBoundary(<PgAdmin />)} />
                <Route path="/admin/users" element={<PgAdminUsers />} />
                <Route path="/admin/tutors" element={<PgAdminTutors />} />
                <Route path="/admin/courses" element={<PgAdminCourses />} />
                <Route path="/admin/reviews" element={<PgAdminReviews />} />
                <Route path="/admin/reports" element={<PgAdminReports />} />
                <Route path="/admin/support" element={<PgAdminSupport />} />
                <Route path="/admin/support/tickets/:id" element={<PgAdminSupportTicket />} />
                <Route path="/admin/profile" element={withBoundary(<PgProfile />)} />
                <Route path="/admin/settings" element={<PgSettings />} />
              </Route>
            </Route>

            {/* Legacy redirects */}
            <Route path="/dashboard" element={<RoleRedirect student="/student/dashboard" tutor="/tutor/dashboard" />} />
            <Route path="/profile" element={<RoleRedirect student="/student/profile" tutor="/tutor/profile" />} />
            <Route path="/schedule" element={<RoleRedirect student="/student/schedule" tutor="/tutor/schedule" />} />
            <Route path="/messages" element={<RoleRedirect student="/student/messages" tutor="/tutor/messages" />} />
            <Route path="/progress" element={<RoleRedirect student="/student/progress" tutor="/tutor/progress" />} />
            <Route path="/settings" element={<RoleRedirect student="/student/settings" tutor="/tutor/settings" />} />
            <Route path="/course" element={<Navigate to="/tutor/courses/create" replace />} />
            <Route path="/course/edit/:courseId" element={<CourseEditRedirect />} />

            <Route path="*" element={<PgNotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      <BottomNav />

      <Auth
        isOpen={isAuthOpen}
        onClose={closeAuth}
        onSuccess={closeAuth}
      />
      <Register
        isOpen={isRegisterOpen}
        onClose={closeRegister}
      />
    </ToastProvider>
  );
}

export default App;
