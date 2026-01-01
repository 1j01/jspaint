/**
 * Tool State Store - Active tool and drawing state
 * Session-only state (not persisted)
 */

import { create } from "zustand";
import { TOOL_IDS, type ToolId, type Selection, type TextBoxState } from "./types";

// Re-export for convenience
export { TOOL_IDS, type ToolId, type Selection, type TextBoxState };

/**
 * Tool state interface
 * Manages the currently selected tool and transient drawing state
 */
export interface ToolState {
	/**
	 * Currently selected tool ID
	 */
	selectedToolId: ToolId;

	/**
	 * Whether the user is currently drawing/dragging
	 */
	isDrawing: boolean;

	/**
	 * Active selection region (rectangular or free-form)
	 */
	selection: Selection | null;

	/**
	 * Active text box state (when text tool is active)
	 */
	textBox: TextBoxState | null;

	/**
	 * Clipboard contents (ImageData from copy/cut operations)
	 */
	clipboard: ImageData | null;

	/**
	 * Set the currently selected tool
	 * @param {ToolId} toolId - The ID of the tool to select
	 */
	setTool: (toolId: ToolId) => void;

	/**
	 * Set whether drawing is currently in progress
	 * @param {boolean} isDrawing - True if actively drawing
	 */
	setDrawing: (isDrawing: boolean) => void;

	/**
	 * Set the current selection region
	 * @param {Selection | null} selection - The selection region or null to clear
	 */
	setSelection: (selection: Selection | null) => void;

	/**
	 * Clear the current selection
	 */
	clearSelection: () => void;

	/**
	 * Set the current text box state
	 * @param {TextBoxState | null} textBox - The text box state or null to clear
	 */
	setTextBox: (textBox: TextBoxState | null) => void;

	/**
	 * Clear the current text box
	 */
	clearTextBox: () => void;

	/**
	 * Set clipboard contents
	 * @param {ImageData | null} imageData - The image data to store in clipboard
	 */
	setClipboard: (imageData: ImageData | null) => void;
}

/**
 * Zustand store for tool state
 * Manages current tool selection, drawing state, selections, text boxes, and clipboard
 * @returns {ToolState} The tool state store
 */
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
