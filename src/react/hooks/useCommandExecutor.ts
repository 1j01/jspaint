/**
 * Command Executor Hook
 * Executes AI drawing commands on the canvas
 * Uses a modular command registry for clean command handling
 * Supports animated visualization with virtual cursor and tool selection
 */

import { useCallback, useRef } from "react";
import type { RefObject } from "react";
import type { DrawingCommand, CommandExecutionResult, ExecutionProgress } from "../types/ai";
import { useSettingsStore } from "../context/state/settingsStore";
import { useToolStore } from "../context/state/toolStore";
import { useHistoryStore } from "../context/state/historyStore";
import { useUIStore } from "../context/state/uiStore";
import { useAIStore } from "../context/state/aiStore";
import { saveSetting } from "../context/state/persistence";
import { commandRegistry, type CommandContext } from "./commandHandlers";
import { TOOL_IDS, type ToolId } from "../context/state/types";

/**
 * Animation speed presets
 */
export type AnimationSpeed = "slow" | "normal" | "fast" | "instant";

/**
 * Options for the command executor hook
 */
export interface CommandExecutorOptions {
  /** Canvas element reference */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Called when execution progress updates */
  onProgress?: (progress: ExecutionProgress) => void;
  /** Called when all commands complete */
  onComplete?: () => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Delay between commands in ms (for visual feedback) - deprecated, use animationSpeed */
  animationDelay?: number;
  /** Animation speed preset */
  animationSpeed?: AnimationSpeed;
  /** Whether to animate cursor movement */
  animateCursor?: boolean;
  /** Whether to animate tool selection */
  animateToolSelection?: boolean;
  /** Callback when cursor should move */
  onCursorMove?: (x: number, y: number, toolIcon: string) => void;
}

/**
 * Map AI command tool names to TOOL_IDS for UI highlighting
 */
export const COMMAND_TO_TOOL: Record<string, ToolId> = {
  pencil: TOOL_IDS.PENCIL,
  brush: TOOL_IDS.BRUSH,
  airbrush: TOOL_IDS.AIRBRUSH,
  eraser: TOOL_IDS.ERASER,
  line: TOOL_IDS.LINE,
  rectangle: TOOL_IDS.RECTANGLE,
  ellipse: TOOL_IDS.ELLIPSE,
  polygon: TOOL_IDS.POLYGON,
  curve: TOOL_IDS.CURVE,
  rounded_rectangle: TOOL_IDS.ROUNDED_RECTANGLE,
  fill: TOOL_IDS.FILL,
  pick_color: TOOL_IDS.PICK_COLOR,
  text: TOOL_IDS.TEXT,
  select_rectangle: TOOL_IDS.SELECT,
  select_freeform: TOOL_IDS.FREE_FORM_SELECT,
};

/**
 * Get tool icon name for a command
 * @param {string} tool - Command tool name
 * @returns {string} Icon name for virtual cursor
 */
function getToolIcon(tool: string): string {
  const iconMap: Record<string, string> = {
    pencil: "pencil",
    brush: "brush",
    airbrush: "airbrush",
    eraser: "eraser",
    line: "line",
    rectangle: "rectangle",
    ellipse: "ellipse",
    polygon: "line",
    curve: "line",
    rounded_rectangle: "rectangle",
    fill: "fill",
    text: "text",
  };
  return iconMap[tool] || "default";
}

/**
 * Calculate adaptive animation delay based on command count
 * Keeps total animation time reasonable regardless of command count
 * @param {number} totalCommands - Total number of commands to execute
 * @returns {number} Delay in milliseconds per command
 */
