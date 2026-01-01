import React from "react";

interface FillStyleOptionsProps {
	fillStyle: "outline" | "both" | "fill";
	onFillStyleChange: (style: "outline" | "both" | "fill") => void;
}

/**
 * Fill style options for shape tools (Rectangle, Ellipse, Rounded Rectangle, Polygon)
 * Matches original $ChooseShapeStyle - 39x21 canvases in column layout
 */
export function FillStyleOptions({ fillStyle, onFillStyleChange }: FillStyleOptionsProps) {
	return (
		<div className="chooser choose-shape-style">
			{(["outline", "both", "fill"] as const).map((style) => {
				const isSelected = fillStyle === style;
				return (
					<div
						key={style}
						className="chooser-option"
						onClick={() => onFillStyleChange(style)}
						style={{ backgroundColor: isSelected ? "var(--Hilight, #000080)" : undefined }}
					>
						<canvas
							key={`fill-${style}-${isSelected}`}
							width={39}
							height={21}
			ref={(canvas) => {
								if (!canvas) return;
								const ctx = canvas.getContext("2d");
								if (!ctx) return;
								ctx.clearRect(0, 0, 39, 21);

								const b = 5; // border inset
								const fillColor = isSelected ? "#ffffff" : "#000000";
								const bgColor = "#808080";

								ctx.fillStyle = fillColor;

								// Draw based on style
								if (style === "outline" || style === "both") {
									// Outline rectangle
									ctx.fillRect(b, b, 39 - b * 2, 21 - b * 2);
								}

								// Inner area
								const innerB = b + 1;
								if (style === "both") {
									ctx.fillStyle = bgColor;
									ctx.fillRect(innerB, innerB, 39 - innerB * 2, 21 - innerB * 2);
								} else if (style === "outline") {
									ctx.clearRect(innerB, innerB, 39 - innerB * 2, 21 - innerB * 2);
								} else if (style === "fill") {
									ctx.fillStyle = bgColor;
									ctx.fillRect(b, b, 39 - b * 2, 21 - b * 2);
								}
							}}
						/>
					</div>
				);
			})}
		</div>
	);
}
