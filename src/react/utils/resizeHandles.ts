/**
 * Resize Handle Utilities
 *
 * Shared logic for calculating resize handle positions and grab regions.
 * Used by CanvasTextBox, SelectionHandles, and other resizable components.
 */

/**
 * Handle position constants
 */
export const HANDLE_START = -1; // Top or left edge
export const HANDLE_MIDDLE = 0; // Center (horizontal or vertical)
export const HANDLE_END = 1; // Bottom or right edge

/**
 * Handle axis type - position along an axis
 */
export type HandleAxis = typeof HANDLE_START | typeof HANDLE_MIDDLE | typeof HANDLE_END;

/**
 * Configuration for a single resize handle
 */
export interface HandleConfig {
  /** Horizontal axis position */
  xAxis: HandleAxis;
  /** Vertical axis position */
  yAxis: HandleAxis;
}

/**
 * 8 resize handles around a rectangle
 * Order: top-right, top, top-left, left, bottom-left, bottom, bottom-right, right
 */
export const HANDLE_CONFIGS: HandleConfig[] = [
  { yAxis: HANDLE_START, xAxis: HANDLE_END }, // top-right (↗)
  { yAxis: HANDLE_START, xAxis: HANDLE_MIDDLE }, // top (↑)
  { yAxis: HANDLE_START, xAxis: HANDLE_START }, // top-left (↖)
  { yAxis: HANDLE_MIDDLE, xAxis: HANDLE_START }, // left (←)
  { yAxis: HANDLE_END, xAxis: HANDLE_START }, // bottom-left (↙)
  { yAxis: HANDLE_END, xAxis: HANDLE_MIDDLE }, // bottom (↓)
  { yAxis: HANDLE_END, xAxis: HANDLE_END }, // bottom-right (↘)
  { yAxis: HANDLE_MIDDLE, xAxis: HANDLE_END }, // right (→)
];

/**
 * Gets the appropriate cursor style for a resize handle
 *
 * @param xAxis - Horizontal axis position
 * @param yAxis - Vertical axis position
 * @returns CSS cursor value
 */
export function getCursor(xAxis: HandleAxis, yAxis: HandleAxis): string {
  if ((xAxis === HANDLE_START && yAxis === HANDLE_START) || (xAxis === HANDLE_END && yAxis === HANDLE_END)) {
    return "nwse-resize";
  }
  if ((xAxis === HANDLE_END && yAxis === HANDLE_START) || (xAxis === HANDLE_START && yAxis === HANDLE_END)) {
    return "nesw-resize";
  }
  if (xAxis === HANDLE_MIDDLE && yAxis !== HANDLE_MIDDLE) return "ns-resize";
  if (yAxis === HANDLE_MIDDLE && xAxis !== HANDLE_MIDDLE) return "ew-resize";
  return "default";
}

/**
 * Handle position calculation result
 */
export interface HandlePositions {
  /** Visual handle dot position */
  handle: { left: number; top: number };
  /** Interactive grab region */
  grabRegion: { left: number; top: number; width: number; height: number };
}

/**
 * Calculate handle and grab region positions
 *
 * Matches the legacy jQuery implementation logic.
 * The grab regions are larger than the visual handles to make them easier to grab.
 *
 * @param xAxis - Horizontal axis position (START/MIDDLE/END)
 * @param yAxis - Vertical axis position (START/MIDDLE/END)
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param handleSize - Size of the visual handle dot (default: 3)
 * @param grabSize - Size of the interactive grab region (default: 32)
 * @returns Handle and grab region positions
 */
export function getHandlePositions(
  xAxis: HandleAxis,
  yAxis: HandleAxis,
  width: number,
  height: number,
  handleSize: number = 3,
  grabSize: number = 32,
): HandlePositions {
  const positions: HandlePositions = {
    handle: { left: 0, top: 0 },
    grabRegion: { left: 0, top: 0, width: 0, height: 0 },
  };

  // X-axis calculations
  let middleStartX = Math.max(width / 2 - grabSize / 2, Math.min(grabSize / 2, width / 3));
  let middleEndX = width - middleStartX;
  if (middleEndX - middleStartX < 1) {
    middleStartX = 0;
    middleEndX = 1;
  }

  const startStartX = -grabSize / 2;
  const startEndX = Math.min(grabSize / 2, middleStartX);

  if (xAxis === HANDLE_START) {
    positions.handle.left = -1;
    positions.grabRegion.left = startStartX;
    positions.grabRegion.width = startEndX - startStartX;
  } else if (xAxis === HANDLE_MIDDLE) {
    positions.handle.left = (width - handleSize) / 2;
    positions.grabRegion.left = middleStartX;
    positions.grabRegion.width = middleEndX - middleStartX;
  } else {
    // HANDLE_END
    positions.handle.left = width - handleSize / 2;
    const endStartX = width - startEndX;
    const endEndX = width - startStartX;
    positions.grabRegion.left = endStartX;
    positions.grabRegion.width = endEndX - endStartX;
  }

  // Y-axis calculations
  let middleStartY = Math.max(height / 2 - grabSize / 2, Math.min(grabSize / 2, height / 3));
  let middleEndY = height - middleStartY;
  if (middleEndY - middleStartY < 1) {
    middleStartY = 0;
    middleEndY = 1;
  }

  const startStartY = -grabSize / 2;
  const startEndY = Math.min(grabSize / 2, middleStartY);

  if (yAxis === HANDLE_START) {
    positions.handle.top = -1;
    positions.grabRegion.top = startStartY;
    positions.grabRegion.height = startEndY - startStartY;
  } else if (yAxis === HANDLE_MIDDLE) {
    positions.handle.top = (height - handleSize) / 2;
    positions.grabRegion.top = middleStartY;
    positions.grabRegion.height = middleEndY - middleStartY;
  } else {
    // HANDLE_END
    positions.handle.top = height - handleSize / 2;
    const endStartY = height - startEndY;
    const endEndY = height - startStartY;
    positions.grabRegion.top = endStartY;
    positions.grabRegion.height = endEndY - endStartY;
  }

  return positions;
}
