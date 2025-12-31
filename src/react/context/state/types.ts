/**
 * TypeScript types and interfaces for the application state
 */

// Tool IDs matching legacy tools.js
export const TOOL_IDS = {
	FREE_FORM_SELECT: "free-form-select",
	SELECT: "select",
	ERASER: "eraser",
	FILL: "fill",
	PICK_COLOR: "pick-color",
	MAGNIFIER: "magnifier",
	PENCIL: "pencil",
	BRUSH: "brush",
	AIRBRUSH: "airbrush",
	TEXT: "text",
	LINE: "line",
	CURVE: "curve",
	RECTANGLE: "rectangle",
	POLYGON: "polygon",
	ELLIPSE: "ellipse",
	ROUNDED_RECTANGLE: "rounded-rectangle",
} as const;

export type ToolId = typeof TOOL_IDS[keyof typeof TOOL_IDS];

// Selection type
export interface Selection {
	x: number;
	y: number;
	width: number;
	height: number;
	imageData: ImageData | null;
	path?: Array<{ x: number; y: number }>; // For free-form selection
}

// Text box state
export interface TextBoxState {
	x: number;
	y: number;
	width: number;
	height: number;
	text: string;
	fontFamily: string;
	fontSize: number;
	fontBold: boolean;
	fontItalic: boolean;
	fontUnderline: boolean;
	isActive: boolean;
}

// Brush shape type
export type BrushShape = "circle" | "square" | "reverse_diagonal" | "diagonal";

// Fill style type
export type FillStyle = "outline" | "fill" | "both";

// Application state interface
export interface AppState {
	// Colors
	primaryColor: string;
	secondaryColor: string;
	palette: string[];

	// Tool
	selectedToolId: ToolId;

	// Canvas dimensions
	canvasWidth: number;
	canvasHeight: number;

	// Drawing state
	isDrawing: boolean;

	// Cursor position (for status bar)
	cursorPosition: { x: number; y: number } | null;

	// Brush settings
	brushSize: number;
	brushShape: BrushShape;
	pencilSize: number;
	eraserSize: number;
	airbrushSize: number;

	// Shape settings (outline, fill, both)
	fillStyle: FillStyle;
	lineWidth: number;

	// Selection state
	selection: Selection | null;

	// Text box state
	textBox: TextBoxState | null;

	// Text settings
	fontFamily: string;
	fontSize: number;
	fontBold: boolean;
	fontItalic: boolean;
	fontUnderline: boolean;
	textTransparent: boolean; // Transparency mode for text/select tools

	// Magnification
	magnification: number;

	// Clipboard
	clipboard: ImageData | null;

	// History
	undoStack: ImageData[];
	redoStack: ImageData[];
	maxHistorySize: number;

	// File state
	fileName: string;
	saved: boolean;

	// View state - visibility toggles
	showToolBox: boolean;
	showColorBox: boolean;
	showStatusBar: boolean;
	showTextToolbar: boolean;
	showGrid: boolean;
	showThumbnail: boolean;

	// Image mode
	drawOpaque: boolean;
}
