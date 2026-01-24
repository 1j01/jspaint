/**
 * Individual chat message component.
 * Displays user or assistant messages with appropriate styling.
 * Shows command count for assistant messages with drawing commands.
 */
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
 * @param {ChatMessageProps} props - Component props
 * @returns {JSX.Element} The rendered chat message
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasCommands = message.commands && message.commands.length > 0;

  return (
    <div
      className={`chat-message ${isUser ? "chat-message-user" : "chat-message-assistant"}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: "8px",
      }}
    >
      <div
        className={isUser ? "chat-bubble-user" : "chat-bubble-assistant"}
        style={{
          maxWidth: "85%",
          padding: "6px 10px",
          borderRadius: "4px",
          backgroundColor: isUser ? "#0078d4" : "#dfdfdf",
          color: isUser ? "#ffffff" : "#000000",
          fontSize: "12px",
          lineHeight: "1.4",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.content}
      </div>
      {hasCommands && (
        <div
          className="chat-message-commands"
          style={{
            fontSize: "10px",
            color: "#666666",
            marginTop: "2px",
            paddingLeft: isUser ? "0" : "4px",
            paddingRight: isUser ? "4px" : "0",
          }}
        >
          {message.commands!.length} command
          {message.commands!.length !== 1 ? "s" : ""} executed
        </div>
      )}
    </div>
  );
}

export default ChatMessage;
