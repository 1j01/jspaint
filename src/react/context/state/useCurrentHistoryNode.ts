/**
 * Get only the current history node
 * Use this sparingly as it will cause re-renders on every history change
 */
import { useHistoryStore } from "./historyStore";

/**
 * Hook to access the current history node
 * WARNING: This will cause re-renders on every history change.
 * Only use when you need to reactively track the current node.
 * @returns {HistoryNode | null} Current history node
 */
export function useCurrentHistoryNode() {
  return useHistoryStore((state) => state.currentNode);
}
