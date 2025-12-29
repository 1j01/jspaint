import { forwardRef, CSSProperties, ChangeEvent, KeyboardEvent, FocusEvent } from "react";
import { TextBoxState } from "../context/AppContext";

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
 */
export const CanvasTextBox = forwardRef<HTMLTextAreaElement, CanvasTextBoxProps>(function CanvasTextBox(
	{ textBox, magnification, primaryColor, onChange, onKeyDown, onBlur },
	ref,
) {
	const containerStyle: CSSProperties = {
		position: "absolute",
		top: textBox.y * magnification,
		left: textBox.x * magnification,
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
