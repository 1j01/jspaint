/**
 * Message list component for displaying chat history.
 * Provides a scrollable container with auto-scroll on new messages.
 */
import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ChatMessage as ChatMessageType } from "../../types/ai";
import { ChatMessage } from "./ChatMessage";
import { StreamingMessage } from "./StreamingMessage";

/**
 * Props for the MessageList component
 */
export interface MessageListProps {
  /** Array of chat messages to display */
  messages: ChatMessageType[];
  /** Current streaming content for real-time display */
  streamContent: string;
  /** Whether the AI is currently streaming a response */
  isStreaming: boolean;
}

/**
 * Renders a scrollable list of chat messages with auto-scroll.
 * Displays historical messages and current streaming content.
 * @param {MessageListProps} props - Component props
 * @returns {JSX.Element} The rendered message list
 */
export function MessageList({ messages, streamContent, isStreaming }: MessageListProps) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, streamContent]);

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div
      ref={listRef}
      className="chat-message-list"
      style={{
        flex: 1,
        overflowX: "hidden",
        overflowY: "scroll",
        scrollbarGutter: "stable",
        padding: "8px",
        backgroundColor: "#ffffff",
        border: "2px inset #ffffff",
        minHeight: "100px",
        boxSizing: "border-box",
      }}
    >
      {isEmpty ? (
        <div
          className="chat-empty-state"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#000000",
            fontSize: "12px",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <div style={{ marginBottom: "8px" }}>{t("Ask the AI to draw something!")}</div>
          <div style={{ fontSize: "11px" }}>{t("Try: \"Draw a red circle\" or \"Fill the canvas with blue\"")}</div>
        </div>
      ) : (
        <>
          {/* Filter out the last assistant message if it's empty and we're streaming */}
          {messages
            .filter((msg, idx) => {
              // If streaming, skip the last empty assistant message (it's the placeholder)
              if (isStreaming && idx === messages.length - 1 && msg.role === "assistant" && !msg.content.trim()) {
                return false;
              }
              return true;
            })
            .map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          {/* Show streaming message if active */}
          {isStreaming && <StreamingMessage content={streamContent} isStreaming={isStreaming} />}
        </>
      )}
    </div>
  );
}

export default MessageList;
