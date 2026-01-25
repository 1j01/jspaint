/**
 * Streaming message component for real-time token display.
 * Shows assistant response as it streams from the API.
 * Uses Windows 98 style with classic 3D borders.
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
 * Uses Windows 98 style to match ChatMessage component.
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
        marginBottom: "6px",
      }}
    >
      {/* Role label - like old IRC/IM clients */}
      <div
        style={{
          fontSize: "10px",
          fontWeight: "bold",
          color: "#000000",
          marginBottom: "2px",
          paddingLeft: "2px",
        }}
      >
        AI:
      </div>
      <div
        className="chat-bubble-assistant chat-bubble-streaming"
        style={{
          maxWidth: "90%",
          padding: "4px 6px",
          backgroundColor: "#ffffff",
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
        {content || ""}
        {isStreaming && (
          <span
            className="typing-indicator"
            style={{
              display: "inline-block",
              width: "6px",
              height: "10px",
              backgroundColor: "#000080",
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
