// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { Spinner } from "../ui/Primitives";
import "../../styles/Avatar.css";

const CROP_OUTPUT = 512;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function AvatarCropModal({ imageSrc, onCancel, onConfirm }: Record<string, unknown>) {
  const { t } = useTranslation();
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(null);
  const [saving, setSaving] = useState(false);
  const [containerSize, setContainerSize] = useState(0);
  const viewportRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return undefined;
    const update = () => setContainerSize(el.clientWidth || 0);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const minZoom = useCallback(() => {
    if (!img) return 1;
    return Math.max(containerSize / img.naturalWidth || 1, containerSize / img.naturalHeight || 1, 1);
  }, [img, containerSize]);

  useEffect(() => {
    if (!img || !containerSize) return;
    const initial = minZoom();
    setZoom((z) => (z < initial ? initial : z));
    setPan({ x: 0, y: 0 });
  }, [img, containerSize, minZoom]);

  const clampPan = useCallback(
    (next, z) => {
      if (!img) return next;
      const rangeX = (img.naturalWidth * z - containerSize) / 2;
      const rangeY = (img.naturalHeight * z - containerSize) / 2;
      return {
        x: clamp(next.x, -rangeX, rangeX),
        y: clamp(next.y, -rangeY, rangeY),
      };
    },
    [img, containerSize]
  );

  const handlePointerDown = (e) => {
    if (saving) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ id: e.pointerId, startX: e.clientX, startY: e.clientY, originX: pan.x, originY: pan.y });
  };

  const handlePointerMove = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setPan(() => clampPan({ x: drag.originX + dx, y: drag.originY + dy }, zoom));
  };

  const endDrag = (e) => {
    if (drag?.id === e.pointerId) setDrag(null);
  };

  const handleConfirm = () => {
    if (!img || saving) return;
    setSaving(true);
    const z = zoom;
    const cx = containerSize / 2;
    const sx = img.naturalWidth / 2 - (cx + pan.x) / z;
    const sy = img.naturalHeight / 2 - (cx + pan.y) / z;
    const cropSize = containerSize / z;

    const canvas = document.createElement("canvas");
    canvas.width = CROP_OUTPUT;
    canvas.height = CROP_OUTPUT;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, CROP_OUTPUT, CROP_OUTPUT);
    canvas.toBlob(
      (blob) => {
        setSaving(false);
        if (blob) onConfirm?.(blob);
        else onCancel?.();
      },
      "image/png",
      0.92
    );
  };

  return createPortal(
    <div className="avatar-crop-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div className="avatar-crop-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title">
        <div className="avatar-crop-header">
          <h2 id="avatar-crop-title">{t("profile.crop_avatar", "Crop photo")}</h2>
          <button type="button" className="avatar-crop-close" onClick={onCancel} aria-label={t("a11y.close_modal", "Close")}>
            ✕
          </button>
        </div>

        <div className="avatar-crop-stage" ref={viewportRef}>
          <div
            className={`avatar-crop-viewport ${drag ? "dragging" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            role="img"
            aria-label={t("profile.crop_drag_hint", "Drag to position the photo")}
          >
            <img
              ref={imgRef}
              className="avatar-crop-image"
              src={imageSrc}
              alt=""
              onLoad={(e) => setImg(e.currentTarget)}
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            />
          </div>
        </div>

        <div className="avatar-crop-zoom">
          <span aria-hidden="true">−</span>
          <input
            type="range"
            min={Math.round(minZoom() * 10) / 10}
            max={4}
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(clamp(Number(e.target.value), minZoom(), 4))}
            aria-label={t("profile.crop_zoom", "Zoom")}
          />
          <span aria-hidden="true">+</span>
        </div>

        <div className="avatar-crop-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
            {t("common.cancel", "Cancel")}
          </button>
          <button type="button" className="btn-primary" onClick={handleConfirm} disabled={saving || !img}>
            {saving ? <Spinner label="" /> : t("profile.crop_apply", "Save photo")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}