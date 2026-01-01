/**
 * Get tree-based history state and actions
 * Use this for the advanced branching history UI
 *
 * NOTE: This hook does NOT return currentNode to avoid unnecessary re-renders.
 * Use useCurrentHistoryNode() if you specifically need to track the current node.
 */
import { useHistoryStore } from "./historyStore";

/**
 * Hook to access tree-based history system (non-linear undo/redo with branching)
 * @returns {{
 *   historyTree: HistoryTree | null;
 *   getRoot: () => HistoryNode | null;
 *   canUndo: () => boolean;
 *   canRedo: () => boolean;
 *   pushState: (imageData: ImageData, name: string, options?: object) => void;
 *   undo: () => HistoryNode | null;
 *   redo: () => HistoryNode | null;
 *   goToNode: (nodeId: string) => HistoryNode | null;
 *   getAllNodes: () => HistoryNode[];
 *   pruneHistory: (maxNodes?: number) => void;
 * }} Tree history state and actions
 */
export function useTreeHistory() {
	const historyTree = useHistoryStore((state) => state.historyTree);
	const getRoot = useHistoryStore((state) => state.getRoot);
	const canUndo = useHistoryStore((state) => state.canUndo);
	const canRedo = useHistoryStore((state) => state.canRedo);
	const pushState = useHistoryStore((state) => state.pushState);
	const undo = useHistoryStore((state) => state.undo);
	const redo = useHistoryStore((state) => state.redo);
	const goToNode = useHistoryStore((state) => state.goToNode);
	const getAllNodes = useHistoryStore((state) => state.getAllNodes);
	const pruneHistory = useHistoryStore((state) => state.pruneHistory);

	return {
		historyTree,
		getRoot,
		canUndo,
		canRedo,
		pushState,
		undo,
		redo,
		goToNode,
		getAllNodes,
		pruneHistory,
	};
}
