/**
 * AI Chat Panel component.
 * Main container for the AI assistant that allows users to control
 * the canvas through natural language commands.
 * Uses Windows 98 styling to match the rest of the application.
 */
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAIChat } from "../../hooks/useAIChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ExecutionProgress } from "./ExecutionProgress";
import { useAIStore } from "../../context/state/aiStore";
import { useDraggable } from "../../hooks/useDraggable";

/**
 * Props for the AIChatPanel component
 */
export interface AIChatPanelProps {
  /** Reference to the canvas element for command execution */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
}

/**
 * AI Chat Panel providing natural language control of the canvas.
 * Displays chat history, streaming responses, and execution progress.
 * Styled as a Windows 98 window that can be dragged.
 * @param {AIChatPanelProps} props - Component props
 * @returns {JSX.Element | null} The rendered panel or null if closed
 */
export function AIChatPanel({ canvasRef, isOpen, onClose }: AIChatPanelProps) {
  const { t } = useTranslation();
  const { messages, isStreaming, isExecuting, streamContent, error, sendMessage, cancel, resetChat } = useAIChat({
    canvasRef,
    animationDelay: 50,
    onCommandError: (errorMsg) => {
      console.error("Command execution error:", errorMsg);
    },
  });

  // Get execution progress from store
  const executionProgress = useAIStore((state) => state.executionProgress);

  // Draggable functionality
  const { position, elementRef, handleProps, isDragging } = useDraggable({
    enabled: true,
  });

  /**
   * Handle closing the panel
   */
  const handleClose = useCallback(() => {
    cancel();
    onClose();
  }, [cancel, onClose]);

  /**
   * Handle clearing the chat
   */
  const handleClear = useCallback(() => {
    resetChat();
  }, [resetChat]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isStreaming && !isExecuting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isStreaming, isExecuting, handleClose]);

  if (!isOpen) {
    return null;
  }

  const windowStyle: React.CSSProperties = {
    position: "fixed",
    width: 320,
    height: 450,
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
    ...(position
      ? {
          left: position.x,
          top: position.y,
        }
      : {
          right: 20,
          top: 100,
        }),
  };

  return (
    <div ref={elementRef} className={`window os-window focused ${isDragging ? "dragging" : ""}`} style={windowStyle}>
      {/* Title bar */}
      <div className="window-titlebar" {...handleProps}>
        <img src="/images/icons/16x16.png" width={16} height={16} draggable={false} alt="" />
        <div className="window-title-area">
          <span className="window-title">{t("AI Assistant")}</span>
        </div>
        <div className="window-buttons">
          <button
            className="window-close-button window-action-close window-button"
            aria-label={t("Close")}
            onClick={handleClose}
          >
            <span className="window-button-icon"></span>
          </button>
        </div>
      </div>

      {/* Window content */}
      <div
        className="window-content window-body"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          padding: 0,
        }}
      >
        {/* Error display */}
        {error && (
          <div
            className="chat-error"
            style={{
              padding: "8px",
              backgroundColor: "#ffcccc",
              borderBottom: "1px solid #cc0000",
              color: "#cc0000",
              fontSize: "11px",
            }}
          >
            {error}
          </div>
        )}

        {/* Message list */}
        <MessageList messages={messages} streamContent={streamContent} isStreaming={isStreaming} />

        {/* Execution progress */}
        {isExecuting && executionProgress && (
          <ExecutionProgress
            current={executionProgress.current}
            total={executionProgress.total}
            isExecuting={isExecuting}
          />
        )}

        {/* Chat input */}
        <ChatInput onSend={sendMessage} onCancel={cancel} onClear={handleClear} isStreaming={isStreaming} isExecuting={isExecuting} />
      </div>
    </div>
  );
}

export default AIChatPanel;
