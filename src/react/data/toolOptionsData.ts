// Line width options (matches original)
export const LINE_WIDTHS = [1, 2, 3, 4, 5];

// Brush shapes and sizes - matches original $choose_brush
// 4 shapes × 3 sizes = 12 options arranged in 3 columns × 4 rows
export type BrushShape = "circle" | "square" | "reverse_diagonal" | "diagonal";
export const BRUSH_SHAPES: BrushShape[] = ["circle", "square", "reverse_diagonal", "diagonal"];
export const CIRCULAR_BRUSH_SIZES = [7, 4, 1];
export const OTHER_BRUSH_SIZES = [8, 5, 2];

export interface BrushOption {
  shape: BrushShape;
  size: number;
}

// Generate all brush options (matches legacy tool-options.js)
export const BRUSH_OPTIONS: BrushOption[] = BRUSH_SHAPES.flatMap((shape) => {
  const sizes = shape === "circle" ? CIRCULAR_BRUSH_SIZES : OTHER_BRUSH_SIZES;
  return sizes.map((size) => ({ shape, size }));
});

// Eraser size options - matches original
export const ERASER_SIZES = [4, 6, 8, 10];

// Airbrush size options - matches original
export const AIRBRUSH_SIZES = [9, 16, 24];
