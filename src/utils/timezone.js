import useAuthStore from "../store/authStore";

export function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function getUserTimezone() {
  try {
    return useAuthStore.getState().user?.timezone || detectTimezone();
  } catch {
    return detectTimezone();
  }
}

export const IANA_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Almaty",
  "Asia/Bishkek",
  "Asia/Tashkent",
  "Asia/Dubai",
  "Asia/Tbilisi",
  "Asia/Yerevan",
  "Asia/Baku",
  "Asia/Istanbul",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Seoul",
  "Asia/Tokyo",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Australia/Sydney",
];

/**
 * Format an ISO-8601 UTC timestamp in a given IANA timezone.
 * Falls back to the user's (or browser) timezone when `timezone` is absent.
 */
export function formatInTimezone(iso, timezone, locale = "ru", options = {}) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tz = timezone || getUserTimezone();
  return new Intl.DateTimeFormat(locale, { timeZone: tz, ...options }).format(d);
}

/**
 * Format the time ("HH:mm") of a UTC timestamp in a specific timezone.
 */
export function formatTimeInTimezone(iso, timezone, locale = "ru", opts = {}) {
  return formatInTimezone(iso, timezone, locale, {
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  });
}

function tzPartsFormatter(timezone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Convert a wall-clock "YYYY-MM-DD HH:MM" (in `timezone`) into an ISO-8601 UTC
 * string. Converges over a few iterations to handle DST offsets correctly.
 */
export function toUtcInput(date, time, timezone) {
  const tz = timezone || getUserTimezone();
  const [y = 1, m = 1, d = 1] = String(date).split("-").map(Number);
  const [hh = 0, mm = 0] = String(time || "00:00").split(":").map(Number);
  const target = Date.UTC(y, m - 1, d, hh, mm);

  const fmt = tzPartsFormatter(tz);
  const wallClockUtc = (inst) => {
    const p = {};
    for (const part of fmt.formatToParts(new Date(inst))) {
      if (part.type !== "literal") p[part.type] = Number(part.value);
    }
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  };

  let guess = target;
  for (let i = 0; i < 4; i++) {
    guess += target - wallClockUtc(guess);
  }
  return new Date(guess).toISOString();
}

/**
 * Timezone display shown next to times, e.g. "GMT+6" or the IANA name.
 */
export function timezoneLabel(timezone = getUserTimezone()) {
  try {
    const now = new Date();
    const dtf = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "short", hour: "2-digit" });
    const parts = dtf.formatToParts(now);
    const name = parts.find((p) => p.type === "timeZoneName");
    return name ? `${timezone} (${name.value})` : timezone;
  } catch {
    return timezone;
  }
}
