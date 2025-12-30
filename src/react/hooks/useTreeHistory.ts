import { useCallback, useReducer, useRef } from "react";

/**
 * Tree-based history system for full undo/redo with branching support.
 *
 * This implements the same history model as the legacy MS Paint clone:
 * - Each history node has a parent and can have multiple "futures" (children)
 * - When you undo and make a change, a new branch is created
 * - The history tree preserves all past states, allowing navigation between branches
 */

export interface HistoryNode {
	id: string;
	parent: HistoryNode | null;
	futures: HistoryNode[]; // children / branches
	timestamp: number;
	soft: boolean; // soft states can be skipped during undo/redo
	name: string;
	imageData: ImageData | null;
	selectionImageData: ImageData | null;
	selectionX: number | null;
	selectionY: number | null;
	primaryColor: string;
	secondaryColor: string;
}

export interface HistoryState {
	root: HistoryNode | null;
	current: HistoryNode | null;
	undoPath: HistoryNode[]; // ancestors from current back to root
	redoPath: HistoryNode[]; // for linear redo navigation
}

type HistoryAction =
	| { type: "INITIALIZE"; node: HistoryNode }
	| { type: "PUSH"; node: HistoryNode }
	| { type: "UNDO" }
	| { type: "REDO" }
	| { type: "GOTO"; node: HistoryNode }
	| { type: "UPDATE_CURRENT"; imageData: ImageData }
	| { type: "CLEAR" };

function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Get all ancestors of a node (from parent up to root)
 */
function getAncestors(node: HistoryNode | null): HistoryNode[] {
	const ancestors: HistoryNode[] = [];
	let current = node?.parent;
	while (current) {
		ancestors.push(current);
		current = current.parent;
	}
	return ancestors;
}

/**
 * Build a path from root to node
 */
function getPathFromRoot(node: HistoryNode | null): HistoryNode[] {
	if (!node) return [];
	const path = getAncestors(node);
	path.reverse();
	return path;
}

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
	switch (action.type) {
		case "INITIALIZE": {
			return {
				root: action.node,
				current: action.node,
				undoPath: [],
				redoPath: [],
			};
		}

		case "PUSH": {
			if (!state.current) return state;

			// Add new node as a future of current
			state.current.futures.push(action.node);

			return {
				...state,
				current: action.node,
				undoPath: [...state.undoPath, state.current],
				redoPath: [], // Clear redo path when new action is taken
			};
		}

		case "UNDO": {
			if (state.undoPath.length === 0) return state;

			const newUndoPath = [...state.undoPath];
			let target = newUndoPath.pop()!;

			// Skip soft states
			while (target.soft && newUndoPath.length > 0) {
				target = newUndoPath.pop()!;
			}

			return {
				...state,
				current: target,
				undoPath: newUndoPath,
				redoPath: state.current ? [state.current, ...state.redoPath] : state.redoPath,
			};
		}

		case "REDO": {
			if (state.redoPath.length === 0) return state;

			const newRedoPath = [...state.redoPath];
			let target = newRedoPath.shift()!;

			// Skip soft states
			while (target.soft && newRedoPath.length > 0) {
				target = newRedoPath.shift()!;
			}

			return {
				...state,
				current: target,
				undoPath: state.current ? [...state.undoPath, state.current] : state.undoPath,
				redoPath: newRedoPath,
			};
		}

		case "GOTO": {
			if (!action.node) return state;

			// Build new undo path from root to the new target
			const newUndoPath = getPathFromRoot(action.node);

			return {
				...state,
				current: action.node,
				undoPath: newUndoPath,
				redoPath: [], // Clear redo when jumping to a specific node
			};
		}

		case "UPDATE_CURRENT": {
			if (!state.current) return state;

			// Update the image data of the current node
			state.current.imageData = action.imageData;

			return { ...state };
		}

		case "CLEAR": {
			return {
				root: null,
				current: null,
				undoPath: [],
				redoPath: [],
			};
		}

		default:
			return state;
	}
}

export interface TreeHistoryOptions {
	maxNodes?: number; // Optional limit on history size
	onHistoryChange?: (state: HistoryState) => void;
}

export interface TreeHistoryActions {
	initialize: (
		imageData: ImageData,
		primaryColor: string,
		secondaryColor: string,
	) => void;
	saveState: (
		name: string,
		imageData: ImageData,
		selection?: { imageData: ImageData | null; x: number; y: number } | null,
		colors?: { primary: string; secondary: string },
		soft?: boolean,
	) => void;
	undo: () => boolean;
	redo: () => boolean;
	goToNode: (node: HistoryNode) => void;
	updateCurrent: (imageData: ImageData) => void;
	clear: () => void;
	getState: () => HistoryState;
	canUndo: boolean;
	canRedo: boolean;
	current: HistoryNode | null;
	getAllNodes: () => HistoryNode[];
}

