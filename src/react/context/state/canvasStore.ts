/**
 * Canvas State Store - Document and history management
 * Handles canvas dimensions, file state, and undo/redo
 */

import { create } from "zustand";
import { saveCanvasHistory, loadCanvasHistory, cleanupCanvasHistory } from "./persistence";

export interface CanvasState {
	// Canvas dimensions
	canvasWidth: number;
	canvasHeight: number;

	// File state
	fileName: string;
	saved: boolean;

	// History
	undoStack: string[]; // Store IDs pointing to IndexedDB entries
	redoStack: string[];
	maxHistorySize: number;

	// Actions
	setCanvasSize: (width: number, height: number) => void;
	setFileName: (name: string) => void;
	setSaved: (saved: boolean) => void;
	saveState: (imageData: ImageData) => Promise<void>;
	undo: () => Promise<ImageData | null>;
	redo: () => Promise<ImageData | null>;
	clearHistory: () => void;
}

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
}));
