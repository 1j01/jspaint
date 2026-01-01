/**
 * FontBoxWindow - Floating font selection window for the text tool
 *
 * Matches the legacy $FontBox.js behavior:
 * - Appears when text tool is active or text box is being edited
 * - Draggable floating window
 * - Font family dropdown with local font enumeration
 * - Font size input
 * - Bold, Italic, Underline, Vertical toggle buttons
 * - Auto-repositions to avoid overlapping the text box
 */
import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDraggable } from "../hooks/useDraggable";
import { useSystemFonts } from "../hooks/useSystemFonts";
import "./FontBoxWindow.css";

interface FontState {
	family: string;
	size: number;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	vertical: boolean;
}

interface FontBoxWindowProps {
	isOpen: boolean;
	onClose: () => void;
	fontState: FontState;
	onFontChange: (state: FontState) => void;
	textBoxRect?: { x: number; y: number; width: number; height: number } | null;
	magnification?: number;
}

/**
 * FontBoxWindow - Floating font window
 * Appears when text tool is active or text box is being edited.
 * Matches the legacy $FontBox.js floating window behavior.
 *
 * Features:
 * - Draggable floating window (via useDraggable hook)
 * - Font family dropdown with Local Font Access API / FontDetective fallback
 * - Font size input (6-200 range)
 * - Bold, Italic, Underline, Vertical formatting toggle buttons
 * - Auto-repositions to avoid overlapping the text box
 * - Incremental font loading (updates dropdown as fonts are detected)
 * - Close button and Escape key support
 * - Portal-rendered (outside main DOM tree)
 *
 * Progressive font enumeration:
 * 1. Try Local Font Access API (window.queryLocalFonts)
 * 2. Fallback to FontDetective library (incremental detection)
 * 3. Fallback to FALLBACK_FONTS list
 *
 * @param {FontBoxWindowProps} props - Component props
 * @returns {JSX.Element | null} Floating font window or null if not open
 *
 * @example
 * <FontBoxWindow
 *   isOpen={showFontBox}
 *   onClose={() => setShowFontBox(false)}
 *   fontState={{ family: "Arial", size: 12, bold: false, italic: false, underline: false, vertical: false }}
 *   onFontChange={(state) => updateTextBoxFont(state)}
 *   textBoxRect={{ x: 100, y: 100, width: 200, height: 50 }}
 *   magnification={2}
 * />
 */
