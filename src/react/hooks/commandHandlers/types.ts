/**
 * Command Handler Types
 * Defines the context and handler function signature for modular command execution
 */

import type { DrawingCommand, CommandExecutionResult, Point } from "../../types/ai";
import type { useSettingsStore } from "../../context/state/settingsStore";
import type { useToolStore } from "../../context/state/toolStore";
import type { useHistoryStore } from "../../context/state/historyStore";
import type { useUIStore } from "../../context/state/uiStore";

/**
 * Context provided to command handlers
 * Contains all dependencies needed to execute drawing commands
 */
export interface CommandContext {
  /** Canvas 2D rendering context */
  ctx: CanvasRenderingContext2D;
  /** Canvas element */
  canvas: HTMLCanvasElement;
  /** Settings store accessor */
  settingsStore: typeof useSettingsStore;
  /** Tool store accessor */
  toolStore: typeof useToolStore;
  /** History store accessor */
  historyStore: typeof useHistoryStore;
  /** UI store accessor */
  uiStore: typeof useUIStore;
}

/**
 * Handler function signature for executing a command
 * @param command - The drawing command to execute
 * @param context - The command execution context
 * @returns Execution result
 */
export type CommandHandler<T extends DrawingCommand = DrawingCommand> = (
  command: T,
  context: CommandContext,
) => CommandExecutionResult;

/**
 * Parse a path string "x1,y1;x2,y2;x3,y3" into Point array
 * @param path - Path string in compact format
 * @returns Array of points
 */
export function parsePath(path: string): Point[] {
  if (!path || path.trim() === "") return [];
  return path.split(";").map((segment) => {
    const [x, y] = segment.split(",").map(Number);
    return { x: x || 0, y: y || 0 };
  });
}

/**
 * Parse hex color to RGBA array
 * @param hex - Hex color string
 * @returns RGBA values
 */
export function hexToRgba(hex: string): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255];
  }
  return [0, 0, 0, 255];
}

/**
 * Convert fill mode to settings store format
 * @param fillMode - AI command fill mode
 * @returns Settings store fill style
 */
export function convertFillMode(fillMode?: string): "outline" | "fill" | "both" {
  switch (fillMode) {
    case "filled":
      return "fill";
    case "filled_with_outline":
      return "both";
    case "outline":
    default:
      return "outline";
  }
}

/**
 * Create a successful execution result
 * @param command - The executed command
 * @param startTime - Execution start timestamp
 * @returns Success result
 */
export function successResult(command: DrawingCommand, startTime: number): CommandExecutionResult {
  return {
    command,
    status: "completed",
    duration: Date.now() - startTime,
  };
}

/**
 * Create a failed execution result
 * @param command - The failed command
 * @param error - Error message
 * @param startTime - Execution start timestamp
 * @returns Failure result
 */
export function failedResult(command: DrawingCommand, error: string, startTime: number): CommandExecutionResult {
  return {
    command,
    status: "failed",
    error,
    duration: Date.now() - startTime,
  };
}
