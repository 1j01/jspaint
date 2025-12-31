import React, { useCallback, useEffect, useMemo, useState, Dispatch, SetStateAction } from "react";
import { Component } from "./Component";

// Extend Window interface for Local Font Access API
declare global {
	interface Window {
		queryLocalFonts?: () => Promise<{ family: string }[]>;
	}
}

interface FontBoxProps {
	fonts?: string[];
	defaultFamily?: string;
	defaultSize?: number;
	defaultFormatting?: {
		bold?: boolean;
		italic?: boolean;
		underline?: boolean;
		vertical?: boolean;
	};
	onChange?: (state: {
		family: string;
		size: number;
		bold: boolean;
		italic: boolean;
		underline: boolean;
		vertical: boolean;
	}) => void;
}

const FALLBACK_FONTS: string[] = [
	"Arial",
	"Calibri",
	"Cambria",
	"Courier New",
	"Georgia",
	"Helvetica",
	"Liberation Sans",
	"Times New Roman",
	"Trebuchet MS",
	"Verdana",
];

const ensureFonts = (fonts?: string[]): string[] => {
	const source = !fonts || !fonts.length ? FALLBACK_FONTS : fonts;
	return Array.from(new Set(source)).sort((a, b) => a.localeCompare(b));
};

const getFontLabel = (font: string): string => font.replace(/"/g, "").trim();

/**
 * React analogue of the legacy font selection window.
 * Handles font enumeration (with progressive enhancement) and exposes formatting toggles.
 */
export function FontBox({
	fonts: fontsProp,
	defaultFamily = "Arial",
	defaultSize = 12,
	defaultFormatting,
	onChange,
}: FontBoxProps) {
	const [availableFonts, setAvailableFonts] = useState(() => ensureFonts(fontsProp));
	const [family, setFamily] = useState(defaultFamily);
	const [size, setSize] = useState(defaultSize);
	const [bold, setBold] = useState(defaultFormatting?.bold ?? false);
	const [italic, setItalic] = useState(defaultFormatting?.italic ?? false);
	const [underline, setUnderline] = useState(defaultFormatting?.underline ?? false);
	const [vertical, setVertical] = useState(defaultFormatting?.vertical ?? false);
	const [loadingFonts, setLoadingFonts] = useState(false);
	const [fontError, setFontError] = useState<string | null>(null);

	useEffect(() => {
		if (!fontsProp || !fontsProp.length) {
			let cancelled = false;
			const loadFonts = async () => {
				if (typeof window === "undefined") {
					setAvailableFonts(ensureFonts(fontsProp));
					return;
				}
				setLoadingFonts(true);
				try {
					if (window.queryLocalFonts) {
						const fonts = await window.queryLocalFonts();
						if (cancelled) {
							return;
						}
						if (fonts.length) {
							const names = fonts.map((font) => font.family).filter(Boolean);
							setAvailableFonts(ensureFonts(names));
							setFontError(null);
							setLoadingFonts(false);
							return;
						}
					}
				} catch (error) {
					if (!cancelled) {
						// console.warn("Failed to enumerate local fonts", error);
						setFontError("Local font access denied or unavailable.");
					}
				}

				if (cancelled) {
					return;
				}
				try {
					if (typeof document !== "undefined" && document.fonts && document.fonts.size > 0) {
						const names = Array.from(document.fonts).map((fontFace) => fontFace.family);
						if (names.length) {
							setAvailableFonts(ensureFonts(names));
							setFontError(null);
							setLoadingFonts(false);
							return;
						}
					}
				} catch (error) {
					if (!cancelled) {
						// console.warn("Unable to read document fonts", error);
					}
				}

				if (!cancelled) {
					setAvailableFonts(ensureFonts(fontsProp));
					setLoadingFonts(false);
				}
			};

			loadFonts();
			return () => {
				cancelled = true;
			};
		}

		setAvailableFonts(ensureFonts(fontsProp));
	}, [fontsProp]);

	const formattingState = useMemo(
		() => ({
			family,
			size,
			bold,
			italic,
			underline,
			vertical,
		}),
		[family, size, bold, italic, underline, vertical],
	);

	useEffect(() => {
		onChange?.(formattingState);
	}, [formattingState, onChange]);

	const toggle = useCallback((setter: Dispatch<SetStateAction<boolean>>) => {
		setter((prev) => !prev);
	}, []);

	return (
		<Component title="Fonts" className="font-box-component" orientation="tall">
			<form className="font-box" aria-label="Font settings" onSubmit={(event) => event.preventDefault()}>
				<label className="sr-only" htmlFor="font-family-select">
					Font family
				</label>
				<select
					id="font-family-select"
					className="font-family-select"
					value={family}
					onChange={(event) => setFamily(event.target.value)}
					aria-describedby="font-family-status"
				>
					{availableFonts.map((font) => (
						<option key={font} value={font} style={{ fontFamily: font }}>
							{getFontLabel(font)}
						</option>
					))}
				</select>
				<label className="sr-only" htmlFor="font-size-input">
					Font size
				</label>
				<input
					id="font-size-input"
					type="number"
					min={6}
					max={200}
					value={size}
					onChange={(event) => setSize(Number(event.target.value) || defaultSize)}
					aria-label="Font size in points"
				/>
				<div className="font-style-toggles" role="toolbar" aria-label="Text formatting">
					<button
						type="button"
						className={bold ? "active" : ""}
						onClick={() => toggle(setBold)}
						aria-pressed={bold}
					>
						B
					</button>
					<button
						type="button"
						className={italic ? "active" : ""}
						onClick={() => toggle(setItalic)}
						aria-pressed={italic}
					>
						I
					</button>
					<button
						type="button"
						className={underline ? "active" : ""}
						onClick={() => toggle(setUnderline)}
						aria-pressed={underline}
					>
						U
					</button>
					<button
						type="button"
						className={vertical ? "active" : ""}
						onClick={() => toggle(setVertical)}
						aria-pressed={vertical}
						disabled
					>
						𖾓
					</button>
				</div>
				<p id="font-family-status" className="font-status" aria-live="polite">
					{loadingFonts
						? "Loading fonts…"
						: (fontError ??
							`Using ${availableFonts.length} font${availableFonts.length === 1 ? "" : "s"}.`)}
				</p>
			</form>
		</Component>
	);
}

export default FontBox;
