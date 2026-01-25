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
import { useTranslation } from "react-i18next";
import { useDraggable } from "../hooks/useDraggable";
import { useSystemFonts } from "../hooks/useSystemFonts";
import { useFontFallback } from "../hooks/useFontFallback";
import { SelectWin98 } from "./SelectWin98";
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
	const { t } = useTranslation();
	const { fonts: availableFonts, loading: loadingFonts } = useSystemFonts();
	const windowRef = useRef<HTMLDivElement>(null);
	const [sizeInput, setSizeInput] = React.useState(fontState.size.toString());

	const { position, elementRef, handleProps, setPosition } = useDraggable({
		enabled: true,
		initialPosition: { x: 100, y: 100 },
	});

	// Update local size input when fontState.size changes externally
	useEffect(() => {
		setSizeInput(fontState.size.toString());
	}, [fontState.size]);

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

	/**
	 * Font fallback validation - matches jQuery $FontBox.js behavior
	 * Uses extracted hook to validate font availability and apply fallbacks
	 */
	useFontFallback({
		loadingFonts,
		availableFonts,
		fontState,
		onFontChange,
	});

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
			const value = e.target.value;
			setSizeInput(value); // Always update the input display to allow free typing
		},
		[],
	);

	const handleSizeBlur = useCallback(() => {
		const size = parseInt(sizeInput, 10);
		// On blur, validate and clamp to the range 8-72 (matching jQuery implementation)
		if (isNaN(size) || size < 8) {
			setSizeInput("8");
			onFontChange({ ...fontState, size: 8 });
		} else if (size > 72) {
			setSizeInput("72");
			onFontChange({ ...fontState, size: 72 });
		} else {
			// Valid size in range, update font state
			onFontChange({ ...fontState, size });
		}
	}, [sizeInput, fontState, onFontChange]);

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

	const windowStyle: React.CSSProperties = {
		position: "fixed",
		zIndex: 9999,
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
			className="font-box-window window os-window tool-window focused"
			style={windowStyle}
			role="dialog"
			aria-label={t("Fonts")}
		>
			<div className="window-titlebar" {...handleProps}>
				<div className="window-title-area">
					<span className="window-title">{t("Fonts")}</span>
				</div>
				<button
					className="window-close-button window-action-close window-button"
					aria-label={t("Close")}
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
					type="button"
				>
					<span className="window-button-icon"></span>
				</button>
			</div>
			<div className="window-content font-box-content">
				<div className="font-box font-box-controls">
					{/* Font Family Dropdown */}
					{loadingFonts ? (
						<div className="font-family-select inset-deep" style={{ padding: "2px 4px", height: "21px" }}>
							{t("Loading fonts...")}
						</div>
					) : (
						<SelectWin98
							className="font-family-select"
							value={fontState.family}
							onChange={(value) => onFontChange({ ...fontState, family: value })}
							options={availableFonts.map((font) => ({
								value: font,
								label: font,
								style: { fontFamily: font },
							}))}
							aria-label={t("Font Family")}
						/>
					)}

					{/* Font Size Input */}
					<input
						type="number"
						className="inset-deep"
						value={sizeInput}
						onChange={handleSizeChange}
						onBlur={handleSizeBlur}
						min={8}
						max={72}
						aria-label={t("Font Size")}
						style={{ maxWidth: 50 }}
					/>

					{/* Formatting Toggle Buttons */}
					<div className="font-style-toggles" role="toolbar" aria-label={t("Text formatting")}>
						<button
							type="button"
							className={`toggle ${fontState.bold ? "selected" : ""}`}
							onClick={toggleBold}
							aria-pressed={fontState.bold}
							aria-label={t("Bold")}
							title={t("Bold")}
						>
							<span className="icon" style={{ "--icon-index": 0 } as React.CSSProperties}></span>
						</button>
						<button
							type="button"
							className={`toggle ${fontState.italic ? "selected" : ""}`}
							onClick={toggleItalic}
							aria-pressed={fontState.italic}
							aria-label={t("Italic")}
							title={t("Italic")}
						>
							<span className="icon" style={{ "--icon-index": 1 } as React.CSSProperties}></span>
						</button>
						<button
							type="button"
							className={`toggle ${fontState.underline ? "selected" : ""}`}
							onClick={toggleUnderline}
							aria-pressed={fontState.underline}
							aria-label={t("Underline")}
							title={t("Underline")}
						>
							<span className="icon" style={{ "--icon-index": 2 } as React.CSSProperties}></span>
						</button>
						<button
							type="button"
							className={`toggle ${fontState.vertical ? "selected" : ""}`}
							onClick={toggleVertical}
							aria-pressed={fontState.vertical}
							aria-label={t("Vertical Writing Mode")}
							title={t("Vertical Writing Mode (Far East fonts only)")}
						>
							<span className="icon" style={{ "--icon-index": 3 } as React.CSSProperties}></span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);

	return createPortal(windowContent, document.body);
}

export default FontBoxWindow;
