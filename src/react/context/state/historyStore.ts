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

export interface HistoryState {
	// History tree instance
	historyTree: HistoryTree | null;

	// Quick access to current state
	currentNode: HistoryNode | null;

	// Actions
	initializeHistory: (initialImageData: ImageData, name?: string) => void;
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
	undo: () => HistoryNode | null;
	redo: () => HistoryNode | null;
	goToNode: (nodeId: string) => HistoryNode | null;
	canUndo: () => boolean;
	canRedo: () => boolean;
	getRoot: () => HistoryNode | null;
	getAllNodes: () => HistoryNode[];
	pruneHistory: (maxNodes?: number) => void;
	clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => {
	console.warn('[historyStore] 🏗️ Store created');

	return {
		historyTree: null,
		currentNode: null,

		initializeHistory: (initialImageData, name = "Initial State") => {
			console.warn(`[historyStore.initializeHistory] Called with name: "${name}"`);
			const tree = new HistoryTree(initialImageData, name);
			set({
				historyTree: tree,
				currentNode: tree.getCurrent(),
			});
		},

	pushState: (imageData, name, options = {}) => {
		console.warn(`[historyStore.pushState] 🔵 CALLED with name: "${name}"`);
		console.trace('[historyStore.pushState] Call stack:');

		const { historyTree } = get();

		if (!historyTree) {
			console.warn('[historyStore.pushState] 🟡 Initializing new history tree');
			// Initialize if not already done
			const tree = new HistoryTree(imageData, name);
			set({
				historyTree: tree,
				currentNode: tree.getCurrent(),
			});
			console.warn('[historyStore.pushState] ✅ History tree initialized');
			return;
		}

		console.warn('[historyStore.pushState] 🟢 Pushing to existing tree');
		const newNode = historyTree.push(imageData, name, options);
		set({ currentNode: newNode });
		console.warn(`[historyStore.pushState] ✅ Pushed node: ${newNode.id}`);
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
		console.warn('[historyStore.clearHistory] 🗑️ Clearing history');
		set({
			historyTree: null,
			currentNode: null,
		});
	},
}});
