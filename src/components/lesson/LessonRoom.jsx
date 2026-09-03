import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Room, RoomEvent, Track } from "livekit-client";
import { apiClient } from "../../api/http";
import { endpoints } from "../../api/endpoints";
import ConfirmModal from "../ui/ConfirmModal";
import { resolveLessonJoinError } from "./lessonErrors";
import useAuthStore from "../../store/authStore";
import { ROLES } from "../../constants/roles";

export default function LessonRoom({ bookingId }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("connecting");
  const [error, setError] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [mediaVersion, setMediaVersion] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const timerRef = useRef(null);
  const roomRef = useRef(null);

  useEffect(() => {
    joinRoom();
    return () => {
      if (roomRef.current) roomRef.current.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- LiveKit room lifecycle is bound to bookingId for the whole session
  }, [bookingId]);

  const attachRoomEvents = (lkRoom) => {
    lkRoom.on(RoomEvent.Connected, () => {
      setConnected(true);
      setConnectionState("connected");
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setElapsedTime((s) => s + 1), 1000);
      }
      updateParticipants(lkRoom);
    });

    lkRoom.on(RoomEvent.Disconnected, () => {
      setConnected(false);
      setConnectionState("lost");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    lkRoom.on(RoomEvent.Reconnecting, () => setConnectionState("reconnecting"));
    lkRoom.on(RoomEvent.Reconnected, () => {
      setConnectionState("connected");
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setElapsedTime((s) => s + 1), 1000);
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

  const joinRoom = async () => {
    try {
      setConnectionState("connecting");
      // --- P1 guard: role + lesson status before requesting LiveKit token ---
      const role = user?.role;
      if (!role || ![ROLES.STUDENT, ROLES.TUTOR].includes(role)) {
        throw { status: 403, message: t("lesson.forbidden_role", "You do not have permission to join this lesson") };
      }
      // optional: validate booking/lesson is in joinable state (best effort, don't block on network error)
      try {
        const { response: bkRes, data: bkData } = await apiClient.get(endpoints.bookings.byId(bookingId));
        if (bkRes.ok && bkData) {
          const s = String(bkData.status || bkData.state || bkData.lesson_status || "").toUpperCase();
          const blocked = ["CANCELLED", "REJECTED", "EXPIRED", "COMPLETED", "CANCELLED_BY_STUDENT", "CANCELLED_BY_TUTOR"];
          if (blocked.includes(s)) {
            throw { status: 403, message: t("lesson.not_joinable_status", "This lesson cannot be joined in its current status") };
          }
        } else if (bkRes.status === 403 || bkRes.status === 404) {
          throw { status: bkRes.status };
        }
      } catch (guardErr) {
        // if guard itself threw 403, propagate; otherwise ignore network errors and continue to token request
        if (guardErr?.status === 403 || guardErr?.status === 404) throw guardErr;
        // network/timeout during guard should not block join attempt
      }

      const { response, data } = await apiClient.post(endpoints.meetings.token(bookingId));
      if (!response.ok) {
        console.error(
          `[lesson] meeting token request failed: status=${response.status} booking=${bookingId}`,
          data ?? ""
        );
        throw { status: response.status };
      }
      if (!data || !data.token || !data.server_url) {
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

      await lkRoom.connect(data.server_url, data.token);
      setRoom(lkRoom);

      try {
        await lkRoom.localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
      } catch {
        setError(t("lesson.mic_permission", "Microphone permission required. Please allow microphone access in browser settings."));
      }

      try {
        await lkRoom.localParticipant.setCameraEnabled(true);
        setIsCameraOff(false);
      } catch {
        setError(t("lesson.camera_permission", "Camera permission required. Please allow camera access in browser settings."));
      }
    } catch (err) {
      console.error("[lesson] unable to join the lesson room", err?.message || err);
      setError(resolveLessonJoinError(err, t));
      setConnectionState("lost");
    }
  };

  const updateParticipants = (lkRoom) => {
    setParticipants(Array.from(lkRoom.remoteParticipants?.values() || lkRoom.participants.values()));
  };

  const toggleMute = async () => {
    if (!room) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(!isMuted);
      setIsMuted((prev) => !prev);
    } catch {
      setError(t("lesson.mic_permission", "Microphone permission required."));
    }
  };

  const toggleCamera = async () => {
    if (!room) return;
    try {
      await room.localParticipant.setCameraEnabled(!isCameraOff);
      setIsCameraOff((prev) => !prev);
    } catch {
      setError(t("lesson.camera_permission", "Camera permission required."));
    }
  };

  const toggleScreenShare = async () => {
    if (!room) return;
    const enabled = !isScreenSharing;
    try {
      await room.localParticipant.setScreenShareEnabled(enabled);
      setIsScreenSharing(enabled);
    } catch {
      setError(t("lesson.screen_permission", "Screen sharing was cancelled or is not available."));
      setIsScreenSharing(false);
    }
  };

  const leaveRoom = () => setShowLeaveConfirm(true);

  const confirmLeave = async () => {
    setShowLeaveConfirm(false);
    if (roomRef.current) roomRef.current.disconnect();
    if (timerRef.current) clearInterval(timerRef.current);
    await apiClient.post(endpoints.meetings.end(bookingId)).catch(() => {});
    navigate(-1);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const getConnectionLabel = () => {
    switch (connectionState) {
      case "connected": return t("lesson.connected", "Connected");
      case "reconnecting": return t("lesson.reconnecting", "Reconnecting...");
      case "lost": return t("lesson.connection_lost", "Connection lost");
      default: return t("lesson.connecting", "Connecting...");
    }
  };

  const localCamPublication = room?.localParticipant?.getTrackPublication(Track.Source.Camera);

  const streamCacheRef = useRef(new WeakMap());

  const attachVideo = (el, participant, source) => {
    if (!el) return;
    const pub = participant.getTrackPublication(source);
    if (pub?.track) {
      const track = pub.track.mediaStreamTrack;
      const existing = el.srcObject;
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
                ref={(el) => attachVideo(el, room?.localParticipant, Track.Source.ScreenShare)}
                autoPlay muted playsInline
              />
              <span className="participant-name">{t("lesson.you_share", "You are sharing")}</span>
            </div>
          )}
          {room && (
            <div className="video-participant local">
              {localCamPublication && !isCameraOff ? (
                <video ref={(el) => attachVideo(el, room.localParticipant, Track.Source.Camera)} autoPlay muted playsInline />
              ) : (
                <div className="video-placeholder">📷</div>
              )}
              <span className="participant-name">{t("lesson.you", "You")}</span>
            </div>
          )}
          {participants.map((p) => (
            <div key={p.sid} className="video-participant remote">
              <video ref={(el) => attachVideo(el, p, Track.Source.Camera)} autoPlay playsInline />
              <span className="participant-name">{p.identity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lesson-controls">
        <button
          className={`control-btn ${isMuted ? "active" : ""}`}
          onClick={toggleMute}
          title={isMuted ? t("lesson.mic_off", "Microphone OFF") : t("lesson.mic_on", "Microphone ON")}
          aria-label={isMuted ? t("lesson.mic_off", "Microphone OFF") : t("lesson.mic_on", "Microphone ON")}
        >
          {isMuted ? "🔇" : "🎤"}
        </button>
        <button
          className={`control-btn ${isCameraOff ? "active" : ""}`}
          onClick={toggleCamera}
          title={isCameraOff ? t("lesson.camera_on", "Camera ON") : t("lesson.camera_off", "Camera OFF")}
          aria-label={isCameraOff ? t("lesson.camera_on", "Camera ON") : t("lesson.camera_off", "Camera OFF")}
        >
          {isCameraOff ? "📹" : "🎥"}
        </button>
        <button
          className={`control-btn ${isScreenSharing ? "sharing" : ""}`}
          onClick={toggleScreenShare}
          disabled={!connected}
          title={isScreenSharing ? t("lesson.stop_sharing", "Stop sharing") : t("lesson.share_screen", "Share Screen")}
          aria-label={isScreenSharing ? t("lesson.stop_sharing", "Stop sharing") : t("lesson.share_screen", "Share Screen")}
        >
          🖥️
        </button>
        <button
          className="control-btn leave"
          onClick={leaveRoom}
          title={t("lesson.leave", "Leave")}
          aria-label={t("lesson.leave", "Leave")}
        >
          📴
        </button>
      </div>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title={t("lesson.leave_confirm_title", "Leave lesson?")}
        message={t("lesson.leave_confirm_message", "You will disconnect from the lesson room.")}
        confirmLabel={t("lesson.leave", "Leave")}
        cancelLabel={t("lesson.stay", "Stay")}
        onConfirm={confirmLeave}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
