import { createContext, useCallback, useContext, useReducer, useRef } from "react";
import { DEFAULT_PALETTE } from "../data/palette";

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
};

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

// Initial state
const initialState = {
	// Colors
	primaryColor: DEFAULT_PALETTE[0],
	secondaryColor: DEFAULT_PALETTE[14], // White - matches original MS Paint
	palette: DEFAULT_PALETTE,

	// Tool
	selectedToolId: TOOL_IDS.PENCIL,

	// Canvas dimensions
	canvasWidth: 480,
	canvasHeight: 320,

	// Drawing state
	isDrawing: false,

	// Cursor position (for status bar)
	cursorPosition: null as { x: number; y: number } | null,

	// Brush settings
	brushSize: 4,
	brushShape: "circle" as "circle" | "square" | "reverse_diagonal" | "diagonal",
	pencilSize: 1,
	eraserSize: 8,
	airbrushSize: 9,

	// Shape settings (outline, fill, both)
	fillStyle: "outline" as "outline" | "fill" | "both",
	lineWidth: 1,

	// Selection state
	selection: null as Selection | null,

	// Text box state
	textBox: null as TextBoxState | null,

	// Text settings
	fontFamily: "Arial",
	fontSize: 12,
	fontBold: false,
	fontItalic: false,
	fontUnderline: false,
	textTransparent: false, // Transparency mode for text/select tools

	// Magnification
	magnification: 1,

	// Clipboard
	clipboard: null as ImageData | null,

	// History
	undoStack: [],
	redoStack: [],
	maxHistorySize: 50,

	// File state
	fileName: "untitled",
	saved: true,

	// View state - visibility toggles
	showToolBox: true,
	showColorBox: true,
	showStatusBar: true,
	showTextToolbar: false,
	showGrid: false,
	showThumbnail: false,

	// Image mode
	drawOpaque: true,
};

/**
 * Action types for the application reducer.
 * These define all possible state mutations in the app.
 * Organized by category: colors, tools, canvas, history, view, etc.
 */
const ActionTypes = {
	// Color actions
	SET_PRIMARY_COLOR: "SET_PRIMARY_COLOR",
	SET_SECONDARY_COLOR: "SET_SECONDARY_COLOR",
	SWAP_COLORS: "SWAP_COLORS",

	// Tool actions
	SET_TOOL: "SET_TOOL",
	SET_BRUSH_SIZE: "SET_BRUSH_SIZE",
	SET_BRUSH_SHAPE: "SET_BRUSH_SHAPE",
	SET_ERASER_SIZE: "SET_ERASER_SIZE",
	SET_AIRBRUSH_SIZE: "SET_AIRBRUSH_SIZE",

	// Canvas actions
	SET_CANVAS_SIZE: "SET_CANVAS_SIZE",
	SET_DRAWING: "SET_DRAWING",
	SET_CURSOR_POSITION: "SET_CURSOR_POSITION",

	// Clipboard actions
	SET_CLIPBOARD: "SET_CLIPBOARD",

	// History actions
	PUSH_UNDO: "PUSH_UNDO",
	UNDO: "UNDO",
	REDO: "REDO",
	CLEAR_HISTORY: "CLEAR_HISTORY",

	// File actions
	SET_SAVED: "SET_SAVED",
	SET_FILE_NAME: "SET_FILE_NAME",

	// Selection actions
	SET_SELECTION: "SET_SELECTION",
	CLEAR_SELECTION: "CLEAR_SELECTION",

	// View actions
	SET_MAGNIFICATION: "SET_MAGNIFICATION",

	// Text box actions
	SET_TEXT_BOX: "SET_TEXT_BOX",
	CLEAR_TEXT_BOX: "CLEAR_TEXT_BOX",
	SET_FONT_FAMILY: "SET_FONT_FAMILY",
	SET_FONT_SIZE: "SET_FONT_SIZE",
	SET_FONT_STYLE: "SET_FONT_STYLE",
	SET_TEXT_TRANSPARENT: "SET_TEXT_TRANSPARENT",

	// Shape actions
	SET_FILL_STYLE: "SET_FILL_STYLE",
	SET_LINE_WIDTH: "SET_LINE_WIDTH",

	// View toggles
	TOGGLE_TOOL_BOX: "TOGGLE_TOOL_BOX",
	TOGGLE_COLOR_BOX: "TOGGLE_COLOR_BOX",
	TOGGLE_STATUS_BAR: "TOGGLE_STATUS_BAR",
	TOGGLE_TEXT_TOOLBAR: "TOGGLE_TEXT_TOOLBAR",
	TOGGLE_GRID: "TOGGLE_GRID",
	TOGGLE_THUMBNAIL: "TOGGLE_THUMBNAIL",
	TOGGLE_DRAW_OPAQUE: "TOGGLE_DRAW_OPAQUE",
};

