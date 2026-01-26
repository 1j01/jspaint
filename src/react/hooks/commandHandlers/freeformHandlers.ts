/**
 * Freeform Drawing Handlers
 * Handles pencil, brush, airbrush, and eraser commands
 */

import type { DrawingCommand } from "../../types/ai";
import type { CommandHandler, CommandContext } from "./types";
import { parsePath, successResult } from "./types";
import { bresenhamLine, getBrushPoints, sprayAirbrush } from "../../utils/drawingUtils";

/**
 * Handle pencil drawing command
 * Draws a 1-pixel wide freeform line
 */
export const handlePencil: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore } = context;
  const settings = settingsStore.getState();

  if (command.tool !== "pencil") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { path, color } = command.params;
  const points = parsePath(path);
  const drawColor = color || settings.primaryColor;

  ctx.save();
  ctx.fillStyle = drawColor;

  for (let i = 0; i < points.length - 1; i++) {
    bresenhamLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, (x, y) => ctx.fillRect(x, y, 1, 1));
  }
  ctx.restore();

  return successResult(command, startTime);
};

/**
 * Handle brush drawing command
 * Draws with a configurable brush size and shape
 */
export const handleBrush: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore } = context;
  const settings = settingsStore.getState();

  if (command.tool !== "brush") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { path, color, size, shape } = command.params;
  const points = parsePath(path);
  const drawColor = color || settings.primaryColor;
  const brushSize = size || settings.brushSize;

  ctx.save();
  ctx.fillStyle = drawColor;

  const brushPoints = getBrushPoints(brushSize, shape === "square" ? "square" : "circle");

  for (const point of points) {
    for (const bp of brushPoints) {
      ctx.fillRect(point.x + bp.x, point.y + bp.y, 1, 1);
    }
  }
  ctx.restore();

  return successResult(command, startTime);
};

/**
 * Handle airbrush drawing command
 * Sprays paint with a random pattern
 */
export const handleAirbrush: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore } = context;
  const settings = settingsStore.getState();

  if (command.tool !== "airbrush") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { path, x, y, color, size } = command.params;
  const drawColor = color || settings.primaryColor;
  const spraySize = size || settings.airbrushSize;

  ctx.save();

  if (path) {
    const points = parsePath(path);
    for (const point of points) {
      sprayAirbrush(ctx, point.x, point.y, drawColor, spraySize);
    }
  } else if (x !== undefined && y !== undefined) {
    sprayAirbrush(ctx, x, y, drawColor, spraySize);
  }
  ctx.restore();

  return successResult(command, startTime);
};

/**
 * Handle eraser drawing command
 * Erases by drawing with the secondary color
 */
export const handleEraser: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore } = context;
  const settings = settingsStore.getState();

  if (command.tool !== "eraser") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { path, size, eraseToColor } = command.params;
  const points = parsePath(path);
  const eraserSize = size || settings.eraserSize;
  const fillColor = eraseToColor || settings.secondaryColor;

  ctx.save();
  ctx.fillStyle = fillColor;

  for (const point of points) {
    const halfSize = Math.floor(eraserSize / 2);
    ctx.fillRect(point.x - halfSize, point.y - halfSize, eraserSize, eraserSize);
  }
  ctx.restore();

  return successResult(command, startTime);
};

/** Map of freeform command handlers */
export const freeformHandlers: Record<string, CommandHandler> = {
  pencil: handlePencil,
  brush: handleBrush,
  airbrush: handleAirbrush,
  eraser: handleEraser,
};
