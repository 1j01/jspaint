/**
 * AI State Store - Chat and command execution state for AI integration
 * Manages streaming responses, pending commands, and execution progress
 */

import { create } from "zustand";
import type { ChatMessage, DrawingCommand, ExecutionProgress } from "../../types/ai";
import type { ToolId } from "./types";

/**
 * Virtual cursor position for animated AI drawing
 */
export interface VirtualCursorState {
  /** Whether the cursor is visible */
  visible: boolean;
  /** X coordinate in canvas pixels */
  x: number;
  /** Y coordinate in canvas pixels */
  y: number;
  /** Current tool icon to display */
  toolIcon: string;
}

/**
 * AI state interface
 * Manages chat messages, streaming state, and command execution
 */
export interface AIState {
  /**
   * Whether the AI chat panel is visible
   */
  showAIPanel: boolean;

  /**
   * Chat message history
   */
  messages: ChatMessage[];

  /**
   * Whether currently receiving streamed tokens from API
   */
  isStreaming: boolean;

  /**
   * Whether currently executing drawing commands
   */
  isExecuting: boolean;

  /**
   * Accumulated stream content during response streaming
   */
  currentStreamContent: string;

  /**
   * Commands waiting to be executed
   */
  pendingCommands: DrawingCommand[];

  /**
   * Current command execution progress
   */
  executionProgress: ExecutionProgress | null;

  /**
   * Error message if any operation failed
   */
  error: string | null;

  /**
   * Virtual cursor state for animated AI drawing
   */
  virtualCursor: VirtualCursorState;

  /**
   * Currently active AI tool (for UI highlighting)
   */
  activeAITool: ToolId | null;

  /**
   * Toggle AI panel visibility
   */
  toggleAIPanel: () => void;

  /**
   * Set AI panel visibility explicitly
   * @param {boolean} visible - Whether to show the panel
   */
  setAIPanelVisible: (visible: boolean) => void;

  /**
   * Add a message to the chat history
   * @param {ChatMessage} message - Message to add
   */
  addMessage: (message: ChatMessage) => void;

  /**
   * Update a message in the chat history (e.g., when streaming completes)
   * @param {string} id - Message ID to update
   * @param {Partial<ChatMessage>} updates - Fields to update
   */
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;

  /**
   * Set streaming state
   * @param {boolean} streaming - Whether currently streaming
   */
  setStreaming: (streaming: boolean) => void;

  /**
   * Set executing state
   * @param {boolean} executing - Whether currently executing commands
   */
  setExecuting: (executing: boolean) => void;

  /**
   * Append content to the current stream
   * @param {string} content - Content to append
   */
  appendStreamContent: (content: string) => void;

  /**
   * Clear the accumulated stream content
   */
  clearStreamContent: () => void;

  /**
   * Set pending commands to execute
   * @param {DrawingCommand[]} commands - Commands to execute
   */
  setPendingCommands: (commands: DrawingCommand[]) => void;

  /**
   * Add commands to pending queue
   * @param {DrawingCommand[]} commands - Commands to add
   */
  addPendingCommands: (commands: DrawingCommand[]) => void;

  /**
   * Clear all pending commands
   */
  clearPendingCommands: () => void;

  /**
   * Remove the first command from pending (after execution)
   */
  shiftPendingCommand: () => DrawingCommand | undefined;

  /**
   * Set execution progress
   * @param {ExecutionProgress | null} progress - Progress state or null to clear
   */
  setExecutionProgress: (progress: ExecutionProgress | null) => void;

  /**
   * Set error message
   * @param {string | null} error - Error message or null to clear
   */
  setError: (error: string | null) => void;

  /**
   * Clear all messages from chat history
   */
  clearMessages: () => void;

  /**
   * Reset all AI state (for "New Chat" functionality)
   */
  resetState: () => void;

  /**
   * Set virtual cursor position
   * @param {Partial<VirtualCursorState>} cursor - Cursor state updates
   */
  setVirtualCursor: (cursor: Partial<VirtualCursorState>) => void;

