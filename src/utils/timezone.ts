import useAuthStore from "../store/authStore";

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function getUserTimezone(): string {
  try {
    const tz = (useAuthStore.getState().user as Record<string, unknown> | null)?.["timezone"];
    if (typeof tz === "string" && tz) return tz;
    return detectTimezone();
  } catch {
    return detectTimezone();
  }
}

export const IANA_TIMEZONES: readonly string[] = [
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

export function formatInTimezone(
  iso: string | null | undefined,
  timezone?: string | null,
  locale = "ru",
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tz = timezone || getUserTimezone();
  return new Intl.DateTimeFormat(locale, { timeZone: tz, ...options }).format(d);
}

export function formatTimeInTimezone(
  iso: string | null | undefined,
  timezone?: string | null,
  locale = "ru",
  opts: Intl.DateTimeFormatOptions = {}
): string {
  return formatInTimezone(iso, timezone, locale, {
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  });
}

function tzPartsFormatter(timezone: string): Intl.DateTimeFormat {
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

export function toUtcInput(date: string, time: string, timezone?: string | null): string {
  const tz = timezone || getUserTimezone();
  const [yRaw = "1", mRaw = "1", dRaw = "1"] = String(date).split("-");
  const [hhRaw = "00", mmRaw = "00"] = String(time || "00:00").split(":");
  const y = Number(yRaw) || 1;
  const m = Number(mRaw) || 1;
  const d = Number(dRaw) || 1;
  const hh = Number(hhRaw) || 0;
  const mm = Number(mmRaw) || 0;
  const target = Date.UTC(y, m - 1, d, hh, mm);

  const fmt = tzPartsFormatter(tz);
  const wallClockUtc = (inst: number): number => {
    const p: Record<string, number> = {};
    for (const part of fmt.formatToParts(new Date(inst))) {
      if (part.type !== "literal") p[part.type] = Number(part.value);
    }
    return Date.UTC(p["year"] ?? 1970, (p["month"] ?? 1) - 1, p["day"] ?? 1, p["hour"] ?? 0, p["minute"] ?? 0, p["second"] ?? 0);
  };

  let guess = target;
  for (let i = 0; i < 4; i++) {
    guess += target - wallClockUtc(guess);
  }
  return new Date(guess).toISOString();
}

export function timezoneLabel(timezone: string = getUserTimezone()): string {
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
