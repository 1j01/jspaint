import React from "react";
import { LINE_WIDTHS } from "../../data/toolOptionsData";

interface LineWidthOptionsProps {
	lineWidth: number;
	onLineWidthChange: (width: number) => void;
}

/**
 * Line width options for Line and Curve tools
 * Matches original $choose_stroke_size - 39x12 canvases in column layout
 */
export function LineWidthOptions({ lineWidth, onLineWidthChange }: LineWidthOptionsProps) {
	return (
		<div className="chooser choose-stroke-size">
			{LINE_WIDTHS.map((width) => {
				const isSelected = lineWidth === width;
				return (
					<div
						key={width}
						className="chooser-option"
						onClick={() => onLineWidthChange(width)}
						style={{ backgroundColor: isSelected ? "var(--Hilight, #000080)" : undefined }}
					>
						<canvas
							key={`line-${width}-${isSelected}`}
							width={39}
							height={12}
							ref={(canvas) => {
								if (!canvas) return;
								const ctx = canvas.getContext("2d");
								if (!ctx) return;
								ctx.clearRect(0, 0, 39, 12);

								const b = 5; // border padding
								const centerY = (12 - width) / 2;
								ctx.fillStyle = isSelected ? "#ffffff" : "#000000";
								ctx.fillRect(b, Math.floor(centerY), 39 - b * 2, width);
							}}
						/>
					</div>
				);
			})}
		</div>
	);
}
