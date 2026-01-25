/**
 * Canvas Handlers
 * Handles clear, resize_canvas, and new_image commands
 */

import type { DrawingCommand } from "../../types/ai";
import type { CommandHandler, CommandContext } from "./types";
import { successResult } from "./types";
import { stretch } from "../../utils/imageTransforms";

/**
 * Handle clear command
 * Clears the canvas or selection with a color
 */
export const handleClear: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, canvas, settingsStore, toolStore } = context;
	const tool = toolStore.getState();
	const settings = settingsStore.getState();

	if (command.tool !== "clear") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { color, target } = command.params;
	const clearColor = color || settings.secondaryColor;
	const selection = tool.selection;

	if (target === "selection" && selection) {
		ctx.fillStyle = clearColor;
		ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
	} else {
		ctx.fillStyle = clearColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	return successResult(command, startTime);
};

/**
 * Handle resize canvas command
 * Resizes the canvas with optional anchor and resampling
 */
export const handleResizeCanvas: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, canvas, settingsStore } = context;
	const settings = settingsStore.getState();

	if (command.tool !== "resize_canvas") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { width, height, anchor = "top-left", resample } = command.params;
	const oldImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	if (resample) {
		// Scale content to fit new size
		const stretched = stretch(oldImageData, width / canvas.width, height / canvas.height);
		canvas.width = width;
		canvas.height = height;
		ctx.putImageData(stretched, 0, 0);
	} else {
		// Position based on anchor
		let offsetX = 0;
		let offsetY = 0;

		if (anchor.includes("right")) {
			offsetX = width - canvas.width;
		} else if (anchor.includes("center") || anchor === "top" || anchor === "bottom") {
			offsetX = Math.floor((width - canvas.width) / 2);
		}

		if (anchor.includes("bottom")) {
			offsetY = height - canvas.height;
		} else if (anchor.includes("center") || anchor === "left" || anchor === "right") {
			offsetY = Math.floor((height - canvas.height) / 2);
		}

		canvas.width = width;
		canvas.height = height;
		ctx.fillStyle = settings.secondaryColor;
		ctx.fillRect(0, 0, width, height);
		ctx.putImageData(oldImageData, offsetX, offsetY);
	}

	return successResult(command, startTime);
};

/**
 * Handle new image command
 * Creates a new blank canvas
 */
export const handleNewImage: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, canvas, settingsStore } = context;
	const settings = settingsStore.getState();

	if (command.tool !== "new_image") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { width = 800, height = 600, backgroundColor, transparent } = command.params;
	canvas.width = width;
	canvas.height = height;

	if (!transparent) {
		ctx.fillStyle = backgroundColor || settings.secondaryColor;
		ctx.fillRect(0, 0, width, height);
	}

	return successResult(command, startTime);
};

/** Map of canvas command handlers */
export const canvasHandlers: Record<string, CommandHandler> = {
	clear: handleClear,
	resize_canvas: handleResizeCanvas,
	new_image: handleNewImage,
};
