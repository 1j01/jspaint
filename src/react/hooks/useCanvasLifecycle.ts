/**
 * Canvas Lifecycle Hook
 *
 * Manages canvas initialization, persistence, and cleanup.
 * Handles canvas state preservation across component remounts.
 *
 * Features:
 * - One-time canvas initialization with white background
 * - Canvas data preservation across unmounts
 * - History tree initialization
 */

import { RefObject, useEffect } from "react";
import { useHistoryStore } from "../context/state/historyStore";

/**
 * Module-level flag to track canvas initialization.
 * Prevents re-initializing the canvas with white background on every remount.
 * This persists across component remounts to maintain canvas state.
 */
let canvasInitialized = false;

/**
 * Module-level storage for canvas data when component unmounts.
 * Used to preserve drawing when the component temporarily unmounts (e.g., during React updates).
 * The ImageData is restored on the next mount if available.
 */
let savedCanvasData: ImageData | null = null;

/**
 * Reset canvas initialization state (useful for testing)
 */
export function resetCanvasLifecycle() {
	canvasInitialized = false;
	savedCanvasData = null;
}

/**
 * Module-level flag to track if history tree was initialized.
 * Prevents re-initializing history on every effect run.
 */
let historyTreeInitialized = false;

/**
 * Hook to manage canvas lifecycle - initialization, persistence, cleanup
 *
 * @param canvasRef - Reference to the canvas element
 */
export function useCanvasLifecycle(canvasRef: RefObject<HTMLCanvasElement>) {
	// console.warn('[useCanvasLifecycle] 🔄 Hook called');

	useEffect(() => {
		// console.warn('[useCanvasLifecycle] 🎯 useEffect RUNNING');

		const canvas = canvasRef.current;
		if (!canvas) {
			// console.warn("[useCanvasLifecycle] Canvas ref not available");
			return;
		}

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) {
			// console.warn("[useCanvasLifecycle] Could not get 2d context");
			return;
		}

		// console.warn(`[useCanvasLifecycle] Canvas dimensions: ${canvas.width}x${canvas.height}`);

		// If we have saved canvas data, restore it
		if (savedCanvasData) {
			// console.warn("[useCanvasLifecycle] 🔄 RESTORING SAVED CANVAS DATA 🔄");
			ctx.putImageData(savedCanvasData, 0, 0);
			savedCanvasData = null; // Clear after restoring
			return () => {
				// Save canvas data on unmount
				// console.warn("[useCanvasLifecycle] 💾 Saving canvas data before unmount");
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				savedCanvasData = imageData;
				// console.warn("[useCanvasLifecycle] ❌ COMPONENT UNMOUNTING! ❌");
			};
		}

		// Otherwise, initialize with white background (only once)
		if (canvasInitialized) {
			// console.warn("[useCanvasLifecycle] Skipping initialization - already done");
			return () => {
				// Save canvas data on unmount
				// console.warn("[useCanvasLifecycle] 💾 Saving canvas data before unmount");
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				savedCanvasData = imageData;
				// console.warn("[useCanvasLifecycle] ❌ COMPONENT UNMOUNTING! ❌");
			};
		}

		// console.warn("[useCanvasLifecycle] ⚠️ INITIALIZING CANVAS WITH WHITE BACKGROUND ⚠️");
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		canvasInitialized = true;
		// console.warn("[useCanvasLifecycle] Initialization complete, flag set to true");

		// Initialize history tree with the blank canvas (only once)
		if (!historyTreeInitialized) {
			// console.warn("[useCanvasLifecycle] 🌳 Initializing history tree...");
			const initialImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			// Use getState() to get stable action reference - no need to include in deps
			useHistoryStore.getState().pushState(initialImageData, "New Document");
			historyTreeInitialized = true;
			// console.warn("[useCanvasLifecycle] 🌳 History tree initialized with blank canvas");
		}

		return () => {
			// Save canvas data on unmount
			// console.warn("[useCanvasLifecycle] 💾 Saving canvas data before unmount");
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			savedCanvasData = imageData;
			// console.warn("[useCanvasLifecycle] ❌ COMPONENT UNMOUNTING! ❌");
		};
	}, [canvasRef]); // Only canvasRef in deps - actions are stable via getState()
}
