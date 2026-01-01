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
			const width = Math.max(50, Math.abs(x - startX));
			const height = Math.max(20, Math.abs(y - startY));
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
	 * Uses SVG foreignObject approach to support vertical text via CSS
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

		// Create SVG with foreignObject containing styled textarea (same as preview)
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("version", "1.1");
		svg.setAttribute("width", textBox.width.toString());
		svg.setAttribute("height", textBox.height.toString());

		const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
		foreignObject.setAttribute("x", "0");
		foreignObject.setAttribute("y", "0");
		foreignObject.setAttribute("width", textBox.width.toString());
		foreignObject.setAttribute("height", textBox.height.toString());

		const textarea = document.createElement("textarea");
		textarea.value = textBox.text;
		textarea.style.cssText = `
			position: absolute;
			left: 0;
			top: 0;
			right: 0;
			bottom: 0;
			padding: 0;
			margin: 0;
			border: 0;
			resize: none;
			overflow: hidden;
			width: ${textBox.width}px;
			height: ${textBox.height}px;
			font-family: ${textBox.fontFamily};
			font-size: ${textBox.fontSize}px;
			font-weight: ${textBox.fontBold ? "bold" : "normal"};
			font-style: ${textBox.fontItalic ? "italic" : "normal"};
			text-decoration: ${textBox.fontUnderline ? "underline" : "none"};
			writing-mode: ${textBox.fontVertical ? "vertical-lr" : "horizontal-tb"};
			-ms-writing-mode: ${textBox.fontVertical ? "tb-lr" : "lr-tb"};
			-webkit-writing-mode: ${textBox.fontVertical ? "vertical-lr" : "horizontal-tb"};
			line-height: ${Math.round(textBox.fontSize * 1.2)}px;
			color: ${primaryColor};
			background: transparent;
		`;

		foreignObject.appendChild(textarea);
		svg.appendChild(foreignObject);

		const svgSource = new XMLSerializer().serializeToString(svg);
		const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgSource)}`;

		const img = new Image();
		img.onload = () => {
			// Draw the rendered text to the main canvas
			ctx.drawImage(img, textBox.x, textBox.y);
			clearTextBox();
		};
		img.onerror = (event) => {
			console.error("Failed to render text to canvas", event);
			clearTextBox();
		};
		img.src = dataUrl;
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
