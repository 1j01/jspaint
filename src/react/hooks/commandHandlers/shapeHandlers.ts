/**
 * Shape Handlers
 * Handles line, rectangle, ellipse, polygon, curve, and rounded_rectangle commands
 */

import type { DrawingCommand } from "../../types/ai";
import type { CommandHandler, CommandContext } from "./types";
import { convertFillMode, successResult } from "./types";
import { drawRectangle, drawEllipse, drawPolygon, drawRoundedRectangle } from "../../utils/drawingUtils";

/**
 * Handle line drawing command
 * Draws a straight line between two points
 */
export const handleLine: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore } = context;
  const settings = settingsStore.getState();

  if (command.tool !== "line") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { startX, startY, endX, endY, color, width } = command.params;
  const drawColor = color || settings.primaryColor;
  const lineWidth = width || settings.lineWidth;

  ctx.save();
  ctx.strokeStyle = drawColor;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();

  return successResult(command, startTime);
};

/**
 * Handle rectangle drawing command
 */
export const handleRectangle: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore } = context;
  const settings = settingsStore.getState();

  if (command.tool !== "rectangle") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { startX, startY, endX, endY, color, fillColor, fillMode, lineWidth } = command.params;
  const strokeColor = color || settings.primaryColor;
  const fill = fillColor || settings.secondaryColor;
  const style = convertFillMode(fillMode);
  const lw = lineWidth || settings.lineWidth;

  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  const actualStroke = style === "fill" ? null : strokeColor;
  const actualFill = style === "outline" ? null : fill;

  drawRectangle(ctx, x, y, width, height, actualStroke, actualFill, lw);

  return successResult(command, startTime);
};

/**
 * Handle rounded rectangle drawing command
 */
export const handleRoundedRectangle: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore } = context;
  const settings = settingsStore.getState();

  if (command.tool !== "rounded_rectangle") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { startX, startY, endX, endY, color, fillColor, fillMode, lineWidth } = command.params;
  const strokeColor = color || settings.primaryColor;
  const fill = fillColor || settings.secondaryColor;
  const style = convertFillMode(fillMode);
  const lw = lineWidth || settings.lineWidth;

  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  const actualStroke = style === "fill" ? null : strokeColor;
  const actualFill = style === "outline" ? null : fill;

  drawRoundedRectangle(ctx, x, y, width, height, actualStroke, actualFill, lw);

  return successResult(command, startTime);
};

/**
 * Handle ellipse drawing command
 */
export const handleEllipse: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore } = context;
  const settings = settingsStore.getState();

  if (command.tool !== "ellipse") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { startX, startY, endX, endY, color, fillColor, fillMode, lineWidth } = command.params;
  const strokeColor = color || settings.primaryColor;
  const fill = fillColor || settings.secondaryColor;
  const style = convertFillMode(fillMode);
  const lw = lineWidth || settings.lineWidth;

  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  const actualStroke = style === "fill" ? null : strokeColor;
  const actualFill = style === "outline" ? null : fill;

  drawEllipse(ctx, x, y, width, height, actualStroke, actualFill, lw);

  return successResult(command, startTime);
};

/**
 * Handle polygon drawing command
 */
export const handlePolygon: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore } = context;
  const settings = settingsStore.getState();

  if (command.tool !== "polygon") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { points, color, fillColor, fillMode, lineWidth } = command.params;

  if (!points || points.length < 3) {
    return successResult(command, startTime);
  }

  const strokeColor = color || settings.primaryColor;
  const fill = fillColor || settings.secondaryColor;
  const style = convertFillMode(fillMode);
  const lw = lineWidth || settings.lineWidth;

  const actualStroke = style === "fill" ? null : strokeColor;
  const actualFill = style === "outline" ? null : fill;

  drawPolygon(ctx, points, actualStroke, actualFill, lw, true);

  return successResult(command, startTime);
};

/**
 * Handle curve drawing command
 * Supports quadratic and cubic bezier curves
 */
export const handleCurve: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore } = context;
  const settings = settingsStore.getState();

  if (command.tool !== "curve") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { startX, startY, endX, endY, controlPoint1, controlPoint2, color, lineWidth } = command.params;
  const strokeColor = color || settings.primaryColor;
  const lw = lineWidth || settings.lineWidth;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(startX, startY);

  if (controlPoint2) {
    ctx.bezierCurveTo(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, endX, endY);
  } else {
    ctx.quadraticCurveTo(controlPoint1.x, controlPoint1.y, endX, endY);
  }
  ctx.stroke();
  ctx.restore();

  return successResult(command, startTime);
};

/** Map of shape command handlers */
export const shapeHandlers: Record<string, CommandHandler> = {
  line: handleLine,
  rectangle: handleRectangle,
  rounded_rectangle: handleRoundedRectangle,
  ellipse: handleEllipse,
  polygon: handlePolygon,
  curve: handleCurve,
};