/**
 * Application reducer function.
 * Handles all state mutations based on dispatched actions.
 *
 * @param {Object} state - Current application state
 * @param {Object} action - Action object with type and optional payload
 * @returns {Object} New state object
 */
function appReducer(state, action) {
	switch (action.type) {
		case ActionTypes.SET_PRIMARY_COLOR:
			return { ...state, primaryColor: action.payload, saved: false };

		case ActionTypes.SET_SECONDARY_COLOR:
			return { ...state, secondaryColor: action.payload, saved: false };

		case ActionTypes.SWAP_COLORS:
			return {
				...state,
				primaryColor: state.secondaryColor,
				secondaryColor: state.primaryColor,
			};

		case ActionTypes.SET_TOOL:
			return { ...state, selectedToolId: action.payload };

		case ActionTypes.SET_CANVAS_SIZE:
			return {
				...state,
				canvasWidth: action.payload.width,
				canvasHeight: action.payload.height,
				saved: false,
			};

		case ActionTypes.SET_DRAWING:
			return { ...state, isDrawing: action.payload };

		case ActionTypes.SET_BRUSH_SIZE:
			return { ...state, brushSize: action.payload };

		case ActionTypes.SET_BRUSH_SHAPE:
			return { ...state, brushShape: action.payload };

		case ActionTypes.SET_ERASER_SIZE:
			return { ...state, eraserSize: action.payload };

		case ActionTypes.SET_AIRBRUSH_SIZE:
			return { ...state, airbrushSize: action.payload };

		case ActionTypes.SET_CURSOR_POSITION:
			return { ...state, cursorPosition: action.payload };

		case ActionTypes.SET_CLIPBOARD:
			return { ...state, clipboard: action.payload };

		case ActionTypes.PUSH_UNDO: {
			const newUndoStack = [...state.undoStack, action.payload];
			// Limit history size
			if (newUndoStack.length > state.maxHistorySize) {
				newUndoStack.shift();
			}
			return {
				...state,
				undoStack: newUndoStack,
				redoStack: [], // Clear redo stack on new action
				saved: false,
			};
		}

		case ActionTypes.UNDO: {
			if (state.undoStack.length === 0) return state;
			const newUndoStack = [...state.undoStack];
			const lastState = newUndoStack.pop();
			return {
				...state,
				undoStack: newUndoStack,
				redoStack: [...state.redoStack, action.payload], // Current state goes to redo
			};
		}

		case ActionTypes.REDO: {
			if (state.redoStack.length === 0) return state;
			const newRedoStack = [...state.redoStack];
			const redoState = newRedoStack.pop();
			return {
				...state,
				undoStack: [...state.undoStack, action.payload], // Current state goes to undo
				redoStack: newRedoStack,
			};
		}

		case ActionTypes.CLEAR_HISTORY:
			return { ...state, undoStack: [], redoStack: [] };

		case ActionTypes.SET_SAVED:
			return { ...state, saved: action.payload };

		case ActionTypes.SET_FILE_NAME:
			return { ...state, fileName: action.payload };

		case ActionTypes.SET_SELECTION:
			return { ...state, selection: action.payload };

		case ActionTypes.CLEAR_SELECTION:
			return { ...state, selection: null };

		case ActionTypes.SET_MAGNIFICATION:
			return { ...state, magnification: action.payload };

		case ActionTypes.SET_TEXT_BOX:
			return { ...state, textBox: action.payload };

		case ActionTypes.CLEAR_TEXT_BOX:
			return { ...state, textBox: null };

		case ActionTypes.SET_FONT_FAMILY:
			return { ...state, fontFamily: action.payload };

		case ActionTypes.SET_FONT_SIZE:
			return { ...state, fontSize: action.payload };

		case ActionTypes.SET_FONT_STYLE:
			return {
				...state,
				fontBold: action.payload.bold ?? state.fontBold,
				fontItalic: action.payload.italic ?? state.fontItalic,
				fontUnderline: action.payload.underline ?? state.fontUnderline,
			};

		case ActionTypes.SET_TEXT_TRANSPARENT:
			return { ...state, textTransparent: action.payload };

		case ActionTypes.SET_FILL_STYLE:
			return { ...state, fillStyle: action.payload };

		case ActionTypes.SET_LINE_WIDTH:
			return { ...state, lineWidth: action.payload };

		case ActionTypes.TOGGLE_TOOL_BOX:
			return { ...state, showToolBox: !state.showToolBox };

		case ActionTypes.TOGGLE_COLOR_BOX:
			return { ...state, showColorBox: !state.showColorBox };

		case ActionTypes.TOGGLE_STATUS_BAR:
			return { ...state, showStatusBar: !state.showStatusBar };

		case ActionTypes.TOGGLE_TEXT_TOOLBAR:
			return { ...state, showTextToolbar: !state.showTextToolbar };

		case ActionTypes.TOGGLE_GRID:
			return { ...state, showGrid: !state.showGrid };

		case ActionTypes.TOGGLE_THUMBNAIL:
			return { ...state, showThumbnail: !state.showThumbnail };

		case ActionTypes.TOGGLE_DRAW_OPAQUE:
			return { ...state, drawOpaque: !state.drawOpaque };

		default:
			return state;
	}
}

