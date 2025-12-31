/**
 * Get only the current history node
 * Use this sparingly as it will cause re-renders on every history change
 */
import { useHistoryStore } from "./historyStore";

export function useCurrentHistoryNode() {
	return useHistoryStore((state) => state.currentNode);
}
