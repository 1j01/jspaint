/**
 * Color Handlers
 * Handles fill, pick_color, set_color, swap_colors, and sample_color commands
 */

import type { DrawingCommand } from "../../types/ai";
import type { CommandHandler, CommandContext } from "./types";
import { successResult } from "./types";
import { floodFill } from "../../utils/drawingUtils";

/**
 * Handle flood fill command
 * Fills a contiguous area with a color
 */
export const handleFill: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, settingsStore } = context;
	const settings = settingsStore.getState();

	if (command.tool !== "fill") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { x, y, color } = command.params;
	const fillColor = color || settings.primaryColor;

	floodFill(ctx, x, y, fillColor);

	return successResult(command, startTime);
};

/**
 * Handle pick color (eyedropper) command
 * Samples a color from the canvas and sets it as primary or secondary
 */
export const handlePickColor: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, settingsStore } = context;

	if (command.tool !== "pick_color") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { x, y, target } = command.params;
	const imageData = ctx.getImageData(x, y, 1, 1);
	const r = imageData.data[0];
	const g = imageData.data[1];
	const b = imageData.data[2];
	const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

	if (target === "secondary") {
		settingsStore.getState().setSecondaryColor(hex);
	} else {
		settingsStore.getState().setPrimaryColor(hex);
	}

	return successResult(command, startTime);
};

/**
 * Handle set color command
 * Sets the primary or secondary color
 */
export const handleSetColor: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { settingsStore } = context;

	if (command.tool !== "set_color") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { target, color } = command.params;
	if (target === "secondary") {
		settingsStore.getState().setSecondaryColor(color);
	} else {
		settingsStore.getState().setPrimaryColor(color);
	}

	return successResult(command, startTime);
};

/**
 * Handle swap colors command
 * Swaps the primary and secondary colors
 */
export const handleSwapColors: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { settingsStore } = context;

	if (command.tool !== "swap_colors") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	settingsStore.getState().swapColors();

	return successResult(command, startTime);
};

/**
 * Handle sample color command
 * Samples a color from the canvas and optionally sets it as primary/secondary
 */
export const handleSampleColor: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, settingsStore } = context;

	if (command.tool !== "sample_color") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { x, y, setAsPrimary, setAsSecondary } = command.params;
	const imageData = ctx.getImageData(x, y, 1, 1);
	const r = imageData.data[0];
	const g = imageData.data[1];
	const b = imageData.data[2];
	const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

	if (setAsPrimary) {
		settingsStore.getState().setPrimaryColor(hex);
	}
	if (setAsSecondary) {
		settingsStore.getState().setSecondaryColor(hex);
	}

	return successResult(command, startTime);
};

/** Map of color command handlers */
export const colorHandlers: Record<string, CommandHandler> = {
	fill: handleFill,
	pick_color: handlePickColor,
	set_color: handleSetColor,
	swap_colors: handleSwapColors,
	sample_color: handleSampleColor,
};
