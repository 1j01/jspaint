/**
 * AI Side Panel component.
 * Right-side panel for AI assistant that spans the full window height.
 * Uses Windows 98 styling to match the rest of the application.
 */
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAIChat } from "../../hooks/useAIChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ExecutionProgress } from "./ExecutionProgress";
import { useAIStore } from "../../context/state/aiStore";

/**
 * Props for the AISidePanel component
 */
export interface AISidePanelProps {
  /** Reference to the canvas element for command execution */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Callback to close/hide the panel */
  onClose: () => void;
}

/**
 * AI Side Panel providing natural language control of the canvas.
 * Displays chat history, streaming responses, and execution progress.
 * Designed as a full-height side panel for the Frame rightContent slot.
 * @param {AISidePanelProps} props - Component props
 * @returns {JSX.Element} The rendered side panel
 */
export function AISidePanel({ canvasRef, onClose }: AISidePanelProps) {
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

  /**
   * Handle clearing the chat
   */
  const handleClear = useCallback(() => {
    resetChat();
  }, [resetChat]);

  /**
   * Handle closing the panel
   */
  const handleClose = useCallback(() => {
    cancel();
    onClose();
  }, [cancel, onClose]);

  return (
    <div className="ai-side-panel">
      {/* Header */}
      <div className="ai-side-panel-header">
        <span className="ai-side-panel-title">{t("AI Assistant")}</span>
        <div className="ai-side-panel-buttons">
          <button
            className="ai-side-panel-button"
            onClick={handleClear}
            title={t("Clear chat")}
            aria-label={t("Clear chat")}
          >
            {t("Clear")}
          </button>
          <button
            className="ai-side-panel-button ai-side-panel-close"
            onClick={handleClose}
            title={t("Hide panel")}
            aria-label={t("Hide AI panel")}
          >
            ×
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && <div className="ai-side-panel-error">{error}</div>}

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
      <ChatInput onSend={sendMessage} onCancel={cancel} isStreaming={isStreaming} isExecuting={isExecuting} />
    </div>
  );
}

export default AISidePanel;
