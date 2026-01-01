import React, { useEffect, useState } from "react";

interface TransparencyModeOptionsProps {
	drawOpaque: boolean;
	onToggleDrawOpaque: () => void;
}

/**
 * Transparency mode options for Select and Text tools
 * Uses theme-specific sprite sheets via CSS background-image
 * Matches jQuery implementation: tool-options.js lines 396-416
 *
 * The classic theme uses an overlapped border (shared between top and bottom options),
 * while modern themes use separate borders with gradients, requiring a 1px shift.
 */
export function TransparencyModeOptions({ drawOpaque, onToggleDrawOpaque }: TransparencyModeOptionsProps) {
	const [isModernTheme, setIsModernTheme] = useState(false);

	useEffect(() => {
		// Detect if modern theme is active
		// Check for theme class or CSS variable
		const checkTheme = () => {
			const isModern = document.documentElement.classList.contains('modern-theme') ||
				document.documentElement.classList.contains('modern-dark-theme') ||
				document.documentElement.classList.contains('bubblegum-theme');
			setIsModernTheme(isModern);
		};

		checkTheme();

		// Listen for theme changes
		const observer = new MutationObserver(checkTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});

		return () => observer.disconnect();
	}, []);

	// Source dimensions from sprite
	const sw = 35; // source width
	const sh = 23; // source height
	const b = 2; // border margin

	return (
		<div className="chooser choose-transparent-mode">
			{[false, true].map((transparent) => {
				const isSelected = !drawOpaque === transparent; // drawOpaque is inverse of transparent
				const sourceY = transparent ? 22 : 0; // Y offset in sprite sheet

				// The classic theme's transparency tool options spritesheet uses an
				// overlapped border, shared by the top and bottom options, as it is
				// simply a row of black for both, whereas the modern theme's spritesheet
				// uses a gradient in the border, and so does not use an overlap trick.
				const yShift = isModernTheme && transparent ? 1 : 0;

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
							backgroundPosition: `0px ${-(sourceY + yShift)}px`,
							filter: isSelected ? "invert(1)" : "none",
						}}
					/>
				);
			})}
		</div>
	);
}
