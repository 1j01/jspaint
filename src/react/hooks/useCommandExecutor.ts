/**
 * Command Executor Hook
 * Executes AI drawing commands on the canvas
 * Maps commands to drawing utilities and store actions
 */

import { useCallback, useRef } from "react";
import type { RefObject } from "react";
import type { DrawingCommand, Point, CommandExecutionResult, ExecutionProgress } from "../types/ai";
import {
  bresenhamLine,
  floodFill,
  drawEllipse,
  drawRectangle,
  drawPolygon,
  drawRoundedRectangle,
  sprayAirbrush,
  getBrushPoints,
} from "../utils/drawingUtils";
import {
  flipHorizontal,
  flipVertical,
  rotate,
  rotateArbitrary,
  stretch,
  skew,
  invertColors,
} from "../utils/imageTransforms";
import { useSettingsStore } from "../context/state/settingsStore";
import { useToolStore } from "../context/state/toolStore";
import { useHistoryStore } from "../context/state/historyStore";
import { useUIStore } from "../context/state/uiStore";

/**
 * Options for the command executor hook
 */
export interface CommandExecutorOptions {
  /** Canvas element reference */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Called when execution progress updates */
  onProgress?: (progress: ExecutionProgress) => void;
  /** Called when all commands complete */
  onComplete?: () => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Delay between commands in ms (for visual feedback) */
  animationDelay?: number;
}

/**
 * Parse a path string "x1,y1;x2,y2;x3,y3" into Point array
 * @param {string} path - Path string in compact format
 * @returns {Point[]} Array of points
 */
function parsePath(path: string): Point[] {
  if (!path || path.trim() === "") return [];
  return path.split(";").map((segment) => {
    const [x, y] = segment.split(",").map(Number);
    return { x: x || 0, y: y || 0 };
  });
}

/**
 * Parse hex color to RGBA array
 * @param {string} hex - Hex color string
 * @returns {[number, number, number, number]} RGBA values
 */
function hexToRgba(hex: string): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255];
  }
  return [0, 0, 0, 255];
}

/**
 * Convert fill mode to settings store format
 * @param {string} fillMode - AI command fill mode
 * @returns {"outline" | "fill" | "both"} Settings store fill style
 */
function convertFillMode(fillMode?: string): "outline" | "fill" | "both" {
  switch (fillMode) {
    case "filled":
      return "fill";
    case "filled_with_outline":
      return "both";
    case "outline":
    default:
      return "outline";
  }
}

/**
 * Hook for executing AI drawing commands on the canvas
 * @param {CommandExecutorOptions} options - Executor options
 * @returns {{ executeCommands: Function, executeCommand: Function, cancelExecution: Function, isExecuting: boolean }}
 */