/**
 * Application context for global state management.
 * Provides state and actions to all child components via React Context.
 */
const AppContext = createContext(null);

/**
 * Application context provider component.
 * Manages global application state using useReducer and provides:
 * - state: Current application state (colors, tools, canvas, history, etc.)
 * - actions: Memoized action creators for state mutations
 * - canvasRef: Shared ref to the main drawing canvas
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with context
 * @returns {JSX.Element} Provider component wrapping children
 */
export function AppProvider({ children }) {
	const [state, dispatch] = useReducer(appReducer, initialState);

	// Canvas ref - shared across components
	const canvasRef = useRef(null);

	/**
	 * Action creators - memoized callbacks for dispatching state changes.
	 * Each action is wrapped in useCallback to prevent unnecessary re-renders.
	 */
	const actions = {
		setPrimaryColor: useCallback((color) => {
			dispatch({ type: ActionTypes.SET_PRIMARY_COLOR, payload: color });
		}, []),

		setSecondaryColor: useCallback((color) => {
			dispatch({ type: ActionTypes.SET_SECONDARY_COLOR, payload: color });
		}, []),

		swapColors: useCallback(() => {
			dispatch({ type: ActionTypes.SWAP_COLORS });
		}, []),

		setTool: useCallback((toolId) => {
			dispatch({ type: ActionTypes.SET_TOOL, payload: toolId });
		}, []),

		setCanvasSize: useCallback((width, height) => {
			dispatch({ type: ActionTypes.SET_CANVAS_SIZE, payload: { width, height } });
		}, []),

		setDrawing: useCallback((isDrawing) => {
			dispatch({ type: ActionTypes.SET_DRAWING, payload: isDrawing });
		}, []),

		setBrushSize: useCallback((size) => {
			dispatch({ type: ActionTypes.SET_BRUSH_SIZE, payload: size });
		}, []),

		setBrushShape: useCallback((shape: "circle" | "square" | "reverse_diagonal" | "diagonal") => {
			dispatch({ type: ActionTypes.SET_BRUSH_SHAPE, payload: shape });
		}, []),

		setEraserSize: useCallback((size) => {
			dispatch({ type: ActionTypes.SET_ERASER_SIZE, payload: size });
		}, []),

		setAirbrushSize: useCallback((size) => {
			dispatch({ type: ActionTypes.SET_AIRBRUSH_SIZE, payload: size });
		}, []),

		setCursorPosition: useCallback((position: { x: number; y: number } | null) => {
			dispatch({ type: ActionTypes.SET_CURSOR_POSITION, payload: position });
		}, []),

		setClipboard: useCallback((imageData: ImageData | null) => {
			dispatch({ type: ActionTypes.SET_CLIPBOARD, payload: imageData });
		}, []),

		pushUndo: useCallback((imageData) => {
			dispatch({ type: ActionTypes.PUSH_UNDO, payload: imageData });
		}, []),

		undo: useCallback((currentImageData) => {
			dispatch({ type: ActionTypes.UNDO, payload: currentImageData });
		}, []),

		redo: useCallback((currentImageData) => {
			dispatch({ type: ActionTypes.REDO, payload: currentImageData });
		}, []),

		clearHistory: useCallback(() => {
			dispatch({ type: ActionTypes.CLEAR_HISTORY });
		}, []),

		setSaved: useCallback((saved) => {
			dispatch({ type: ActionTypes.SET_SAVED, payload: saved });
		}, []),

		setFileName: useCallback((name) => {
			dispatch({ type: ActionTypes.SET_FILE_NAME, payload: name });
		}, []),

		setSelection: useCallback((selection: Selection | null) => {
			dispatch({ type: ActionTypes.SET_SELECTION, payload: selection });
		}, []),

		clearSelection: useCallback(() => {
			dispatch({ type: ActionTypes.CLEAR_SELECTION });
		}, []),

		setMagnification: useCallback((magnification: number) => {
			dispatch({ type: ActionTypes.SET_MAGNIFICATION, payload: magnification });
		}, []),

		setTextBox: useCallback((textBox: TextBoxState | null) => {
			dispatch({ type: ActionTypes.SET_TEXT_BOX, payload: textBox });
		}, []),

		clearTextBox: useCallback(() => {
			dispatch({ type: ActionTypes.CLEAR_TEXT_BOX });
		}, []),

		setFontFamily: useCallback((fontFamily: string) => {
			dispatch({ type: ActionTypes.SET_FONT_FAMILY, payload: fontFamily });
		}, []),

		setFontSize: useCallback((fontSize: number) => {
			dispatch({ type: ActionTypes.SET_FONT_SIZE, payload: fontSize });
		}, []),

		setFontStyle: useCallback((style: { bold?: boolean; italic?: boolean; underline?: boolean }) => {
			dispatch({ type: ActionTypes.SET_FONT_STYLE, payload: style });
		}, []),

		setTextTransparent: useCallback((transparent: boolean) => {
			dispatch({ type: ActionTypes.SET_TEXT_TRANSPARENT, payload: transparent });
		}, []),

		setFillStyle: useCallback((fillStyle: "outline" | "fill" | "both") => {
			dispatch({ type: ActionTypes.SET_FILL_STYLE, payload: fillStyle });
		}, []),

		setLineWidth: useCallback((lineWidth: number) => {
			dispatch({ type: ActionTypes.SET_LINE_WIDTH, payload: lineWidth });
		}, []),

		// View toggles
		toggleToolBox: useCallback(() => {
			dispatch({ type: ActionTypes.TOGGLE_TOOL_BOX });
		}, []),

		toggleColorBox: useCallback(() => {
			dispatch({ type: ActionTypes.TOGGLE_COLOR_BOX });
		}, []),

		toggleStatusBar: useCallback(() => {
			dispatch({ type: ActionTypes.TOGGLE_STATUS_BAR });
		}, []),

		toggleTextToolbar: useCallback(() => {
			dispatch({ type: ActionTypes.TOGGLE_TEXT_TOOLBAR });
		}, []),

		toggleGrid: useCallback(() => {
			dispatch({ type: ActionTypes.TOGGLE_GRID });
		}, []),

		toggleThumbnail: useCallback(() => {
			dispatch({ type: ActionTypes.TOGGLE_THUMBNAIL });
		}, []),

		toggleDrawOpaque: useCallback(() => {
			dispatch({ type: ActionTypes.TOGGLE_DRAW_OPAQUE });
		}, []),
	};
	const value = {
		state,
		actions,
		canvasRef,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to access the application context.
 * Must be used within an AppProvider component.
 *
 * @throws {Error} If used outside of AppProvider
 * @returns {Object} Application context containing state, actions, and canvasRef
 * @returns {AppState} state - Current application state
 * @returns {Object} actions - Action creators for state mutations
 * @returns {React.RefObject<HTMLCanvasElement>} canvasRef - Ref to main drawing canvas
 */
export function useApp() {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useApp must be used within an AppProvider");
	}
	return context;
}

/**
 * Convenience hook for color-related state and actions.
 * Provides access to primary/secondary colors, palette, and color manipulation.
 *
 * @returns {Object} Color state and actions
 * @returns {string} primaryColor - Current primary drawing color (left mouse button)
 * @returns {string} secondaryColor - Current secondary/background color (right mouse button)
 * @returns {string[]} palette - Array of available colors in the color palette
 * @returns {Function} setPrimaryColor - Set the primary color
 * @returns {Function} setSecondaryColor - Set the secondary color
 * @returns {Function} swapColors - Swap primary and secondary colors
 */
export function useColors() {
	const { state, actions } = useApp();
	return {
		primaryColor: state.primaryColor,
		secondaryColor: state.secondaryColor,
		palette: state.palette,
		setPrimaryColor: actions.setPrimaryColor,
		setSecondaryColor: actions.setSecondaryColor,
		swapColors: actions.swapColors,
	};
}

/**
 * Convenience hook for tool-related state and actions.
 * Provides access to selected tool, brush/eraser/airbrush settings, and tool configuration.
 *
 * @returns {Object} Tool state and actions
 * @returns {ToolId} selectedToolId - Currently selected tool ID (e.g., TOOL_IDS.PENCIL)
 * @returns {Function} setTool - Select a different tool
 * @returns {number} brushSize - Current brush size (4, 5, or 7 pixels)
 * @returns {BrushShape} brushShape - Current brush shape ("circle" | "square" | "diagonal" | "reverse_diagonal")
 * @returns {number} pencilSize - Pencil size (always 1)
 * @returns {number} eraserSize - Eraser size (4, 6, 8, or 10 pixels)
 * @returns {number} airbrushSize - Airbrush spray radius (9, 16, or 24 pixels)
 * @returns {Function} setBrushSize - Set brush size
 * @returns {Function} setBrushShape - Set brush shape
 * @returns {Function} setEraserSize - Set eraser size
 * @returns {Function} setAirbrushSize - Set airbrush size
 * @returns {boolean} textTransparent - Text/selection transparency mode
 * @returns {Function} setTextTransparent - Toggle text transparency
 */
export function useTool() {
	const { state, actions } = useApp();
	return {
		selectedToolId: state.selectedToolId,
		setTool: actions.setTool,
		brushSize: state.brushSize,
		brushShape: state.brushShape,
		pencilSize: state.pencilSize,
		eraserSize: state.eraserSize,
		airbrushSize: state.airbrushSize,
		setBrushSize: actions.setBrushSize,
		setBrushShape: actions.setBrushShape,
		setEraserSize: actions.setEraserSize,
		setAirbrushSize: actions.setAirbrushSize,
		textTransparent: state.textTransparent,
		setTextTransparent: actions.setTextTransparent,
	};
}

/**
 * Convenience hook for cursor position tracking.
 * Used by the status bar to display current mouse coordinates over the canvas.
 *
 * @returns {Object} Cursor position state and actions
 * @returns {{x: number, y: number} | null} cursorPosition - Current cursor position in canvas coordinates, or null if outside canvas
 * @returns {Function} setCursorPosition - Update cursor position (called on mousemove)
 */
export function useCursorPosition() {
	const { state, actions } = useApp();
	return {
		cursorPosition: state.cursorPosition,
		setCursorPosition: actions.setCursorPosition,
	};
}

/**
 * Convenience hook for canvas-related state and actions.
 * Provides access to the canvas element, dimensions, and drawing state.
 *
 * @returns {Object} Canvas state, actions, and ref
 * @returns {React.RefObject<HTMLCanvasElement>} canvasRef - Ref to the main drawing canvas element
 * @returns {number} canvasWidth - Canvas width in pixels
 * @returns {number} canvasHeight - Canvas height in pixels
 * @returns {boolean} isDrawing - Whether a drawing operation is in progress
 * @returns {Function} setCanvasSize - Resize the canvas (width, height)
 * @returns {Function} setDrawing - Set drawing state (used during pointer events)
 */
export function useCanvas() {
	const { state, actions, canvasRef } = useApp();
	return {
		canvasRef,
		canvasWidth: state.canvasWidth,
		canvasHeight: state.canvasHeight,
		isDrawing: state.isDrawing,
		setCanvasSize: actions.setCanvasSize,
		setDrawing: actions.setDrawing,
	};
}

/**
 * Hook for undo/redo history management.
 * Provides access to history stacks and actions to save/restore canvas state.
 * Implements linear undo/redo (not tree-based branching).
 *
 * @returns {Object} History state and actions
 * @returns {boolean} canUndo - Whether undo is available (undo stack not empty)
 * @returns {boolean} canRedo - Whether redo is available (redo stack not empty)
 * @returns {Function} saveState - Save current canvas state to undo stack
 * @returns {Function} undo - Restore previous canvas state
 * @returns {Function} redo - Restore next canvas state (after undo)
 * @returns {Function} clearHistory - Clear both undo and redo stacks
 */
export function useHistory() {
	const { state, actions, canvasRef } = useApp();

	const saveState = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		actions.pushUndo(imageData);
	}, [canvasRef, actions]);

	const undo = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || state.undoStack.length === 0) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Get the last undo state
		const previousState = state.undoStack[state.undoStack.length - 1];
		ctx.putImageData(previousState, 0, 0);

		actions.undo(currentImageData);
	}, [canvasRef, state.undoStack, actions]);

	const redo = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || state.redoStack.length === 0) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Get the last redo state
		const nextState = state.redoStack[state.redoStack.length - 1];
		ctx.putImageData(nextState, 0, 0);

		actions.redo(currentImageData);
	}, [canvasRef, state.redoStack, actions]);

	return {
		canUndo: state.undoStack.length > 0,
		canRedo: state.redoStack.length > 0,
		saveState,
		undo,
		redo,
		clearHistory: actions.clearHistory,
	};
}

