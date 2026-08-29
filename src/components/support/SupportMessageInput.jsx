import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

export default function SupportMessageInput({ onSend, disabled = false, placeholder }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
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
    <form className="support-message-input" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className="support-message-textarea"
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t("support.type_message", "Type your message...")}
        disabled={disabled}
        rows={1}
        aria-label={t("support.message_input", "Message input")}
      />
      <button
        type="submit"
        className="support-send-btn"
        disabled={disabled || !text.trim()}
        aria-label={t("support.send", "Send")}
      >
        {t("support.send", "Send")}
      </button>
    </form>
  );
}
