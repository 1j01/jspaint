import React from "react";
import { AIRBRUSH_SIZES } from "../../data/toolOptionsData";

interface AirbrushSizeOptionsProps {
	airbrushSize: number;
	onAirbrushSizeChange: (size: number) => void;
}

/**
 * Airbrush size options for Airbrush tool
 * Uses image sprite from images/options-airbrush-size.png (72x23 px, 3 sections)
 */
export function AirbrushSizeOptions({ airbrushSize, onAirbrushSizeChange }: AirbrushSizeOptionsProps) {
	const imageWidth = 72;
	const imageHeight = 23;
	const numOptions = AIRBRUSH_SIZES.length; // 3

	return (
		<div className="chooser choose-airbrush-size">
			{AIRBRUSH_SIZES.map((size, i) => {
				const isSelected = airbrushSize === size;
				const isBottom = i === 2;
				const shrink = isBottom ? 0 : 4;
				const w = imageWidth / numOptions - shrink * 2;
				const sourceX = (imageWidth / numOptions) * i + shrink;

				return (
					<div
						key={size}
						className="chooser-option"
						onClick={() => onAirbrushSizeChange(size)}
						style={{
							backgroundColor: isSelected ? "var(--Hilight, #000080)" : "rgb(192, 192, 192)",
						}}
					>
						<canvas
							key={`airbrush-${size}-${isSelected}`}
							width={w}
							height={imageHeight}
							style={{ filter: isSelected ? "invert(1)" : "none" }}
							ref={(canvas) => {
								if (!canvas) return;
								const ctx = canvas.getContext("2d");
								if (!ctx) return;

								// Load and draw the airbrush sprite
								const img = new Image();
								img.onload = () => {
									ctx.clearRect(0, 0, w, imageHeight);
									ctx.drawImage(
										img,
										sourceX,
										0,
										w,
										imageHeight, // source rectangle
										0,
										0,
										w,
										imageHeight, // destination rectangle
									);
								};
								img.src = "/images/options-airbrush-size.png";
							}}
						/>
					</div>
				);
			})}
		</div>
	);
}
