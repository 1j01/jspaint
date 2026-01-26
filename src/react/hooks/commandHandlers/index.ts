/**
 * Command Registry
 * Combines all command handlers into a single registry
 */

import type { CommandHandler } from "./types";
export * from "./types";

// Import all handler modules
import { freeformHandlers } from "./freeformHandlers";
import { shapeHandlers } from "./shapeHandlers";
import { colorHandlers } from "./colorHandlers";
import { textHandlers } from "./textHandler";
import { viewHandlers } from "./viewHandler";
import { selectionHandlers } from "./selectionHandlers";
import { transformHandlers } from "./transformHandlers";
import { canvasHandlers } from "./canvasHandlers";
import { editHandlers } from "./editHandlers";
import { batchHandlers } from "./batchHandlers";

/**
 * Combined command registry
 * Maps all command tool names to their handlers
 */
export const commandRegistry: Record<string, CommandHandler> = {
  ...freeformHandlers,
  ...shapeHandlers,
  ...colorHandlers,
  ...textHandlers,
  ...viewHandlers,
  ...selectionHandlers,
  ...transformHandlers,
  ...canvasHandlers,
  ...editHandlers,
  ...batchHandlers,
};

/**
 * Get handler for a specific command tool
 * @param tool - The tool name from the command
 * @returns The handler function or undefined if not found
 */
export function getCommandHandler(tool: string): CommandHandler | undefined {
  return commandRegistry[tool];
}

/**
 * Check if a handler exists for a command tool
 * @param tool - The tool name from the command
 * @returns True if a handler exists for the tool
 */
export function hasCommandHandler(tool: string): boolean {
  return tool in commandRegistry;
}

// Re-export individual handler modules for direct access if needed
export { freeformHandlers } from "./freeformHandlers";
export { shapeHandlers } from "./shapeHandlers";
export { colorHandlers } from "./colorHandlers";
export { textHandlers } from "./textHandler";
export { viewHandlers } from "./viewHandler";
export { selectionHandlers } from "./selectionHandlers";
export { transformHandlers } from "./transformHandlers";
export { canvasHandlers } from "./canvasHandlers";
export { editHandlers } from "./editHandlers";
export { batchHandlers } from "./batchHandlers";
