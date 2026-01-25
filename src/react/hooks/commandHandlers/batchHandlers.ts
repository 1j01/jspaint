/**
 * Batch Handlers
 * Handles batch_shapes, batch_points, draw_grid, and draw_path commands
 */

import type { DrawingCommand } from "../../types/ai";
import type { CommandHandler, CommandContext } from "./types";
import { parsePath, convertFillMode, successResult } from "./types";
import { drawRectangle, drawEllipse } from "../../utils/drawingUtils";

/**
 * Handle batch shapes command
 * Draws multiple shapes of the same type efficiently
 */
export const handleBatchShapes: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, settingsStore } = context;
	const settings = settingsStore.getState();

	if (command.tool !== "batch_shapes") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { shapeType, shapes, color, fillColor, fillMode } = command.params;
	const strokeColor = color || settings.primaryColor;
	const fill = fillColor || settings.secondaryColor;
	const style = convertFillMode(fillMode);
	const lw = settings.lineWidth;

	const actualStroke = style === "fill" ? null : strokeColor;
	const actualFill = style === "outline" ? null : fill;

	for (const shape of shapes) {
		const { startX, startY, endX, endY } = shape;
		const x = Math.min(startX, endX);
		const y = Math.min(startY, endY);
		const width = Math.abs(endX - startX);
		const height = Math.abs(endY - startY);

		switch (shapeType) {
			case "rectangle":
				drawRectangle(ctx, x, y, width, height, actualStroke, actualFill, lw);
				break;
			case "ellipse":
				drawEllipse(ctx, x, y, width, height, actualStroke, actualFill, lw);
				break;
			case "line":
				ctx.save();
				ctx.strokeStyle = strokeColor;
				ctx.lineWidth = lw;
				ctx.beginPath();
				ctx.moveTo(startX, startY);
				ctx.lineTo(endX, endY);
				ctx.stroke();
				ctx.restore();
				break;
		}
	}

	return successResult(command, startTime);
};

/**
 * Handle batch points command
 * Draws multiple individual pixels
 */
export const handleBatchPoints: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, settingsStore } = context;
	const settings = settingsStore.getState();

	if (command.tool !== "batch_points") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { points, color } = command.params;
	const drawColor = color || settings.primaryColor;
	const pointArray = parsePath(points);

	ctx.save();
	ctx.fillStyle = drawColor;
	for (const p of pointArray) {
		ctx.fillRect(p.x, p.y, 1, 1);
	}
	ctx.restore();

	return successResult(command, startTime);
};

/**
 * Handle draw grid command
 * Draws a grid of horizontal and vertical lines
 */
export const handleDrawGrid: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, settingsStore } = context;
	const settings = settingsStore.getState();

	if (command.tool !== "draw_grid") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { startX, startY, cols, rows, cellWidth, cellHeight, color, lineWidth } = command.params;
	const strokeColor = color || settings.primaryColor;
	const lw = lineWidth || 1;

	ctx.save();
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = lw;

	// Draw vertical lines
	for (let i = 0; i <= cols; i++) {
		const x = startX + i * cellWidth;
		ctx.beginPath();
		ctx.moveTo(x, startY);
		ctx.lineTo(x, startY + rows * cellHeight);
		ctx.stroke();
	}

	// Draw horizontal lines
	for (let i = 0; i <= rows; i++) {
		const y = startY + i * cellHeight;
		ctx.beginPath();
		ctx.moveTo(startX, y);
		ctx.lineTo(startX + cols * cellWidth, y);
		ctx.stroke();
	}

	ctx.restore();

	return successResult(command, startTime);
};

/**
 * Handle draw path command
 * Draws an SVG path on the canvas
 */
export const handleDrawPath: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
	const startTime = Date.now();
	const { ctx, settingsStore } = context;
	const settings = settingsStore.getState();

	if (command.tool !== "draw_path") {
		return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
	}

	const { d, color, fillColor, lineWidth } = command.params;
	const strokeColor = color || settings.primaryColor;
	const lw = lineWidth || settings.lineWidth;

	ctx.save();
	const path = new Path2D(d);

	if (fillColor) {
		ctx.fillStyle = fillColor;
		ctx.fill(path);
	}

	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = lw;
	ctx.stroke(path);
	ctx.restore();

	return successResult(command, startTime);
};

/** Map of batch command handlers */
export const batchHandlers: Record<string, CommandHandler> = {
	batch_shapes: handleBatchShapes,
	batch_points: handleBatchPoints,
	draw_grid: handleDrawGrid,
	draw_path: handleDrawPath,
};