export function calculateAnimationDelay(totalCommands: number): number {
  const TARGET_MIN_DURATION_MS = 3000; // Minimum 3 seconds for small drawings
  const TARGET_MAX_DURATION_MS = 8000; // Maximum 8 seconds for complex drawings
  const MIN_DELAY_MS = 10; // Never faster than 10ms per command
  const MAX_DELAY_MS = 200; // Never slower than 200ms per command

  if (totalCommands <= 1) return MAX_DELAY_MS;

  // Scale delay inversely with command count
  const targetDuration = Math.min(TARGET_MAX_DURATION_MS, TARGET_MIN_DURATION_MS + totalCommands * 30);
  const calculatedDelay = targetDuration / totalCommands;

  return Math.max(MIN_DELAY_MS, Math.min(MAX_DELAY_MS, calculatedDelay));
}

/**
 * Get animation delay based on speed preset
 * @param {AnimationSpeed} speed - Speed preset
 * @param {number} totalCommands - Total commands for adaptive calculation
 * @returns {number} Delay in milliseconds
 */
function getDelayFromSpeed(speed: AnimationSpeed, totalCommands: number): number {
  switch (speed) {
    case "instant":
      return 0;
    case "fast":
      return Math.max(10, calculateAnimationDelay(totalCommands) * 0.5);
    case "slow":
      return Math.min(300, calculateAnimationDelay(totalCommands) * 2);
    case "normal":
    default:
      return calculateAnimationDelay(totalCommands);
  }
}

/**
 * Extract cursor position from a command
 * Returns the start position for drawing commands
 * @param {DrawingCommand} command - The command to extract position from
 * @returns {{ x: number, y: number } | null} Position or null if not applicable
 */
function extractCursorPosition(command: DrawingCommand): { x: number; y: number } | null {
  // Use type assertion to access arbitrary properties
  const params = command.params as Record<string, unknown>;
  if (!params) return null;

  // Line commands
  if (typeof params.x1 === "number" && typeof params.y1 === "number") {
    return { x: params.x1, y: params.y1 };
  }
  if (typeof params.startX === "number" && typeof params.startY === "number") {
    return { x: params.startX, y: params.startY };
  }

  // Fill and point commands
  if (typeof params.x === "number" && typeof params.y === "number") {
    return { x: params.x, y: params.y };
  }

  // Path commands (pencil, brush, etc.)
  if (typeof params.path === "string") {
    const firstSegment = params.path.split(";")[0];
    if (firstSegment) {
      const [x, y] = firstSegment.split(",").map(Number);
      if (!isNaN(x) && !isNaN(y)) {
        return { x, y };
      }
    }
  }

  // Points array (polygon)
  if (Array.isArray(params.points) && params.points.length > 0) {
    const firstPoint = params.points[0] as { x?: number; y?: number };
    if (typeof firstPoint.x === "number" && typeof firstPoint.y === "number") {
      return { x: firstPoint.x, y: firstPoint.y };
    }
  }

  return null;
}

/** Commands that don't need canvas operations or require special handling */
const PASSTHROUGH_COMMANDS = new Set([
  "select_freeform",
  "resize_selection",
  "set_attributes",
  "get_attributes",
  "load_image",
  "export_image",
  "set_palette_color",
  "set_custom_color",
  "get_custom_colors",
  "define_color",
  "load_palette",
  "save_palette",
  "repeat",
  "pattern_repeat",
]);

/** Per-command timeout in milliseconds */
const COMMAND_TIMEOUT_MS = 5000;

/**
 * Wrap a promise with a timeout
 * @param {Promise<T>} promise - Promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} errorMessage - Error message on timeout
 * @returns {Promise<T>} Promise that rejects on timeout
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Hook for executing AI drawing commands on the canvas
 * @param {CommandExecutorOptions} options - Executor options
 * @returns {{ executeCommands: Function, executeCommand: Function, cancelExecution: Function, isExecuting: boolean }}
 */
