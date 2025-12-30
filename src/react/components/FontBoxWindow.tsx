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
import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useDraggable } from "../hooks/useDraggable";
import "./FontBoxWindow.css";

// Extend Window interface for Local Font Access API
declare global {
	interface Window {
		queryLocalFonts?: () => Promise<{ family: string }[]>;
	}
}

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

const FALLBACK_FONTS: string[] = [
	"Arial",
	"Calibri",
	"Cambria",
	"Comic Sans MS",
	"Courier New",
	"Georgia",
	"Helvetica",
	"Impact",
	"Liberation Sans",
	"Lucida Console",
	"Palatino Linotype",
	"Tahoma",
	"Times New Roman",
	"Trebuchet MS",
	"Verdana",
];

const ensureFonts = (fonts: string[]): string[] => {
	const source = !fonts || !fonts.length ? FALLBACK_FONTS : fonts;
	return Array.from(new Set(source)).sort((a, b) => a.localeCompare(b));
};

export function FontBoxWindow({
	isOpen,
	onClose,
	fontState,
	onFontChange,
	textBoxRect,
	magnification = 1,
}: FontBoxWindowProps) {
	const [availableFonts, setAvailableFonts] = useState<string[]>(() => ensureFonts([]));
	const [loadingFonts, setLoadingFonts] = useState(false);
	const windowRef = useRef<HTMLDivElement>(null);

	const { position, elementRef, handleProps, setPosition } = useDraggable({
		enabled: true,
		initialPosition: { x: 100, y: 100 },
	});

	// Load available fonts using Local Font Access API or fallback
	useEffect(() => {
		let cancelled = false;

		const loadFonts = async () => {
			if (typeof window === "undefined") {
				setAvailableFonts(ensureFonts([]));
				return;
			}

			setLoadingFonts(true);

			try {
				// Try Local Font Access API first
				if (window.queryLocalFonts) {
					const fonts = await window.queryLocalFonts();
					if (cancelled) return;

					if (fonts.length) {
						const familyNames = new Set<string>();
						for (const font of fonts) {
							if (!familyNames.has(font.family)) {
								familyNames.add(font.family);
							}
						}
						setAvailableFonts(ensureFonts(Array.from(familyNames)));
						setLoadingFonts(false);
						return;
					}
				}
			} catch (error) {
				if (!cancelled) {
					console.warn("Local Font Access API failed:", error);
				}
			}

			// Fallback to document.fonts
			try {
				if (typeof document !== "undefined" && document.fonts && document.fonts.size > 0) {
					const names = Array.from(document.fonts).map((fontFace) => fontFace.family);
					if (names.length) {
						setAvailableFonts(ensureFonts(names));
						setLoadingFonts(false);
						return;
					}
				}
			} catch (error) {
				if (!cancelled) {
					console.warn("Unable to read document fonts:", error);
				}
			}

			// Use fallback fonts
			if (!cancelled) {
				setAvailableFonts(ensureFonts([]));
				setLoadingFonts(false);
			}
		};

		loadFonts();

		return () => {
			cancelled = true;
		};
	}, []);

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

	const windowStyle: React.CSSProperties = {
		position: "fixed",
		zIndex: 999,
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
					onClick={onClose}
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
