import React, { useCallback, useMemo, useState, KeyboardEvent, MouseEvent } from "react";
import { DEFAULT_PALETTE } from "../data/palette";
import { Component } from "./Component";

interface ColorBoxProps {
	palette?: string[];
	initialPrimary?: string;
	initialSecondary?: string;
	onPrimaryChange?: (color: string) => void;
	onSecondaryChange?: (color: string) => void;
	onEditRequest?: (primary: string, secondary: string) => void;
}

const FALLBACK_PRIMARY = "rgb(0,0,0)";
const FALLBACK_SECONDARY = "rgb(255,255,255)";

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
 */
export function ColorBox({
	palette: paletteProp,
	initialPrimary,
	initialSecondary,
	onPrimaryChange,
	onSecondaryChange,
	onEditRequest,
}: ColorBoxProps) {
	const palette = useMemo(() => ensurePalette(paletteProp ?? DEFAULT_PALETTE), [paletteProp]);
	const [primary, setPrimary] = useState(() => normalizeColor(initialPrimary, palette[0] ?? FALLBACK_PRIMARY));
	const [secondary, setSecondary] = useState(() =>
		normalizeColor(initialSecondary, palette[palette.length - 1] ?? FALLBACK_SECONDARY),
	);

	const emitPrimary = useCallback(
		(color: string) => {
			setPrimary(color);
			onPrimaryChange?.(color);
		},
		[onPrimaryChange],
	);

	const emitSecondary = useCallback(
		(color: string) => {
			setSecondary(color);
			onSecondaryChange?.(color);
		},
		[onSecondaryChange],
	);

	const swapColors = useCallback(() => {
		setPrimary((currentPrimary) => {
			const nextPrimary = secondary;
			setSecondary(currentPrimary);
			onPrimaryChange?.(nextPrimary);
			onSecondaryChange?.(currentPrimary);
			return nextPrimary;
		});
	}, [secondary, onPrimaryChange, onSecondaryChange]);

	const handleSwapKey = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				swapColors();
			}
		},
		[swapColors],
	);

	const handleEditRequest = useCallback(() => {
		onEditRequest?.(primary, secondary);
	}, [onEditRequest, primary, secondary]);

	const resolveColor = (color: string | undefined): string =>
		typeof color === "string" && color ? color : FALLBACK_PRIMARY;

	const handlePaletteInteraction = useCallback(
		(event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, color: string) => {
			const resolvedColor = resolveColor(color);
			if (event.type === "contextmenu" || ("button" in event && event.button === 2) || event.ctrlKey) {
				event.preventDefault();
				emitSecondary(resolvedColor);
				return;
			}
			emitPrimary(resolvedColor);
		},
		[emitPrimary, emitSecondary],
	);

	return (
		<Component title="Colors" className="colors-component" orientation="wide">
			<div className="color-box" role="group" aria-label="Color palette">
				<div
					className="current-colors swatch"
					role="button"
					tabIndex={0}
					aria-label={`Swap colors ${primary} and ${secondary}`}
					onClick={swapColors}
					onKeyDown={handleSwapKey}
				>
					{/* Order matches legacy: background first, then foreground */}
					<div
						className="swatch color-selection background-color"
						style={{ background: secondary }}
						aria-hidden="true"
					/>
					<div
						className="swatch color-selection foreground-color"
						style={{ background: primary }}
						aria-hidden="true"
					/>
				</div>
				<div className="palette" role="listbox" aria-label="Available colors">
					{palette.map((color, index) => {
						const resolvedColor = resolveColor(color);
						return (
							<div
								key={`${index}-${resolvedColor}`}
								className="swatch color-button"
								role="button"
								tabIndex={0}
								style={{ background: resolvedColor }}
								aria-label={`Select color ${resolvedColor}`}
								onClick={(event) => handlePaletteInteraction(event, color)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") handlePaletteInteraction(e, color);
								}}
								onContextMenu={(event) => handlePaletteInteraction(event, color)}
								onDoubleClick={handleEditRequest}
								data-color={resolvedColor}
							/>
						);
					})}
				</div>
			</div>
		</Component>
	);
}

export default ColorBox;
