import { useCallback, useRef, RefObject } from "react";
import { useColors } from "../context/state/useColors";
import { useToolStore } from "../context/state/toolStore";
import { useSettingsStore } from "../context/state/settingsStore";
import type { TextBoxState } from "../context/state/types";

export interface TextBoxCreationState {
	isCreating: boolean;
	startX: number;
	startY: number;
}

interface UseCanvasTextBoxProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
}

/**
 * Hook for handling text tool operations
 *
 * Manages the complete text box lifecycle:
 * - Creating new text boxes by dragging
 * - Displaying editable text box overlay
 * - Committing text to canvas with font styling
 * - Moving and resizing text boxes
 * - Font formatting (family, size, bold, italic, underline)
 *
 * Text box workflow:
 * 1. User drags to create text box bounds
 * 2. Text box appears with textarea for editing
 * 3. User types text and changes font settings
 * 4. On commit (blur or tool change), text is rendered to canvas
 *
 * @param {UseCanvasTextBoxProps} props - Hook configuration
 * @param {RefObject<HTMLCanvasElement | null>} props.canvasRef - Reference to the canvas element
 * @returns {Object} Text box state and control functions
 *
 * @example
 * const textBox = useCanvasTextBox({ canvasRef });
 * // Start creating text box
 * textBox.startTextBox(x, y);
 * // Finalize dimensions on mouse up
 * textBox.finalizeTextBox(x2, y2);
 * // User edits text...
 * textBox.updateText('Hello World');
 * // Commit to canvas
 * textBox.commitTextBox();
 */
