/**
 * Streaming message component for real-time token display.
 * Shows assistant response as it streams from the API.
 */

/**
 * Props for the StreamingMessage component
 */
export interface StreamingMessageProps {
  /** The current streaming content */
  content: string;
  /** Whether streaming is currently active */
  isStreaming: boolean;
}

/**
 * Displays streaming content with a typing indicator.
 * Shows real-time response from the AI as tokens arrive.
 * @param {StreamingMessageProps} props - Component props
 * @returns {JSX.Element | null} The rendered streaming message or null if no content
 */
export function StreamingMessage({ content, isStreaming }: StreamingMessageProps) {
  if (!content && !isStreaming) {
    return null;
  }

  return (
    <div
      className="chat-message chat-message-assistant chat-message-streaming"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        marginBottom: "8px",
      }}
    >
      <div
        className="chat-bubble-assistant chat-bubble-streaming"
        style={{
          maxWidth: "85%",
          padding: "6px 10px",
          borderRadius: "4px",
          backgroundColor: "#dfdfdf",
          color: "#000000",
          fontSize: "12px",
          lineHeight: "1.4",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {content || ""}
        {isStreaming && (
          <span
            className="typing-indicator"
            style={{
              display: "inline-block",
              width: "8px",
              height: "12px",
              backgroundColor: "#666666",
              marginLeft: "2px",
              animation: "blink 1s step-end infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default StreamingMessage;
