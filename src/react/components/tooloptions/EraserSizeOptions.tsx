import React from "react";
import { ERASER_SIZES } from "../../data/toolOptionsData";

interface EraserSizeOptionsProps {
	eraserSize: number;
	onEraserSizeChange: (size: number) => void;
}

/**
 * Eraser size options for Eraser tool
 * Matches original $choose_eraser_size - 39x16 canvases in column layout
 */
export function EraserSizeOptions({ eraserSize, onEraserSizeChange }: EraserSizeOptionsProps) {
	return (
		<div className="chooser choose-eraser">
			{ERASER_SIZES.map((size) => {
				const isSelected = eraserSize === size;
				return (
					<div
						key={size}
						className="chooser-option"
						onClick={() => onEraserSizeChange(size)}
						style={{ backgroundColor: isSelected ? "var(--Hilight, #000080)" : undefined }}
					>
						<canvas
							key={`eraser-${size}-${isSelected}`}
							width={39}
							height={16}
							ref={(canvas) => {
								if (!canvas) return;
								const ctx = canvas.getContext("2d");
								if (!ctx) return;
								ctx.clearRect(0, 0, 39, 16);

								ctx.fillStyle = isSelected ? "#ffffff" : "#000000";
								const x = (39 - size) / 2;
								const y = (16 - size) / 2;
								ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
							}}
						/>
					</div>
				);
			})}
		</div>
	);
}