export function useCanvasTextBox({ canvasRef }: UseCanvasTextBoxProps) {
	const { primaryColor } = useColors();

	// Use stores directly with individual selectors (no useShallow needed)
	const textBox = useToolStore((state) => state.textBox);
	const setTextBox = useToolStore((state) => state.setTextBox);
	const clearTextBox = useToolStore((state) => state.clearTextBox);

	const fontFamily = useSettingsStore((state) => state.fontFamily);
	const fontSize = useSettingsStore((state) => state.fontSize);
	const fontBold = useSettingsStore((state) => state.fontBold);
	const fontItalic = useSettingsStore((state) => state.fontItalic);
	const fontUnderline = useSettingsStore((state) => state.fontUnderline);
	const fontVertical = useSettingsStore((state) => state.fontVertical);

	// Text box creation state
	const textBoxState = useRef<TextBoxCreationState>({
		isCreating: false,
		startX: 0,
		startY: 0,
	});

	/**
	 * Start creating a text box
	 * @param {number} x - Start X coordinate
	 * @param {number} y - Start Y coordinate
	 */
	const startTextBox = useCallback((x: number, y: number): void => {
		textBoxState.current = {
			isCreating: true,
			startX: x,
			startY: y,
		};
	}, []);

	/**
	 * Finalize text box creation with final dimensions
	 * Creates the text box state with minimum size constraints
	 * @param {number} x - End X coordinate
	 * @param {number} y - End Y coordinate
	 */
	const finalizeTextBox = useCallback(
		(x: number, y: number): void => {
			if (!textBoxState.current.isCreating) return;

			const { startX, startY } = textBoxState.current;
			const width = Math.max(20, Math.abs(x - startX));
			const height = Math.max(10, Math.abs(y - startY));
			const boxX = Math.min(startX, x);
			const boxY = Math.min(startY, y);

			setTextBox({
				x: boxX,
				y: boxY,
				width,
				height,
				text: "",
				fontFamily,
				fontSize,
				fontBold,
				fontItalic,
				fontUnderline,
				fontVertical,
				isActive: true,
			});

		textBoxState.current.isCreating = false;
	},
	[fontFamily, fontSize, fontBold, fontItalic, fontUnderline, fontVertical, setTextBox],
);

	/**
	 * Commit text box to canvas
	 * Renders the text with current font settings and clears the text box
	 * Supports multi-line text, underline styling, and vertical text
	 */
	const commitTextBox = useCallback((): void => {
		if (!textBox || !textBox.text.trim()) {
			clearTextBox();
			return;
		}

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Build font string
		let fontStyle = "";
		if (textBox.fontItalic) fontStyle += "italic ";
		if (textBox.fontBold) fontStyle += "bold ";
		fontStyle += `${textBox.fontSize}px ${textBox.fontFamily}`;

		ctx.font = fontStyle;
		ctx.fillStyle = primaryColor;
		ctx.textBaseline = "top";

		// Split text into lines and draw each
		const lines = textBox.text.split("\n");
		const lineHeight = textBox.fontSize * 1.2;

		if (textBox.fontVertical) {
			// Vertical text: rotate context 90 degrees and render from upper-right
			ctx.save();
			// Move to upper-right corner of text box, then rotate
			ctx.translate(textBox.x + textBox.width, textBox.y);
			ctx.rotate(Math.PI / 2); // Rotate 90 degrees clockwise

			// Character spacing for vertical text (use fontSize for vertical stacking)
			const charHeight = textBox.fontSize;

			lines.forEach((line, lineIndex) => {
				const chars = Array.from(line); // Handle multi-byte characters properly
				chars.forEach((char, charIndex) => {
					// Characters go downward (positive X after rotation)
					// Lines go leftward (positive Y moves left in original coords after 90° CW rotation)
					const rotatedX = charIndex * charHeight;
					const rotatedY = lineIndex * lineHeight; // Positive to go left
					ctx.fillText(char, rotatedX, rotatedY);

					// Draw underline if needed (vertical line to the right of rotated character)
					if (textBox.fontUnderline) {
						const textWidth = ctx.measureText(char).width;
						// In rotated space, underline appears below the character (at rotatedX + fontSize + 1)
						// spanning the character width along the Y axis
						ctx.fillRect(rotatedX + textBox.fontSize + 1, rotatedY, 1, textWidth);
					}
				});
			});

			ctx.restore();
		} else {
			// Horizontal text: render normally
			lines.forEach((line, index) => {
				ctx.fillText(line, textBox.x, textBox.y + index * lineHeight);

				// Draw underline if needed
				if (textBox.fontUnderline) {
					const textWidth = ctx.measureText(line).width;
					ctx.fillRect(textBox.x, textBox.y + index * lineHeight + textBox.fontSize + 1, textWidth, 1);
				}
			});
		}

		clearTextBox();
	}, [textBox, primaryColor, canvasRef, clearTextBox]);

	// Check if currently creating
	const isCreating = useCallback((): boolean => {
		return textBoxState.current.isCreating;
	}, []);

	// Update text box text
	const updateText = useCallback(
		(newText: string): void => {
			if (textBox) {
				setTextBox({
					...textBox,
					text: newText,
				});
			}
		},
		[textBox, setTextBox],
	);

	// Move text box
	const moveTextBox = useCallback(
		(x: number, y: number): void => {
			if (textBox) {
				setTextBox({
					...textBox,
					x,
					y,
				});
			}
		},
		[textBox, setTextBox],
	);

	// Resize text box
	const resizeTextBox = useCallback(
		(width: number, height: number): void => {
			if (textBox) {
				setTextBox({
					...textBox,
					width,
					height,
				});
			}
		},
		[textBox, setTextBox],
	);

	// Get current drag bounds for preview
	const getDragBounds = useCallback(():  { x: number; y: number; width: number; height: number } | null => {
		if (!textBoxState.current.isCreating) return null;
		return {
			x: textBoxState.current.startX,
			y: textBoxState.current.startY,
			width: 0,
			height: 0,
		};
	}, []);

	return {
		textBox,
		textBoxState,
		startTextBox,
		finalizeTextBox,
		commitTextBox,
		clearTextBox,
		isCreating,
		updateText,
		moveTextBox,
		resizeTextBox,
		fontFamily,
		fontSize,
		fontBold,
		fontItalic,
		fontUnderline,
	};
}