/**
 * Hook for selection management.
 * Handles rectangular and free-form selections on the canvas.
 *
 * @returns {Object} Selection state and actions
 * @returns {Selection | null} selection - Current selection region with position, dimensions, and image data
 * @returns {Function} setSelection - Set or update the current selection
 * @returns {Function} clearSelection - Remove the current selection
 * @returns {boolean} hasSelection - Whether a selection exists
 */
export function useSelection() {
	const { state, actions, canvasRef } = useApp();
	return {
		selection: state.selection,
		setSelection: actions.setSelection,
		clearSelection: actions.clearSelection,
		hasSelection: state.selection !== null,
	};
}

/**
 * Hook for clipboard operations.
 * Provides cut, copy, and paste functionality for selections.
 *
 * @returns {Object} Clipboard state and actions
 * @returns {ImageData | null} clipboard - Current clipboard image data
 * @returns {boolean} hasClipboard - Whether clipboard contains data
 * @returns {Function} copy - Copy current selection to clipboard
 * @returns {Function} cut - Cut current selection (copy and clear from canvas)
 * @returns {Function} paste - Paste clipboard data as new selection at origin
 */
export function useClipboard() {
	const { state, actions, canvasRef } = useApp();

	const copy = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || !state.selection) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Get the image data from the selection area
		const { x, y, width, height } = state.selection;
		const imageData = ctx.getImageData(
			Math.min(x, x + width),
			Math.min(y, y + height),
			Math.abs(width),
			Math.abs(height),
		);
		actions.setClipboard(imageData);
	}, [canvasRef, state.selection, actions]);

	const cut = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || !state.selection) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Copy first
		const { x, y, width, height } = state.selection;
		const imageData = ctx.getImageData(
			Math.min(x, x + width),
			Math.min(y, y + height),
			Math.abs(width),
			Math.abs(height),
		);
		actions.setClipboard(imageData);

		// Then clear the selection area with background color
		ctx.fillStyle = state.secondaryColor;
		ctx.fillRect(Math.min(x, x + width), Math.min(y, y + height), Math.abs(width), Math.abs(height));
	}, [canvasRef, state.selection, state.secondaryColor, actions]);

	const paste = useCallback(() => {
		if (!state.clipboard) return;

		// Set the selection to the clipboard content, positioned at origin
		actions.setSelection({
			x: 0,
			y: 0,
			width: state.clipboard.width,
			height: state.clipboard.height,
			imageData: state.clipboard,
		});
	}, [state.clipboard, actions]);

	return {
		clipboard: state.clipboard,
		hasClipboard: state.clipboard !== null,
		copy,
		cut,
		paste,
	};
}

