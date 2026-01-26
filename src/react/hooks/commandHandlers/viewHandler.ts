/**
 * View Handler
 * Handles magnifier and view-related commands
 */

import type { DrawingCommand } from "../../types/ai";
import type { CommandHandler, CommandContext } from "./types";
import { successResult } from "./types";

/**
 * Handle magnifier command
 * Changes the canvas zoom level
 */
export const handleMagnifier: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { uiStore } = context;

  if (command.tool !== "magnifier") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { zoom } = command.params;
  const validZoom = [1, 2, 4, 6, 8].includes(zoom) ? zoom : 1;
  uiStore.getState().setMagnification(validZoom as 1 | 2 | 4 | 6 | 8);

  return successResult(command, startTime);
};

/** Map of view command handlers */
export const viewHandlers: Record<string, CommandHandler> = {
  magnifier: handleMagnifier,
};
