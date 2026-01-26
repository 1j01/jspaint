import React from "react";
import { AIRBRUSH_SIZES } from "../../data/toolOptionsData";

interface AirbrushSizeOptionsProps {
  airbrushSize: number;
  onAirbrushSizeChange: (size: number) => void;
}

/**
 * Airbrush size options for Airbrush tool
 * Uses image sprite from images/options-airbrush-size.png (72x24 px, 3 sections)
 * Each section is 24px wide, displayed vertically to fit in 41x66px tool-options container
 */
export function AirbrushSizeOptions({ airbrushSize, onAirbrushSizeChange }: AirbrushSizeOptionsProps) {
  const imageWidth = 72;
  const imageHeight = 24;
  const numOptions = AIRBRUSH_SIZES.length; // 3
  const sectionWidth = imageWidth / numOptions; // 24px per section

  // Scale to fit: 3 options must fit in ~66px height, so ~20px each with some margin
  const displayHeight = 20;
  const displayWidth = Math.floor((sectionWidth * displayHeight) / imageHeight); // maintain aspect ratio (~20px)

  return (
    <div className="chooser choose-airbrush-size">
      {AIRBRUSH_SIZES.map((size, i) => {
        const isSelected = airbrushSize === size;
        const sourceX = sectionWidth * i;

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
              width={displayWidth}
              height={displayHeight}
              style={{ filter: isSelected ? "invert(1)" : "none" }}
              ref={(canvas) => {
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                // Load and draw the airbrush sprite section, scaled to fit
                const img = new Image();
                img.onload = () => {
                  ctx.clearRect(0, 0, displayWidth, displayHeight);
                  ctx.drawImage(
                    img,
                    sourceX,
                    0,
                    sectionWidth,
                    imageHeight, // source rectangle (full section)
                    0,
                    0,
                    displayWidth,
                    displayHeight, // destination rectangle (scaled)
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
