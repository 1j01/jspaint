/**
 * Chat input component with text area and action buttons.
 * Handles user input, send/cancel actions, and keyboard shortcuts.
 */
import { useState, useCallback, useRef, useEffect, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

/**
 * Props for the ChatInput component
 */
export interface ChatInputProps {
  /** Callback when user sends a message */
  onSend: (message: string) => void;
  /** Callback when user cancels current operation */
  onCancel: () => void;
  /** Callback when user clears the chat */
  onClear: () => void;
  /** Whether the AI is currently streaming a response */
  isStreaming: boolean;
  /** Whether commands are currently being executed */
  isExecuting: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
}

/**
 * Input component for the AI chat panel.
 * Provides a text area for message input with Send and Cancel buttons.
 * Supports Ctrl+Enter to send and Escape to cancel.
 * @param {ChatInputProps} props - Component props
 * @returns {JSX.Element} The rendered chat input
 */
export function ChatInput({
  onSend,
  onCancel,
  onClear,
  isStreaming,
  isExecuting,
  placeholder,
}: ChatInputProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isBusy = isStreaming || isExecuting;
  const placeholderText = placeholder || t("Describe what you want to draw...");

  /**
   * Handle sending the message
   */
  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (trimmed && !isBusy) {
      onSend(trimmed);
      setMessage("");
    }
  }, [message, isBusy, onSend]);

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent<HTMLTextAreaElement>} e - Keyboard event
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (isBusy) {
          onCancel();
        }
      }
    },
    [handleSend, isBusy, onCancel],
  );

  // Focus input when not busy
  useEffect(() => {
    if (!isBusy && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isBusy]);

  return (
    <div
      className="chat-input-container"
      style={{
        padding: "8px",
        borderTop: "1px solid #808080",
        backgroundColor: "#c0c0c0",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      <textarea
        ref={textareaRef}
        className="chat-input-textarea"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholderText}
        disabled={isBusy}
        rows={3}
        style={{
          width: "100%",
          resize: "none",
          fontFamily: "inherit",
          fontSize: "12px",
          padding: "4px",
          boxSizing: "border-box",
          border: "2px inset #ffffff",
          backgroundColor: isBusy ? "#dfdfdf" : "#ffffff",
        }}
      />
      <div
        className="chat-input-buttons"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "4px",
          marginTop: "4px",
        }}
      >
        {isBusy ? (
          <button
            className="chat-cancel-button"
            onClick={onCancel}
            style={{
              minWidth: "70px",
            }}
          >
            {t("Cancel")}
          </button>
        ) : (
          <>
            <button
              className="chat-clear-button"
              onClick={onClear}
              style={{
                minWidth: "70px",
              }}
            >
              {t("Clear")}
            </button>
            <button
              className="chat-send-button"
              onClick={handleSend}
              disabled={!message.trim()}
              style={{
                minWidth: "70px",
              }}
            >
              {t("Send")}
            </button>
          </>
        )}
      </div>
      <div
        className="chat-input-hint"
        style={{
          fontSize: "10px",
          color: "#000000",
          marginTop: "2px",
          textAlign: "right",
        }}
      >
        {isBusy ? t("Press Esc to cancel") : t("Ctrl+Enter to send")}
      </div>
    </div>
  );
}

export default ChatInput;
