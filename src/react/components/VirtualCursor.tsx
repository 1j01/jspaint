/**
 * Virtual Cursor Component
 * Renders an animated cursor overlay during AI command execution
 * Shows a tool-appropriate cursor icon that moves across the canvas
 */

import React, { CSSProperties, useMemo } from "react";
import { useAIStore } from "../context/state/aiStore";

/**
 * Props for VirtualCursor component
 */
interface VirtualCursorProps {
  /** Canvas magnification level */
  magnification: number;
}

/**
 * Map of tool icons to their visual representation
 * Uses CSS-based icons that mimic the actual tool cursors
 */
const TOOL_CURSOR_STYLES: Record<string, CSSProperties> = {
  pencil: {
    width: "16px",
    height: "16px",
    background: "transparent",
    border: "none",
    position: "relative",
  },
  brush: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid black",
  },
  airbrush: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,0,0,0.4) 0%, transparent 70%)",
    border: "none",
  },
  eraser: {
    width: "16px",
    height: "16px",
    background: "rgba(255, 255, 255, 0.8)",
    border: "1px solid black",
  },
  line: {
    width: "12px",
    height: "12px",
    background: "transparent",
    border: "none",
  },
  rectangle: {
    width: "12px",
    height: "12px",
    background: "transparent",
    border: "none",
  },
  ellipse: {
    width: "12px",
    height: "12px",
    background: "transparent",
    border: "none",
  },
  fill: {
    width: "16px",
    height: "16px",
    background: "transparent",
    border: "none",
  },
  text: {
    width: "2px",
    height: "16px",
    background: "black",
    border: "none",
  },
  default: {
    width: "12px",
    height: "12px",
    background: "transparent",
    border: "none",
  },
};

/**
 * VirtualCursor component - Renders animated cursor during AI execution
 *
 * This component displays a visual cursor that moves across the canvas
 * as the AI executes drawing commands. It helps users understand what
 * the AI is drawing and where.
 *
 * Features:
 * - Tool-specific cursor icons
 * - Smooth animation via CSS transforms
 * - Magnification-aware positioning
 * - Crosshair display for precision
 *
 * @param {VirtualCursorProps} props - Component props
 * @returns {React.JSX.Element | null} Cursor overlay or null if hidden
 */
export function VirtualCursor({ magnification }: VirtualCursorProps): React.JSX.Element | null {
  const virtualCursor = useAIStore((state) => state.virtualCursor);

  const cursorStyle = useMemo<CSSProperties>(() => {
    const toolStyle = TOOL_CURSOR_STYLES[virtualCursor.toolIcon] || TOOL_CURSOR_STYLES.default;
    const width = parseInt(String(toolStyle.width), 10) || 12;
    const height = parseInt(String(toolStyle.height), 10) || 12;

    return {
      position: "absolute",
      left: `${virtualCursor.x * magnification - width / 2}px`,
      top: `${virtualCursor.y * magnification - height / 2}px`,
      ...toolStyle,
      pointerEvents: "none",
      zIndex: 1000,
      transition: "none", // Animation handled by useVirtualCursor hook
    };
  }, [virtualCursor.x, virtualCursor.y, virtualCursor.toolIcon, magnification]);

  // Don't render if cursor is not visible
  if (!virtualCursor.visible) {
    return null;
  }

  // Render crosshair for precision cursors
  const showCrosshair = ["pencil", "line", "rectangle", "ellipse", "fill", "default"].includes(virtualCursor.toolIcon);

  return (
    <div className="virtual-cursor-container" style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
      <div className="virtual-cursor" style={cursorStyle}>
        {showCrosshair && <CrosshairCursor />}
      </div>
      {/* Cursor trail effect */}
      <div
        className="virtual-cursor-trail"
        style={{
          position: "absolute",
          left: `${virtualCursor.x * magnification}px`,
          top: `${virtualCursor.y * magnification}px`,
          width: "4px",
          height: "4px",
          marginLeft: "-2px",
          marginTop: "-2px",
          borderRadius: "50%",
          background: "rgba(0, 120, 255, 0.6)",
          boxShadow: "0 0 8px rgba(0, 120, 255, 0.8)",
          pointerEvents: "none",
          zIndex: 1001,
        }}
      />
    </div>
  );
}

/**
 * Crosshair cursor for precision tools
 * Renders a small crosshair pattern at the cursor position
 */
function CrosshairCursor(): React.JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" style={{ position: "absolute", left: "2px", top: "2px" }}>
      {/* Vertical line */}
      <line x1="6" y1="0" x2="6" y2="5" stroke="black" strokeWidth="1" />
      <line x1="6" y1="7" x2="6" y2="12" stroke="black" strokeWidth="1" />
      {/* Horizontal line */}
      <line x1="0" y1="6" x2="5" y2="6" stroke="black" strokeWidth="1" />
      <line x1="7" y1="6" x2="12" y2="6" stroke="black" strokeWidth="1" />
      {/* Center point */}
      <circle cx="6" cy="6" r="1" fill="black" />
    </svg>
  );
}

export default VirtualCursor;