/**
 * Hook for magnification/zoom level management.
 * Controls canvas zoom (1x, 2x, 4x, 6x, 8x).
 *
 * @returns {Object} Magnification state and actions
 * @returns {number} magnification - Current zoom level (1, 2, 4, 6, or 8)
 * @returns {Function} setMagnification - Set zoom level
 */
export function useMagnification() {
	const { state, actions } = useApp();
	return {
		magnification: state.magnification,
		setMagnification: actions.setMagnification,
	};
}

/**
 * Hook for text box management.
 * Handles the text tool's editable text overlay on the canvas.
 *
 * @returns {Object} Text box state and actions
 * @returns {TextBoxState | null} textBox - Current text box with position, size, content, and formatting
 * @returns {Function} setTextBox - Create or update text box
 * @returns {Function} clearTextBox - Remove text box (commits text to canvas first)
 * @returns {string} fontFamily - Current font family (e.g., "Arial")
 * @returns {number} fontSize - Current font size in pixels
 * @returns {boolean} fontBold - Whether bold is enabled
 * @returns {boolean} fontItalic - Whether italic is enabled
 * @returns {boolean} fontUnderline - Whether underline is enabled
 * @returns {Function} setFontFamily - Set font family
 * @returns {Function} setFontSize - Set font size
 * @returns {Function} setFontStyle - Set font styles (bold, italic, underline)
 */
