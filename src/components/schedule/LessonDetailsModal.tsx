import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatInTimezone, formatTimeInTimezone, timezoneLabel } from "../../utils/timezone";
import {
  useJoinLesson,
  useCancelLesson,
  useReviewLesson,
  useStartLesson,
  useCompleteLesson,
  useStudentNoShow,
  useTutorNoShow,
  useReportIssue,
  useUpdateLessonDetails,
  useProposeReschedule,
  useAcceptReschedule,
  useRejectReschedule,
  useProposeFormat,
  useAcceptFormat,
  useRejectFormat,
  useProposeLocation,
  useAcceptLocation,
  useRejectLocation,
  useProposeDuration,
  useAcceptDuration,
  useRejectDuration,
} from "../../hooks/schedule";
import type { LessonDTO } from "../../types/schedule";
import { useToast } from "../../components/ui/Toast";
import "./LessonDetailsModal.css";

interface LessonDetailsModalProps {
  lesson: LessonDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

type Scope = "SINGLE" | "FUTURE";
type Tab = "main" | "reschedule" | "format" | "location" | "duration" | "details" | "issue";

export const LessonDetailsModal = function LessonDetailsModal({
  lesson,
  isOpen,
  onClose,
  onChanged,
}: LessonDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [tab, setTab] = useState<Tab>("main");
  const [scope, setScope] = useState<Scope>("SINGLE");
  const [busy, setBusy] = useState(false);
  // forms
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [formatChoice, setFormatChoice] = useState<"ONLINE" | "OFFLINE">("ONLINE");
  const [locationType, setLocationType] = useState("OTHER");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationDetails, setLocationDetails] = useState("");
  const [durationChoice, setDurationChoice] = useState(60);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [homework, setHomework] = useState("");
  const [materials, setMaterials] = useState("");
  const [links, setLinks] = useState("");
  const [issueText, setIssueText] = useState("");

  const joinLesson = useJoinLesson();
  const cancelLesson = useCancelLesson();
  const reviewLesson = useReviewLesson();
  const startLesson = useStartLesson();
  const completeLesson = useCompleteLesson();
  const studentNoShow = useStudentNoShow();
  const tutorNoShow = useTutorNoShow();
  const reportIssue = useReportIssue();
  const updateDetails = useUpdateLessonDetails();
  const proposeReschedule = useProposeReschedule();
  const acceptReschedule = useAcceptReschedule();
  const rejectReschedule = useRejectReschedule();
  const proposeFormat = useProposeFormat();
  const proposeLocation = useProposeLocation();
  const proposeDuration = useProposeDuration();
  const acceptFormat = useAcceptFormat();
  const rejectFormat = useRejectFormat();
  const acceptLocation = useAcceptLocation();
  const rejectLocation = useRejectLocation();
  const acceptDuration = useAcceptDuration();
  const rejectDuration = useRejectDuration();

