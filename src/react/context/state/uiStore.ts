/**
 * UI State Store - Window/panel visibility and view state
 * Persisted to IndexedDB for cross-session consistency
 */

import { create } from "zustand";
import { saveSetting, loadSetting } from "./persistence";

export type DialogName =
	| "about"
	| "flipRotate"
	| "stretchSkew"
	| "attributes"
	| "customZoom"
	| "loadFromUrl"
	| "helpTopics"
	| "editColors"
	| "imgurUpload"
	| "manageStorage"
	| "history"
	| "saveAs";

export interface UIState {
	// Panel visibility
	showToolBox: boolean;
	showColorBox: boolean;
	showStatusBar: boolean;
	showTextToolbar: boolean;
	showGrid: boolean;
	showThumbnail: boolean;

	// Magnification
	magnification: number;

	// Cursor position (for status bar)
	cursorPosition: { x: number; y: number } | null;

	// Dialog visibility (not persisted - session only)
	dialogs: Record<DialogName, boolean>;

	// Actions
	toggleToolBox: () => void;
	toggleColorBox: () => void;
	toggleStatusBar: () => void;
	toggleTextToolbar: () => void;
	toggleGrid: () => void;
	toggleThumbnail: () => void;
	setMagnification: (mag: number) => void;
	setCursorPosition: (position: { x: number; y: number } | null) => void;
	openDialog: (name: DialogName) => void;
	closeDialog: (name: DialogName) => void;
	loadPersistedUIState: () => Promise<void>;
}

export const useUIStore = create<UIState>((set, get) => ({
	// Initial values
	showToolBox: true,
	showColorBox: true,
	showStatusBar: true,
	showTextToolbar: false,
	showGrid: false,
	showThumbnail: false,
	magnification: 1,
	cursorPosition: null,

	// Dialog state (all closed initially)
	dialogs: {
		about: false,
		flipRotate: false,
		stretchSkew: false,
		attributes: false,
		customZoom: false,
		loadFromUrl: false,
		helpTopics: false,
		editColors: false,
		imgurUpload: false,
		manageStorage: false,
		history: false,
		saveAs: false,
	},

	// Actions with persistence
	toggleToolBox: () => {
		const newValue = !get().showToolBox;
		set({ showToolBox: newValue });
		saveSetting("showToolBox", newValue);
	},

	toggleColorBox: () => {
		const newValue = !get().showColorBox;
		set({ showColorBox: newValue });
		saveSetting("showColorBox", newValue);
	},

	toggleStatusBar: () => {
		const newValue = !get().showStatusBar;
		set({ showStatusBar: newValue });
		saveSetting("showStatusBar", newValue);
	},

	toggleTextToolbar: () => {
		const newValue = !get().showTextToolbar;
		set({ showTextToolbar: newValue });
		saveSetting("showTextToolbar", newValue);
	},

	toggleGrid: () => {
		const newValue = !get().showGrid;
		set({ showGrid: newValue });
		saveSetting("showGrid", newValue);
	},

	toggleThumbnail: () => {
		const newValue = !get().showThumbnail;
		set({ showThumbnail: newValue });
		saveSetting("showThumbnail", newValue);
	},

	setMagnification: (mag) => {
		set({ magnification: mag });
		saveSetting("magnification", mag);
	},

	setCursorPosition: (position) => {
		set({ cursorPosition: position });
		// Don't persist cursor position - it's ephemeral
	},

	// Dialog actions (not persisted)
	openDialog: (name) => {
		set((state) => ({
			dialogs: { ...state.dialogs, [name]: true },
		}));
	},

	closeDialog: (name) => {
		set((state) => ({
			dialogs: { ...state.dialogs, [name]: false },
		}));
	},

	// Load persisted UI state on app initialization
	loadPersistedUIState: async () => {
		const showToolBox = await loadSetting("showToolBox", true);
		const showColorBox = await loadSetting("showColorBox", true);
		const showStatusBar = await loadSetting("showStatusBar", true);
		const showTextToolbar = await loadSetting("showTextToolbar", false);
		const showGrid = await loadSetting("showGrid", false);
		const showThumbnail = await loadSetting("showThumbnail", false);
		const magnification = await loadSetting("magnification", 1);

		set({
			showToolBox,
			showColorBox,
			showStatusBar,
			showTextToolbar,
			showGrid,
			showThumbnail,
			magnification,
		});
	},
}));
