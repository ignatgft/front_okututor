import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { scheduleApi } from "../../api/schedule.api";
import { getUserTimezone } from "../../utils/timezone";

function formatTimeMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
function isValidHHMM(v: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(v)) return false;
  const [h, m] = v.split(":").map(Number);
  return h >= 0 && h < 24 && m >= 0 && m < 60;
}
function addMinutes(timeStr: string, mins: number): string {
  if (!isValidHHMM(timeStr)) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}
function diffMinutes(start: string, end: string): number | null {
  if (!isValidHHMM(start) || !isValidHHMM(end)) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let d = eh * 60 + em - (sh * 60 + sm);
  if (d <= 0) d += 24 * 60;
  return d;
}

export interface ManualTimePickerProps {
  tutorId?: string | number | null;
  date?: string | null;
  initialStart?: string;
  initialEnd?: string;
  duration?: number;
  quickSlots?: string[];
  onChange?: (value: { start: string; end: string; duration: number | null }) => void;
  onValidityChange?: (valid: boolean) => void;
  timezone?: string;
}

interface CheckStatus {
  available: boolean;
  reason: string;
  message: string;
  suggestedSlots: string[];
}

export default function ManualTimePicker({
  tutorId,
  date,
  initialStart = "18:00",
  initialEnd = "",
  duration = 60,
  quickSlots = [],
  onChange,
  onValidityChange,
  timezone,
}: ManualTimePickerProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const [start, setStart] = useState<string>(initialStart);
  const [end, setEnd] = useState<string>(initialEnd || addMinutes(initialStart, duration));
  const [checking, setChecking] = useState<boolean>(false);
  const [status, setStatus] = useState<CheckStatus | null>(null);
  const [touched, setTouched] = useState<boolean>(false);
  const debounceRef = useRef<number | null>(null);

  const displayDate = useMemo(() => {
    if (!date) return "";
    try {
      const d = new Date(`${date}T00:00:00`);
      return new Intl.DateTimeFormat(i18n.language || "ru", { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch { return date; }
  }, [date, i18n.language]);

  const handleStartChange = (raw: string): void => {
    const masked = formatTimeMask(raw);
    setStart(masked);
    setTouched(true);
    if (masked.length === 5 && isValidHHMM(masked)) {
      const autoEnd = addMinutes(masked, duration);
      setEnd(autoEnd);
      onChange?.({ start: masked, end: autoEnd, duration });
    } else if (masked.length < 5) {
      onChange?.({ start: masked, end, duration: null });
    }
  };
  const handleEndChange = (raw: string): void => {
    const masked = formatTimeMask(raw);
    setEnd(masked);
    setTouched(true);
    if (isValidHHMM(start) && isValidHHMM(masked)) {
      const d = diffMinutes(start, masked);
      onChange?.({ start, end: masked, duration: d });
    } else {
      onChange?.({ start, end: masked, duration: null });
    }
  };
  const selectQuickSlot = (tm: string): void => {
    const s = tm;
    const e = addMinutes(s, duration);
    setStart(s);
    setEnd(e);
    setTouched(true);
    onChange?.({ start: s, end: e, duration });
  };
  const selectSuggested = (tm: string): void => {
    const e = addMinutes(tm, duration);
    setStart(tm);
    setEnd(e);
    setTouched(true);
    onChange?.({ start: tm, end: e, duration });
  };

  useEffect(() => {
    if (!touched) return;
    if (!isValidHHMM(start) || !isValidHHMM(end) || !date) {
      setStatus(null);
      onValidityChange?.(false);
      return;
    }
    if (!tutorId) {
      setStatus({ available: true, reason: "OK", message: "Свободно", suggestedSlots: [] });
      onValidityChange?.(true);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setChecking(true);
      try {
        const payload: Record<string, unknown> = {
          tutor_id: tutorId,
          date,
          start_time: start,
          end_time: end,
          timezone: timezone || getUserTimezone(),
        };
        const { response, data } = await scheduleApi.checkAvailability(payload);
        const rec = data as Record<string, unknown> | null;
        if (response.ok) {
          const normalized: CheckStatus = {
            available: Boolean(rec?.["available"]),
            reason: String(rec?.["reason"] ?? ""),
            message: String(rec?.["message"] ?? ""),
            suggestedSlots: (rec?.["suggestedSlots"] as string[] | undefined) ?? (rec?.["suggested_slots"] as string[] | undefined) ?? [],
          };
          setStatus(normalized);
          onValidityChange?.(!!normalized.available);
        } else {
          setStatus({ available: false, reason: String(rec?.["reason"] ?? "INVALID"), message: String(rec?.["message"] ?? t("schedule.manual.invalid", "Некорректное время")), suggestedSlots: (rec?.["suggestedSlots"] as string[] | undefined) ?? (rec?.["suggested_slots"] as string[] | undefined) ?? [] });
          onValidityChange?.(false);
        }
      } catch {
        setStatus({ available: false, reason: "ERROR", message: t("schedule.manual.check_failed", "Не удалось проверить") as string, suggestedSlots: [] });
        onValidityChange?.(false);
      } finally {
        setChecking(false);
      }
    }, 450);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [start, end, date, tutorId, timezone, touched, t, onValidityChange, duration]);

  useEffect(() => {
    if (isValidHHMM(start) && isValidHHMM(end)) {
      onChange?.({ start, end, duration: diffMinutes(start, end) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusKind = !status ? "idle" : status.available ? "ok" : status.reason === "CONFLICT" ? "conflict" : status.reason === "OUTSIDE_AVAILABILITY" ? "outside" : status.reason === "TOO_SOON" ? "soon" : "error";

  return (
    <div className="manual-time">
      <div className="manual-time__header">
        <div className="manual-time__title">{t("schedule.manual.title", "Укажите желаемое время")}</div>
        {displayDate && <div className="manual-time__date">{displayDate}</div>}
      </div>

      {quickSlots.length > 0 && (
        <div className="manual-time__quick">
          <div className="manual-time__quick-label">{t("schedule.manual.quick", "Быстрый выбор")}</div>
          <div className="manual-time__chips">
            {quickSlots.slice(0, 8).map((tm) => (
              <button key={tm} type="button" className={`manual-chip ${start === tm ? "manual-chip--active" : ""}`} onClick={() => selectQuickSlot(tm)}>{tm}</button>
            ))}
          </div>
        </div>
      )}

      <div className="manual-time__inputs">
        <label className="manual-time__field">
          <span className="manual-time__label">{t("schedule.manual.start", "Начало")}</span>
          <input
            className="manual-time__input"
            inputMode="numeric"
            placeholder="18:00"
            value={start}
            onChange={(e) => handleStartChange(e.target.value)}
            maxLength={5}
            aria-label={t("schedule.manual.start", "Начало") as string}
          />
        </label>
        <span className="manual-time__dash">—</span>
        <label className="manual-time__field">
          <span className="manual-time__label">{t("schedule.manual.end", "Конец")}</span>
          <input
            className="manual-time__input"
            inputMode="numeric"
            placeholder="19:00"
            value={end}
            onChange={(e) => handleEndChange(e.target.value)}
            maxLength={5}
            aria-label={t("schedule.manual.end", "Конец") as string}
          />
        </label>
      </div>

      <div className="manual-time__status" aria-live="polite">
        {checking && <span className="manual-time__status--checking">{t("schedule.manual.checking", "Проверяем…")}</span>}
        {!checking && status && statusKind === "ok" && <span className="manual-time__status--ok">✓ {status.message || t("schedule.manual.free", "Свободно")}</span>}
        {!checking && status && statusKind === "conflict" && <span className="manual-time__status--warn">⚠ {status.message || t("schedule.manual.conflict", "Пересекается с другим уроком")}</span>}
        {!checking && status && statusKind === "outside" && <span className="manual-time__status--err">✕ {status.message || t("schedule.manual.outside", "Вне доступности тьютора")}</span>}
        {!checking && status && statusKind === "soon" && <span className="manual-time__status--warn">⏰ {status.message || t("schedule.manual.soon", "Слишком поздно бронировать (меньше 2 часов)")}</span>}
        {!checking && status && statusKind === "error" && <span className="manual-time__status--err">✕ {status.message}</span>}
        {!checking && !status && touched && (!isValidHHMM(start) || !isValidHHMM(end)) && <span className="manual-time__status--err">{t("schedule.manual.invalid", "Введите время в формате ЧЧ:ММ")}</span>}
      </div>

      {!checking && status && status.suggestedSlots?.length > 0 && (
        <div className="manual-time__suggest">
          <div className="manual-time__suggest-label">{t("schedule.manual.suggest", "Попробуйте")}:</div>
          <div className="manual-time__chips">
            {status.suggestedSlots.map((s) => (
              <button key={s} type="button" className="manual-chip manual-chip--suggest" onClick={() => selectSuggested(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