export function FontBoxWindow({
	isOpen,
	onClose,
	fontState,
	onFontChange,
	textBoxRect,
	magnification = 1,
}: FontBoxWindowProps) {
	const { fonts: availableFonts, loading: loadingFonts } = useSystemFonts();
	const windowRef = useRef<HTMLDivElement>(null);

	const { position, elementRef, handleProps, setPosition } = useDraggable({
		enabled: true,
		initialPosition: { x: 100, y: 100 },
	});

	// Auto-reposition to avoid overlapping the text box
	useEffect(() => {
		if (!isOpen || !textBoxRect || !windowRef.current) return;

		const windowRect = windowRef.current.getBoundingClientRect();
		const tbLeft = textBoxRect.x * magnification;
		const tbTop = textBoxRect.y * magnification;
		const tbRight = tbLeft + textBoxRect.width * magnification;
		const tbBottom = tbTop + textBoxRect.height * magnification;

		// Check if font box overlaps text box
		const fbLeft = position?.x ?? 100;
		const fbTop = position?.y ?? 100;
		const fbRight = fbLeft + windowRect.width;
		const fbBottom = fbTop + windowRect.height;

		const overlaps =
			fbLeft <= tbRight && tbLeft <= fbRight && fbTop <= tbBottom && tbTop <= fbBottom;

		if (overlaps) {
			// Move font box above the text box
			const newTop = Math.max(10, tbTop - windowRect.height - 10);
			setPosition({ x: fbLeft, y: newTop });
		}
	}, [isOpen, textBoxRect, magnification, position, setPosition]);

	// Handle keyboard events
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	const handleFamilyChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			onFontChange({ ...fontState, family: e.target.value });
		},
		[fontState, onFontChange],
	);

	const handleSizeChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const size = parseInt(e.target.value, 10);
			if (!isNaN(size) && size >= 6 && size <= 200) {
				onFontChange({ ...fontState, size });
			}
		},
		[fontState, onFontChange],
	);

	const toggleBold = useCallback(() => {
		onFontChange({ ...fontState, bold: !fontState.bold });
	}, [fontState, onFontChange]);

	const toggleItalic = useCallback(() => {
		onFontChange({ ...fontState, italic: !fontState.italic });
	}, [fontState, onFontChange]);

	const toggleUnderline = useCallback(() => {
		onFontChange({ ...fontState, underline: !fontState.underline });
	}, [fontState, onFontChange]);

	const toggleVertical = useCallback(() => {
		onFontChange({ ...fontState, vertical: !fontState.vertical });
	}, [fontState, onFontChange]);

	if (!isOpen) {
		return null;
	}

	// console.log("[FontBoxWindow] Rendering with isOpen:", isOpen, "position:", position);

	const windowStyle: React.CSSProperties = {
		position: "fixed",
		zIndex: 9999,
		backgroundColor: "#c0c0c0",
		border: "2px outset #c0c0c0",
		boxShadow: "2px 2px 8px rgba(0, 0, 0, 0.3)",
		minWidth: "280px",
		...(position
			? {
					left: position.x,
					top: position.y,
				}
			: {
					left: 100,
					top: 100,
				}),
	};

	const windowContent = (
		<div
			ref={(el) => {
				if (elementRef && typeof elementRef === "object") {
					(elementRef as { current: HTMLDivElement | null }).current = el;
				}
				windowRef.current = el;
			}}
			className="font-box-window window os-window tool-window"
			style={windowStyle}
			role="dialog"
			aria-label="Fonts"
		>
			<div className="window-titlebar" {...handleProps}>
				<div className="window-title-area">
					<span className="window-title">Fonts</span>
				</div>
				<button
					className="window-close-button window-action-close window-button"
					aria-label="Close"
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
				>
					<span className="window-button-icon"></span>
				</button>
			</div>
			<div className="window-content font-box-content">
				<div className="font-box-controls">
					{/* Font Family Dropdown */}
					<select
						className="font-family-select inset-deep"
						value={fontState.family}
						onChange={handleFamilyChange}
						aria-label="Font Family"
						disabled={loadingFonts}
					>
						{loadingFonts ? (
							<option>Loading fonts...</option>
						) : (
							availableFonts.map((font) => (
								<option key={font} value={font} style={{ fontFamily: font }}>
									{font}
								</option>
							))
						)}
					</select>

					{/* Font Size Input */}
					<input
						type="number"
						className="font-size-input inset-deep"
						value={fontState.size}
						onChange={handleSizeChange}
						min={6}
						max={200}
						aria-label="Font Size"
					/>

					{/* Formatting Toggle Buttons */}
					<div className="font-style-toggles" role="toolbar" aria-label="Text formatting">
						<button
							type="button"
							className={`toggle-button ${fontState.bold ? "selected" : ""}`}
							onClick={toggleBold}
							aria-pressed={fontState.bold}
							aria-label="Bold"
							title="Bold"
						>
							<span className="toggle-icon bold-icon">B</span>
						</button>
						<button
							type="button"
							className={`toggle-button ${fontState.italic ? "selected" : ""}`}
							onClick={toggleItalic}
							aria-pressed={fontState.italic}
							aria-label="Italic"
							title="Italic"
						>
							<span className="toggle-icon italic-icon">I</span>
						</button>
						<button
							type="button"
							className={`toggle-button ${fontState.underline ? "selected" : ""}`}
							onClick={toggleUnderline}
							aria-pressed={fontState.underline}
							aria-label="Underline"
							title="Underline"
						>
							<span className="toggle-icon underline-icon">U</span>
						</button>
						<button
							type="button"
							className={`toggle-button ${fontState.vertical ? "selected" : ""}`}
							onClick={toggleVertical}
							aria-pressed={fontState.vertical}
							aria-label="Vertical Writing Mode"
							title="Vertical Writing Mode (Far East fonts only)"
							disabled
						>
							<span className="toggle-icon vertical-icon">↕</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);

	return createPortal(windowContent, document.body);
}

export default FontBoxWindow;
