/**
 * TypeScript types and interfaces for the application state
 */

/**
 * Tool IDs matching legacy tools.js
 * Each ID corresponds to one of the 16 drawing tools available in MCPaint
 */
export const TOOL_IDS = {
  /** Free-form selection tool */
  FREE_FORM_SELECT: "free-form-select",
  /** Rectangular selection tool */
  SELECT: "select",
  /** Eraser tool */
  ERASER: "eraser",
  /** Fill/bucket tool */
  FILL: "fill",
  /** Color picker/eyedropper tool */
  PICK_COLOR: "pick-color",
  /** Magnifier/zoom tool */
  MAGNIFIER: "magnifier",
  /** Pencil tool */
  PENCIL: "pencil",
  /** Brush tool */
  BRUSH: "brush",
  /** Airbrush tool */
  AIRBRUSH: "airbrush",
  /** Text tool */
  TEXT: "text",
  /** Line tool */
  LINE: "line",
  /** Curve tool */
  CURVE: "curve",
  /** Rectangle tool */
  RECTANGLE: "rectangle",
  /** Polygon tool */
  POLYGON: "polygon",
  /** Ellipse tool */
  ELLIPSE: "ellipse",
  /** Rounded rectangle tool */
  ROUNDED_RECTANGLE: "rounded-rectangle",
} as const;

/**
 * Union type of all valid tool IDs
 */
export type ToolId = (typeof TOOL_IDS)[keyof typeof TOOL_IDS];

/**
 * Selection region interface
 * Represents a rectangular or free-form selected area on the canvas
 */
export interface Selection {
  /** X coordinate of selection (top-left corner) */
  x: number;
  /** Y coordinate of selection (top-left corner) */
  y: number;
  /** Width of selection in pixels */
  width: number;
  /** Height of selection in pixels */
  height: number;
  /** Image data captured from the selected region */
  imageData: ImageData | null;
  /** Path points for free-form selection (optional) */
  path?: Array<{ x: number; y: number }>;
}

/**
 * Text box state interface
 * Represents an active text editing box on the canvas
 */
export interface TextBoxState {
  /** X coordinate of text box */
  x: number;
  /** Y coordinate of text box */
  y: number;
  /** Width of text box in pixels */
  width: number;
  /** Height of text box in pixels */
  height: number;
  /** Current text content */
  text: string;
  /** Font family name */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Whether text is bold */
  fontBold: boolean;
  /** Whether text is italic */
  fontItalic: boolean;
  /** Whether text is underlined */
  fontUnderline: boolean;
  /** Whether text uses vertical writing mode (Far East fonts) */
  fontVertical: boolean;
  /** Whether the text box is currently active/editable */
  isActive: boolean;
}

/**
 * Brush shape type
 * Defines the available brush shapes for the brush tool
 */
export type BrushShape = "circle" | "square" | "reverse_diagonal" | "diagonal";

/**
 * Fill style type
 * Defines how shapes should be rendered (outline only, filled, or both)
 */
export type FillStyle = "outline" | "fill" | "both";

/**
 * Application state interface (legacy)
 * This represents the complete application state before Zustand migration
 * Kept for reference and backwards compatibility
 */
export interface AppState {
  // Colors
  /** Primary (left-click) drawing color */
  primaryColor: string;
  /** Secondary (right-click) drawing color */
  secondaryColor: string;
  /** Color palette (array of hex color strings) */
  palette: string[];

  // Tool
  /** Currently selected tool ID */
  selectedToolId: ToolId;

  // Canvas dimensions
  /** Canvas width in pixels */
  canvasWidth: number;
  /** Canvas height in pixels */
  canvasHeight: number;

  // Drawing state
  /** Whether user is currently drawing/dragging */
  isDrawing: boolean;

  // Cursor position (for status bar)
  /** Current cursor position in canvas coordinates */
  cursorPosition: { x: number; y: number } | null;

  // Brush settings
  /** Brush tool size in pixels */
  brushSize: number;
  /** Brush shape style */
  brushShape: BrushShape;
  /** Pencil tool size in pixels */
  pencilSize: number;
  /** Eraser tool size in pixels */
  eraserSize: number;
  /** Airbrush tool size in pixels */
  airbrushSize: number;

  // Shape settings (outline, fill, both)
  /** Shape fill style */
  fillStyle: FillStyle;
  /** Line width for shape tools */
  lineWidth: number;

  // Selection state
  /** Current selection region (if any) */
  selection: Selection | null;

  // Text box state
  /** Current text box (if any) */
  textBox: TextBoxState | null;

  // Text settings
  /** Font family for text tool */
  fontFamily: string;
  /** Font size for text tool in pixels */
  fontSize: number;
  /** Whether text should be bold */
  fontBold: boolean;
  /** Whether text should be italic */
  fontItalic: boolean;
  /** Whether text should be underlined */
  fontUnderline: boolean;
  /** Whether text uses vertical writing mode (Far East fonts) */
  fontVertical: boolean;
  /** Transparency mode for text/select tools */
  textTransparent: boolean;

  // Magnification
  /** Current zoom magnification level (1 = 100%, 2 = 200%, etc.) */
  magnification: number;

  // Clipboard
  /** Clipboard contents (ImageData from copy/cut operations) */
  clipboard: ImageData | null;

  // History
  /** Undo stack (array of ImageData) */
  undoStack: ImageData[];
  /** Redo stack (array of ImageData) */
  redoStack: ImageData[];
  /** Maximum number of history states to keep */
  maxHistorySize: number;

  // File state
  /** Current file name */
  fileName: string;
  /** Whether the canvas has been saved (no unsaved changes) */
  saved: boolean;

  // View state - visibility toggles
  /** Whether Tool Box panel is visible */
  showToolBox: boolean;
  /** Whether Color Box panel is visible */
  showColorBox: boolean;
  /** Whether status bar is visible */
  showStatusBar: boolean;
  /** Whether text formatting toolbar is visible */
  showTextToolbar: boolean;
  /** Whether pixel grid overlay is visible */
  showGrid: boolean;
  /** Whether thumbnail preview window is visible */
  showThumbnail: boolean;

  // Image mode
  /** Whether to draw in opaque mode (vs transparent) */
  drawOpaque: boolean;
}
