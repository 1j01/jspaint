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

  // Support both parameter formats: {x1,y1,x2,y2} and {startX,startY,endX,endY}
  const params = command.params;
  const x1 = params.x1 ?? params.startX;
  const y1 = params.y1 ?? params.startY;
  const x2 = params.x2 ?? params.endX;
  const y2 = params.y2 ?? params.endY;
  const drawColor = params.color || settings.primaryColor;
  const lineWidth = params.width || params.lineWidth || settings.lineWidth || 1;

  console.log("[handleLine] Drawing line from", x1, y1, "to", x2, y2, "color:", drawColor, "width:", lineWidth);
  console.log("[handleLine] Canvas dimensions:", ctx.canvas.width, "x", ctx.canvas.height);
  console.log("[handleLine] Canvas in DOM:", document.body.contains(ctx.canvas));
  console.log("[handleLine] Canvas class:", ctx.canvas.className);

  // Sample pixel before drawing
  const beforePixel = ctx.getImageData(x1, y1, 1, 1);
  console.log("[handleLine] Pixel before drawing at", x1, y1, ":", Array.from(beforePixel.data));

  ctx.save();
  ctx.strokeStyle = drawColor;
  ctx.lineWidth = lineWidth;
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();

  // Sample pixel after drawing
  const afterPixel = ctx.getImageData(x1, y1, 1, 1);
  console.log("[handleLine] Pixel after drawing at", x1, y1, ":", Array.from(afterPixel.data));

  // Check if pixels changed
  const changed =
    beforePixel.data[0] !== afterPixel.data[0] ||
    beforePixel.data[1] !== afterPixel.data[1] ||
    beforePixel.data[2] !== afterPixel.data[2] ||
    beforePixel.data[3] !== afterPixel.data[3];
  console.log("[handleLine] Pixels changed:", changed);

  console.log("[handleLine] Line drawn successfully");

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
