// migrated to TSX — minimal strict types (controlled)
import { Navigate } from "react-router-dom";
import { isTutorLike, isAdmin } from "../../constants/roles";
import useAuthStore from "../../store/authStore";

interface RoleRedirectProps {
  student: string;
  tutor: string;
  admin?: string;
}

/**
 * Role-based redirect helper. Admins (ADMIN / SUPER_ADMIN) go to `admin`
 * when provided, otherwise they fall back to the tutor area (admins are
 * tutor-like), never to the student area.
 */
export default function RoleRedirect({ student, tutor, admin }: RoleRedirectProps) {
  const { user } = useAuthStore();
  const role = user?.role;

  if (isAdmin(role) && admin) {
    return <Navigate to={admin} replace />;
  }
  return <Navigate to={isTutorLike(role) ? tutor : student} replace />;
}