  /**
   * Show the virtual cursor at a position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} toolIcon - Tool icon name
   */
  showCursor: (x: number, y: number, toolIcon: string) => void;

  /**
   * Hide the virtual cursor
   */
  hideCursor: () => void;

  /**
   * Set the currently active AI tool for UI highlighting
   * @param {ToolId | null} toolId - Tool ID or null to clear
   */
  setActiveAITool: (toolId: ToolId | null) => void;
}

/**
 * Generate a unique message ID
 * @returns {string} Unique ID
 */
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * Create a user message
 * @param {string} content - Message content
 * @returns {ChatMessage} User message object
 */
export const createUserMessage = (content: string): ChatMessage => ({
  id: generateMessageId(),
  role: "user",
  content,
  timestamp: Date.now(),
});

/**
 * Create an assistant message
 * @param {string} content - Message content
 * @param {DrawingCommand[]} commands - Optional commands associated with message
 * @returns {ChatMessage} Assistant message object
 */
export const createAssistantMessage = (content: string, commands?: DrawingCommand[]): ChatMessage => ({
  id: generateMessageId(),
  role: "assistant",
  content,
  commands,
  timestamp: Date.now(),
});

/**
 * Initial virtual cursor state
 */
const initialCursorState: VirtualCursorState = {
  visible: false,
  x: 0,
  y: 0,
  toolIcon: "pencil",
};

/**
 * Initial state values
 */
const initialState = {
  showAIPanel: false,
  messages: [] as ChatMessage[],
  isStreaming: false,
  isExecuting: false,
  currentStreamContent: "",
  pendingCommands: [] as DrawingCommand[],
  executionProgress: null as ExecutionProgress | null,
  error: null as string | null,
  virtualCursor: initialCursorState,
  activeAITool: null as ToolId | null,
};

/**
 * Zustand store for AI state
 * Manages chat, streaming, and command execution
 * @returns {AIState} The AI state store
 */
export const useAIStore = create<AIState>((set, get) => ({
  ...initialState,

  toggleAIPanel: () => {
    set((state) => ({ showAIPanel: !state.showAIPanel }));
  },

  setAIPanelVisible: (visible) => {
    set({ showAIPanel: visible });
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
    }));
  },

  setStreaming: (streaming) => {
    set({ isStreaming: streaming });
  },

  setExecuting: (executing) => {
    set({ isExecuting: executing });
  },

  appendStreamContent: (content) => {
    set((state) => ({
      currentStreamContent: state.currentStreamContent + content,
    }));
  },

  clearStreamContent: () => {
    set({ currentStreamContent: "" });
  },

  setPendingCommands: (commands) => {
    set({ pendingCommands: commands });
  },

  addPendingCommands: (commands) => {
    set((state) => ({
      pendingCommands: [...state.pendingCommands, ...commands],
    }));
  },

  clearPendingCommands: () => {
    set({ pendingCommands: [] });
  },

  shiftPendingCommand: () => {
    const state = get();
    const [first, ...rest] = state.pendingCommands;
    set({ pendingCommands: rest });
    return first;
  },

  setExecutionProgress: (progress) => {
    set({ executionProgress: progress });
  },

  setError: (error) => {
    set({ error });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  resetState: () => {
    set({
      ...initialState,
      // Keep panel visible if it was open
      showAIPanel: get().showAIPanel,
    });
  },

  setVirtualCursor: (cursor) => {
    set((state) => ({
      virtualCursor: { ...state.virtualCursor, ...cursor },
    }));
  },

  showCursor: (x, y, toolIcon) => {
    set({
      virtualCursor: { visible: true, x, y, toolIcon },
    });
  },

  hideCursor: () => {
    set((state) => ({
      virtualCursor: { ...state.virtualCursor, visible: false },
    }));
  },

  setActiveAITool: (toolId) => {
    set({ activeAITool: toolId });
  },
}));
