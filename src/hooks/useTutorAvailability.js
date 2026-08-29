import { useCallback, useEffect, useState } from "react";
import { tutorsApi } from "../api/tutors.api";

function normalize(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

/**
 * Loads the public weekly availability slots of a specific tutor (by id).
 * Used on student-facing pages to show truly free times in the booking flow.
 * Fails gracefully to [] until the backend exposes the endpoint.
 */
export function useTutorAvailability(tutorId) {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!tutorId) {
      setAvailability([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { response, data } = await tutorsApi.availabilityByTeacher(tutorId);
      if (response.ok) setAvailability(normalize(data));
      else setAvailability([]);
    } catch (e) {
      setError(e.message || "Failed to load availability");
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    load();
  }, [load]);

  return { availability, loading, error, reload: load };
}
