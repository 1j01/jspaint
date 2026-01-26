/**
 * Text Handler
 * Handles text drawing commands
 */

import type { DrawingCommand } from "../../types/ai";
import type { CommandHandler, CommandContext } from "./types";
import { successResult } from "./types";

/**
 * Handle text drawing command
 * Draws text on the canvas with configurable font and style
 */
export const handleText: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore } = context;
  const settings = settingsStore.getState();

  if (command.tool !== "text") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { x, y, text, color, fontFamily, fontSize, bold, italic, underline, backgroundColor, transparent } =
    command.params;

  const textColor = color || settings.primaryColor;
  const family = fontFamily || settings.fontFamily;
  const size = fontSize || settings.fontSize;
  const isBold = bold ?? settings.fontBold;
  const isItalic = italic ?? settings.fontItalic;
  const isTransparent = transparent ?? true;

  ctx.save();

  // Build font string
  let fontString = "";
  if (isItalic) fontString += "italic ";
  if (isBold) fontString += "bold ";
  fontString += `${size}px "${family}"`;

  ctx.font = fontString;
  ctx.textBaseline = "top";

  // Draw background if not transparent
  if (!isTransparent && backgroundColor) {
    const metrics = ctx.measureText(text);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x, y, metrics.width, size * 1.2);
  }

  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y);

  // Draw underline if needed
  if (underline) {
    const metrics = ctx.measureText(text);
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + size + 2);
    ctx.lineTo(x + metrics.width, y + size + 2);
    ctx.stroke();
  }

  ctx.restore();

  return successResult(command, startTime);
};

/** Map of text command handlers */
export const textHandlers: Record<string, CommandHandler> = {
  text: handleText,
};
