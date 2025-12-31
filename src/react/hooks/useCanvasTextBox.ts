import { useCallback, useRef, RefObject } from "react";
import { TextBoxState, useColors, useToolStore, useSettingsStore } from "../context/state";
import { useShallow } from "zustand/react/shallow";

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
 */
export function useCanvasTextBox({ canvasRef }: UseCanvasTextBoxProps) {
	const { primaryColor } = useColors();

	// Use stores directly
	const { textBox, setTextBox, clearTextBox } = useToolStore(
		(state) => ({
			textBox: state.textBox,
			setTextBox: state.setTextBox,
			clearTextBox: state.clearTextBox,
		}),
		useShallow,
	);

	const { fontFamily, fontSize, fontBold, fontItalic, fontUnderline } = useSettingsStore(
		(state) => ({
			fontFamily: state.fontFamily,
			fontSize: state.fontSize,
			fontBold: state.fontBold,
			fontItalic: state.fontItalic,
			fontUnderline: state.fontUnderline,
		}),
		useShallow,
	);

	// Text box creation state
	const textBoxState = useRef<TextBoxCreationState>({
		isCreating: false,
		startX: 0,
		startY: 0,
	});

	// Start creating a text box
	const startTextBox = useCallback((x: number, y: number): void => {
		textBoxState.current = {
			isCreating: true,
			startX: x,
			startY: y,
		};
	}, []);

	// Finalize text box creation
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
				isActive: true,
			});

			textBoxState.current.isCreating = false;
		},
		[fontFamily, fontSize, fontBold, fontItalic, fontUnderline, setTextBox],
	);

	// Commit text box to canvas
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

		lines.forEach((line, index) => {
			ctx.fillText(line, textBox.x, textBox.y + index * lineHeight);

			// Draw underline if needed
			if (textBox.fontUnderline) {
				const textWidth = ctx.measureText(line).width;
				ctx.fillRect(textBox.x, textBox.y + index * lineHeight + textBox.fontSize + 1, textWidth, 1);
			}
		});

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

	return {
		textBox,
		textBoxState,
		startTextBox,
		finalizeTextBox,
		commitTextBox,
		clearTextBox,
		isCreating,
		updateText,
		fontFamily,
		fontSize,
		fontBold,
		fontItalic,
		fontUnderline,
	};
}
