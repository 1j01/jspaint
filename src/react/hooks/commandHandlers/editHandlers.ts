/**
 * Edit Handlers
 * Handles undo and redo commands
 */

import type { DrawingCommand } from "../../types/ai";
import type { CommandHandler, CommandContext } from "./types";
import { successResult } from "./types";

/**
 * Handle undo command
 * Undoes the specified number of steps
 */
export const handleUndo: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, historyStore } = context;

	if (command.tool !== "undo") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { steps = 1 } = command.params;
	for (let i = 0; i < steps; i++) {
		const node = historyStore.getState().undo();
		if (node && node.imageData) {
			ctx.putImageData(node.imageData, 0, 0);
		}
	}

	return successResult(command, startTime);
};

/**
 * Handle redo command
 * Redoes the specified number of steps
 */
export const handleRedo: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, historyStore } = context;

	if (command.tool !== "redo") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { steps = 1 } = command.params;
	for (let i = 0; i < steps; i++) {
		const node = historyStore.getState().redo();
		if (node && node.imageData) {
			ctx.putImageData(node.imageData, 0, 0);
		}
	}

	return successResult(command, startTime);
};

/** Map of edit command handlers */
export const editHandlers: Record<string, CommandHandler> = {
	undo: handleUndo,
	redo: handleRedo,
};
