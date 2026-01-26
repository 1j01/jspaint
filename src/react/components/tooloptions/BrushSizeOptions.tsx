import React from "react";
import { BrushShape, BRUSH_OPTIONS } from "../../data/toolOptionsData";
import { drawBrushShape } from "../../utils/toolOptionsHelpers";

interface BrushSizeOptionsProps {
  brushSize: number;
  brushShape: BrushShape;
  onBrushChange: (size: number, shape: BrushShape) => void;
}

/**
 * Brush size and shape options for Brush tool
 * Matches original $choose_brush - 10x10 canvases in 3 columns × 4 rows (12 options total)
 */
export function BrushSizeOptions({ brushSize, brushShape, onBrushChange }: BrushSizeOptionsProps) {
  return (
    <div className="chooser choose-brush">
      {BRUSH_OPTIONS.map((option, index) => {
        const isSelected = brushSize === option.size && brushShape === option.shape;
        return (
          <div
            key={`${option.shape}-${option.size}-${index}`}
            className="chooser-option"
            onClick={() => onBrushChange(option.size, option.shape)}
            style={{ backgroundColor: isSelected ? "var(--Hilight, #000080)" : undefined }}
          >
            <canvas
              key={`brush-${option.shape}-${option.size}-${isSelected}`}
              width={10}
              height={10}
              ref={(canvas) => {
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.clearRect(0, 0, 10, 10);

                const color = isSelected ? "#ffffff" : "#000000";
                drawBrushShape(ctx, 5, 5, option.shape, option.size, color);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
