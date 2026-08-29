import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usersApi } from "../../api/users.api";
import { useToast } from "../ui/Toast";
import AvatarCropModal from "./AvatarCropModal";
import "../../styles/Avatar.css";

const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

export function getInitials(name = "") {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function avatarUrlFrom(payload) {
  const d = payload || {};
  return d.avatar_url || d.avatarUrl || d.url || d.photo_url || d.photoUrl || d.avatar || "";
}

export default function AvatarUploader({ src, name, onSaved, onRemoved }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [cropSrc, setCropSrc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const avatarInputRef = useRef(null);

  const handlePick = (file) => {
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error(t("profile.avatar_too_large", "Photo must be 10 MB or smaller"));
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.avatar_type_error", "Please choose an image file"));
      return;
    }
    setCropSrc(URL.createObjectURL(file));
  };

  const applyBlob = async (blob) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setUploading(true);
    setProgress(0);
    const file = new File([blob], "avatar.png", { type: "image/png" });
    try {
      const { response, data } = await usersApi.updateAvatar(file, (p) => setProgress(p));
      if (response.ok) {
        const url = avatarUrlFrom(data);
        if (url) {
          onSaved?.(url);
          toast.success(t("profile.avatar_saved", "Photo updated"));
        } else {
          onSaved?.("");
          toast.success(t("profile.avatar_saved", "Photo updated"));
        }
      } else {
        toast.error(data?.message || data?.detail || t("profile.avatar_save_failed", "Failed to update photo"));
      }
    } catch (err) {
      toast.error(err.message || t("profile.avatar_save_failed", "Failed to update photo"));
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const handleRemove = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      const { response, data } = await usersApi.deleteAvatar();
      if (response.ok) {
        onRemoved?.();
        toast.success(t("profile.avatar_removed", "Photo removed"));
      } else {
        toast.error(data?.message || t("profile.avatar_remove_failed", "Failed to remove photo"));
      }
    } catch (err) {
      toast.error(err.message || t("profile.avatar_remove_failed", "Failed to remove photo"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avatar-uploader">
      <div className="avatar-uploader-preview">
        {src ? (
          <img className="avatar-uploader-img" src={src} alt={t("profile.avatar_alt", "User avatar")} />
        ) : (
          <span className="avatar-uploader-fallback" aria-hidden="true">{getInitials(name) || "?"}</span>
        )}
        {uploading && (
          <div className="avatar-uploader-progress" aria-live="polite">
            {progress != null ? <i style={{ width: `${progress}%` }} /> : <span className="avatar-uploader-spinner" />}
          </div>
        )}
      </div>

      <div className="avatar-uploader-actions">
        <button
          type="button"
          className="avatar-uploader-btn"
          onClick={() => avatarInputRef.current?.click()}
          disabled={uploading}
        >
          {src ? t("profile.change_avatar", "Change photo") : t("profile.set_avatar", "Add photo")}
        </button>
        {src && (
          <button
            type="button"
            className="avatar-uploader-btn danger"
            onClick={handleRemove}
            disabled={uploading}
          >
            {t("profile.remove_avatar", "Remove")}
          </button>
        )}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            handlePick(file);
          }}
          data-testid="avatar-input"
        />
      </div>

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
          onConfirm={applyBlob}
        />
      )}
    </div>
  );
}