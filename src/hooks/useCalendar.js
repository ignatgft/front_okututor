import { useState, useEffect, useCallback, useRef } from "react";
import { loadCalendarRange } from "../api/calendar.api";
import { tutorsApi } from "../api/tutors.api";
import { toLocalInput } from "../utils/date";

/**
 * Owns calendar data for a date range: booking/lesson events plus (for
 * tutors) weekly availability slots. Exposes refetch and mutation helpers
 * so the UI can reload after a booking/availability change.
 *
 * Events come from loadCalendarRange() which hits GET /api/v1/calendar and
 * falls back to bookings.my / bookings.teacher when the calendar feed is
 * empty (see calendar.api.js).
 */
export function useCalendar({ from, to, tutorMode = false, includeAvailability = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [availability, setAvailability] = useState([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [saving, setSaving] = useState(false);

  const abortRef = useRef(null);

  const rangeKey = from && to ? `${from.getTime()}|${to.getTime()}` : "";

  const fetchEvents = useCallback(async () => {
    if (!rangeKey) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const data = await loadCalendarRange(
        toLocalInput(from),
        toLocalInput(to),
        { tutorMode }
      );
      if (controller.signal.aborted) return;
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err.message || "Failed to load calendar");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [rangeKey, from, to, tutorMode]);

  useEffect(() => {
    fetchEvents();
    return () => abortRef.current?.abort();
  }, [fetchEvents]);

  const fetchAvailability = useCallback(async () => {
    setAvailabilityError("");
    try {
      const { response, data } = await tutorsApi.availability();
      if (response.ok) setAvailability(Array.isArray(data) ? data : data.content || []);
      else setAvailabilityError(data?.error || data?.message || "Failed to load availability");
    } catch (e) {
      setAvailabilityError(e.message || "Failed to load availability");
    }
  }, []);

  useEffect(() => {
    if (tutorMode && includeAvailability) fetchAvailability();
  }, [tutorMode, includeAvailability, fetchAvailability]);

  const addSlot = useCallback(
    async (slot) => {
      setSaving(true);
      try {
        const { response } = await tutorsApi.addAvailability(slot);
        if (!response.ok) return { ok: false };
        await fetchAvailability();
        return { ok: true };
      } finally {
        setSaving(false);
      }
    },
    [fetchAvailability]
  );

  const removeSlot = useCallback(
    async (id) => {
      setSaving(true);
      try {
        await tutorsApi.removeAvailability(id);
        await fetchAvailability();
        return { ok: true };
      } finally {
        setSaving(false);
      }
    },
    [fetchAvailability]
  );

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    availability,
    availabilityError,
    availabilityLoading: saving,
    reloadAvailability: fetchAvailability,
    addSlot,
    removeSlot,
  };
}
