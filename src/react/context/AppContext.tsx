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

// Action types
const ActionTypes = {
	SET_PRIMARY_COLOR: "SET_PRIMARY_COLOR",
	SET_SECONDARY_COLOR: "SET_SECONDARY_COLOR",
	SWAP_COLORS: "SWAP_COLORS",
	SET_TOOL: "SET_TOOL",
	SET_CANVAS_SIZE: "SET_CANVAS_SIZE",
	SET_DRAWING: "SET_DRAWING",
	SET_BRUSH_SIZE: "SET_BRUSH_SIZE",
	SET_BRUSH_SHAPE: "SET_BRUSH_SHAPE",
	SET_CURSOR_POSITION: "SET_CURSOR_POSITION",
	SET_CLIPBOARD: "SET_CLIPBOARD",
	PUSH_UNDO: "PUSH_UNDO",
	UNDO: "UNDO",
	REDO: "REDO",
	CLEAR_HISTORY: "CLEAR_HISTORY",
	SET_SAVED: "SET_SAVED",
	SET_FILE_NAME: "SET_FILE_NAME",
	SET_SELECTION: "SET_SELECTION",
	CLEAR_SELECTION: "CLEAR_SELECTION",
	SET_MAGNIFICATION: "SET_MAGNIFICATION",
	SET_TEXT_BOX: "SET_TEXT_BOX",
	CLEAR_TEXT_BOX: "CLEAR_TEXT_BOX",
	SET_FONT_FAMILY: "SET_FONT_FAMILY",
	SET_FONT_SIZE: "SET_FONT_SIZE",
	SET_FONT_STYLE: "SET_FONT_STYLE",
	SET_FILL_STYLE: "SET_FILL_STYLE",
	SET_LINE_WIDTH: "SET_LINE_WIDTH",
	SET_ERASER_SIZE: "SET_ERASER_SIZE",
	SET_AIRBRUSH_SIZE: "SET_AIRBRUSH_SIZE",
	// View toggles
	TOGGLE_TOOL_BOX: "TOGGLE_TOOL_BOX",
	TOGGLE_COLOR_BOX: "TOGGLE_COLOR_BOX",
	TOGGLE_STATUS_BAR: "TOGGLE_STATUS_BAR",
	TOGGLE_TEXT_TOOLBAR: "TOGGLE_TEXT_TOOLBAR",
	TOGGLE_GRID: "TOGGLE_GRID",
	TOGGLE_THUMBNAIL: "TOGGLE_THUMBNAIL",
	TOGGLE_DRAW_OPAQUE: "TOGGLE_DRAW_OPAQUE",
};

// Reducer
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

// Context
const AppContext = createContext(null);

// Provider component
export function AppProvider({ children }) {
	const [state, dispatch] = useReducer(appReducer, initialState);

	// Canvas ref - shared across components
	const canvasRef = useRef(null);

	// Action creators
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

// Hook to use the context
export function useApp() {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useApp must be used within an AppProvider");
	}
	return context;
}

// Convenience hooks for specific parts of state
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
	};
}

export function useCursorPosition() {
	const { state, actions } = useApp();
	return {
		cursorPosition: state.cursorPosition,
		setCursorPosition: actions.setCursorPosition,
	};
}

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

export function useSelection() {
	const { state, actions, canvasRef } = useApp();
	return {
		selection: state.selection,
		setSelection: actions.setSelection,
		clearSelection: actions.clearSelection,
		hasSelection: state.selection !== null,
	};
}

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

export function useMagnification() {
	const { state, actions } = useApp();
	return {
		magnification: state.magnification,
		setMagnification: actions.setMagnification,
	};
}

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

export function useShapeSettings() {
	const { state, actions } = useApp();
	return {
		fillStyle: state.fillStyle,
		lineWidth: state.lineWidth,
		setFillStyle: actions.setFillStyle,
		setLineWidth: actions.setLineWidth,
	};
}

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

export function useFileState() {
	const { state, actions } = useApp();
	return {
		fileName: state.fileName,
		saved: state.saved,
		setFileName: actions.setFileName,
		setSaved: actions.setSaved,
	};
}

export default AppContext;
