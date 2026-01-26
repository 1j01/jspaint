/**
 * Selection Handlers
 * Handles selection-related commands: select, move, copy, cut, paste, delete, crop
 */

import type { DrawingCommand } from "../../types/ai";
import type { CommandHandler, CommandContext } from "./types";
import { successResult } from "./types";

/**
 * Handle select rectangle command
 * Creates a rectangular selection
 */
export const handleSelectRectangle: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { toolStore } = context;

  if (command.tool !== "select_rectangle") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { startX, startY, endX, endY } = command.params;
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  toolStore.getState().setSelection({
    x,
    y,
    width,
    height,
    imageData: null,
  });

  return successResult(command, startTime);
};

/**
 * Handle select all command
 * Selects the entire canvas
 */
export const handleSelectAll: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { canvas, toolStore } = context;

  if (command.tool !== "select_all") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  toolStore.getState().setSelection({
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    imageData: null,
  });

  return successResult(command, startTime);
};

/**
 * Handle deselect command
 * Clears the current selection
 */
export const handleDeselect: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { toolStore } = context;

  if (command.tool !== "deselect") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  toolStore.getState().clearSelection();

  return successResult(command, startTime);
};

/**
 * Handle move selection command
 * Moves the current selection by delta or to absolute position
 */
export const handleMoveSelection: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { toolStore } = context;
  const tool = toolStore.getState();

  if (command.tool !== "move_selection") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { deltaX, deltaY, toX, toY } = command.params;
  const selection = tool.selection;

  if (selection) {
    if (toX !== undefined && toY !== undefined) {
      toolStore.getState().setSelection({
        ...selection,
        x: toX,
        y: toY,
      });
    } else {
      toolStore.getState().setSelection({
        ...selection,
        x: selection.x + (deltaX || 0),
        y: selection.y + (deltaY || 0),
      });
    }
  }

  return successResult(command, startTime);
};

/**
 * Handle copy command
 * Copies the current selection to clipboard
 */
export const handleCopy: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, toolStore } = context;
  const tool = toolStore.getState();

  if (command.tool !== "copy") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const selection = tool.selection;
  if (selection) {
    const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
    toolStore.getState().setClipboard(imageData);
  }

  return successResult(command, startTime);
};

/**
 * Handle cut command
 * Cuts the current selection to clipboard
 */
export const handleCut: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore, toolStore } = context;
  const tool = toolStore.getState();
  const settings = settingsStore.getState();

  if (command.tool !== "cut") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const selection = tool.selection;
  if (selection) {
    const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
    toolStore.getState().setClipboard(imageData);

    // Clear the cut area
    ctx.fillStyle = settings.secondaryColor;
    ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
  }

  return successResult(command, startTime);
};

/**
 * Handle paste command
 * Pastes clipboard content at specified position
 */
export const handlePaste: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, toolStore } = context;
  const tool = toolStore.getState();

  if (command.tool !== "paste") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const { x = 0, y = 0 } = command.params;
  const clipboard = tool.clipboard;
  if (clipboard) {
    ctx.putImageData(clipboard, x, y);
  }

  return successResult(command, startTime);
};

/**
 * Handle delete selection command
 * Clears the selected area with secondary color
 */
export const handleDeleteSelection: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, settingsStore, toolStore } = context;
  const tool = toolStore.getState();
  const settings = settingsStore.getState();

  if (command.tool !== "delete_selection") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const selection = tool.selection;
  if (selection) {
    ctx.fillStyle = settings.secondaryColor;
    ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
  }

  return successResult(command, startTime);
};

/**
 * Handle crop to selection command
 * Crops the canvas to the current selection
 */
export const handleCropToSelection: CommandHandler = (command: DrawingCommand, context: CommandContext) => {
  const startTime = Date.now();
  const { ctx, canvas, toolStore } = context;
  const tool = toolStore.getState();

  if (command.tool !== "crop_to_selection") {
    return { command, status: "failed", error: "Invalid command type", duration: Date.now() - startTime };
  }

  const selection = tool.selection;
  if (selection) {
    const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
    canvas.width = selection.width;
    canvas.height = selection.height;
    ctx.putImageData(imageData, 0, 0);
    toolStore.getState().clearSelection();
  }

  return successResult(command, startTime);
};

/** Map of selection command handlers */
export const selectionHandlers: Record<string, CommandHandler> = {
  select_rectangle: handleSelectRectangle,
  select_all: handleSelectAll,
  deselect: handleDeselect,
  move_selection: handleMoveSelection,
  copy: handleCopy,
  cut: handleCut,
  paste: handlePaste,
  delete_selection: handleDeleteSelection,
  crop_to_selection: handleCropToSelection,
};