/**
 * Hook for tree-based history management
 */
export function useTreeHistory(options: TreeHistoryOptions = {}): TreeHistoryActions {
	const [state, dispatch] = useReducer(historyReducer, {
		root: null,
		current: null,
		undoPath: [],
		redoPath: [],
	});

	const stateRef = useRef(state);
	stateRef.current = state;

	// Initialize history with first state
	const initialize = useCallback(
		(imageData: ImageData, primaryColor: string, secondaryColor: string) => {
			const rootNode: HistoryNode = {
				id: generateId(),
				parent: null,
				futures: [],
				timestamp: Date.now(),
				soft: false,
				name: "New",
				imageData: imageData,
				selectionImageData: null,
				selectionX: null,
				selectionY: null,
				primaryColor,
				secondaryColor,
			};
			dispatch({ type: "INITIALIZE", node: rootNode });
			options.onHistoryChange?.(stateRef.current);
		},
		[options],
	);

	// Save a new state
	const saveState = useCallback(
		(
			name: string,
			imageData: ImageData,
			selection?: { imageData: ImageData | null; x: number; y: number } | null,
			colors?: { primary: string; secondary: string },
			soft = false,
		) => {
			const current = stateRef.current.current;
			if (!current) return;

			const newNode: HistoryNode = {
				id: generateId(),
				parent: current,
				futures: [],
				timestamp: Date.now(),
				soft,
				name,
				imageData: imageData,
				selectionImageData: selection?.imageData ?? null,
				selectionX: selection?.x ?? null,
				selectionY: selection?.y ?? null,
				primaryColor: colors?.primary ?? current.primaryColor,
				secondaryColor: colors?.secondary ?? current.secondaryColor,
			};

			dispatch({ type: "PUSH", node: newNode });
			options.onHistoryChange?.(stateRef.current);
		},
		[options],
	);

	// Undo
	const undo = useCallback((): boolean => {
		if (stateRef.current.undoPath.length === 0) return false;
		dispatch({ type: "UNDO" });
		options.onHistoryChange?.(stateRef.current);
		return true;
	}, [options]);

	// Redo
	const redo = useCallback((): boolean => {
		if (stateRef.current.redoPath.length === 0) return false;
		dispatch({ type: "REDO" });
		options.onHistoryChange?.(stateRef.current);
		return true;
	}, [options]);

	// Go to a specific node
	const goToNode = useCallback(
		(node: HistoryNode) => {
			dispatch({ type: "GOTO", node });
			options.onHistoryChange?.(stateRef.current);
		},
		[options],
	);

	// Update current node's image data
	const updateCurrent = useCallback((imageData: ImageData) => {
		dispatch({ type: "UPDATE_CURRENT", imageData });
	}, []);

	// Clear history
	const clear = useCallback(() => {
		dispatch({ type: "CLEAR" });
		options.onHistoryChange?.(stateRef.current);
	}, [options]);

	// Get current state
	const getState = useCallback(() => stateRef.current, []);

	// Get all nodes in the tree (for history view)
	const getAllNodes = useCallback((): HistoryNode[] => {
		const nodes: HistoryNode[] = [];
		const stack: HistoryNode[] = stateRef.current.root ? [stateRef.current.root] : [];

		while (stack.length > 0) {
			const node = stack.pop()!;
			nodes.push(node);
			stack.push(...node.futures);
		}

		return nodes.sort((a, b) => a.timestamp - b.timestamp);
	}, []);

	return {
		initialize,
		saveState,
		undo,
		redo,
		goToNode,
		updateCurrent,
		clear,
		getState,
		canUndo: state.undoPath.length > 0,
		canRedo: state.redoPath.length > 0,
		current: state.current,
		getAllNodes,
	};
}

/**
 * Get the tree structure for visualization
 */
export function getHistoryTreeData(root: HistoryNode | null): {
	nodes: Array<{ id: string; name: string; timestamp: number; depth: number; hasChildren: boolean }>;
	edges: Array<{ from: string; to: string }>;
} {
	if (!root) return { nodes: [], edges: [] };

	const nodes: Array<{ id: string; name: string; timestamp: number; depth: number; hasChildren: boolean }> = [];
	const edges: Array<{ from: string; to: string }> = [];

	function traverse(node: HistoryNode, depth: number) {
		nodes.push({
			id: node.id,
			name: node.name,
			timestamp: node.timestamp,
			depth,
			hasChildren: node.futures.length > 0,
		});

		for (const future of node.futures) {
			edges.push({ from: node.id, to: future.id });
			traverse(future, depth + 1);
		}
	}

	traverse(root, 0);

	return { nodes, edges };
}

export default useTreeHistory;
