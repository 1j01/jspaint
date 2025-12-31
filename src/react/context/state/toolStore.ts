/**
 * Tool State Store - Active tool and drawing state
 * Session-only state (not persisted)
 */

import { create } from "zustand";
import { TOOL_IDS, type ToolId, type Selection, type TextBoxState } from "./types";

// Re-export for convenience
export { TOOL_IDS, type ToolId, type Selection, type TextBoxState };

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
