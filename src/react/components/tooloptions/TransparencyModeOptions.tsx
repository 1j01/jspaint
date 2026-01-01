import React from "react";

interface TransparencyModeOptionsProps {
	drawOpaque: boolean;
	onToggleDrawOpaque: () => void;
}

/**
 * Transparency mode options for Select and Text tools
 * Uses theme-specific sprite sheets via CSS background-image
 * Matches jQuery implementation: tool-options.js lines 396-416
 */
export function TransparencyModeOptions({ drawOpaque, onToggleDrawOpaque }: TransparencyModeOptionsProps) {
	// Source dimensions from sprite
	const sw = 35;
	const sh = 23;
	const b = 2; // border margin

	return (
		<div className="chooser choose-transparent-mode">
			{[false, true].map((transparent) => {
				const isSelected = !drawOpaque === transparent; // drawOpaque is inverse of transparent
				const sourceY = transparent ? 22 : 0; // Y offset in sprite sheet

				return (
					<div
						key={transparent ? "transparent" : "opaque"}
						className="chooser-option transparent-mode-option"
						onClick={onToggleDrawOpaque}
						style={{
							backgroundColor: isSelected ? "var(--Hilight, #000080)" : undefined,
							width: `${sw}px`,
							height: `${sh}px`,
							borderColor: "transparent",
							borderStyle: "solid",
							borderLeftWidth: `${b}px`,
							borderTopWidth: `${b}px`,
							borderRightWidth: `${b}px`,
							borderBottomWidth: `${b}px`,
							backgroundClip: "content-box",
							backgroundPosition: `0px ${-sourceY}px`,
							filter: isSelected ? "invert(1)" : "none",
						}}
					/>
				);
			})}
		</div>
	);
}
