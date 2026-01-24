/**
 * AI Chat Hook
 * Combines aiStore with SSE handling and command execution
 * Provides a simple interface for chat functionality
 */

import { useCallback, useRef, useEffect } from "react";
import type { RefObject } from "react";
import { useAIStore, createUserMessage, createAssistantMessage } from "../context/state/aiStore";
import { useSettingsStore } from "../context/state/settingsStore";
import { useCanvasStore } from "../context/state/canvasStore";
import { sendAIRequest, type AIServiceCallbacks } from "../services/aiService";
import { useCommandExecutor } from "./useCommandExecutor";
import type { DrawingCommand, ChatMessage } from "../types/ai";

/**
 * Options for the useAIChat hook
 */
export interface UseAIChatOptions {
  /** Canvas element reference for command execution */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Delay between command executions in ms */
  animationDelay?: number;
  /** Called when a command execution error occurs */
  onCommandError?: (error: string) => void;
}

/**
 * Return type for the useAIChat hook
 */
export interface UseAIChatReturn {
  /** All chat messages */
  messages: ChatMessage[];
  /** Whether currently streaming response from API */
  isStreaming: boolean;
  /** Whether currently executing drawing commands */
  isExecuting: boolean;
  /** Current streaming content (for real-time display) */
  streamContent: string;
  /** Error message if any */
  error: string | null;
  /** Pending commands waiting to execute */
  pendingCommands: DrawingCommand[];
  /** Send a message and get AI response */
  sendMessage: (content: string) => void;
  /** Cancel current request or execution */
  cancel: () => void;
  /** Clear all messages */
  clearMessages: () => void;
  /** Reset entire chat state */
  resetChat: () => void;
}

/**
 * Hook for managing AI chat interactions
 * Handles sending messages, receiving streamed responses, and executing commands
 * @param {UseAIChatOptions} options - Hook options
 * @returns {UseAIChatReturn} Chat state and actions
 */