export function useCommandExecutor(options: CommandExecutorOptions) {
  const {
    canvasRef,
    onProgress,
    onComplete,
    onError,
    animationDelay,
    animationSpeed = "normal",
    animateCursor = true,
    animateToolSelection = true,
    onCursorMove,
  } = options;

  const isExecutingRef = useRef(false);
  const cancelledRef = useRef(false);

  // Store accessors
  const settingsStore = useSettingsStore;
  const toolStore = useToolStore;
  const historyStore = useHistoryStore;
  const uiStore = useUIStore;
  const aiStore = useAIStore;

  /**
   * Get the canvas 2D context
   * @returns {CanvasRenderingContext2D | null} Canvas context
   */
  const getContext = useCallback((): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d", { willReadFrequently: true });
  }, [canvasRef]);

  /**
   * Execute a single drawing command
   * @param {DrawingCommand} command - Command to execute
   * @returns {CommandExecutionResult} Execution result
   */
  const executeCommand = useCallback(
    (command: DrawingCommand): CommandExecutionResult => {
      const startTime = Date.now();
      const ctx = getContext();

      if (!ctx) {
        console.error("[CommandExecutor] Canvas context not available");
        return {
          command,
          status: "failed",
          error: "Canvas context not available",
        };
      }

      const canvas = ctx.canvas;

      // Check for passthrough commands that don't need processing
      if (PASSTHROUGH_COMMANDS.has(command.tool)) {
        return {
          command,
          status: "completed",
          duration: Date.now() - startTime,
        };
      }

      // Look up handler in registry
      const handler = commandRegistry[command.tool];
      if (!handler) {
        console.error("[CommandExecutor] Unknown command:", command.tool);
        return {
          command,
          status: "failed",
          error: `Unknown command: ${command.tool}`,
          duration: Date.now() - startTime,
        };
      }

      // Create context for handler
      const context: CommandContext = {
        ctx,
        canvas,
        settingsStore,
        toolStore,
        historyStore,
        uiStore,
      };

      try {
        const result = handler(command, context);
        return result;
      } catch (err) {
        console.error("[CommandExecutor] Command error:", err);
        return {
          command,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
          duration: Date.now() - startTime,
        };
      }
    },
    [getContext, settingsStore, toolStore, historyStore, uiStore],
  );

  /**
   * Execute a single command with animation effects
   * @param {DrawingCommand} command - Command to execute
   * @param {number} delay - Delay for cursor animation
   * @returns {Promise<CommandExecutionResult>} Execution result
   */
  const executeCommandWithAnimation = useCallback(
    async (command: DrawingCommand, delay: number): Promise<CommandExecutionResult> => {
      const toolIcon = getToolIcon(command.tool);

      // Animate tool selection in UI
      if (animateToolSelection) {
        const mappedTool = COMMAND_TO_TOOL[command.tool];
        if (mappedTool) {
          aiStore.getState().setActiveAITool(mappedTool);
        }
      }

      // Animate cursor to command position
      if (animateCursor) {
        const position = extractCursorPosition(command);
        if (position) {
          aiStore.getState().showCursor(position.x, position.y, toolIcon);
          onCursorMove?.(position.x, position.y, toolIcon);

          // Brief delay for cursor to be visible before drawing
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 50)));
          }
        }
      }

      // Execute the command with timeout protection
      try {
        const executePromise = new Promise<CommandExecutionResult>((resolve) => {
          const result = executeCommand(command);
          resolve(result);
        });

        const result = await withTimeout(executePromise, COMMAND_TIMEOUT_MS, `Command timed out: ${command.tool}`);

        return result;
      } catch (err) {
        console.error("[CommandExecutor] Command execution error:", err);
        return {
          command,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    },
    [executeCommand, animateCursor, animateToolSelection, onCursorMove, aiStore],
  );

  /**
   * Execute an array of commands sequentially with animation
   * @param {DrawingCommand[]} commands - Commands to execute
   * @returns {Promise<CommandExecutionResult[]>} Array of execution results
   */
  const executeCommands = useCallback(
    async (commands: DrawingCommand[]): Promise<CommandExecutionResult[]> => {
      // If already executing, skip (commands will be picked up when done)
      if (isExecutingRef.current) {
        return [];
      }

      if (commands.length === 0) {
        return [];
      }

      isExecutingRef.current = true;
      cancelledRef.current = false;

      const results: CommandExecutionResult[] = [];
      const total = commands.length;

      // Calculate adaptive delay based on command count
      const delay = animationDelay !== undefined ? animationDelay : getDelayFromSpeed(animationSpeed, total);

      // Save canvas state before batch execution
      const ctx = getContext();
      if (ctx) {
        const canvas = ctx.canvas;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyStore.getState().pushState(imageData, "AI Commands");
      }

      // Show cursor at start
      if (animateCursor && commands.length > 0) {
        const firstPos = extractCursorPosition(commands[0]);
        if (firstPos) {
          aiStore.getState().showCursor(firstPos.x, firstPos.y, getToolIcon(commands[0].tool));
        }
      }

      let failedCount = 0;
      const maxConsecutiveFailures = 5;

      for (let i = 0; i < commands.length; i++) {
        if (cancelledRef.current) {
          // Mark remaining commands as cancelled
          for (let j = i; j < commands.length; j++) {
            results.push({
              command: commands[j],
              status: "cancelled",
            });
          }
          break;
        }

        onProgress?.({
          current: i + 1,
          total,
          currentCommand: commands[i],
        });

        const result = await executeCommandWithAnimation(commands[i], delay);
        results.push(result);

        // Track consecutive failures for early abort
        if (result.status === "failed") {
          failedCount++;
          console.warn(`[CommandExecutor] Command failed (${failedCount} consecutive):`, result.error);
          if (failedCount >= maxConsecutiveFailures) {
            console.error("[CommandExecutor] Too many consecutive failures, aborting");
            onError?.(`Execution stopped after ${maxConsecutiveFailures} consecutive failures`);
            break;
          }
        } else {
          failedCount = 0; // Reset on success
        }

        // Add delay for visual feedback between commands
        if (delay > 0 && i < commands.length - 1 && !cancelledRef.current) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // Hide cursor after execution
      if (animateCursor) {
        aiStore.getState().hideCursor();
      }

      // Clear active AI tool
      if (animateToolSelection) {
        aiStore.getState().setActiveAITool(null);
      }

      // Save canvas state AFTER all commands executed
      // This is critical for persistence - the pre-execution save (above) is for undo,
      // but we also need to save the final state to IndexedDB for page refresh persistence
      const ctxAfter = getContext();
      if (ctxAfter && !cancelledRef.current) {
        const canvasAfter = ctxAfter.canvas;
        const imageDataAfter = ctxAfter.getImageData(0, 0, canvasAfter.width, canvasAfter.height);

        // Push final state to history tree for proper undo/redo
        historyStore.getState().pushState(imageDataAfter, "AI Commands Complete");

        // Persist to IndexedDB for page refresh persistence
        const canvasData = {
          data: Array.from(imageDataAfter.data),
          width: imageDataAfter.width,
          height: imageDataAfter.height,
        };
        saveSetting("savedCanvas", canvasData);
      }

      isExecutingRef.current = false;
      onComplete?.();

      return results;
    },
    [
      executeCommandWithAnimation,
      getContext,
      historyStore,
      aiStore,
      onProgress,
      onComplete,
      onError,
      animationDelay,
      animationSpeed,
      animateCursor,
      animateToolSelection,
    ],
  );

  /**
   * Cancel the current execution
   */
  const cancelExecution = useCallback(() => {
    cancelledRef.current = true;
    // Hide cursor immediately on cancel
    aiStore.getState().hideCursor();
    aiStore.getState().setActiveAITool(null);
  }, [aiStore]);

  return {
    executeCommands,
    executeCommand,
    cancelExecution,
    isExecuting: isExecutingRef.current,
  };
}
