import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import RoleRedirect from "../../components/routes/RoleRedirect";
import SupportTicketRedirect from "../../components/routes/SupportTicketRedirect";
import ErrorBoundary from "../../components/ErrorBoundary";
import SeoNoindex from "../../components/SeoNoindex";
import i18n from "../../i18n";
import { initAnalytics, trackPageView } from "../../utils/analytics";
import { StudentRoutes } from "./StudentRoutes";
import { TutorRoutes } from "./TutorRoutes";
import { AdminRoutes } from "./AdminRoutes";

const withBoundary = (node: React.ReactNode): React.ReactNode => <ErrorBoundary>{node}</ErrorBoundary>;

const PgLesson = lazy(() => import("../../pages/PgLesson"));
const PgBecomeTutor = lazy(() => import("../../pages/PgBecomeTutor"));
const PgMain = lazy(() => import("../../pages/PgMain"));
const PgCourseView = lazy(() => import("../../pages/PgCourseView"));
const PgSearch = lazy(() => import("../../pages/PgSearch"));
const PgTutorProfile = lazy(() => import("../../pages/PgTutorProfile"));
const PgNotFound = lazy(() => import("../../pages/PgNotFound"));
const PgForbidden = lazy(() => import("../../pages/PgForbidden"));
const PgOAuthCallback = lazy(() => import("../../pages/PgOAuthCallback"));
const PgForgotPassword = lazy(() => import("../../pages/PgForgotPassword"));
const PgResetPassword = lazy(() => import("../../pages/PgResetPassword"));
const PgVerifyEmail = lazy(() => import("../../pages/PgVerifyEmail"));
const Login = lazy(() => import("../../components/routes/Login"));
const RegisterPage = lazy(() => import("../../components/routes/RegisterPage"));
const CourseEditRedirect = lazy(() => import("../../components/routes/CourseEditRedirect"));

const PageLoader = (): JSX.Element => <div className="loading-screen" role="status" aria-live="polite">{i18n.t("common.loading", "Loading...")}</div>;

export function AppRouter(): JSX.Element {
  const location = useLocation();

  // GA4: report public page views only (private areas are filtered inside trackPageView)
  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return (
    <>
      <SeoNoindex />
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
        <Route path="/dashboard" element={<RoleRedirect student="/student/dashboard" tutor="/tutor/dashboard" admin="/admin" />} />
        <Route path="/profile" element={<RoleRedirect student="/student/profile" tutor="/tutor/profile" admin="/admin/profile" />} />
        <Route path="/schedule" element={<RoleRedirect student="/student/schedule" tutor="/tutor/schedule" admin="/admin" />} />
        <Route path="/messages" element={<RoleRedirect student="/student/messages" tutor="/tutor/messages" admin="/admin/support" />} />
        <Route path="/progress" element={<RoleRedirect student="/student/progress" tutor="/tutor/progress" admin="/admin/metrics" />} />
        <Route path="/settings" element={<RoleRedirect student="/student/settings" tutor="/tutor/settings" admin="/admin/settings" />} />
        <Route path="/course" element={<Navigate to="/tutor/courses/create" replace />} />
        <Route path="/course/edit/:courseId" element={<CourseEditRedirect />} />
        {StudentRoutes()}
        {TutorRoutes()}

        <Route element={<ProtectedRoute />}>
          <Route path="/lesson/:bookingId" element={withBoundary(<PgLesson />)} />
          <Route path="/become-tutor" element={<PgBecomeTutor />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/support" element={<RoleRedirect student="/student/messages?filter=support" tutor="/tutor/messages?filter=support" />} />
          <Route path="/support/new" element={<RoleRedirect student="/student/messages?filter=support" tutor="/tutor/messages?filter=support" />} />
          <Route path="/support/tickets/:ticketId" element={<SupportTicketRedirect />} />
        </Route>

        {AdminRoutes()}

        <Route path="*" element={withBoundary(<LazyNotFound />)} />
      </Routes>
      </Suspense>
    </>
  );
}

const LazyNotFound = lazy(() => import("../../pages/PgNotFound"));
