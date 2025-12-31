import { forwardRef, CSSProperties, ChangeEvent, KeyboardEvent, FocusEvent } from "react";
import { TextBoxState } from "../context/state";

interface CanvasTextBoxProps {
	textBox: TextBoxState;
	magnification: number;
	primaryColor: string;
	onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
	onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
	onBlur: (e: FocusEvent<HTMLTextAreaElement>) => void;
}

/**
 * Text input overlay for the text tool
 * Positioned relative to .canvas-area border box, accounting for padding
 */
export const CanvasTextBox = forwardRef<HTMLTextAreaElement, CanvasTextBoxProps>(function CanvasTextBox(
	{ textBox, magnification, primaryColor, onChange, onKeyDown, onBlur },
	ref,
) {
	// Get .canvas-area padding to position correctly
	// Text box is absolutely positioned relative to .canvas-area border box
	// Canvas is at padding edge, so we add padding to align with canvas content
	const canvasArea = document.querySelector(".canvas-area");
	const padding = canvasArea
		? {
				left: parseFloat(window.getComputedStyle(canvasArea).paddingLeft) || 0,
				top: parseFloat(window.getComputedStyle(canvasArea).paddingTop) || 0,
			}
		: { left: 0, top: 0 };

	const containerStyle: CSSProperties = {
		position: "absolute",
		top: textBox.y * magnification + padding.top,
		left: textBox.x * magnification + padding.left,
		width: textBox.width * magnification,
		minHeight: textBox.height * magnification,
		border: "1px dashed #000",
		backgroundColor: "transparent",
	};

	const textareaStyle: CSSProperties = {
		width: "100%",
		height: "100%",
		minHeight: textBox.height * magnification,
		border: "none",
		background: "transparent",
		resize: "both",
		overflow: "hidden",
		font: `${textBox.fontItalic ? "italic " : ""}${textBox.fontBold ? "bold " : ""}${textBox.fontSize * magnification}px ${textBox.fontFamily}`,
		color: primaryColor,
		textDecoration: textBox.fontUnderline ? "underline" : "none",
		outline: "none",
		padding: 0,
		margin: 0,
	};

	return (
		<div className="text-box-container" style={containerStyle}>
			<textarea
				ref={ref}
				value={textBox.text}
				onChange={onChange}
				onKeyDown={onKeyDown}
				onBlur={onBlur}
				style={textareaStyle}
				aria-label="Text input"
			/>
		</div>
	);
});

export default CanvasTextBox;
