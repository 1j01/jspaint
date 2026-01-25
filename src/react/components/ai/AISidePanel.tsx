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
  const { messages, isStreaming, isExecuting, streamContent, sendMessage, cancel, resetChat } = useAIChat({
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
    <div className="ai-side-panel os-window focused">
      {/* Header - using same structure as Dialog */}
      <div className="window-titlebar ai-side-panel-titlebar">
        <div className="window-title-area">
          <span className="window-title">{t("AI Assistant")}</span>
        </div>
      </div>

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
  );
}

export default AISidePanel;
