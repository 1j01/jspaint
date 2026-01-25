/**
 * Individual chat message component.
 * Displays user or assistant messages with appropriate styling.
 * Shows command count for assistant messages with drawing commands.
 */
import { useTranslation } from "react-i18next";
import type { ChatMessage as ChatMessageType } from "../../types/ai";

/**
 * Props for the ChatMessage component
 */
export interface ChatMessageProps {
  /** The chat message to display */
  message: ChatMessageType;
}

/**
 * Renders a single chat message with role-appropriate styling.
 * User messages appear on the right, assistant messages on the left.
 * Uses Windows 98 style with classic 3D borders.
 * @param {ChatMessageProps} props - Component props
 * @returns {JSX.Element} The rendered chat message
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const hasCommands = message.commands && message.commands.length > 0;

  return (
    <div
      className={`chat-message ${isUser ? "chat-message-user" : "chat-message-assistant"}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: "6px",
      }}
    >
      {/* Role label - like old IRC/IM clients */}
      <div
        style={{
          fontSize: "10px",
          fontWeight: "bold",
          color: isUser ? "#000080" : "#008000",
          marginBottom: "2px",
          paddingLeft: isUser ? "0" : "2px",
          paddingRight: isUser ? "2px" : "0",
        }}
      >
        {isUser ? "You:" : "AI:"}
      </div>
      <div
        className={isUser ? "chat-bubble-user" : "chat-bubble-assistant"}
        style={{
          maxWidth: "90%",
          padding: "4px 6px",
          backgroundColor: isUser ? "#ffffcc" : "#ffffff",
          color: "#000000",
          fontSize: "11px",
          lineHeight: "1.3",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          border: "1px solid",
          borderColor: "#808080 #ffffff #ffffff #808080",
          boxShadow: "inset 1px 1px 0 #dfdfdf",
        }}
      >
        {message.content}
      </div>
      {hasCommands && (
        <div
          className="chat-message-commands"
          style={{
            fontSize: "10px",
            color: "#808080",
            marginTop: "2px",
            fontStyle: "italic",
            paddingLeft: isUser ? "0" : "2px",
            paddingRight: isUser ? "2px" : "0",
          }}
        >
          {t("{{count}} command executed", { count: message.commands!.length })}
        </div>
      )}
    </div>
  );
}

export default ChatMessage;