export function useCommandExecutor(options: CommandExecutorOptions) {
  const { canvasRef, onProgress, onComplete, onError, animationDelay = 50 } = options;

  const isExecutingRef = useRef(false);
  const cancelledRef = useRef(false);

  // Store accessors
  const settingsStore = useSettingsStore;
  const toolStore = useToolStore;
  const historyStore = useHistoryStore;
  const uiStore = useUIStore;

  /**
   * Get the canvas 2D context
   * @returns {CanvasRenderingContext2D | null} Canvas context
   */
  const getContext = useCallback((): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d", { willReadFrequently: true });
  }, [canvasRef]);

  /**
   * Execute a single drawing command
   * @param {DrawingCommand} command - Command to execute
   * @returns {CommandExecutionResult} Execution result
   */
  const executeCommand = useCallback(
    (command: DrawingCommand): CommandExecutionResult => {
      const startTime = Date.now();
      const ctx = getContext();

      if (!ctx) {
        return {
          command,
          status: "failed",
          error: "Canvas context not available",
        };
      }

      const canvas = ctx.canvas;
      const settings = settingsStore.getState();
      const tool = toolStore.getState();

      try {
        switch (command.tool) {
          // ═══════════════════════════════════════════════════════════
          // FREEFORM DRAWING
          // ═══════════════════════════════════════════════════════════
          case "pencil": {
            const { path, color } = command.params;
            const points = parsePath(path);
            const drawColor = color || settings.primaryColor;

            ctx.save();
            ctx.fillStyle = drawColor;

            for (let i = 0; i < points.length - 1; i++) {
              bresenhamLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, (x, y) =>
                ctx.fillRect(x, y, 1, 1),
              );
            }
            ctx.restore();
            break;
          }

          case "brush": {
            const { path, color, size, shape } = command.params;
            const points = parsePath(path);
            const drawColor = color || settings.primaryColor;
            const brushSize = size || settings.brushSize;

            ctx.save();
            ctx.fillStyle = drawColor;

            // Get brush shape pattern (returns relative offsets)
            const brushPoints = getBrushPoints(brushSize, shape === "square" ? "square" : "circle");

            for (const point of points) {
              for (const bp of brushPoints) {
                ctx.fillRect(point.x + bp.x, point.y + bp.y, 1, 1);
              }
            }
            ctx.restore();
            break;
          }

          case "airbrush": {
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
            break;
          }

          case "eraser": {
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
            break;
          }

          // ═══════════════════════════════════════════════════════════
          // SHAPES
          // ═══════════════════════════════════════════════════════════
          case "line": {
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
            break;
          }

          case "rectangle": {
            const { startX, startY, endX, endY, color, fillColor, fillMode, lineWidth } = command.params;
            const strokeColor = color || settings.primaryColor;
            const fill = fillColor || settings.secondaryColor;
            const style = convertFillMode(fillMode);
            const lw = lineWidth || settings.lineWidth;

            // Convert start/end to x/y/width/height
            const x = Math.min(startX, endX);
            const y = Math.min(startY, endY);
            const width = Math.abs(endX - startX);
            const height = Math.abs(endY - startY);

            // Apply fill mode
            const actualStroke = style === "fill" ? null : strokeColor;
            const actualFill = style === "outline" ? null : fill;

            drawRectangle(ctx, x, y, width, height, actualStroke, actualFill, lw);
            break;
          }

          case "rounded_rectangle": {
            const { startX, startY, endX, endY, color, fillColor, fillMode, lineWidth } = command.params;
            const strokeColor = color || settings.primaryColor;
            const fill = fillColor || settings.secondaryColor;
            const style = convertFillMode(fillMode);
            const lw = lineWidth || settings.lineWidth;

            // Convert start/end to x/y/width/height
            const x = Math.min(startX, endX);
            const y = Math.min(startY, endY);
            const width = Math.abs(endX - startX);
            const height = Math.abs(endY - startY);

            // Apply fill mode
            const actualStroke = style === "fill" ? null : strokeColor;
            const actualFill = style === "outline" ? null : fill;

            drawRoundedRectangle(ctx, x, y, width, height, actualStroke, actualFill, lw);
            break;
          }

          case "ellipse": {
            const { startX, startY, endX, endY, color, fillColor, fillMode, lineWidth } = command.params;
            const strokeColor = color || settings.primaryColor;
            const fill = fillColor || settings.secondaryColor;
            const style = convertFillMode(fillMode);
            const lw = lineWidth || settings.lineWidth;

            // Convert start/end to x/y/width/height
            const x = Math.min(startX, endX);
            const y = Math.min(startY, endY);
            const width = Math.abs(endX - startX);
            const height = Math.abs(endY - startY);

            // Apply fill mode
            const actualStroke = style === "fill" ? null : strokeColor;
            const actualFill = style === "outline" ? null : fill;

            drawEllipse(ctx, x, y, width, height, actualStroke, actualFill, lw);
            break;
          }

          case "polygon": {
            const { points, color, fillColor, fillMode, lineWidth } = command.params;
            if (points && points.length >= 3) {
              const strokeColor = color || settings.primaryColor;
              const fill = fillColor || settings.secondaryColor;
              const style = convertFillMode(fillMode);
              const lw = lineWidth || settings.lineWidth;

              // Apply fill mode
              const actualStroke = style === "fill" ? null : strokeColor;
              const actualFill = style === "outline" ? null : fill;

              drawPolygon(ctx, points, actualStroke, actualFill, lw, true);
            }
            break;
          }

          case "curve": {
            const { startX, startY, endX, endY, controlPoint1, controlPoint2, color, lineWidth } = command.params;
            const strokeColor = color || settings.primaryColor;
            const lw = lineWidth || settings.lineWidth;

            ctx.save();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.moveTo(startX, startY);

            if (controlPoint2) {
              // Cubic bezier
              ctx.bezierCurveTo(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, endX, endY);
            } else {
              // Quadratic bezier
              ctx.quadraticCurveTo(controlPoint1.x, controlPoint1.y, endX, endY);
            }
            ctx.stroke();
            ctx.restore();
            break;
          }

          // ═══════════════════════════════════════════════════════════
          // FILL & COLOR TOOLS
          // ═══════════════════════════════════════════════════════════
          case "fill": {
            const { x, y, color } = command.params;
            const fillColor = color || settings.primaryColor;

            floodFill(ctx, x, y, fillColor);
            break;
          }

          case "pick_color": {
            const { x, y, target } = command.params;
            const imageData = ctx.getImageData(x, y, 1, 1);
            const [r, g, b] = imageData.data;
            const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

            if (target === "secondary") {
              settingsStore.getState().setSecondaryColor(hex);
            } else {
              settingsStore.getState().setPrimaryColor(hex);
            }
            break;
          }

          // ═══════════════════════════════════════════════════════════
          // TEXT
          // ═══════════════════════════════════════════════════════════
          case "text": {
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
            break;
          }

          // ═══════════════════════════════════════════════════════════
          // VIEW/MAGNIFIER
          // ═══════════════════════════════════════════════════════════
          case "magnifier": {
            const { zoom } = command.params;
            const validZoom = [1, 2, 4, 6, 8].includes(zoom) ? zoom : 1;
            uiStore.getState().setMagnification(validZoom as 1 | 2 | 4 | 6 | 8);
            break;
          }

          // ═══════════════════════════════════════════════════════════
          // SELECTION
          // ═══════════════════════════════════════════════════════════
          case "select_rectangle": {
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
            break;
          }

          case "select_all": {
            toolStore.getState().setSelection({
              x: 0,
              y: 0,
              width: canvas.width,
              height: canvas.height,
              imageData: null,
            });
            break;
          }

          case "deselect": {
            toolStore.getState().clearSelection();
            break;
          }

          case "move_selection": {
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
            break;
          }

          case "copy": {
            const selection = tool.selection;
            if (selection) {
              const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
              toolStore.getState().setClipboard(imageData);
            }
            break;
          }

          case "cut": {
            const selection = tool.selection;
            if (selection) {
              const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
              toolStore.getState().setClipboard(imageData);

              // Clear the cut area
              ctx.fillStyle = settings.secondaryColor;
              ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
            }
            break;
          }

          case "paste": {
            const { x = 0, y = 0 } = command.params;
            const clipboard = tool.clipboard;
            if (clipboard) {
              ctx.putImageData(clipboard, x, y);
            }
            break;
          }

          case "delete_selection": {
            const selection = tool.selection;
            if (selection) {
              ctx.fillStyle = settings.secondaryColor;
              ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
            }
            break;
          }

          case "crop_to_selection": {
            const selection = tool.selection;
            if (selection) {
              const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
              canvas.width = selection.width;
              canvas.height = selection.height;
              ctx.putImageData(imageData, 0, 0);
              toolStore.getState().clearSelection();
            }
            break;
          }

          // ═══════════════════════════════════════════════════════════
          // TRANSFORMS
          // ═══════════════════════════════════════════════════════════
          case "flip": {
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
            break;
          }

          case "rotate": {
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
            break;
          }

          case "stretch": {
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
            break;
          }

          case "skew": {
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
            break;
          }

          case "invert_colors": {
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
            break;
          }

          // ═══════════════════════════════════════════════════════════
          // CANVAS OPERATIONS
          // ═══════════════════════════════════════════════════════════
          case "clear": {
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
            break;
          }

          case "resize_canvas": {
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
            break;
          }

          case "new_image": {
            const { width = 800, height = 600, backgroundColor, transparent } = command.params;
            canvas.width = width;
            canvas.height = height;

            if (!transparent) {
              ctx.fillStyle = backgroundColor || settings.secondaryColor;
              ctx.fillRect(0, 0, width, height);
            }
            break;
          }

          // ═══════════════════════════════════════════════════════════
          // COLOR MANAGEMENT
          // ═══════════════════════════════════════════════════════════
          case "set_color": {
            const { target, color } = command.params;
            if (target === "secondary") {
              settingsStore.getState().setSecondaryColor(color);
            } else {
              settingsStore.getState().setPrimaryColor(color);
            }
            break;
          }

          case "swap_colors": {
            settingsStore.getState().swapColors();
            break;
          }

          case "sample_color": {
            const { x, y, setAsPrimary, setAsSecondary } = command.params;
            const imageData = ctx.getImageData(x, y, 1, 1);
            const [r, g, b] = imageData.data;
            const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

            if (setAsPrimary) {
              settingsStore.getState().setPrimaryColor(hex);
            }
            if (setAsSecondary) {
              settingsStore.getState().setSecondaryColor(hex);
            }
            break;
          }

          // ═══════════════════════════════════════════════════════════
          // EDIT OPERATIONS
          // ═══════════════════════════════════════════════════════════
          case "undo": {
            const { steps = 1 } = command.params;
            for (let i = 0; i < steps; i++) {
              const node = historyStore.getState().undo();
              if (node && node.imageData) {
                ctx.putImageData(node.imageData, 0, 0);
              }
            }
            break;
          }

          case "redo": {
            const { steps = 1 } = command.params;
            for (let i = 0; i < steps; i++) {
              const node = historyStore.getState().redo();
              if (node && node.imageData) {
                ctx.putImageData(node.imageData, 0, 0);
              }
            }
            break;
          }

          // ═══════════════════════════════════════════════════════════
          // BATCH COMMANDS
          // ═══════════════════════════════════════════════════════════
          case "batch_shapes": {
            const { shapeType, shapes, color, fillColor, fillMode } = command.params;
            const strokeColor = color || settings.primaryColor;
            const fill = fillColor || settings.secondaryColor;
            const style = convertFillMode(fillMode);
            const lw = settings.lineWidth;

            // Apply fill mode
            const actualStroke = style === "fill" ? null : strokeColor;
            const actualFill = style === "outline" ? null : fill;

            for (const shape of shapes) {
              const { startX, startY, endX, endY } = shape;
              // Convert start/end to x/y/width/height
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
            break;
          }

          case "batch_points": {
            const { points, color } = command.params;
            const drawColor = color || settings.primaryColor;
            const pointArray = parsePath(points);

            ctx.save();
            ctx.fillStyle = drawColor;
            for (const p of pointArray) {
              ctx.fillRect(p.x, p.y, 1, 1);
            }
            ctx.restore();
            break;
          }

          case "draw_grid": {
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
            break;
          }

          case "draw_path": {
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
            break;
          }

          // Commands that don't need canvas operations
          case "select_freeform":
          case "resize_selection":
          case "set_attributes":
          case "get_attributes":
          case "load_image":
          case "export_image":
          case "set_palette_color":
          case "set_custom_color":
          case "get_custom_colors":
          case "define_color":
          case "load_palette":
          case "save_palette":
          case "repeat":
          case "pattern_repeat":
            // These commands are either not implemented or require special handling
            break;

          default:
            return {
              command,
              status: "failed",
              error: `Unknown command: ${(command as DrawingCommand).tool}`,
              duration: Date.now() - startTime,
            };
        }

        return {
          command,
          status: "completed",
          duration: Date.now() - startTime,
        };
      } catch (err) {
        return {
          command,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
          duration: Date.now() - startTime,
        };
      }
    },
    [getContext, settingsStore, toolStore, historyStore, uiStore],
  );

  /**
   * Execute an array of commands sequentially
   * @param {DrawingCommand[]} commands - Commands to execute
   * @returns {Promise<CommandExecutionResult[]>} Array of execution results
   */
  const executeCommands = useCallback(
    async (commands: DrawingCommand[]): Promise<CommandExecutionResult[]> => {
      if (isExecutingRef.current) {
        onError?.("Execution already in progress");
        return [];
      }

      isExecutingRef.current = true;
      cancelledRef.current = false;

      const results: CommandExecutionResult[] = [];
      const total = commands.length;

      // Save canvas state before batch execution
      const ctx = getContext();
      if (ctx) {
        const canvas = ctx.canvas;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyStore.getState().pushState(imageData, "AI Commands");
      }

      for (let i = 0; i < commands.length; i++) {
        if (cancelledRef.current) {
          // Mark remaining commands as cancelled
          for (let j = i; j < commands.length; j++) {
            results.push({
              command: commands[j],
              status: "cancelled",
            });
          }
          break;
        }

        onProgress?.({
          current: i + 1,
          total,
          currentCommand: commands[i],
        });

        const result = await executeCommand(commands[i]);
        results.push(result);

        // Add delay for visual feedback
        if (animationDelay > 0 && i < commands.length - 1 && !cancelledRef.current) {
          await new Promise((resolve) => setTimeout(resolve, animationDelay));
        }
      }

      isExecutingRef.current = false;
      onComplete?.();

      return results;
    },
    [executeCommand, getContext, historyStore, onProgress, onComplete, onError, animationDelay],
  );

  /**
   * Cancel the current execution
   */
  const cancelExecution = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  return {
    executeCommands,
    executeCommand,
    cancelExecution,
    isExecuting: isExecutingRef.current,
  };
}