  useEffect(() => {
    if (!isOpen) {
      setConfirmCancel(false);
      setTab("main");
      setBusy(false);
      return;
    }
    if (lesson) {
      setFormatChoice(lesson.format === "OFFLINE" ? "OFFLINE" : "ONLINE");
      setLocationAddress(lesson.locationAddress || lesson.location || "");
      setLocationDetails(lesson.locationDetails || "");
      setLocationType(lesson.locationType || "OTHER");
      setDurationChoice(lesson.durationMinutes || (lesson.startAt && lesson.endAt ? Math.round((new Date(lesson.endAt).getTime() - new Date(lesson.startAt).getTime())/60000) : 60));
      setTopic(lesson.topic || "");
      setNotes(lesson.notes || "");
      setHomework(lesson.homework || "");
      setMaterials(lesson.materials || "");
      setLinks(lesson.links || "");
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, lesson, onClose]);

  if (!isOpen || !lesson) return null;

  const start = lesson.startAt ? new Date(lesson.startAt) : null;
  const end = lesson.endAt ? new Date(lesson.endAt) : null;
  const isInProgress = lesson.status === "IN_PROGRESS";
  const isCompleted = lesson.status === "COMPLETED";
  const isCancelled = lesson.status === "CANCELLED";
  const isScheduled = lesson.status === "SCHEDULED";
  const isReschedulePending = lesson.status === "RESCHEDULE_PENDING";
  const isFormatPending = lesson.status === "FORMAT_CHANGE_PENDING";
  const isLocationPending = lesson.status === "LOCATION_CHANGE_PENDING";
  const isDurationPending = lesson.status === "DURATION_CHANGE_PENDING";
  const isNoShow = lesson.status === "STUDENT_NO_SHOW" || lesson.status === "TUTOR_NO_SHOW";

  const dateStr = lesson.startAt ? formatInTimezone(lesson.startAt, lesson.timezone || "UTC", i18n.language, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—";
  const timeStr = lesson.startAt && lesson.endAt ? `${formatTimeInTimezone(lesson.startAt, lesson.timezone || "UTC", i18n.language)}–${formatTimeInTimezone(lesson.endAt, lesson.timezone || "UTC", i18n.language)}` : lesson.startAt ? formatTimeInTimezone(lesson.startAt, lesson.timezone || "UTC", i18n.language) : "—";
  const tzLabel = timezoneLabel(lesson.timezone || "UTC");
  const duration = start && end && !isNaN(start.getTime()) && !isNaN(end.getTime()) ? Math.round((end.getTime() - start.getTime()) / 60000) : (lesson.durationMinutes || 0);

  const canJoin = (() => {
    if (!lesson.canJoin) return false;
    if (lesson.status === "IN_PROGRESS") return true;
    if (lesson.status !== "SCHEDULED") return false;
    const start = new Date(lesson.startAt).getTime();
    const diff = start - Date.now();
    return diff < 10 * 60 * 1000 && diff > -30 * 60 * 1000;
  })();
  const canCancel = lesson.canCancel && !isCompleted && !isCancelled && !isNoShow;
  const canReview = lesson.canReview && isCompleted;
  const canStart = (lesson.canStart ?? isScheduled) && isScheduled;
  const canComplete = (lesson.canComplete ?? isInProgress) && isInProgress;
  const canStudentNoShow = lesson.canMarkStudentNoShow ?? false;
  const canTutorNoShow = lesson.canMarkTutorNoShow ?? false;
  const canIssue = lesson.canReportIssue ?? (isInProgress || isCompleted || isScheduled);

  const handleJoin = () => { joinLesson.mutate(lesson.id, { onSuccess: () => { onClose(); onChanged?.(); } }); };
  const handleStart = async () => {
    setBusy(true);
    try { await startLesson.mutateAsync(lesson.id); onChanged?.(); onClose(); } catch {} finally { setBusy(false); }
  };
  const handleComplete = async () => {
    setBusy(true);
    try { await completeLesson.mutateAsync(lesson.id); onChanged?.(); onClose(); } catch {} finally { setBusy(false); }
  };
  const handleCancel = async () => {
    setBusy(true);
    try { await cancelLesson.mutateAsync({ lessonId: lesson.id }); onClose(); onChanged?.(); } catch {} finally { setBusy(false); }
  };
  const handleStudentNoShow = async () => {
    setBusy(true);
    try { await studentNoShow.mutateAsync(lesson.id); onChanged?.(); onClose(); } catch(e: unknown){ toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e)); } finally { setBusy(false); }
  };
  const handleTutorNoShow = async () => {
    setBusy(true);
    try { await tutorNoShow.mutateAsync({ lessonId: lesson.id }); onChanged?.(); onClose(); } catch(e: unknown){ toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e)); } finally { setBusy(false); }
  };
  const handleIssue = async () => {
    if (!issueText.trim()) { toast.error(t("lesson.issue_required","Укажите описание проблемы")); return; }
    setBusy(true);
    try { await reportIssue.mutateAsync({ lessonId: lesson.id, reason: issueText }); onChanged?.(); setTab("main"); setIssueText(""); } catch {} finally { setBusy(false); }
  };

  const handleProposeReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) { toast.error(t("schedule.date_required","Укажите дату и время")); return; }
    setBusy(true);
    try {
      const isoStart = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();
      const isoEnd = new Date(new Date(isoStart).getTime() + durationChoice*60*1000).toISOString();
      await proposeReschedule.mutateAsync({ lessonId: lesson.id, payload: { newStartAt: isoStart, newEndAt: isoEnd, reason: rescheduleReason, scope } });
      onChanged?.(); setTab("main");
    } catch(e: unknown){ toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e));} finally { setBusy(false); }
  };
  const handleAcceptReschedule = async () => { setBusy(true); try{ await acceptReschedule.mutateAsync(lesson.id); onChanged?.(); } catch(e: unknown){toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e));} finally{ setBusy(false);} };
  const handleRejectReschedule = async () => { setBusy(true); try{ await rejectReschedule.mutateAsync(lesson.id); onChanged?.(); } catch(e: unknown){toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e));} finally{ setBusy(false);} };
  const handleAcceptFormat = async () => { setBusy(true); try{ await acceptFormat.mutateAsync(lesson.id); onChanged?.(); } catch(e: unknown){toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e));} finally{ setBusy(false);} };
  const handleRejectFormat = async () => { setBusy(true); try{ await rejectFormat.mutateAsync(lesson.id); onChanged?.(); } catch(e: unknown){toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e));} finally{ setBusy(false);} };
  const handleAcceptLocation = async () => { setBusy(true); try{ await acceptLocation.mutateAsync(lesson.id); onChanged?.(); } catch(e: unknown){toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e));} finally{ setBusy(false);} };
  const handleRejectLocation = async () => { setBusy(true); try{ await rejectLocation.mutateAsync(lesson.id); onChanged?.(); } catch(e: unknown){toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e));} finally{ setBusy(false);} };
  const handleAcceptDuration = async () => { setBusy(true); try{ await acceptDuration.mutateAsync(lesson.id); onChanged?.(); } catch(e: unknown){toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e));} finally{ setBusy(false);} };
  const handleRejectDuration = async () => { setBusy(true); try{ await rejectDuration.mutateAsync(lesson.id); onChanged?.(); } catch(e: unknown){toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e));} finally{ setBusy(false);} };
  const handleProposeFormat = async () => {
    setBusy(true);
    try {
      await proposeFormat.mutateAsync({ lessonId: lesson.id, payload:{ format: formatChoice, location_type: locationType, location_address: locationAddress, location_details: locationDetails, scope }});
      onChanged?.(); setTab("main");
    } catch(e: unknown){ toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e)); } finally{ setBusy(false); }
  };
  const handleProposeLocation = async () => {
    setBusy(true);
    try {
      await proposeLocation.mutateAsync({ lessonId: lesson.id, payload:{ location_type: locationType, location_address: locationAddress, location_details: locationDetails, scope }});
      onChanged?.(); setTab("main");
    } catch(e: unknown){ toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e));} finally{ setBusy(false); }
  };
  const handleProposeDuration = async () => {
    setBusy(true);
    try {
      await proposeDuration.mutateAsync({ lessonId: lesson.id, payload:{ duration_minutes: durationChoice, scope }});
      onChanged?.(); setTab("main");
    } catch(e: unknown){ toast.error(e instanceof Error ? e.message : String((e as Record<string, unknown>)["message"] ?? e));} finally{ setBusy(false); }
  };
  const handleSaveDetails = async () => {
    setBusy(true);
    try { await updateDetails.mutateAsync({ lessonId: lesson.id, payload:{ topic, notes, homework, materials, links }}); onChanged?.(); setTab("main"); toast.success(t("common.saved","Сохранено")); } catch {} finally{ setBusy(false); }
  };
  const handleReview = async (rating:number, comment?:string) => { setBusy(true); try{ await reviewLesson.mutateAsync({ lessonId: lesson.id, payload:{ rating, comment }}); onClose(); onChanged?.(); } catch{} finally{ setBusy(false);} };

  const mapUrl = locationAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationAddress)}` : null;

  // timer elapsed
  const elapsed = (() => {
    if (!isInProgress || !lesson.actualStart) return null;
    const diff = Date.now() - new Date(lesson.actualStart).getTime();
    if (diff <0) return "00:00";
    const m = Math.floor(diff/60000);
    const s = Math.floor((diff%60000)/1000);
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  })();

  return (
    <div className="lesson-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="lesson-modal-title">
      <div className="lesson-modal-box" onClick={(e)=>e.stopPropagation()}>
        <button ref={closeRef} type="button" className="lesson-modal-close" onClick={onClose} aria-label={t("common.close","Закрыть")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {confirmCancel ? (
          <div className="lesson-modal-confirm">
            <h3>{t("schedule.cancel_title","Отменить это занятие?")}</h3>
            <p>{t("schedule.cancel_message","Занятие будет отменено. Тьютор и ученик получат уведомление.")}</p>
            <div className="lesson-modal-confirm-actions">
              <button type="button" className="btn-secondary" onClick={()=>setConfirmCancel(false)} disabled={busy}>{t("common.back","Назад")}</button>
              <button type="button" className="btn-danger" onClick={handleCancel} disabled={busy}>{busy ? t("common.loading","Загрузка...") : t("schedule.cancel_confirm","Отменить занятие")}</button>
            </div>
          </div>
        ) : tab !== "main" ? (
          <>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
              <button type="button" className="btn-secondary" onClick={()=>setTab("main")} style={{padding:"6px 10px"}}>← {t("common.back","Назад")}</button>
              <h3 style={{margin:0, flex:1}}>
                {tab==="reschedule" && t("schedule.reschedule_title","Перенести занятие")}
                {tab==="format" && t("schedule.format_change","Изменить формат")}
                {tab==="location" && t("lesson.change_location","Изменить место")}
                {tab==="duration" && t("lesson.change_duration","Изменить длительность")}
                {tab==="details" && t("lesson.details","Детали занятия")}
                {tab==="issue" && t("lesson.report_issue","Сообщить о проблеме")}
              </h3>
            </div>
            {tab==="reschedule" && (
              <div className="reschedule-form">
                <div className="form-field"><label>{t("schedule.new_date","Новая дата")}</label><input type="date" value={rescheduleDate} onChange={e=>setRescheduleDate(e.target.value)} min={new Date().toISOString().split("T")[0]} /></div>
                <div className="form-field"><label>{t("schedule.new_time","Новое время")}</label><input type="time" value={rescheduleTime} onChange={e=>setRescheduleTime(e.target.value)} /></div>
                <div className="form-field"><label>{t("common.duration","Длительность (мин)")}</label><select value={durationChoice} onChange={e=>setDurationChoice(Number(e.target.value))}><option value={30}>30</option><option value={45}>45</option><option value={60}>60</option><option value={90}>90</option><option value={120}>120</option></select></div>
                <div className="form-field"><label>{t("common.reason","Причина")}</label><textarea value={rescheduleReason} onChange={e=>setRescheduleReason(e.target.value)} rows={2} placeholder={t("common.optional","Необязательно")} style={{padding:8, border:"1px solid var(--color-border)", borderRadius:8}} /></div>
                <ScopeSelector scope={scope} setScope={setScope} t={t} />
                <div className="lesson-modal-confirm-actions"><button type="button" className="btn-secondary" onClick={()=>setTab("main")} disabled={busy}>{t("common.cancel","Отмена")}</button><button type="button" className="btn-primary" onClick={handleProposeReschedule} disabled={busy}>{busy? t("common.loading","Загрузка..."): t("schedule.reschedule_confirm","Перенести")}</button></div>
              </div>
            )}
            {tab==="format" && (
              <div className="reschedule-form">
                <div className="form-field"><label>{t("schedule.format","Формат")}</label><div style={{display:"flex", gap:8}}><button type="button" className={formatChoice==="ONLINE" ? "btn-primary":"btn-secondary"} onClick={()=>setFormatChoice("ONLINE")} style={{flex:1}}>💻 ONLINE</button><button type="button" className={formatChoice==="OFFLINE" ? "btn-primary":"btn-secondary"} onClick={()=>setFormatChoice("OFFLINE")} style={{flex:1}}>📍 OFFLINE</button></div></div>
                {formatChoice==="OFFLINE" && (<>
                  <div className="form-field"><label>{t("lesson.place","Место")}</label><select value={locationType} onChange={e=>setLocationType(e.target.value)}><option value="TUTOR_PLACE">У тьютора</option><option value="STUDENT_PLACE">У ученика</option><option value="CENTER">Центр</option><option value="OTHER">Другое</option></select></div>
                  <div className="form-field"><label>{t("lesson.address","Адрес")}</label><input value={locationAddress} onChange={e=>setLocationAddress(e.target.value)} placeholder="г. Бишкек, ул. Манаса 25, каб.304" /></div>
                  <div className="form-field"><label>{t("lesson.location_comment","Комментарий")}</label><input value={locationDetails} onChange={e=>setLocationDetails(e.target.value)} placeholder="кабинет, этаж" /></div>
                </>)}
                <ScopeSelector scope={scope} setScope={setScope} t={t} />
                <div className="lesson-modal-confirm-actions"><button type="button" className="btn-secondary" onClick={()=>setTab("main")} disabled={busy}>{t("common.cancel","Отмена")}</button><button type="button" className="btn-primary" onClick={handleProposeFormat} disabled={busy}>{busy? t("common.loading","Загрузка..."): t("common.confirm","Подтвердить")}</button></div>
              </div>
            )}
            {tab==="location" && (
              <div className="reschedule-form">
                <div className="form-field"><label>{t("lesson.place","Место")}</label><select value={locationType} onChange={e=>setLocationType(e.target.value)}><option value="TUTOR_PLACE">У тьютора</option><option value="STUDENT_PLACE">У ученика</option><option value="CENTER">Центр</option><option value="OTHER">Другое</option></select></div>
                <div className="form-field"><label>{t("lesson.address","Адрес")}</label><input value={locationAddress} onChange={e=>setLocationAddress(e.target.value)} placeholder="г. Бишкек, ул. Манаса 25" /></div>
                <div className="form-field"><label>{t("lesson.location_comment","Комментарий")}</label><input value={locationDetails} onChange={e=>setLocationDetails(e.target.value)} /></div>
                <ScopeSelector scope={scope} setScope={setScope} t={t} />
                <div className="lesson-modal-confirm-actions"><button type="button" className="btn-secondary" onClick={()=>setTab("main")} disabled={busy}>{t("common.cancel","Отмена")}</button><button type="button" className="btn-primary" onClick={handleProposeLocation} disabled={busy}>{busy? t("common.loading","Загрузка..."): t("common.confirm","Подтвердить")}</button></div>
              </div>
            )}
            {tab==="duration" && (
              <div className="reschedule-form">
                <div className="form-field"><label>{t("lesson.duration","Длительность")}</label><select value={durationChoice} onChange={e=>setDurationChoice(Number(e.target.value))}><option value={30}>30 мин</option><option value={45}>45 мин</option><option value={60}>60 мин</option><option value={90}>90 мин</option><option value={120}>120 мин</option></select><p style={{fontSize:12, color:"var(--color-text-secondary)"}}>{t("lesson.duration_hint","60 мин → 90 мин — пример")}</p></div>
                <ScopeSelector scope={scope} setScope={setScope} t={t} />
                <div className="lesson-modal-confirm-actions"><button type="button" className="btn-secondary" onClick={()=>setTab("main")} disabled={busy}>{t("common.cancel","Отмена")}</button><button type="button" className="btn-primary" onClick={handleProposeDuration} disabled={busy}>{busy? t("common.loading","Загрузка..."): t("common.confirm","Подтвердить")}</button></div>
              </div>
            )}
            {tab==="details" && (
              <div className="reschedule-form">
                <div className="form-field"><label>{t("lesson.topic","Тема занятия")}</label><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Циклы Python" /></div>
                <div className="form-field"><label>{t("lesson.notes","Заметки")}</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder={t("lesson.notes_hint","Заметки для ученика")} style={{padding:8, border:"1px solid var(--color-border)", borderRadius:8}} /></div>
                <div className="form-field"><label>{t("lesson.homework","Домашнее задание")}</label><textarea value={homework} onChange={e=>setHomework(e.target.value)} rows={3} placeholder="10 задач" style={{padding:8, border:"1px solid var(--color-border)", borderRadius:8}} /></div>
                <div className="form-field"><label>{t("lesson.materials","Материалы")}</label><input value={materials} onChange={e=>setMaterials(e.target.value)} placeholder="lesson4.pdf" /></div>
                <div className="form-field"><label>{t("lesson.links","Ссылки")}</label><input value={links} onChange={e=>setLinks(e.target.value)} placeholder="https://..." /></div>
                <div className="lesson-modal-confirm-actions"><button type="button" className="btn-secondary" onClick={()=>setTab("main")} disabled={busy}>{t("common.cancel","Отмена")}</button><button type="button" className="btn-primary" onClick={handleSaveDetails} disabled={busy}>{busy? t("common.loading","Загрузка..."): t("common.save","Сохранить")}</button></div>
              </div>
            )}
            {tab==="issue" && (
              <div className="reschedule-form">
                <div className="form-field"><label>{t("lesson.issue_desc","Опишите проблему")}</label><textarea value={issueText} onChange={e=>setIssueText(e.target.value)} rows={4} style={{padding:8, border:"1px solid var(--color-border)", borderRadius:8}} /></div>
                <div className="lesson-modal-confirm-actions"><button type="button" className="btn-secondary" onClick={()=>setTab("main")} disabled={busy}>{t("common.cancel","Отмена")}</button><button type="button" className="btn-danger" onClick={handleIssue} disabled={busy}>{busy? t("common.loading","Загрузка..."): t("lesson.send_issue","Сообщить о проблеме")}</button></div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="lesson-modal-header">
              <span className={`status-badge status-${String(lesson.status || "").toLowerCase().replace(/_/g,"-") || "scheduled"}`}>
                {lesson.statusLabel || t(`statuses.${String(lesson.status || "").toLowerCase().replace(/_/g,"-")}`, String(lesson.status || "SCHEDULED"))}
              </span>
              {isInProgress && <span className="live-indicator" aria-live="polite">{t("schedule.live","● ИДЁТ СЕЙЧАС")} {elapsed && `— ${elapsed}`}</span>}
            </div>
            <h3 id="lesson-modal-title" className="lesson-modal-title">{lesson.courseTitle}</h3>

            {/* pending banner — per-type accept/reject */}
            {(isReschedulePending || isFormatPending || isLocationPending || isDurationPending) && (
              <div style={{background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:8, padding:10, marginBottom:12}}>
                <strong style={{fontSize:13, color:"#92400e"}}>⏳ {t("lesson.pending","Ожидает подтверждения ученика")}</strong>
                <div style={{fontSize:12, marginTop:4}}>
                  {isReschedulePending && lesson.pendingStartAt && `📅 ${new Date(lesson.pendingStartAt).toLocaleString(i18n.language)}`}
                  {isFormatPending && ` — ${lesson.pendingFormat === "ONLINE" ? "ONLINE → OFFLINE" : lesson.pendingFormat}`}
                  {isLocationPending && ` — ${lesson.pendingLocationAddress}`}
                  {isDurationPending && ` — ${lesson.pendingDurationMinutes} мин`}
                  {lesson.pendingReason && ` — ${lesson.pendingReason}`}
                  {lesson.pendingScope && ` (${lesson.pendingScope === "FUTURE" ? t("lesson.all_future","Все будущие") : t("lesson.only_this","Только это")})`}
                </div>
                <div style={{display:"flex", gap:8, marginTop:8}}>
                  {isReschedulePending && (<><button type="button" className="btn-primary" onClick={handleAcceptReschedule} disabled={busy} style={{flex:1, height:36, fontSize:13}}>{t("common.accept","Принять")}</button><button type="button" className="btn-secondary" onClick={handleRejectReschedule} disabled={busy} style={{flex:1, height:36, fontSize:13}}>{t("common.reject","Отклонить")}</button></>)}
                  {isFormatPending && (<><button type="button" className="btn-primary" onClick={handleAcceptFormat} disabled={busy} style={{flex:1, height:36, fontSize:13}}>{t("common.accept","Принять")}</button><button type="button" className="btn-secondary" onClick={handleRejectFormat} disabled={busy} style={{flex:1, height:36, fontSize:13}}>{t("common.reject","Отклонить")}</button></>)}
                  {isLocationPending && (<><button type="button" className="btn-primary" onClick={handleAcceptLocation} disabled={busy} style={{flex:1, height:36, fontSize:13}}>{t("common.accept","Принять")}</button><button type="button" className="btn-secondary" onClick={handleRejectLocation} disabled={busy} style={{flex:1, height:36, fontSize:13}}>{t("common.reject","Отклонить")}</button></>)}
                  {isDurationPending && (<><button type="button" className="btn-primary" onClick={handleAcceptDuration} disabled={busy} style={{flex:1, height:36, fontSize:13}}>{t("common.accept","Принять")}</button><button type="button" className="btn-secondary" onClick={handleRejectDuration} disabled={busy} style={{flex:1, height:36, fontSize:13}}>{t("common.reject","Отклонить")}</button></>)}
                </div>
              </div>
            )}

            <div className="lesson-modal-meta">
              <div className="lesson-modal-meta-row"><span className="meta-icon" aria-hidden="true">👤</span><span className="meta-label">{t("schedule.tutor","Тьютор")}:</span><span className="meta-value"><span className="tutor-avatar" aria-hidden="true">{lesson.tutorAvatar ? <img src={lesson.tutorAvatar} alt="" /> : lesson.tutorName?.charAt(0).toUpperCase()}</span>{lesson.tutorName}</span></div>
              <div className="lesson-modal-meta-row"><span className="meta-icon" aria-hidden="true">📅</span><span className="meta-label">{t("schedule.date","Дата")}:</span><span className="meta-value">{dateStr}</span></div>
              <div className="lesson-modal-meta-row"><span className="meta-icon" aria-hidden="true">🕐</span><span className="meta-label">{t("schedule.time","Время")}:</span><span className="meta-value">{timeStr} ({duration} {t("schedule.min","мин")})</span></div>
              <div className="lesson-modal-meta-row"><span className="meta-icon" aria-hidden="true">🌍</span><span className="meta-label">{t("schedule.timezone","Часовой пояс")}:</span><span className="meta-value">{tzLabel}</span></div>
              <div className="lesson-modal-meta-row"><span className="meta-icon" aria-hidden="true">{lesson.format === "ONLINE" ? "💻" : "📍"}</span><span className="meta-label">{t("schedule.format","Формат")}:</span><span className="meta-value">{lesson.format === "ONLINE" ? t("schedule.online","Онлайн") : t("schedule.offline","Офлайн")}{lesson.locationAddress ? ` — ${lesson.locationAddress}` : ""}</span></div>
              {lesson.format==="OFFLINE" && lesson.locationAddress && (
                <div className="lesson-modal-meta-row"><span className="meta-icon" aria-hidden="true">🗺️</span><span className="meta-label">{t("lesson.location","Место")}:</span><span className="meta-value">{lesson.locationAddress}{lesson.locationDetails ? `, ${lesson.locationDetails}` : ""} {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" style={{marginLeft:8, color:"var(--color-primary)", textDecoration:"underline"}}>📍 {t("lesson.open_map","Открыть карту")}</a>}</span></div>
              )}
              {lesson.actualStart && <div className="lesson-modal-meta-row"><span className="meta-icon">▶</span><span className="meta-label">{t("lesson.actualStart","Начало фактически")}:</span><span className="meta-value">{new Date(lesson.actualStart).toLocaleString(i18n.language)} {elapsed && `(${elapsed})`}</span></div>}
              {lesson.actualEnd && <div className="lesson-modal-meta-row"><span className="meta-icon">⏹</span><span className="meta-label">{t("lesson.actualEnd","Завершено")}:</span><span className="meta-value">{new Date(lesson.actualEnd).toLocaleString(i18n.language)} {lesson.durationMinutes ? `· ${lesson.durationMinutes} мин` : ""}</span></div>}
              {lesson.topic && <div className="lesson-modal-meta-row"><span className="meta-icon">📚</span><span className="meta-label">{t("lesson.topic","Тема")}:</span><span className="meta-value">{lesson.topic}</span></div>}
              {lesson.homework && <div className="lesson-modal-meta-row"><span className="meta-icon">📝</span><span className="meta-label">{t("lesson.homework","ДЗ")}:</span><span className="meta-value">{lesson.homework}</span></div>}
              {lesson.notes && <div className="lesson-modal-meta-row"><span className="meta-icon">🗒️</span><span className="meta-label">{t("lesson.notes","Заметки")}:</span><span className="meta-value">{lesson.notes}</span></div>}
              {lesson.links && <div className="lesson-modal-meta-row"><span className="meta-icon">🔗</span><span className="meta-label">{t("lesson.links","Ссылки")}:</span><span className="meta-value" style={{wordBreak:"break-all"}}>{lesson.links}</span></div>}
              {lesson.materials && <div className="lesson-modal-meta-row"><span className="meta-icon">📎</span><span className="meta-label">{t("lesson.materials","Материалы")}:</span><span className="meta-value">{lesson.materials}</span></div>}
            </div>

            <div className="lesson-modal-actions">
              {/* Upcoming actions for tutor */}
              {isScheduled && (
                <>
                  {canStart && <button type="button" className="btn-primary lesson-modal-join" onClick={handleStart} disabled={busy || startLesson.isPending}>▶ {t("lesson.start_lesson","Начать занятие")}</button>}
                  {canJoin && <button type="button" className="btn-primary lesson-modal-join" onClick={handleJoin} disabled={joinLesson.isPending}>{joinLesson.isPending ? t("common.loading","Загрузка...") : t("schedule.join_lesson","Войти в урок")}</button>}
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                    <button type="button" className="btn-secondary" onClick={()=>setTab("reschedule")} disabled={busy}>🔄 {t("schedule.reschedule","Предложить перенос")}</button>
                    <button type="button" className="btn-secondary" onClick={()=>setTab("format")} disabled={busy}>🔀 {t("lesson.change_format","Изменить формат")}</button>
                    <button type="button" className="btn-secondary" onClick={()=>setTab("location")} disabled={busy}>📍 {t("lesson.change_place","Изменить место")}</button>
                    <button type="button" className="btn-secondary" onClick={()=>setTab("duration")} disabled={busy}>⏱ {t("lesson.change_duration","Изменить длительность")}</button>
                  </div>
                  {canCancel && <button type="button" className="btn-danger" onClick={()=>setConfirmCancel(true)} disabled={busy}>❌ {t("common.cancel","Отменить")}</button>}
                  <button type="button" className="btn-secondary" onClick={handleStudentNoShow} disabled={busy || !canStudentNoShow} title={!canStudentNoShow ? t("lesson.noshow_wait","Доступно спустя 15 минут после начала") : ""}>👤 {t("lesson.student_no_show","Ученик не пришёл")}</button>
                </>
              )}
              {isInProgress && (
                <>
                  <div style={{background:"var(--color-surface-alt)", padding:10, borderRadius:8, textAlign:"center"}}>
                    <div style={{fontSize:12, color:"var(--color-text-secondary)"}}>{t("lesson.timer","Таймер")}</div>
                    <div style={{fontSize:24, fontWeight:700, fontVariantNumeric:"tabular-nums"}}>{elapsed || "00:00"} <span style={{fontSize:12, fontWeight:400}}>⏱ {t("schedule.min","мин")}</span></div>
                  </div>
                  {canComplete && <button type="button" className="btn-primary lesson-modal-join" onClick={handleComplete} disabled={busy}>✓ {t("lesson.finish_lesson","Закончить занятие")}</button>}
                  {canIssue && <button type="button" className="btn-secondary" onClick={()=>setTab("issue")} disabled={busy}>⚠ {t("lesson.report_issue","Сообщить о проблеме")}</button>}
                </>
              )}
              {isCompleted && (
                <>
                  <button type="button" className="btn-secondary" onClick={()=>setTab("details")} disabled={busy}>👁 {t("lesson.view_details","Просмотреть")} / 📝 {t("lesson.add_notes","Добавить заметки")}</button>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                    <button type="button" className="btn-secondary" onClick={()=>setTab("details")}>📚 {t("lesson.add_homework","Добавить ДЗ")}</button>
                    <button type="button" className="btn-secondary" onClick={()=>setTab("issue")}>⚠ {t("lesson.report_issue","Сообщить о проблеме")}</button>
                  </div>
                  {canReview && <button type="button" className="btn-secondary" onClick={()=>{ const rating = prompt(t("review.rating_prompt","Оцените урок от 1 до 5:")); if(rating) handleReview(parseInt(rating)); }} disabled={busy}>{t("schedule.review","Оставить отзыв")}</button>}
                </>
              )}
              {/* Student specific no-show tutor */}
              {isScheduled && canTutorNoShow && (
                <button type="button" className="btn-secondary" onClick={handleTutorNoShow} disabled={busy}>⚠ {t("lesson.tutor_no_show","Тьютор не пришёл")}</button>
              )}
              {/* Generic issue button for scheduled/completed */}
              {(isScheduled || isCompleted) && !isInProgress && canIssue && (
                <button type="button" className="btn-secondary" onClick={()=>setTab("issue")} disabled={busy}>⚠ {t("lesson.report_issue","Сообщить о проблеме")}</button>
              )}
              {/* View location map for offline always */}
              {lesson.format==="OFFLINE" && mapUrl && isScheduled && (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{textAlign:"center", textDecoration:"none", display:"block", padding:"10px"}}>📍 {t("lesson.open_map","Открыть карту")}</a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function ScopeSelector({scope, setScope, t}: {scope:Scope, setScope:(s:Scope)=>void, t: (key: string, fallback?: string) => string}) {
  return (
    <div className="form-field">
      <label>{t("lesson.scope","Применить")}</label>
      <div style={{display:"flex", gap:8}}>
        <label style={{flex:1, display:"flex", alignItems:"center", gap:6, padding:"8px 10px", border: scope==="SINGLE" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)", borderRadius:8, cursor:"pointer", background: scope==="SINGLE" ? "var(--color-primary-soft)" : "#fff"}}>
          <input type="radio" name="scope" checked={scope==="SINGLE"} onChange={()=>setScope("SINGLE")} /> {t("lesson.only_this","Только это занятие")}
        </label>
        <label style={{flex:1, display:"flex", alignItems:"center", gap:6, padding:"8px 10px", border: scope==="FUTURE" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)", borderRadius:8, cursor:"pointer", background: scope==="FUTURE" ? "var(--color-primary-soft)" : "#fff"}}>
          <input type="radio" name="scope" checked={scope==="FUTURE"} onChange={()=>setScope("FUTURE")} /> {t("lesson.all_future","Все будущие занятия")}
        </label>
      </div>
      <p style={{fontSize:11, color:"var(--color-text-secondary)", margin:0}}>{t("lesson.scope_hint","Прошедшие занятия никогда не изменяются.")}</p>
    </div>
  );
}

LessonDetailsModal.displayName = "LessonDetailsModal";
