/**
 * Custom hook for keyboard shortcuts
 * Extracted from App.tsx to reduce complexity
 */

import { useEffect } from "react";
import { TOOL_IDS } from "../context/state";
import type { MenuActions } from "../menus/menuDefinitions";

interface UseKeyboardShortcutsParams {
	canUndo: boolean;
	canRedo: boolean;
	undo: () => void;
	redo: () => void;
	setTool: (toolId: string) => void;
	hasSelection: boolean;
	copy: () => void;
	cut: () => void;
	paste: () => void;
	hasClipboard: boolean;
	clearSelection: () => void;
	handleSelectAll: () => void;
	handleInvertColors: () => void;
	menuActions: MenuActions;
}

export function useKeyboardShortcuts(params: UseKeyboardShortcutsParams): void {
	const {
		canUndo,
		canRedo,
		undo,
		redo,
		setTool,
		hasSelection,
		copy,
		cut,
		paste,
		hasClipboard,
		clearSelection,
		handleSelectAll,
		handleInvertColors,
		menuActions,
	} = params;

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't handle shortcuts if typing in a text input
			const target = e.target as HTMLElement;
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
				// Allow Escape to exit text input
				if (e.key === "Escape") {
					target.blur();
				}
				return;
			}

			// Modifier key detection (Ctrl on Windows/Linux, Cmd on Mac)
			const isMod = e.ctrlKey || e.metaKey;

			// Ctrl/Cmd+Z for undo
			if (isMod && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				if (canUndo) undo();
				return;
			}

			// Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z for redo
			if (
				(isMod && e.key === "y") ||
				(isMod && e.shiftKey && e.key === "z") ||
				(isMod && e.shiftKey && e.key === "Z")
			) {
				e.preventDefault();
				if (canRedo) redo();
				return;
			}

			// Ctrl/Cmd+A for select all
			if (isMod && e.key === "a") {
				e.preventDefault();
				handleSelectAll();
				return;
			}

			// Ctrl/Cmd+C for copy
			if (isMod && e.key === "c") {
				if (hasSelection) {
					e.preventDefault();
					copy();
				}
				return;
			}

			// Ctrl/Cmd+X for cut
			if (isMod && e.key === "x") {
				if (hasSelection) {
					e.preventDefault();
					cut();
					clearSelection();
				}
				return;
			}

			// Ctrl/Cmd+V for paste
			if (isMod && e.key === "v") {
				if (hasClipboard) {
					e.preventDefault();
					paste();
				}
				return;
			}

			// Ctrl/Cmd+I for invert colors
			if (isMod && e.key === "i") {
				e.preventDefault();
				handleInvertColors();
				return;
			}

			// Delete or Backspace to clear selection
			if (e.key === "Delete" || e.key === "Backspace") {
				if (hasSelection) {
					e.preventDefault();
					menuActions.editClearSelection();
				}
				return;
			}

			// Escape to cancel current operation / deselect
			if (e.key === "Escape") {
				e.preventDefault();
				clearSelection();
				return;
			}

			// F11 for fullscreen
			if (e.key === "F11") {
				e.preventDefault();
				menuActions.viewFullscreen();
				return;
			}

			// Tool shortcuts (single keys)
			if (!isMod && !e.shiftKey && !e.altKey) {
				switch (e.key.toLowerCase()) {
					case "p":
						setTool(TOOL_IDS.PENCIL);
						break;
					case "b":
						setTool(TOOL_IDS.BRUSH);
						break;
					case "e":
						setTool(TOOL_IDS.ERASER);
						break;
					case "f":
						setTool(TOOL_IDS.FILL);
						break;
					case "k":
						setTool(TOOL_IDS.PICK_COLOR);
						break;
					case "l":
						setTool(TOOL_IDS.LINE);
						break;
					case "r":
						setTool(TOOL_IDS.RECTANGLE);
						break;
					case "o":
						setTool(TOOL_IDS.ELLIPSE);
						break;
					case "s":
						setTool(TOOL_IDS.SELECT);
						break;
					case "a":
						setTool(TOOL_IDS.AIRBRUSH);
						break;
					case "t":
						setTool(TOOL_IDS.TEXT);
						break;
					case "m":
						setTool(TOOL_IDS.MAGNIFIER);
						break;
					case "c":
						setTool(TOOL_IDS.CURVE);
						break;
					case "g":
						setTool(TOOL_IDS.POLYGON);
						break;
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		canUndo,
		canRedo,
		undo,
		redo,
		setTool,
		hasSelection,
		copy,
		cut,
		paste,
		hasClipboard,
		clearSelection,
		handleSelectAll,
		handleInvertColors,
		menuActions,
	]);
}
