/**
 * Command Executor Hook
 * Executes AI drawing commands on the canvas
 * Uses a modular command registry for clean command handling
 */

import { useCallback, useRef } from "react";
import type { RefObject } from "react";
import type { DrawingCommand, CommandExecutionResult, ExecutionProgress } from "../types/ai";
import { useSettingsStore } from "../context/state/settingsStore";
import { useToolStore } from "../context/state/toolStore";
import { useHistoryStore } from "../context/state/historyStore";
import { useUIStore } from "../context/state/uiStore";
import { commandRegistry, type CommandContext } from "./commandHandlers";

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
  /** Delay between commands in ms (for visual feedback) */
  animationDelay?: number;
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

/**
 * Hook for executing AI drawing commands on the canvas
 * @param {CommandExecutorOptions} options - Executor options
 * @returns {{ executeCommands: Function, executeCommand: Function, cancelExecution: Function, isExecuting: boolean }}
 */
export function useCommandExecutor(options: CommandExecutorOptions) {
  const { canvasRef, onProgress, onComplete, onError, animationDelay = 50 } = options;

  const isExecutingRef = useRef(false);
  const cancelledRef = useRef(false);

  // Store accessors
  const settingsStore = useSettingsStore;
  const toolStore = useToolStore;
  const historyStore = useHistoryStore;
  const uiStore = useUIStore;

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
        return handler(command, context);
      } catch (err) {
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
   * Execute an array of commands sequentially
   * @param {DrawingCommand[]} commands - Commands to execute
   * @returns {Promise<CommandExecutionResult[]>} Array of execution results
   */
  const executeCommands = useCallback(
    async (commands: DrawingCommand[]): Promise<CommandExecutionResult[]> => {
      if (isExecutingRef.current) {
        onError?.("Execution already in progress");
        return [];
      }

      isExecutingRef.current = true;
      cancelledRef.current = false;

      const results: CommandExecutionResult[] = [];
      const total = commands.length;

      // Save canvas state before batch execution
      const ctx = getContext();
      if (ctx) {
        const canvas = ctx.canvas;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyStore.getState().pushState(imageData, "AI Commands");
      }

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

        const result = await executeCommand(commands[i]);
        results.push(result);

        // Add delay for visual feedback
        if (animationDelay > 0 && i < commands.length - 1 && !cancelledRef.current) {
          await new Promise((resolve) => setTimeout(resolve, animationDelay));
        }
      }

      isExecutingRef.current = false;
      onComplete?.();

      return results;
    },
    [executeCommand, getContext, historyStore, onProgress, onComplete, onError, animationDelay],
  );

  /**
   * Cancel the current execution
   */
  const cancelExecution = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  return {
    executeCommands,
    executeCommand,
    cancelExecution,
    isExecuting: isExecutingRef.current,
  };
}
