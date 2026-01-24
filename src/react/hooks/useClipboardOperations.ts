/**
 * Custom hook for clipboard operations
 * Provides copy, cut, and paste functionality with selection integration
 *
 * Handles:
 * - Copy selection ImageData to clipboard
 * - Cut selection ImageData to clipboard
 * - Paste clipboard ImageData
 */

import { useCallback } from "react";
import { useToolStore } from "../context/state/toolStore";
import { useSelection } from "../context/state/useSelection";

/**
 * Return type for the clipboard operations hook
 */
interface UseClipboardOperationsReturn {
	/** Whether clipboard has content */
	hasClipboard: boolean;
	/** Whether there is an active selection */
	hasSelection: boolean;
	/** Current selection state */
	selection: ReturnType<typeof useSelection>["selection"];
	/** Set selection state */
	setSelection: ReturnType<typeof useSelection>["setSelection"];
	/** Clear current selection */
	clearSelection: ReturnType<typeof useSelection>["clearSelection"];
	/** Copy current selection to clipboard */
	copy: () => void;
	/** Cut current selection to clipboard */
	cut: () => void;
	/** Get clipboard content for pasting */
	paste: () => ImageData | null;
}

/**
 * Hook for managing clipboard operations with selection
 *
 * This hook provides clipboard functionality that integrates with the
 * selection system, allowing copy/cut/paste of selected image regions.
 *
 * @returns {UseClipboardOperationsReturn} Clipboard operations and state
 *
 * @example
 * const { hasClipboard, copy, cut, paste, hasSelection } = useClipboardOperations();
 *
 * // Copy current selection
 * if (hasSelection) copy();
 *
 * // Paste clipboard content
 * if (hasClipboard) {
 *   const imageData = paste();
 *   // Use imageData...
 * }
 */
export function useClipboardOperations(): UseClipboardOperationsReturn {
	const { selection, setSelection, clearSelection, hasSelection } = useSelection();

	// Clipboard actions using direct store access to avoid infinite loops
	const clipboard = useToolStore((state) => state.clipboard);
	const setClipboard = useToolStore((state) => state.setClipboard);
	const hasClipboard = clipboard !== null;

	/**
	 * Copy current selection to clipboard
	 * Only works if there is an active selection with ImageData
	 */
	const copy = useCallback(() => {
		if (selection?.imageData) {
			setClipboard(selection.imageData);
		}
	}, [selection, setClipboard]);

	/**
	 * Cut current selection to clipboard
	 * Copies the selection ImageData (clearing is handled separately)
	 */
	const cut = useCallback(() => {
		if (selection?.imageData) {
			setClipboard(selection.imageData);
		}
	}, [selection, setClipboard]);

	/**
	 * Get clipboard content for pasting
	 * @returns {ImageData | null} The clipboard ImageData or null if empty
	 */
	const paste = useCallback(() => clipboard, [clipboard]);

	return {
		hasClipboard,
		hasSelection,
		selection,
		setSelection,
		clearSelection,
		copy,
		cut,
		paste,
	};
}
