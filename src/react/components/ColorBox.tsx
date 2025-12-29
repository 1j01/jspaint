import React, { useCallback, useMemo, useState, useRef, useLayoutEffect, KeyboardEvent, PointerEvent } from "react";
import { DEFAULT_PALETTE } from "../data/palette";
import { Component } from "./Component";

interface ColorBoxProps {
	palette?: string[];
	initialPrimary?: string;
	initialSecondary?: string;
	onPrimaryChange?: (color: string) => void;
	onSecondaryChange?: (color: string) => void;
	onEditRequest?: (color: string, slot: "foreground" | "background") => void;
	vertical?: boolean;
}

const FALLBACK_PRIMARY = "rgb(0,0,0)";
const FALLBACK_SECONDARY = "rgb(255,255,255)";
const DOUBLE_CLICK_MS = 400;

const ensurePalette = (palette?: string[]): string[] => {
	if (!Array.isArray(palette) || palette.length === 0) {
		return DEFAULT_PALETTE;
	}
	return palette;
};

const normalizeColor = (color: string | undefined, fallback: string): string =>
	typeof color === "string" && color ? color : fallback;

/**
 * React-friendly recreation of the legacy Colors component using the classic styles.
 * Matches the legacy $ColorBox structure and behavior.
 */
export function ColorBox({
	palette: paletteProp,
	initialPrimary,
	initialSecondary,
	onPrimaryChange,
	onSecondaryChange,
	onEditRequest,
	vertical = false,
}: ColorBoxProps) {
	const palette = useMemo(() => ensurePalette(paletteProp ?? DEFAULT_PALETTE), [paletteProp]);
	const [foreground, setForeground] = useState(() => normalizeColor(initialPrimary, palette[0] ?? FALLBACK_PRIMARY));
	const [background, setBackground] = useState(() =>
		normalizeColor(initialSecondary, palette[palette.length - 1] ?? FALLBACK_SECONDARY),
	);

	// Ref for palette to calculate dimensions for 2-row layout
	const paletteRef = useRef<HTMLDivElement>(null);

	// Calculate palette dimensions to force 2-row layout (matches legacy behavior)
	useLayoutEffect(() => {
		const paletteEl = paletteRef.current;
		if (!paletteEl) return;

		const firstButton = paletteEl.querySelector(".color-button") as HTMLElement | null;
		if (!firstButton) return;

		const style = getComputedStyle(firstButton);
		const colorsPerRow = Math.ceil(palette.length / 2);

		if (vertical) {
			// Tall mode: set height to fit half the colors per column
			const heightPerButton =
				firstButton.offsetHeight + parseFloat(style.marginTop || "0") + parseFloat(style.marginBottom || "0");
			paletteEl.style.height = `${colorsPerRow * heightPerButton}px`;
			paletteEl.style.width = "";
		} else {
			// Wide mode: set width to fit half the colors per row
			const widthPerButton =
				firstButton.offsetWidth + parseFloat(style.marginLeft || "0") + parseFloat(style.marginRight || "0");
			paletteEl.style.width = `${colorsPerRow * widthPerButton}px`;
			paletteEl.style.height = "";
		}
	}, [palette.length, vertical]);

	// Double-click detection state (matches legacy behavior)
	const doubleClickState = useRef<{
		withinPeriod: boolean;
		button: number | null;
		timeout: ReturnType<typeof setTimeout> | null;
	}>({
		withinPeriod: false,
		button: null,
		timeout: null,
	});

	const setForegroundColor = useCallback(
		(color: string) => {
			setForeground(color);
			onPrimaryChange?.(color);
		},
		[onPrimaryChange],
	);

	const setBackgroundColor = useCallback(
		(color: string) => {
			setBackground(color);
			onSecondaryChange?.(color);
		},
		[onSecondaryChange],
	);

	// Swap foreground and background colors (click on current-colors)
	const swapColors = useCallback(() => {
		setForeground((currentFg) => {
			const newFg = background;
			setBackground(currentFg);
			onPrimaryChange?.(newFg);
			onSecondaryChange?.(currentFg);
			return newFg;
		});
	}, [background, onPrimaryChange, onSecondaryChange]);

	const handleCurrentColorsPointerDown = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			event.preventDefault();
			swapColors();
		},
		[swapColors],
	);

	const handleCurrentColorsKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				swapColors();
			}
		},
		[swapColors],
	);

	// Handle color button interaction (matches legacy pointerdown behavior)
	const handleColorButtonPointerDown = useCallback(
		(event: PointerEvent<HTMLDivElement>, color: string) => {
			event.preventDefault();

			// Determine which color slot to update based on button and modifiers
			// button 0 = left click = foreground
			// button 2 = right click = background
			// ctrl+click = ternary (not implemented yet, treat as foreground)
			const slot: "foreground" | "background" | null = event.ctrlKey
				? "foreground"
				: event.button === 0
					? "foreground"
					: event.button === 2
						? "background"
						: null;

			if (!slot) return;

			// Check for double-click
			const state = doubleClickState.current;
			if (state.withinPeriod && event.button === state.button) {
				// Double-click detected - open edit dialog
				onEditRequest?.(color, slot);
			} else {
				// Single click - set color
				if (slot === "foreground") {
					setForegroundColor(color);
				} else {
					setBackgroundColor(color);
				}
			}

			// Reset and start double-click timer
			if (state.timeout) {
				clearTimeout(state.timeout);
			}
			state.withinPeriod = true;
			state.button = event.button;
			state.timeout = setTimeout(() => {
				state.withinPeriod = false;
				state.button = null;
			}, DOUBLE_CLICK_MS);
		},
		[setForegroundColor, setBackgroundColor, onEditRequest],
	);

	// Prevent context menu on right-click (we handle it ourselves)
	const handleContextMenu = useCallback((event: React.MouseEvent) => {
		event.preventDefault();
	}, []);

	const handleColorButtonKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>, color: string) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				setForegroundColor(color);
			}
		},
		[setForegroundColor],
	);

	return (
		<Component title="Colors" className="colors-component" orientation={vertical ? "tall" : "wide"}>
			<div className="color-box" role="group" aria-label="Color palette">
				{/* Current colors display - click to swap */}
				<div
					className="current-colors swatch"
					role="button"
					tabIndex={0}
					aria-label={`Swap foreground ${foreground} and background ${background}`}
					onPointerDown={handleCurrentColorsPointerDown}
					onKeyDown={handleCurrentColorsKeyDown}
				>
					{/* Order matches legacy: background first (bottom-right), then foreground (top-left) */}
					<div
						className="swatch color-selection background-color"
						style={{ backgroundColor: background }}
						aria-hidden="true"
					/>
					<div
						className="swatch color-selection foreground-color"
						style={{ backgroundColor: foreground }}
						aria-hidden="true"
					/>
				</div>

				{/* Palette grid - sized to force 2-row layout */}
				<div ref={paletteRef} className="palette" role="listbox" aria-label="Available colors">
					{palette.map((color, index) => (
						<div
							key={`${index}-${color}`}
							className="swatch color-button"
							role="option"
							tabIndex={0}
							style={{ backgroundColor: color }}
							aria-label={`Color ${color}`}
							aria-selected={color === foreground}
							data-color={color}
							onPointerDown={(e) => handleColorButtonPointerDown(e, color)}
							onKeyDown={(e) => handleColorButtonKeyDown(e, color)}
							onContextMenu={handleContextMenu}
						/>
					))}
				</div>
			</div>
		</Component>
	);
}

export default ColorBox;
