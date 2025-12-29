import React, { createContext, useContext, useReducer, useRef, useCallback } from "react";
import { DEFAULT_PALETTE } from "../data/palette.js";

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

// Initial state
const initialState = {
	// Colors
	primaryColor: DEFAULT_PALETTE[0],
	secondaryColor: DEFAULT_PALETTE[DEFAULT_PALETTE.length - 1],
	palette: DEFAULT_PALETTE,

	// Tool
	selectedToolId: TOOL_IDS.PENCIL,

	// Canvas dimensions
	canvasWidth: 480,
	canvasHeight: 320,

	// Drawing state
	isDrawing: false,

	// Brush settings
	brushSize: 4,
	pencilSize: 1,
	eraserSize: 8,

	// History
	undoStack: [],
	redoStack: [],
	maxHistorySize: 50,

	// File state
	fileName: "untitled",
	saved: true,
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
	PUSH_UNDO: "PUSH_UNDO",
	UNDO: "UNDO",
	REDO: "REDO",
	CLEAR_HISTORY: "CLEAR_HISTORY",
	SET_SAVED: "SET_SAVED",
	SET_FILE_NAME: "SET_FILE_NAME",
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
		pencilSize: state.pencilSize,
		eraserSize: state.eraserSize,
		setBrushSize: actions.setBrushSize,
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
		const ctx = canvas.getContext("2d");
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		actions.pushUndo(imageData);
	}, [canvasRef, actions]);

	const undo = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || state.undoStack.length === 0) return;

		const ctx = canvas.getContext("2d");
		const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Get the last undo state
		const previousState = state.undoStack[state.undoStack.length - 1];
		ctx.putImageData(previousState, 0, 0);

		actions.undo(currentImageData);
	}, [canvasRef, state.undoStack, actions]);

	const redo = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || state.redoStack.length === 0) return;

		const ctx = canvas.getContext("2d");
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

export default AppContext;
