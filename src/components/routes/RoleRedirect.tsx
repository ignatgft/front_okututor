// migrated to TSX — minimal strict types (controlled)
import { Navigate } from "react-router-dom";
import { isTutorLike } from "../../constants/roles";
import useAuthStore from "../../store/authStore";

export default function RoleRedirect({ student, tutor, admin }: Record<string, unknown>) {
  const { user } = useAuthStore();
  const role = user?.role;
  if (admin && isTutorLike(role) && (role === "ADMIN" || role === "SUPER_ADMIN")) {
    return <Navigate to={admin} replace />;
  }
  return <Navigate to={isTutorLike(role) ? tutor : student} replace />;
}