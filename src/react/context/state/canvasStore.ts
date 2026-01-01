/**
 * Canvas State Store - Document and history management
 * Handles canvas dimensions, file state, and undo/redo
 */

import { create } from "zustand";
import { saveCanvasHistory, loadCanvasHistory, cleanupCanvasHistory, saveSetting, loadSetting } from "./persistence";

/**
 * Canvas state interface
 * Manages canvas document state and linear history (legacy undo/redo)
 */
export interface CanvasState {
	/**
	 * Canvas width in pixels
	 */
	canvasWidth: number;

	/**
	 * Canvas height in pixels
	 */
	canvasHeight: number;

	/**
	 * Current file name
	 */
	fileName: string;

	/**
	 * Whether the canvas has been saved (no unsaved changes)
	 */
	saved: boolean;

	/**
	 * Undo stack (stores IndexedDB IDs pointing to saved states)
	 */
	undoStack: string[];

	/**
	 * Redo stack (stores IndexedDB IDs pointing to saved states)
	 */
	redoStack: string[];

	/**
	 * Maximum number of history states to keep
	 */
	maxHistorySize: number;

	/**
	 * Set canvas dimensions
	 * @param {number} width - Canvas width in pixels
	 * @param {number} height - Canvas height in pixels
	 */
	setCanvasSize: (width: number, height: number) => void;

	/**
	 * Set file name
	 * @param {string} name - File name
	 */
	setFileName: (name: string) => void;

	/**
	 * Set saved state
	 * @param {boolean} saved - Whether the canvas is saved
	 */
	setSaved: (saved: boolean) => void;

	/**
	 * Save current canvas state to history
	 * @param {ImageData} imageData - Canvas image data to save
	 * @returns {Promise<void>}
	 */
	saveState: (imageData: ImageData) => Promise<void>;

	/**
	 * Undo to previous state
	 * @returns {Promise<ImageData | null>} Previous state image data, or null if no undo available
	 */
	undo: () => Promise<ImageData | null>;

	/**
	 * Redo to next state
	 * @returns {Promise<ImageData | null>} Next state image data, or null if no redo available
	 */
	redo: () => Promise<ImageData | null>;

	/**
	 * Clear all history (undo and redo stacks)
	 */
	clearHistory: () => void;

	/**
	 * Load persisted canvas state from IndexedDB
	 * @returns {Promise<void>}
	 */
	loadPersistedCanvasState: () => Promise<void>;
}

/**
 * Zustand store for canvas document state
 * Manages canvas dimensions, file state, and linear undo/redo history
 * @returns {CanvasState} The canvas state store
 */
export const useCanvasStore = create<CanvasState>((set, get) => ({
	// Initial values
	canvasWidth: 480,
	canvasHeight: 320,
	fileName: "untitled",
	saved: true,
	undoStack: [],
	redoStack: [],
	maxHistorySize: 50,

	// Actions
	setCanvasSize: (width, height) => {
		set({ canvasWidth: width, canvasHeight: height, saved: false });
		// Persist canvas dimensions
		saveSetting("canvasWidth", width);
		saveSetting("canvasHeight", height);
	},

	setFileName: (name) => {
		set({ fileName: name });
	},

	setSaved: (saved) => {
		set({ saved });
	},

	saveState: async (imageData) => {
		const { undoStack, maxHistorySize } = get();

		// Generate unique ID for this state
		const stateId = `state-${Date.now()}-${Math.random()}`;

		// Save to IndexedDB
		await saveCanvasHistory(stateId, imageData);

		// Add to undo stack
		const newUndoStack = [...undoStack, stateId];

		// Limit stack size
		if (newUndoStack.length > maxHistorySize) {
			newUndoStack.shift();
		}

		set({
			undoStack: newUndoStack,
			redoStack: [], // Clear redo stack on new action
			saved: false,
		});

		// Clean up old entries periodically
		if (Math.random() < 0.1) { // 10% chance
			cleanupCanvasHistory(maxHistorySize);
		}
	},

	undo: async () => {
		const { undoStack, redoStack } = get();

		if (undoStack.length === 0) return null;

		const newUndoStack = [...undoStack];
		const stateId = newUndoStack.pop();

		if (!stateId) return null;

		// Load the state from IndexedDB
		const imageData = await loadCanvasHistory(stateId);

		if (imageData) {
			set({
				undoStack: newUndoStack,
				redoStack: [...redoStack, stateId],
			});
		}

		return imageData;
	},

	redo: async () => {
		const { undoStack, redoStack } = get();

		if (redoStack.length === 0) return null;

		const newRedoStack = [...redoStack];
		const stateId = newRedoStack.pop();

		if (!stateId) return null;

		// Load the state from IndexedDB
		const imageData = await loadCanvasHistory(stateId);

		if (imageData) {
			set({
				undoStack: [...undoStack, stateId],
				redoStack: newRedoStack,
			});
		}

		return imageData;
	},

	clearHistory: () => {
		set({ undoStack: [], redoStack: [] });
	},

	loadPersistedCanvasState: async () => {
		const canvasWidth = await loadSetting("canvasWidth", 480);
		const canvasHeight = await loadSetting("canvasHeight", 320);
		set({ canvasWidth, canvasHeight });
	},
}));