export function useTextBox() {
	const { state, actions } = useApp();
	return {
		textBox: state.textBox,
		setTextBox: actions.setTextBox,
		clearTextBox: actions.clearTextBox,
		fontFamily: state.fontFamily,
		fontSize: state.fontSize,
		fontBold: state.fontBold,
		fontItalic: state.fontItalic,
		fontUnderline: state.fontUnderline,
		setFontFamily: actions.setFontFamily,
		setFontSize: actions.setFontSize,
		setFontStyle: actions.setFontStyle,
	};
}

/**
 * Hook for shape drawing settings.
 * Controls how shapes (rectangle, ellipse, rounded rectangle, polygon) are drawn.
 *
 * @returns {Object} Shape settings state and actions
 * @returns {FillStyle} fillStyle - Shape fill mode ("outline" | "fill" | "both")
 * @returns {number} lineWidth - Line/outline width in pixels (1-5)
 * @returns {Function} setFillStyle - Set shape fill mode
 * @returns {Function} setLineWidth - Set line width
 */
export function useShapeSettings() {
	const { state, actions } = useApp();
	return {
		fillStyle: state.fillStyle,
		lineWidth: state.lineWidth,
		setFillStyle: actions.setFillStyle,
		setLineWidth: actions.setLineWidth,
	};
}