export function useAIChat(options: UseAIChatOptions): UseAIChatReturn {
  const { canvasRef, animationDelay = 50, onCommandError } = options;

  // Store state
  const messages = useAIStore((state) => state.messages);
  const isStreaming = useAIStore((state) => state.isStreaming);
  const isExecuting = useAIStore((state) => state.isExecuting);
  const streamContent = useAIStore((state) => state.currentStreamContent);
  const error = useAIStore((state) => state.error);
  const pendingCommands = useAIStore((state) => state.pendingCommands);

  // Store actions
  const addMessage = useAIStore((state) => state.addMessage);
  const updateMessage = useAIStore((state) => state.updateMessage);
  const setStreaming = useAIStore((state) => state.setStreaming);
  const setExecuting = useAIStore((state) => state.setExecuting);
  const appendStreamContent = useAIStore((state) => state.appendStreamContent);
  const clearStreamContent = useAIStore((state) => state.clearStreamContent);
  const addPendingCommands = useAIStore((state) => state.addPendingCommands);
  const clearPendingCommands = useAIStore((state) => state.clearPendingCommands);
  const setExecutionProgress = useAIStore((state) => state.setExecutionProgress);
  const setError = useAIStore((state) => state.setError);
  const clearMessages = useAIStore((state) => state.clearMessages);
  const resetState = useAIStore((state) => state.resetState);

  // Settings for context
  const primaryColor = useSettingsStore((state) => state.primaryColor);
  const secondaryColor = useSettingsStore((state) => state.secondaryColor);

  // Canvas dimensions
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasHeight = useCanvasStore((state) => state.canvasHeight);

  // Refs for current request
  const abortRef = useRef<{ abort: () => void } | null>(null);
  const currentAssistantMessageIdRef = useRef<string | null>(null);
  const accumulatedCommandsRef = useRef<DrawingCommand[]>([]);

  // Command executor
  const { executeCommands, cancelExecution } = useCommandExecutor({
    canvasRef,
    animationDelay,
    onProgress: (progress) => {
      setExecutionProgress(progress);
    },
    onComplete: () => {
      setExecuting(false);
      setExecutionProgress(null);
      clearPendingCommands();
    },
    onError: (error) => {
      setError(error);
      onCommandError?.(error);
    },
  });

  /**
   * Execute pending commands
   */
  const executePendingCommands = useCallback(async () => {
    const commands = useAIStore.getState().pendingCommands;
    if (commands.length === 0) return;

    setExecuting(true);
    await executeCommands(commands);
  }, [executeCommands, setExecuting]);

  /**
   * Send a chat message to the AI
   * @param {string} content - User message content
   */
  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      if (isStreaming || isExecuting) return;

      // Clear any previous error
      setError(null);
      clearStreamContent();
      accumulatedCommandsRef.current = [];

      // Add user message
      const userMessage = createUserMessage(content);
      addMessage(userMessage);

      // Create placeholder assistant message
      const assistantMessage = createAssistantMessage("");
      addMessage(assistantMessage);
      currentAssistantMessageIdRef.current = assistantMessage.id;

      // Start streaming
      setStreaming(true);

      // Prepare messages for API (only send role and content)
      const apiMessages = [...useAIStore.getState().messages]
        .filter((m) => m.content.trim() !== "") // Exclude empty messages
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // Add the new user message
      apiMessages.push({ role: "user", content });

      // SSE callbacks
      const callbacks: AIServiceCallbacks = {
        onToken: (token) => {
          appendStreamContent(token);
        },
        onCommands: (commands) => {
          // Accumulate commands as they come in
          accumulatedCommandsRef.current = [...accumulatedCommandsRef.current, ...commands];
          addPendingCommands(commands);
        },
        onProgress: (current, total) => {
          setExecutionProgress({ current, total });
        },
        onDone: (message) => {
          setStreaming(false);

          // Update assistant message with final content
          const finalContent = message || useAIStore.getState().currentStreamContent;
          const commands = accumulatedCommandsRef.current;

          if (currentAssistantMessageIdRef.current) {
            updateMessage(currentAssistantMessageIdRef.current, {
              content: finalContent,
              commands: commands.length > 0 ? commands : undefined,
            });
          }

          clearStreamContent();
          abortRef.current = null;

          // Execute commands if any
          if (commands.length > 0) {
            executePendingCommands();
          }
        },
        onError: (errorMessage) => {
          setStreaming(false);
          setError(errorMessage);
          clearStreamContent();

          // Update assistant message with error
          if (currentAssistantMessageIdRef.current) {
            updateMessage(currentAssistantMessageIdRef.current, {
              content: `Error: ${errorMessage}`,
            });
          }

          abortRef.current = null;
        },
      };

      // Send request
      abortRef.current = sendAIRequest(
        {
          messages: apiMessages,
          canvasWidth,
          canvasHeight,
          currentColors: {
            primary: primaryColor,
            secondary: secondaryColor,
          },
        },
        callbacks,
      );
    },
    [
      isStreaming,
      isExecuting,
      canvasWidth,
      canvasHeight,
      primaryColor,
      secondaryColor,
      addMessage,
      updateMessage,
      setStreaming,
      appendStreamContent,
      clearStreamContent,
      addPendingCommands,
      setExecutionProgress,
      setError,
      executePendingCommands,
    ],
  );

  /**
   * Cancel current request or command execution
   */
  const cancel = useCallback(() => {
    // Cancel SSE request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setStreaming(false);
      clearStreamContent();
    }

    // Cancel command execution
    if (isExecuting) {
      cancelExecution();
      setExecuting(false);
      clearPendingCommands();
      setExecutionProgress(null);
    }

    // Update assistant message if it was streaming
    if (currentAssistantMessageIdRef.current) {
      const currentContent = useAIStore.getState().currentStreamContent;
      if (currentContent) {
        updateMessage(currentAssistantMessageIdRef.current, {
          content: currentContent + " [Cancelled]",
        });
      }
    }
  }, [
    isExecuting,
    cancelExecution,
    setStreaming,
    setExecuting,
    clearStreamContent,
    clearPendingCommands,
    setExecutionProgress,
    updateMessage,
  ]);

  /**
   * Reset entire chat state
   */
  const resetChat = useCallback(() => {
    cancel();
    resetState();
    accumulatedCommandsRef.current = [];
    currentAssistantMessageIdRef.current = null;
  }, [cancel, resetState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isStreaming,
    isExecuting,
    streamContent,
    error,
    pendingCommands,
    sendMessage,
    cancel,
    clearMessages,
    resetChat,
  };
}
