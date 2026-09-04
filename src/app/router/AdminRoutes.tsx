import { Route } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import AdminLayout from "../../layouts/AdminLayout";
import ErrorBoundary from "../../components/ErrorBoundary";
import { ROLES } from "../../constants/roles";

const withBoundary = (node: React.ReactNode): React.ReactNode => <ErrorBoundary>{node}</ErrorBoundary>;

const PgAdmin = lazy(() => import("../../pages/PgAdmin"));
const PgAdminUsers = lazy(() => import("../../pages/PgAdminUsers"));
const PgAdminTutors = lazy(() => import("../../pages/PgAdminTutors"));
const PgAdminCourses = lazy(() => import("../../pages/PgAdminCourses"));
const PgAdminReviews = lazy(() => import("../../pages/PgAdminReviews"));
const PgAdminReports = lazy(() => import("../../pages/PgAdminReports"));
const PgAdminMetrics = lazy(() => import("../../pages/PgAdminMetrics"));
const PgAdminSupport = lazy(() => import("../../pages/PgAdminSupport"));
const PgAdminSupportTicket = lazy(() => import("../../pages/PgAdminSupportTicket"));
const PgProfile = lazy(() => import("../../pages/PgProfile"));
const PgSettings = lazy(() => import("../../pages/PgSettings"));

export function AdminRoutes(): React.ReactNode {
  return (
    <Route element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={withBoundary(<PgAdmin />)} />
        <Route path="/admin/users" element={<PgAdminUsers />} />
        <Route path="/admin/tutors" element={<PgAdminTutors />} />
        <Route path="/admin/courses" element={<PgAdminCourses />} />
        <Route path="/admin/reviews" element={<PgAdminReviews />} />
        <Route path="/admin/reports" element={<PgAdminReports />} />
        <Route path="/admin/metrics" element={<PgAdminMetrics />} />
        <Route path="/admin/support" element={<PgAdminSupport />} />
        <Route path="/admin/support/tickets/:id" element={<PgAdminSupportTicket />} />
        <Route path="/admin/profile" element={withBoundary(<PgProfile />)} />
        <Route path="/admin/settings" element={<PgSettings />} />
      </Route>
    </Route>
  );
}
