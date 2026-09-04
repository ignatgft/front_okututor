/* eslint-disable react-refresh/only-export-components */
// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import "../../styles/Attachments.css";

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function isImageAttachment(attachment = {}) {
  const kind = String(attachment.kind || "").toUpperCase();
  const mime = String(attachment.mime_type || attachment.mimeType || "").toLowerCase();
  return kind === "IMAGE" || kind === "IMAGE/*" || mime.startsWith("image/");
}

export function normalizeAttachment(attachment = {}) {
  return {
    id: attachment.id,
    kind: attachment.kind,
    mime_type: attachment.mime_type || attachment.mimeType || "",
    name: attachment.name || attachment.filename || attachment.file_name || "file",
    size: attachment.size || 0,
    url: attachment.url || attachment.file_url || attachment.src || "",
  };
}

export function AttachmentLightbox({ attachment, onClose }) {
  const { t } = useTranslation();

  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const a = normalizeAttachment(attachment);

  return createPortal(
    <div className="attachment-lightbox" role="dialog" aria-modal="true" aria-label={a.name} onClick={onClose}>
      <button
        type="button"
        className="attachment-lightbox-close"
        onClick={onClose}
        aria-label={t("a11y.close_lightbox", "Close preview")}
      >
        ✕
      </button>
      <img
        className="attachment-lightbox-img"
        src={a.url}
        alt={a.name}
        onClick={(e) => e.stopPropagation()}
      />
      <span className="attachment-lightbox-caption">{a.name}</span>
    </div>,
    document.body
  );
}

export default function AttachmentRenderer({ attachment }: Record<string, unknown>) {
  const { t } = useTranslation();
  const [openLightbox, setOpenLightbox] = useState(false);
  const a = normalizeAttachment(attachment);

  const isImage = isImageAttachment(attachment);

  if (!a.url) return null;

  if (isImage) {
    return (
      <div className="attachment-image-wrap">
        <button
          type="button"
          className="attachment-image-btn"
          onClick={() => setOpenLightbox(true)}
          aria-label={t("attachments.open_image", "Open image {{name}}", { name: a.name })}
        >
          <img className="attachment-image" src={a.url} alt={a.name} loading="lazy" />
        </button>
        {openLightbox && <AttachmentLightbox attachment={a} onClose={() => setOpenLightbox(false)} />}
      </div>
    );
  }

  return (
    <div className="attachment-file-card">
      <span className="attachment-file-icon" aria-hidden="true">
        📄
      </span>
      <div className="attachment-file-info">
        <span className="attachment-file-name">{a.name}</span>
        {a.size > 0 && <span className="attachment-file-size">{formatBytes(a.size)}</span>}
      </div>
      <a
        className="attachment-file-download"
        href={a.url}
        target="_blank"
        rel="noopener noreferrer"
        download={a.name}
        aria-label={t("attachments.download", "Download {{name}}", { name: a.name })}
      >
        {t("attachments.download", "Download")}
      </a>
    </div>
  );
}