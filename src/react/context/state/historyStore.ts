/**
 * History Store - Tree-based undo/redo with branching
 *
 * This store manages canvas history using a tree structure that allows:
 * - Non-linear undo/redo (branching timelines)
 * - Visual navigation through the history tree
 * - Preservation of alternate timelines
 * - Memory-efficient storage with IndexedDB
 */

import { create } from "zustand";
import { HistoryTree, type HistoryNode } from "../../utils/historyTree";

// Re-export HistoryNode for convenience
export type { HistoryNode };

/**
 * History state interface
 * Manages a tree-based history system for non-linear undo/redo
 */
export interface HistoryState {
	/**
	 * History tree instance containing all canvas states
	 */
	historyTree: HistoryTree | null;

	/**
	 * Quick access to current history node
	 */
	currentNode: HistoryNode | null;

	/**
	 * Initialize the history tree with an initial canvas state
	 * @param {ImageData} initialImageData - Initial canvas state
	 * @param {string} [name="Initial State"] - Name for the initial state
	 */
	initializeHistory: (initialImageData: ImageData, name?: string) => void;

	/**
	 * Push a new state to the history tree
	 * @param {ImageData} imageData - Canvas image data to save
	 * @param {string} name - Name/description of the change
	 * @param {Object} [options] - Optional metadata
	 * @param {ImageData | null} [options.selectionImageData] - Selection image data
	 * @param {number} [options.selectionX] - Selection X position
	 * @param {number} [options.selectionY] - Selection Y position
	 * @param {number} [options.selectionWidth] - Selection width
	 * @param {number} [options.selectionHeight] - Selection height
	 * @param {string} [options.textBoxText] - Text box content
	 * @param {number} [options.textBoxX] - Text box X position
	 * @param {number} [options.textBoxY] - Text box Y position
	 * @param {number} [options.textBoxWidth] - Text box width
	 * @param {number} [options.textBoxHeight] - Text box height
	 * @param {boolean} [options.soft] - Whether this is a soft state (skippable)
	 * @param {string} [options.foregroundColor] - Foreground color at time of change
	 * @param {string} [options.backgroundColor] - Background color at time of change
	 */
	pushState: (
		imageData: ImageData,
		name: string,
		options?: {
			selectionImageData?: ImageData | null;
			selectionX?: number;
			selectionY?: number;
			selectionWidth?: number;
			selectionHeight?: number;
			textBoxText?: string;
			textBoxX?: number;
			textBoxY?: number;
			textBoxWidth?: number;
			textBoxHeight?: number;
			soft?: boolean;
			foregroundColor?: string;
			backgroundColor?: string;
		}
	) => void;

	/**
	 * Undo to the previous state (skips soft states)
	 * @returns {HistoryNode | null} The previous state node, or null if at root
	 */
	undo: () => HistoryNode | null;

	/**
	 * Redo to the next state (skips soft states)
	 * @returns {HistoryNode | null} The next state node, or null if at leaf
	 */
	redo: () => HistoryNode | null;

	/**
	 * Jump to a specific node in the history tree by ID
	 * @param {string} nodeId - ID of the node to navigate to
	 * @returns {HistoryNode | null} The target node, or null if not found
	 */
	goToNode: (nodeId: string) => HistoryNode | null;

	/**
	 * Check if undo is available
	 * @returns {boolean} True if there are previous states to undo to
	 */
	canUndo: () => boolean;

	/**
	 * Check if redo is available
	 * @returns {boolean} True if there are future states to redo to
	 */
	canRedo: () => boolean;

	/**
	 * Get the root node of the history tree
	 * @returns {HistoryNode | null} The root node, or null if tree not initialized
	 */
	getRoot: () => HistoryNode | null;

	/**
	 * Get all nodes in the history tree (for visualization)
	 * @returns {HistoryNode[]} Array of all history nodes
	 */
	getAllNodes: () => HistoryNode[];

	/**
	 * Prune old history nodes to limit memory usage
	 * @param {number} [maxNodes=50] - Maximum number of nodes to keep
	 */
	pruneHistory: (maxNodes?: number) => void;

	/**
	 * Clear all history and reset the tree
	 */
	clearHistory: () => void;
}

/**
 * Zustand store for tree-based history management
 * Provides non-linear undo/redo with branching support
 * @returns {HistoryState} The history state store
 */
export const useHistoryStore = create<HistoryState>((set, get) => {
	// console.warn('[historyStore] 🏗️ Store created');

	return {
		historyTree: null,
		currentNode: null,

		initializeHistory: (initialImageData, name = "Initial State") => {
			// console.warn(`[historyStore.initializeHistory] Called with name: "${name}"`);
			const tree = new HistoryTree(initialImageData, name);
			set({
				historyTree: tree,
				currentNode: tree.getCurrent(),
			});
		},

	pushState: (imageData, name, options = {}) => {
		// console.warn(`[historyStore.pushState] 🔵 CALLED with name: "${name}"`);
		// console.trace('[historyStore.pushState] Call stack:');

		const { historyTree } = get();

		if (!historyTree) {
			// console.warn('[historyStore.pushState] 🟡 Initializing new history tree');
			// Initialize if not already done
			const tree = new HistoryTree(imageData, name);
			set({
				historyTree: tree,
				currentNode: tree.getCurrent(),
			});
			// console.warn('[historyStore.pushState] ✅ History tree initialized');
			return;
		}

		// console.warn('[historyStore.pushState] 🟢 Pushing to existing tree');
		const newNode = historyTree.push(imageData, name, options);
		set({ currentNode: newNode });
		// console.warn(`[historyStore.pushState] ✅ Pushed node: ${newNode.id}`);
	},

	undo: () => {
		const { historyTree } = get();
		if (!historyTree) return null;

		const node = historyTree.undo();
		if (node) {
			set({ currentNode: node });
		}
		return node;
	},

	redo: () => {
		const { historyTree } = get();
		if (!historyTree) return null;

		const node = historyTree.redo();
		if (node) {
			set({ currentNode: node });
		}
		return node;
	},

	goToNode: (nodeId) => {
		const { historyTree } = get();
		if (!historyTree) return null;

		const node = historyTree.goToNode(nodeId);
		if (node) {
			set({ currentNode: node });
		}
		return node;
	},

	canUndo: () => {
		const { historyTree } = get();
		return historyTree?.canUndo() ?? false;
	},

	canRedo: () => {
		const { historyTree } = get();
		return historyTree?.canRedo() ?? false;
	},

	getRoot: () => {
		const { historyTree } = get();
		return historyTree?.getRoot() ?? null;
	},

	getAllNodes: () => {
		const { historyTree } = get();
		return historyTree?.getAllNodes() ?? [];
	},

	pruneHistory: (maxNodes = 50) => {
		const { historyTree } = get();
		if (historyTree) {
			historyTree.prune(maxNodes);
			// Force re-render by updating currentNode reference
			set({ currentNode: historyTree.getCurrent() });
		}
	},

	clearHistory: () => {
		// console.warn('[historyStore.clearHistory] 🗑️ Clearing history');
		set({
			historyTree: null,
			currentNode: null,
		});
	},
}});
