import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Room, RoomEvent, Track, type RemoteParticipant, type LocalParticipant } from "livekit-client";
import { apiClient } from "../../api/http";
import { endpoints } from "../../api/endpoints";
import ConfirmModal from "../ui/ConfirmModal";
import { resolveLessonJoinError } from "./lessonErrors";
import useAuthStore from "../../store/authStore";
import { ROLES } from "../../constants/roles";

export interface LessonRoomProps {
  bookingId: string | number;
}

export default function LessonRoom({ bookingId }: LessonRoomProps): JSX.Element {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore() as { user: Record<string, unknown> | null };
  const [room, setRoom] = useState<Room | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>("connecting");
  const [error, setError] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [mediaVersion, setMediaVersion] = useState<number>(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    void joinRoom();
    return () => {
      if (roomRef.current) roomRef.current.disconnect();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- LiveKit room lifecycle is bound to bookingId for the whole session
  }, [bookingId]);

  const attachRoomEvents = (lkRoom: Room): void => {
    lkRoom.on(RoomEvent.Connected, () => {
      setConnected(true);
      setConnectionState("connected");
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => setElapsedTime((s) => s + 1), 1000);
      }
      updateParticipants(lkRoom);
    });

    lkRoom.on(RoomEvent.Disconnected, () => {
      setConnected(false);
      setConnectionState("lost");
      if (timerRef.current) window.clearInterval(timerRef.current);
    });

    lkRoom.on(RoomEvent.Reconnecting, () => setConnectionState("reconnecting"));
    lkRoom.on(RoomEvent.Reconnected, () => {
      setConnectionState("connected");
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => setElapsedTime((s) => s + 1), 1000);
      }
    });

    lkRoom.on(RoomEvent.ParticipantConnected, () => updateParticipants(lkRoom));
    lkRoom.on(RoomEvent.ParticipantDisconnected, () => updateParticipants(lkRoom));
    lkRoom.on(RoomEvent.TrackSubscribed, () => setMediaVersion((v) => v + 1));
    lkRoom.on(RoomEvent.TrackUnsubscribed, () => setMediaVersion((v) => v + 1));
    lkRoom.on(RoomEvent.LocalTrackPublished, () => setMediaVersion((v) => v + 1));
    lkRoom.on(RoomEvent.LocalTrackUnpublished, () => setMediaVersion((v) => v + 1));
    lkRoom.on(RoomEvent.TrackMuted, () => setMediaVersion((v) => v + 1));
    lkRoom.on(RoomEvent.TrackUnmuted, () => setMediaVersion((v) => v + 1));
  };

  const joinRoom = async (): Promise<void> => {
    try {
      setConnectionState("connecting");
      const role = (user as Record<string, unknown> | null)?.["role"] as string | undefined;
      if (!role || ![ROLES.STUDENT, ROLES.TUTOR].includes(role as never)) {
        throw { status: 403, message: t("lesson.forbidden_role", "You do not have permission to join this lesson") };
      }
      try {
        const { response: bkRes, data: bkData } = await apiClient.get<Record<string, unknown>>(endpoints.bookings.byId(String(bookingId)));
        if (bkRes.ok && bkData) {
          const s = String(bkData["status"] ?? bkData["state"] ?? bkData["lesson_status"] ?? "").toUpperCase();
          const blocked = ["CANCELLED", "REJECTED", "EXPIRED", "COMPLETED", "CANCELLED_BY_STUDENT", "CANCELLED_BY_TUTOR"];
          if (blocked.includes(s)) {
            throw { status: 403, message: t("lesson.not_joinable_status", "This lesson cannot be joined in its current status") };
          }
        } else if (bkRes.status === 403 || bkRes.status === 404) {
          throw { status: bkRes.status };
        }
      } catch (guardErr: unknown) {
        const rec = guardErr as Record<string, unknown> | null;
        if (rec?.["status"] === 403 || rec?.["status"] === 404) throw guardErr;
      }

      const { response, data } = await apiClient.post<Record<string, unknown>>(endpoints.meetings.token(String(bookingId)));
      if (!response.ok) {
        console.error(
          `[lesson] meeting token request failed: status=${response.status} booking=${bookingId}`,
          data ?? ""
        );
        throw { status: response.status };
      }
      if (!data || !data["token"] || !data["server_url"]) {
        console.error(
          `[lesson] meeting token response missing server_url/token: booking=${bookingId}`,
          data ?? ""
        );
        throw { status: 0 };
      }

      const lkRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = lkRoom;
      attachRoomEvents(lkRoom);

      await lkRoom.connect(String(data["server_url"]), String(data["token"]));
      setRoom(lkRoom);

      try {
        await lkRoom.localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
      } catch {
        setError(t("lesson.mic_permission", "Microphone permission required. Please allow microphone access in browser settings.") as string);
      }

      try {
        await lkRoom.localParticipant.setCameraEnabled(true);
        setIsCameraOff(false);
      } catch {
        setError(t("lesson.camera_permission", "Camera permission required. Please allow camera access in browser settings.") as string);
      }
    } catch (err: unknown) {
      console.error("[lesson] unable to join the lesson room", (err as Record<string, unknown>)?.["message"] ?? err);
      setError(resolveLessonJoinError(err, t as (k: string, f: string) => string));
      setConnectionState("lost");
    }
  };

  const updateParticipants = (lkRoom: Room): void => {
    const remotes = Array.from((lkRoom.remoteParticipants as Map<string, RemoteParticipant>)?.values() ?? (lkRoom as unknown as { participants: Map<string, RemoteParticipant> }).participants.values());
    setParticipants(remotes);
  };

  const toggleMute = async (): Promise<void> => {
    if (!room) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted((prev) => !prev);
    } catch {
      setError(t("lesson.mic_permission", "Microphone permission required.") as string);
    }
  };

  const toggleCamera = async (): Promise<void> => {
    if (!room) return;
    try {
      await room.localParticipant.setCameraEnabled(isCameraOff);
      setIsCameraOff((prev) => !prev);
    } catch {
      setError(t("lesson.camera_permission", "Camera permission required.") as string);
    }
  };

  const toggleScreenShare = async (): Promise<void> => {
    if (!room) return;
    const enabled = !isScreenSharing;
    try {
      await room.localParticipant.setScreenShareEnabled(enabled);
      setIsScreenSharing(enabled);
    } catch {
      setError(t("lesson.screen_permission", "Screen sharing was cancelled or is not available.") as string);
      setIsScreenSharing(false);
    }
  };

  const leaveRoom = (): void => setShowLeaveConfirm(true);

  const confirmLeave = async (): Promise<void> => {
    setShowLeaveConfirm(false);
    if (roomRef.current) roomRef.current.disconnect();
    if (timerRef.current) window.clearInterval(timerRef.current);
    await apiClient.post(endpoints.meetings.end(String(bookingId))).catch(() => {});
    navigate(-1);
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const getConnectionLabel = (): string => {
    switch (connectionState) {
      case "connected": return t("lesson.connected", "Connected") as string;
      case "reconnecting": return t("lesson.reconnecting", "Reconnecting...") as string;
      case "lost": return t("lesson.connection_lost", "Connection lost") as string;
      default: return t("lesson.connecting", "Connecting...") as string;
    }
  };

  const localCamPublication = (room as unknown as { localParticipant?: { getTrackPublication: (s: unknown) => unknown } })?.localParticipant?.getTrackPublication(Track.Source.Camera);

  const streamCacheRef = useRef<WeakMap<HTMLVideoElement, MediaStream>>(new WeakMap());

  const attachVideo = (el: HTMLVideoElement | null, participant: { getTrackPublication: (s: unknown) => { track?: { mediaStreamTrack: MediaStreamTrack } } | undefined }, source: unknown): void => {
    if (!el) return;
    const pub = participant.getTrackPublication(source);
    if (pub?.track) {
      const track = pub.track.mediaStreamTrack;
      const existing = el.srcObject as MediaStream | null;
      if (existing && existing.getTracks().some((t) => t === track)) return;
      el.srcObject = new MediaStream([track]);
      streamCacheRef.current.set(el, el.srcObject);
    } else {
      el.srcObject = null;
      streamCacheRef.current.delete(el);
    }
  };

  if (error && !room) return (
    <div className="lesson-page">
      <div className="lesson-error">
        <h2>{t("common.error", "Error")}</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>{t("buttons.back_home", "Back")}</button>
      </div>
    </div>
  );

  return (
    <div className="lesson-page">
      <div className="lesson-header">
        <span className="lesson-title">{t("lesson.title", "Okututor Lesson")}</span>
        <div className="lesson-header-right">
          <span className={`connection-state connection-${connectionState}`}>{getConnectionLabel()}</span>
          <span className="lesson-timer">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {error && <div className="lesson-permission-warning">{error}</div>}

      <div className="lesson-video-area">
        <div className="video-grid" data-media-version={mediaVersion}>
          {isScreenSharing && (
            <div className="video-participant screen-share">
              <video
                ref={(el) => attachVideo(el, room?.localParticipant as unknown as { getTrackPublication: (s: unknown) => { track?: { mediaStreamTrack: MediaStreamTrack } } | undefined }, Track.Source.ScreenShare)}
                autoPlay muted playsInline
              />
              <span className="participant-name">{t("lesson.you_share", "You are sharing")}</span>
            </div>
          )}
          {room && (
            <div className="video-participant local">
              {localCamPublication && !isCameraOff ? (
                <video ref={(el) => attachVideo(el, room.localParticipant as unknown as { getTrackPublication: (s: unknown) => { track?: { mediaStreamTrack: MediaStreamTrack } } | undefined }, Track.Source.Camera)} autoPlay muted playsInline />
              ) : (
                <div className="video-placeholder">📷</div>
              )}
              <span className="participant-name">{t("lesson.you", "You")}</span>
            </div>
          )}
          {participants.map((p) => (
            <div key={p.sid} className="video-participant remote">
              <video ref={(el) => attachVideo(el, p as unknown as { getTrackPublication: (s: unknown) => { track?: { mediaStreamTrack: MediaStreamTrack } } | undefined }, Track.Source.Camera)} autoPlay playsInline />
              <span className="participant-name">{p.identity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lesson-controls">
        <button
          className={`control-btn ${isMuted ? "active" : ""}`}
          onClick={toggleMute}
          title={isMuted ? t("lesson.mic_off", "Microphone OFF") as string : t("lesson.mic_on", "Microphone ON") as string}
          aria-label={isMuted ? t("lesson.mic_off", "Microphone OFF") as string : t("lesson.mic_on", "Microphone ON") as string}
        >
          {isMuted ? "🔇" : "🎤"}
        </button>
        <button
          className={`control-btn ${isCameraOff ? "active" : ""}`}
          onClick={toggleCamera}
          title={isCameraOff ? t("lesson.camera_on", "Camera ON") as string : t("lesson.camera_off", "Camera OFF") as string}
          aria-label={isCameraOff ? t("lesson.camera_on", "Camera ON") as string : t("lesson.camera_off", "Camera OFF") as string}
        >
          {isCameraOff ? "📹" : "🎥"}
        </button>
        <button
          className={`control-btn ${isScreenSharing ? "sharing" : ""}`}
          onClick={toggleScreenShare}
          disabled={!connected}
          title={isScreenSharing ? t("lesson.stop_sharing", "Stop sharing") as string : t("lesson.share_screen", "Share Screen") as string}
          aria-label={isScreenSharing ? t("lesson.stop_sharing", "Stop sharing") as string : t("lesson.share_screen", "Share Screen") as string}
        >
          🖥️
        </button>
        <button
          className="control-btn leave"
          onClick={leaveRoom}
          title={t("lesson.leave", "Leave") as string}
          aria-label={t("lesson.leave", "Leave") as string}
        >
          📴
        </button>
      </div>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title={t("lesson.leave_confirm_title", "Leave lesson?") as string}
        message={t("lesson.leave_confirm_message", "You will disconnect from the lesson room.") as string}
        confirmLabel={t("lesson.leave", "Leave") as string}
        cancelLabel={t("lesson.stay", "Stay") as string}
        onConfirm={confirmLeave}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
