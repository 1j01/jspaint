/**
 * TextBoxResizeHandles component
 * Renders 8 resize handles (corners and edges) with grab regions
 * Extracted from CanvasTextBox to reduce complexity
 */

import React, { CSSProperties } from "react";
import { HANDLE_CONFIGS, HANDLE_MIDDLE, getCursor, getHandlePositions, type HandleAxis } from "../utils/resizeHandles";

/**
 * Props for TextBoxResizeHandles component
 */
interface TextBoxResizeHandlesProps {
  /** Width of the text box */
  width: number;
  /** Height of the text box */
  height: number;
  /** Callback when resize handle pointer down */
  onResizePointerDown: (xAxis: HandleAxis, yAxis: HandleAxis, e: React.PointerEvent) => void;
}

/**
 * Style for the visual handle dot
 *
 * @param left - Left position in pixels
 * @param top - Top position in pixels
 * @returns CSS properties for handle
 */
function handleStyle(left: number, top: number): CSSProperties {
  return {
    touchAction: "none",
    position: "absolute",
    left: `${left}px`,
    top: `${top}px`,
    width: "3px",
    height: "3px",
    border: "1px solid #000",
    background: "#fff",
    boxSizing: "border-box",
  };
}

/**
 * Style for the interactive grab region
 *
 * @param positions - Handle positions from getHandlePositions
 * @param cursor - CSS cursor value
 * @returns CSS properties for grab region
 */
function grabRegionStyle(positions: ReturnType<typeof getHandlePositions>, cursor: string): CSSProperties {
  return {
    position: "absolute",
    cursor,
    left: `${positions.grabRegion.left}px`,
    top: `${positions.grabRegion.top}px`,
    width: `${positions.grabRegion.width}px`,
    height: `${positions.grabRegion.height}px`,
  };
}

/**
 * Renders 8 resize handles around a text box
 * Each handle has a visual dot and larger grab region
 *
 * @param props - Component props
 * @returns Resize handles JSX elements
 *
 * @example
 * <TextBoxResizeHandles
 *   width={textBox.width}
 *   height={textBox.height}
 *   onResizePointerDown={handleResizePointerDown}
 * />
 */
export function TextBoxResizeHandles({
  width,
  height,
  onResizePointerDown,
}: TextBoxResizeHandlesProps): React.ReactElement {
  return (
    <>
      {HANDLE_CONFIGS.map(({ xAxis, yAxis }, index) => {
        const positions = getHandlePositions(xAxis, yAxis, width, height);
        const cursor = getCursor(xAxis, yAxis);
        const isMiddle = xAxis === HANDLE_MIDDLE || yAxis === HANDLE_MIDDLE;

        return (
          <React.Fragment key={index}>
            <div className="handle" style={handleStyle(positions.handle.left, positions.handle.top)} />
            <div
              className={`grab-region ${isMiddle ? "is-middle" : ""}`}
              style={grabRegionStyle(positions, cursor)}
              onPointerDown={(e) => onResizePointerDown(xAxis, yAxis, e)}
              onMouseDown={(e) => e.preventDefault()}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}

export default TextBoxResizeHandles;
