import { useState, useEffect, useCallback } from "react";
import type { CountdownResult } from "../../types/schedule";

/**
 * Hook for real-time countdown to a target date
 * Uses requestAnimationFrame for smooth updates without causing re-renders of parent components
 * 
 * @param targetDate - ISO date string (UTC) to count down to
 * @returns CountdownResult with days, hours, minutes, seconds
 */
export function useCountdown(targetDate: string | null): CountdownResult {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!targetDate) return;
    // Throttled to 1s — rAF 60fps would cause 60 rerenders/sec per NextLessonCard
    // 1s is enough for countdown text and respects visibility
    const tick = (): void => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    const handleVisibility = (): void => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [targetDate]);

  const result = useCallback((): CountdownResult => {
    if (!targetDate) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
        isPast: false,
        isSoon: false,
      };
    }

    const target = new Date(targetDate).getTime();
    const diff = target - now;

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
        isPast: true,
        isSoon: false,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
      days,
      hours,
      minutes,
      seconds,
      totalMs: diff,
      isPast: false,
      isSoon: diff < 15 * 60 * 1000, // Within 15 minutes
    };
  }, [targetDate, now]);

  return result();
}

/**
 * Format countdown for display
 */
export function formatCountdown(countdown: CountdownResult, t: (key: string, defaultValue: string) => string): string {
  if (countdown.isPast) {
    return t("schedule.countdown_started", "Урок начался");
  }

  const parts: string[] = [];
  if (countdown.days > 0) parts.push(`${countdown.days} ${t("plural.day", "д")}`);
  if (countdown.hours > 0) parts.push(`${countdown.hours} ${t("plural.hour", "ч")}`);
  if (countdown.minutes > 0) parts.push(`${countdown.minutes} ${t("plural.minute", "мин")}`);
  if (parts.length === 0) parts.push(`${countdown.seconds} ${t("plural.second", "с")}`);

  return parts.join(" ");
}

/**
 * Check if join button should be enabled based on countdown
 * Join is enabled 15 minutes before start and during the lesson
 */
export function canJoinFromCountdown(countdown: CountdownResult, lessonStatus: string): boolean {
  if (lessonStatus === "IN_PROGRESS") return true;
  if (lessonStatus !== "SCHEDULED") return false;
  return countdown.isSoon && !countdown.isPast; // Within 15 minutes before start
}