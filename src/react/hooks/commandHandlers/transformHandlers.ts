/**
 * Transform Handlers
 * Handles flip, rotate, stretch, skew, and invert_colors commands
 */

import type { DrawingCommand } from "../../types/ai";
import type { CommandHandler, CommandContext } from "./types";
import { hexToRgba, successResult } from "./types";
import { flipHorizontal, flipVertical, rotate, rotateArbitrary, stretch, skew, invertColors } from "../../utils/imageTransforms";

/**
 * Handle flip command
 * Flips the canvas or selection horizontally or vertically
 */
export const handleFlip: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, canvas, toolStore } = context;
	const tool = toolStore.getState();

	if (command.tool !== "flip") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { direction, target } = command.params;
	const selection = tool.selection;

	if (target === "selection" && selection) {
		const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
		const flipped = direction === "horizontal" ? flipHorizontal(imageData) : flipVertical(imageData);
		ctx.putImageData(flipped, selection.x, selection.y);
	} else {
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const flipped = direction === "horizontal" ? flipHorizontal(imageData) : flipVertical(imageData);
		ctx.putImageData(flipped, 0, 0);
	}

	return successResult(command, startTime);
};

/**
 * Handle rotate command
 * Rotates the canvas or selection by specified angle
 */
export const handleRotate: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, canvas, settingsStore, toolStore } = context;
	const tool = toolStore.getState();
	const settings = settingsStore.getState();

	if (command.tool !== "rotate") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { angle, target } = command.params;
	const selection = tool.selection;
	const bgColor = hexToRgba(settings.secondaryColor);

	if (target === "selection" && selection) {
		const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
		const rotated = angle % 90 === 0 ? rotate(imageData, angle) : rotateArbitrary(imageData, angle, bgColor);

		// Clear selection area
		ctx.fillStyle = settings.secondaryColor;
		ctx.fillRect(selection.x, selection.y, selection.width, selection.height);

		// Place rotated image
		ctx.putImageData(rotated, selection.x, selection.y);
	} else {
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const rotated = angle % 90 === 0 ? rotate(imageData, angle) : rotateArbitrary(imageData, angle, bgColor);

		if (rotated.width !== canvas.width || rotated.height !== canvas.height) {
			canvas.width = rotated.width;
			canvas.height = rotated.height;
		}
		ctx.putImageData(rotated, 0, 0);
	}

	return successResult(command, startTime);
};

/**
 * Handle stretch command
 * Stretches the canvas or selection by percentage
 */
export const handleStretch: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, canvas, settingsStore, toolStore } = context;
	const tool = toolStore.getState();
	const settings = settingsStore.getState();

	if (command.tool !== "stretch") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { horizontalPercent = 100, verticalPercent = 100, target } = command.params;
	const selection = tool.selection;
	const scaleX = horizontalPercent / 100;
	const scaleY = verticalPercent / 100;

	if (target === "selection" && selection) {
		const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
		const stretched = stretch(imageData, scaleX, scaleY);
		ctx.fillStyle = settings.secondaryColor;
		ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
		ctx.putImageData(stretched, selection.x, selection.y);
	} else {
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const stretched = stretch(imageData, scaleX, scaleY);
		canvas.width = stretched.width;
		canvas.height = stretched.height;
		ctx.putImageData(stretched, 0, 0);
	}

	return successResult(command, startTime);
};

/**
 * Handle skew command
 * Skews the canvas or selection by degrees
 */
export const handleSkew: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, canvas, settingsStore, toolStore } = context;
	const tool = toolStore.getState();
	const settings = settingsStore.getState();

	if (command.tool !== "skew") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { horizontalDegrees = 0, verticalDegrees = 0, target } = command.params;
	const selection = tool.selection;
	const bgColor = hexToRgba(settings.secondaryColor);

	if (target === "selection" && selection) {
		const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
		const skewed = skew(imageData, horizontalDegrees, verticalDegrees, bgColor);
		ctx.fillStyle = settings.secondaryColor;
		ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
		ctx.putImageData(skewed, selection.x, selection.y);
	} else {
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const skewed = skew(imageData, horizontalDegrees, verticalDegrees, bgColor);
		canvas.width = skewed.width;
		canvas.height = skewed.height;
		ctx.putImageData(skewed, 0, 0);
	}

	return successResult(command, startTime);
};

/**
 * Handle invert colors command
 * Inverts the colors of the canvas or selection
 */
export const handleInvertColors: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, canvas, toolStore } = context;
	const tool = toolStore.getState();

	if (command.tool !== "invert_colors") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { target } = command.params;
	const selection = tool.selection;

	if (target === "selection" && selection) {
		const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
		const inverted = invertColors(imageData);
		ctx.putImageData(inverted, selection.x, selection.y);
	} else {
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const inverted = invertColors(imageData);
		ctx.putImageData(inverted, 0, 0);
	}

	return successResult(command, startTime);
};

/** Map of transform command handlers */
export const transformHandlers: Record<string, CommandHandler> = {
	flip: handleFlip,
	rotate: handleRotate,
	stretch: handleStretch,
	skew: handleSkew,
	invert_colors: handleInvertColors,
};
