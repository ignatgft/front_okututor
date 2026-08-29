import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CourseWizard from "../components/CourseWizard";
import { usePageTitle } from "../components/pageTitleContext";
import { Spinner, ErrorState } from "../components/ui/Primitives";
import { coursesApi } from "../api/courses.api";
import { useTranslation } from "react-i18next";

function PgCourse() {
  const { courseId } = useParams();
  const { t } = useTranslation();
  const setPageTitle = usePageTitle();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(Boolean(courseId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    coursesApi
      .byId(courseId)
      .then(({ response, data }) => {
        if (cancelled) return;
        if (response.ok) setInitialData(data);
        else setError(data.error || data.message || t("common.error", "Error"));
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [courseId, t]);

  useEffect(() => {
    setPageTitle(courseId ? t("cr_course.edit_title") : t("cr_course.page_title"));
  }, [setPageTitle, courseId, t]);

  return (
      <>
      {loading ? (
        <Spinner label={t("common.loading", "Loading...")} />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <CourseWizard key={courseId || "new"} initialData={initialData} />
      )}
      </>
  );
}

export default PgCourse;
