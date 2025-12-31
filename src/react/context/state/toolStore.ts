/**
 * Tool State Store - Active tool and drawing state
 * Session-only state (not persisted)
 */

import { create } from "zustand";

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

export type ToolId = (typeof TOOL_IDS)[keyof typeof TOOL_IDS];

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

export interface ToolState {
	// Current tool
	selectedToolId: ToolId;

	// Drawing state
	isDrawing: boolean;

	// Selection state
	selection: Selection | null;

	// Text box state
	textBox: TextBoxState | null;

	// Clipboard
	clipboard: ImageData | null;

	// Actions
	setTool: (toolId: ToolId) => void;
	setDrawing: (isDrawing: boolean) => void;
	setSelection: (selection: Selection | null) => void;
	clearSelection: () => void;
	setTextBox: (textBox: TextBoxState | null) => void;
	clearTextBox: () => void;
	setClipboard: (imageData: ImageData | null) => void;
}

export const useToolStore = create<ToolState>((set) => ({
	// Initial values
	selectedToolId: TOOL_IDS.PENCIL,
	isDrawing: false,
	selection: null,
	textBox: null,
	clipboard: null,

	// Actions
	setTool: (toolId) => set({ selectedToolId: toolId }),
	setDrawing: (isDrawing) => set({ isDrawing }),
	setSelection: (selection) => set({ selection }),
	clearSelection: () => set({ selection: null }),
	setTextBox: (textBox) => set({ textBox }),
	clearTextBox: () => set({ textBox: null }),
	setClipboard: (imageData) => set({ clipboard: imageData }),
}));
