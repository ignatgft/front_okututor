import { useParams, Navigate } from "react-router-dom";
import { isTutorLike } from "../../constants/roles";
import useAuthStore from "../../store/authStore";

export default function SupportTicketRedirect() {
  const { ticketId } = useParams();
  const { user } = useAuthStore();
  const section = isTutorLike(user?.role) ? "tutor" : "student";
  return <Navigate to={`/${section}/messages?ticket=${ticketId}`} replace />;
}