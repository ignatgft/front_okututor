import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "../../api/courses.api";

export function useCoursesForFilter() {
  return useQuery({
    queryKey: ["courses", "filter"],
    queryFn: async () => {
      const { response, data } = await coursesApi.list("?page=0&size=100");
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to load courses");
      const courses = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data?.items)
        ? data.items
        : [];
      return courses.map((c) => ({
        id: c.id,
        title: c.title,
        tutorName: c.teacher_name || c.tutor_name,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}