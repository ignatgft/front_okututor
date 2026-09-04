// migrated to TSX — minimal strict types (controlled)
import { useParams, Navigate } from "react-router-dom";

export default function CourseEditRedirect() {
  const { courseId } = useParams();
  return <Navigate to={`/tutor/courses/edit/${courseId}`} replace />;
}