/**
 * Hook for view state management.
 * Controls visibility of UI components and view modes.
 *
 * @returns {Object} View state and toggle actions
 * @returns {boolean} showToolBox - Tool palette visibility
 * @returns {boolean} showColorBox - Color palette visibility
 * @returns {boolean} showStatusBar - Status bar visibility
 * @returns {boolean} showTextToolbar - Text formatting toolbar visibility
 * @returns {boolean} showGrid - Pixel grid visibility (at high zoom)
 * @returns {boolean} showThumbnail - Thumbnail preview visibility
 * @returns {boolean} drawOpaque - Whether to draw opaque (vs. transparent mode)
 * @returns {Function} toggleToolBox - Toggle tool palette
 * @returns {Function} toggleColorBox - Toggle color palette
 * @returns {Function} toggleStatusBar - Toggle status bar
 * @returns {Function} toggleTextToolbar - Toggle text toolbar
 * @returns {Function} toggleGrid - Toggle pixel grid
 * @returns {Function} toggleThumbnail - Toggle thumbnail preview
 * @returns {Function} toggleDrawOpaque - Toggle opaque drawing mode
 */
export function useViewState() {
	const { state, actions } = useApp();
	return {
		showToolBox: state.showToolBox,
		showColorBox: state.showColorBox,
		showStatusBar: state.showStatusBar,
		showTextToolbar: state.showTextToolbar,
		showGrid: state.showGrid,
		showThumbnail: state.showThumbnail,
		drawOpaque: state.drawOpaque,
		toggleToolBox: actions.toggleToolBox,
		toggleColorBox: actions.toggleColorBox,
		toggleStatusBar: actions.toggleStatusBar,
		toggleTextToolbar: actions.toggleTextToolbar,
		toggleGrid: actions.toggleGrid,
		toggleThumbnail: actions.toggleThumbnail,
		toggleDrawOpaque: actions.toggleDrawOpaque,
	};
}

/**
 * Hook for file state management.
 * Tracks document name and saved status.
 *
 * @returns {Object} File state and actions
 * @returns {string} fileName - Current document name (without extension)
 * @returns {boolean} saved - Whether document has unsaved changes
 * @returns {Function} setFileName - Set document name
 * @returns {Function} setSaved - Set saved status
 */
export function useFileState() {
	const { state, actions } = useApp();
	return {
		fileName: state.fileName,
		saved: state.saved,
		setFileName: actions.setFileName,
		setSaved: actions.setSaved,
	};
}

/**
 * Default export of the AppContext.
 * This is the raw context object - prefer using the useApp hook instead.
 */
export default AppContext;
