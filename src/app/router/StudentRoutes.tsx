import { Route, Navigate } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import StudentLayout from "../../layouts/StudentLayout";
import ErrorBoundary from "../../components/ErrorBoundary";
import { ROLES } from "../../constants/roles";

const withBoundary = (node: React.ReactNode): React.ReactNode => <ErrorBoundary>{node}</ErrorBoundary>;

const PgDashboard = lazy(() => import("../../pages/PgDashboard"));
const PgStudentSearch = lazy(() => import("../../pages/PgStudentSearch"));
const PgStudentCourses = lazy(() => import("../../pages/PgStudentCourses"));
const PgStudentTutors = lazy(() => import("../../pages/PgStudentTutors"));
const PgStudentRequests = lazy(() => import("../../pages/PgStudentRequests"));
const PgStudentRequestDetail = lazy(() => import("../../pages/PgStudentRequestDetail"));
const PgSchedule = lazy(() => import("../../pages/Schedule/SchedulePage"));
const PgLessons = lazy(() => import("../../pages/PgLessons"));
const PgMessages = lazy(() => import("../../pages/PgMessages"));
const PgNotifications = lazy(() => import("../../pages/PgNotifications"));
const PgProgress = lazy(() => import("../../pages/PgProgress"));
const PgProfile = lazy(() => import("../../pages/PgProfile"));
const PgSettings = lazy(() => import("../../pages/PgSettings"));

export function StudentRoutes(): React.ReactNode {
  return (
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
  );
}
