/**
 * Custom hook for rendering text preview on canvas
 * Extracted from CanvasTextBox to reduce complexity
 *
 * Handles:
 * - Canvas text rendering with font styling
 * - Horizontal and vertical text modes
 * - Underline support
 * - Opaque/transparent background modes
 */

import { useEffect, RefObject } from "react";
import type { TextBoxState } from "../context/state/types";

/**
 * Line scale factor matching jQuery implementation (20/12 ≈ 1.667)
 * This determines the line height as a multiplier of font size
 */
const LINE_SCALE = 20 / 12;

/**
 * Parameters for the text canvas preview hook
 */
interface UseTextCanvasPreviewParams {
  /** Reference to the canvas element */
  canvasRef: RefObject<HTMLCanvasElement>;
  /** Text box state with text content and font settings */
  textBox: TextBoxState;
  /** Primary/foreground color for text */
  primaryColor: string;
  /** Secondary/background color for text box */
  secondaryColor: string;
  /** Whether to draw opaque background */
  drawOpaque: boolean;
}

/**
 * Renders text preview on a canvas element
 * Supports both horizontal and vertical text modes with underline
 *
 * @param params - Hook parameters
 * @returns void - Updates canvas via side effect
 *
 * @example
 * useTextCanvasPreview({
 *   canvasRef,
 *   textBox,
 *   primaryColor: "rgb(0,0,0)",
 *   secondaryColor: "rgb(255,255,255)",
 *   drawOpaque: true,
 * });
 */
export function useTextCanvasPreview({
  canvasRef,
  textBox,
  primaryColor,
  secondaryColor,
  drawOpaque,
}: UseTextCanvasPreviewParams): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background if opaque mode
      if (drawOpaque) {
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Render text preview on canvas
      if (textBox.text) {
        const fontString = `${textBox.fontItalic ? "italic " : ""}${textBox.fontBold ? "bold " : ""}${textBox.fontSize}px ${textBox.fontFamily}`;
        ctx.font = fontString;
        ctx.fillStyle = primaryColor;
        ctx.textBaseline = "top";

        const lines = textBox.text.split("\n");
        const lineHeight = textBox.fontSize * LINE_SCALE;

        if (textBox.fontVertical) {
          // Vertical text: rotate context 90 degrees and render from upper-right
          ctx.save();
          // Move to upper-right corner, then rotate
          ctx.translate(textBox.width, 0);
          ctx.rotate(Math.PI / 2); // Rotate 90 degrees clockwise

          // Character spacing for vertical text (use fontSize for vertical stacking)
          const charHeight = textBox.fontSize;

          lines.forEach((line, lineIndex) => {
            const chars = Array.from(line); // Handle multi-byte characters properly
            const rotatedY = lineIndex * lineHeight; // Positive to go left in original coords

            chars.forEach((char, charIndex) => {
              // Characters go downward (positive X after rotation)
              // Lines go leftward (positive Y moves left in original coords after 90° CW rotation)
              const rotatedX = charIndex * charHeight;
              ctx.fillText(char, rotatedX, rotatedY);
            });

            // Draw underline for the entire column (vertical line in display)
            // In rotated space: X spans the column height, Y is offset to the left of the column
            if (textBox.fontUnderline && chars.length > 0) {
              const columnLength = chars.length * charHeight;
              // Offset by fontSize + 2 in Y direction (appears to the left of text column in display)
              ctx.fillRect(0, rotatedY + textBox.fontSize + 2, columnLength, 1);
            }
          });

          ctx.restore();
        } else {
          // Horizontal text: render normally
          lines.forEach((line, index) => {
            const y = index * lineHeight;
            ctx.fillText(line, 0, y);

            // Draw underline if needed
            if (textBox.fontUnderline) {
              const metrics = ctx.measureText(line);
              // Use fillRect to match commit rendering
              ctx.fillRect(0, y + textBox.fontSize + 1, metrics.width, 1);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error rendering text preview:", error);
    }
  }, [
    canvasRef,
    textBox.text,
    textBox.width,
    textBox.height,
    textBox.fontFamily,
    textBox.fontSize,
    textBox.fontBold,
    textBox.fontItalic,
    textBox.fontUnderline,
    textBox.fontVertical,
    primaryColor,
    secondaryColor,
    drawOpaque,
  ]);
}

/**
 * Exported LINE_SCALE constant for use in other components
 */
export { LINE_SCALE };
