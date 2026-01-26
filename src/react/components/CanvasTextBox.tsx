import React, {
  forwardRef,
  CSSProperties,
  ChangeEvent,
  KeyboardEvent,
  FocusEvent,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import type { TextBoxState } from "../context/state/types";
import { useSettingsStore } from "../context/state/settingsStore";
import { useTextCanvasPreview, LINE_SCALE } from "../hooks/useTextCanvasPreview";
import { useTextBoxDragResize } from "../hooks/useTextBoxDragResize";
import { TextBoxResizeHandles } from "./TextBoxResizeHandles";

/**
 * Props for CanvasTextBox component
 */
interface CanvasTextBoxProps {
  /** Current text box state from toolStore */
  textBox: TextBoxState;
  /** Canvas magnification level (1 = 100%, 2 = 200%, etc.) */
  magnification: number;
  /** Primary/foreground color for text */
  primaryColor: string;
  /** Secondary/background color for text box */
  secondaryColor: string;
  /** Callback when textarea content changes */
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  /** Callback for keyboard events (e.g., Escape to commit) */
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Callback when textarea loses focus */
  onBlur: (e: FocusEvent<HTMLTextAreaElement>) => void;
  /** Callback when text box is moved (dragged) */
  onMove: (x: number, y: number) => void;
  /** Callback when text box is resized */
  onResize: (width: number, height: number) => void;
}

/**
 * CanvasTextBox component - On-canvas text editing overlay
 * Provides editable text box with live preview, resize handles, and drag-to-move.
 * Matches the legacy jQuery text tool implementation exactly.
 *
 * Features:
 * - Textarea for text input with font styling applied
 * - Canvas overlay for rendering text preview with underline support
 * - 8 resize handles (corners and edges) with intelligent grab regions
 * - Drag container to move text box
 * - CSS transform scaling for magnification support
 * - Pointer capture for smooth drag/resize
 * - Minimum size enforcement (20x20 pixels)
 * - Auto-adjusts handle grab regions based on text box size
 *
 * The text box appears when Text tool is active and user clicks on canvas.
 * User can type, move, resize, and format text before committing to canvas.
 *
 * @param {CanvasTextBoxProps} props - Component props
 * @param {React.Ref<HTMLTextAreaElement>} ref - Forwarded ref to textarea element
 * @returns {JSX.Element} Text box overlay with textarea, canvas preview, and resize handles
 *
 * @example
 * {textBox?.isActive && (
 *   <CanvasTextBox
 *     ref={textareaRef}
 *     textBox={textBox}
 *     magnification={2}
 *     primaryColor="rgb(0,0,0)"
 *     secondaryColor="rgb(255,255,255)"
 *     onChange={handleTextChange}
 *     onKeyDown={handleTextKeyDown}
 *     onBlur={handleTextBlur}
 *     onMove={handleTextMove}
 *     onResize={handleTextResize}
 *   />
 * )}
 */
export const CanvasTextBox = forwardRef<HTMLTextAreaElement, CanvasTextBoxProps>(function CanvasTextBox(
  { textBox, magnification, primaryColor, secondaryColor, onChange, onKeyDown, onBlur, onMove, onResize },
  ref,
) {
  const { t } = useTranslation();
  const drawOpaque = useSettingsStore((state) => state.drawOpaque);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Combine external ref with internal ref
  React.useImperativeHandle(ref, () => textareaRef.current!);

  // Use drag/resize hook for state management
  const { isDragging, isResizing, handleContainerPointerDown, handleResizePointerDown } = useTextBoxDragResize({
    x: textBox.x,
    y: textBox.y,
    width: textBox.width,
    height: textBox.height,
    magnification,
    onMove,
    onResize,
  });

  // Use canvas preview hook for text rendering
  useTextCanvasPreview({
    canvasRef,
    textBox,
    primaryColor,
    secondaryColor,
    drawOpaque,
  });

  // Get .canvas-area padding to position correctly
  const canvasArea = document.querySelector(".canvas-area");
  const padding = canvasArea
    ? {
        left: parseFloat(window.getComputedStyle(canvasArea).paddingLeft) || 0,
        top: parseFloat(window.getComputedStyle(canvasArea).paddingTop) || 0,
      }
    : { left: 0, top: 0 };

  // Auto-size text box to fit content (matching legacy jQuery behavior)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Don't auto-resize while dragging or resizing manually
    if (isDragging || isResizing) return;

    // Match jQuery: only reset height, NOT width (resetting width causes text reflow issues)
    const originalHeight = textarea.style.height;
    const originalMinHeight = textarea.style.minHeight;
    const originalBottom = textarea.style.bottom;
    const originalRows = textarea.getAttribute("rows");

    // jQuery technique: reset height and set rows="1" to get minimum content height
    textarea.style.height = "";
    textarea.style.minHeight = "0px";
    textarea.style.bottom = ""; // needed for when magnified
    textarea.setAttribute("rows", "1");

    // Get scroll dimensions (jQuery reads scrollHeight AFTER rows="1", scrollWidth directly)
    const scrollHeight = textarea.scrollHeight;
    const scrollWidth = textarea.scrollWidth;

    // Restore original styles
    textarea.style.height = originalHeight;
    textarea.style.minHeight = originalMinHeight;
    textarea.style.bottom = originalBottom || "0";
    if (originalRows) {
      textarea.setAttribute("rows", originalRows);
    } else {
      textarea.removeAttribute("rows");
    }

    // Calculate new dimensions
    // jQuery: this.height = Math.max(scrollHeight, this.height); this.width = scrollWidth;
    let newHeight, newWidth;
    if (textBox.fontVertical) {
      // Vertical: characters stack downward, lines go left
      newHeight = Math.max(scrollWidth, textBox.height);
      newWidth = scrollHeight; // jQuery doesn't Math.max width, just uses scrollWidth directly
    } else {
      // Horizontal: normal behavior matching jQuery
      newHeight = Math.max(scrollHeight, textBox.height);
      newWidth = scrollWidth; // jQuery: this.width = edit_textarea.scrollWidth (no Math.max)
    }

    // Only resize if dimensions actually changed
    if (newHeight !== textBox.height || newWidth !== textBox.width) {
      onResize(Math.round(newWidth), Math.round(newHeight));
    }
  }, [textBox.text, textBox.fontVertical, textBox.height, textBox.width, isDragging, isResizing, onResize]);

  // Handler wrapper for container pointer down
  const handleContainerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      handleContainerPointerDown(e, containerRef.current);
    },
    [handleContainerPointerDown],
  );

  const containerStyle: CSSProperties = {
    cursor: "move",
    touchAction: "none",
    position: "absolute",
    left: textBox.x * magnification + padding.left,
    top: textBox.y * magnification + padding.top,
    width: textBox.width * magnification,
    height: textBox.height * magnification,
  };

  const canvasStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    pointerEvents: "none",
    transform: `scale(${magnification})`,
    transformOrigin: "left top",
    zIndex: 5, // Above textarea (z-index: 4) to show rendered text
    opacity: 1, // Override CSS that sets opacity: 0
  };

  const textareaStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    padding: 0,
    margin: 0,
    border: 0,
    resize: "none",
    overflow: "hidden",
    overflowWrap: "break-word", // Allow text to wrap to next line
    wordWrap: "break-word", // Legacy support
    whiteSpace: textBox.fontVertical ? "normal" : "pre-wrap", // Wrap in vertical, preserve spaces in horizontal
    minWidth: "3em",
    transform: `scale(${magnification})`,
    transformOrigin: "left top",
    width: textBox.width,
    fontFamily: textBox.fontFamily,
    fontSize: `${textBox.fontSize}px`, // Use px to match canvas rendering
    fontWeight: textBox.fontBold ? "bold" : "normal",
    fontStyle: textBox.fontItalic ? "italic" : "normal",
    textDecoration: textBox.fontUnderline ? "underline" : "none",
    writingMode: textBox.fontVertical ? "vertical-rl" : undefined, // vertical-rl makes text flow right-to-left, matching canvas rotation
    lineHeight: `${Math.round(textBox.fontSize * LINE_SCALE)}px`,
    letterSpacing: textBox.fontVertical ? "0px" : undefined, // Tight spacing for vertical text
    color: primaryColor, // Keep color for selection highlighting
    WebkitTextFillColor: textBox.fontVertical ? "transparent" : undefined, // Hide text but show selection in vertical mode
    caretColor: primaryColor, // Keep cursor visible
    background: drawOpaque ? secondaryColor : "transparent", // Transparent background when drawOpaque is false
    minHeight: 0,
    height: textBox.height,
    outline: "none",
  };

  return (
    <div
      ref={containerRef}
      className="on-canvas-object textbox"
      style={containerStyle}
      onPointerDown={handleContainerDown}
    >
      {/* Textarea for editing */}
      <textarea
        ref={textareaRef}
        className="textbox-editor"
        value={textBox.text}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        style={textareaStyle}
        aria-label={t("Text input")}
        autoFocus
      />

      {/* Canvas overlay for text preview */}
      <canvas ref={canvasRef} width={textBox.width} height={textBox.height} style={canvasStyle} />

      {/* Resize handles and grab regions */}
      <TextBoxResizeHandles
        width={textBox.width}
        height={textBox.height}
        onResizePointerDown={handleResizePointerDown}
      />
    </div>
  );
});

export default CanvasTextBox;
