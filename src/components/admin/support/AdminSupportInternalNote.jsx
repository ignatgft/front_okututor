import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

export default function AdminSupportInternalNote({ onSend }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text, "INTERNAL_NOTE");
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <form className="support-message-input support-internal-note-input" onSubmit={handleSubmit}>
      <div className="support-internal-note-label">
        {t("support.internal_note", "Internal note")}
      </div>
      <textarea
        ref={textareaRef}
        className="support-message-textarea support-internal-note-textarea"
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={t("support.internal_note_placeholder", "Type an internal note...")}
        rows={1}
        aria-label={t("support.internal_note", "Internal note")}
      />
      <button
        type="submit"
        className="btn-secondary support-internal-note-btn"
        disabled={!text.trim()}
      >
        {t("support.add_note", "Add note")}
      </button>
    </form>
  );
}
