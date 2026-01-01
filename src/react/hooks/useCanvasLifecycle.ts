/**
 * Canvas Lifecycle Hook
 *
 * Manages canvas initialization, persistence, and cleanup.
 * Handles canvas state preservation across component remounts and page refreshes.
 *
 * Features:
 * - One-time canvas initialization with white background
 * - Canvas data preservation across unmounts
 * - Canvas data persistence to IndexedDB across page refreshes
 * - History tree initialization
 */

import { RefObject, useEffect } from "react";
import { useHistoryStore } from "../context/state/historyStore";
import { saveSetting, loadSetting } from "../context/state/persistence";

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
	loadedFromIndexedDB = false;
	historyTreeInitialized = false;
}

/**
 * Module-level flag to track if history tree was initialized.
 * Prevents re-initializing history on every effect run.
 */
let historyTreeInitialized = false;

/**
 * Module-level flag to track if we've attempted to load from IndexedDB.
 * Prevents multiple load attempts.
 */
let loadedFromIndexedDB = false;

/**
 * Save canvas content to IndexedDB for persistence across page refreshes
 */
async function saveCanvasToIndexedDB(imageData: ImageData): Promise<void> {
	try {
		// Convert ImageData to a serializable format
		const canvasData = {
			data: Array.from(imageData.data),
			width: imageData.width,
			height: imageData.height,
		};
		await saveSetting("savedCanvas", canvasData);
	} catch (error) {
		console.error("[useCanvasLifecycle] Failed to save canvas to IndexedDB:", error);
	}
}

/**
 * Load canvas content from IndexedDB
 */
async function loadCanvasFromIndexedDB(): Promise<ImageData | null> {
	try {
		const canvasData = await loadSetting<{
			data: number[];
			width: number;
			height: number;
		} | null>("savedCanvas", null);

		if (!canvasData) return null;

		// Reconstruct ImageData from saved format
		const uint8Array = new Uint8ClampedArray(canvasData.data);
		return new ImageData(uint8Array, canvasData.width, canvasData.height);
	} catch (error) {
		console.error("[useCanvasLifecycle] Failed to load canvas from IndexedDB:", error);
		return null;
	}
}

/**
 * Hook to manage canvas lifecycle - initialization, persistence, cleanup
 *
 * @param canvasRef - Reference to the canvas element
 */
export function useCanvasLifecycle(canvasRef: RefObject<HTMLCanvasElement>) {
	useEffect(() => {
		console.log("[useCanvasLifecycle] useEffect triggered");
		const canvas = canvasRef.current;
		if (!canvas) {
			console.log("[useCanvasLifecycle] No canvas ref");
			return;
		}

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) {
			console.log("[useCanvasLifecycle] No context");
			return;
		}

		console.log(`[useCanvasLifecycle] Canvas dimensions: ${canvas.width}x${canvas.height}`);

		// Async initialization function
		const initializeCanvas = async () => {
			console.log("[useCanvasLifecycle] Starting initialization...");

			// Check if canvas already has content (e.g., from fileOpen)
			// Sample a few pixels to detect if it's already been drawn to
			const sampleData = ctx.getImageData(0, 0, Math.min(10, canvas.width), Math.min(10, canvas.height));
			let hasContent = false;
			for (let i = 0; i < sampleData.data.length; i += 4) {
				const r = sampleData.data[i];
				const g = sampleData.data[i + 1];
				const b = sampleData.data[i + 2];
				const a = sampleData.data[i + 3];
				// If we find any non-white, non-transparent pixel, canvas has content
				if (!(r === 255 && g === 255 && b === 255) && a > 0) {
					hasContent = true;
					break;
				}
			}

			if (hasContent) {
				console.log("[useCanvasLifecycle] Canvas already has content, skipping initialization");
				canvasInitialized = true;
				loadedFromIndexedDB = true; // Prevent IndexedDB load on next mount

				// Initialize history tree with existing canvas if needed
				if (!historyTreeInitialized) {
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					useHistoryStore.getState().pushState(imageData, "Loaded Document");
					historyTreeInitialized = true;
				}
				return;
			}

			// Priority 1: Restore from module-level savedCanvasData (component remount)
			if (savedCanvasData) {
				console.log("[useCanvasLifecycle] Restoring from savedCanvasData");
				ctx.putImageData(savedCanvasData, 0, 0);
				savedCanvasData = null;
				console.log("[useCanvasLifecycle] Restored from savedCanvasData");
				return;
			}

			// Priority 2: Load from IndexedDB (page refresh) - only on first mount
			if (!loadedFromIndexedDB) {
				console.log("[useCanvasLifecycle] Attempting to load from IndexedDB...");
				loadedFromIndexedDB = true;
				const persistedCanvas = await loadCanvasFromIndexedDB();

				if (persistedCanvas) {
					console.log(`[useCanvasLifecycle] Found persisted canvas: ${persistedCanvas.width}x${persistedCanvas.height}`);
					// Check if dimensions match
					if (persistedCanvas.width === canvas.width && persistedCanvas.height === canvas.height) {
						console.log("[useCanvasLifecycle] Dimensions match, restoring from IndexedDB");
						ctx.putImageData(persistedCanvas, 0, 0);
						canvasInitialized = true;

						// Initialize history tree with persisted canvas
						if (!historyTreeInitialized) {
							const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
							useHistoryStore.getState().pushState(imageData, "Restored Document");
							historyTreeInitialized = true;
						}
						console.log("[useCanvasLifecycle] Restored from IndexedDB");
						return;
					} else {
						console.log(`[useCanvasLifecycle] Dimension mismatch (persisted: ${persistedCanvas.width}x${persistedCanvas.height} vs canvas: ${canvas.width}x${canvas.height})`);
					}
					// If dimensions don't match, fall through to white background initialization
				} else {
					console.log("[useCanvasLifecycle] No persisted canvas found");
				}
			} else {
				console.log("[useCanvasLifecycle] Already loaded from IndexedDB on previous mount");
			}

			// Priority 3: Initialize with white background (only once)
			if (!canvasInitialized) {
				console.log("[useCanvasLifecycle] Initializing with white background");
				ctx.fillStyle = "#ffffff";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				canvasInitialized = true;

				// Initialize history tree with blank canvas
				if (!historyTreeInitialized) {
					const initialImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					useHistoryStore.getState().pushState(initialImageData, "New Document");
					historyTreeInitialized = true;
				}
			}
		};

		initializeCanvas();

		// Cleanup: Save to both module-level AND IndexedDB
		return () => {
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			savedCanvasData = imageData;
			saveCanvasToIndexedDB(imageData); // Persist to IndexedDB
		};
	}, [canvasRef]);
}
