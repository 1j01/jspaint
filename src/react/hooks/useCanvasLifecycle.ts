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
 *
 * ## Persistence Strategy
 *
 * This hook uses a **two-tier persistence strategy** to handle different scenarios:
 *
 * ### 1. Module-Level Persistence (savedCanvasData)
 * - **Purpose**: Preserve canvas across component remounts during React updates
 * - **Scope**: In-memory, same page session only
 * - **When saved**: In cleanup function when component unmounts
 * - **When restored**: On component remount if available
 * - **Use case**: Hot module reloading, React strict mode double-mounting
 *
 * ### 2. IndexedDB Persistence
 * - **Purpose**: Persist canvas across page refreshes
 * - **Scope**: Browser storage, survives page reloads
 * - **When saved**: During drawing operations (via Canvas.tsx saveHistoryState())
 * - **When restored**: On initial mount after page refresh
 * - **Use case**: User refreshes page, browser crash recovery
 *
 * ## CRITICAL: Why We Don't Save to IndexedDB in Cleanup
 *
 * **Problem**: React may clear the canvas DOM before the cleanup function runs.
 * When this happens, `ctx.getImageData()` returns empty/transparent pixels instead
 * of the actual drawing. If we save this to IndexedDB, we overwrite valid data
 * with corrupted data, causing the canvas to appear blank after multiple refreshes.
 *
 * **Solution**: Only save to IndexedDB during active drawing operations when we
 * KNOW the canvas has valid data. The cleanup function only saves to module-level
 * for immediate component remounts within the same page session.
 *
 * **Reproduction of the bug**:
 * 1. Draw something on canvas
 * 2. Refresh page → canvas restores correctly ✅
 * 3. Refresh again → canvas becomes blank ❌
 * 4. Cause: Second refresh's cleanup saved empty canvas data, overwriting the drawing
 *
 * **Timeline of operations**:
 * ```
 * User draws → saveHistoryState() saves to IndexedDB ✅
 * Page refresh → cleanup runs → saves module-level only (may be corrupted) ⚠️
 *             → new mount → loads from IndexedDB (still valid) ✅
 * User draws → saveHistoryState() saves to IndexedDB ✅
 * Page refresh → cleanup runs → saves module-level only ⚠️
 *             → new mount → loads from IndexedDB (still valid) ✅
 * ```
 *
 * @module useCanvasLifecycle
 */

import { RefObject, useEffect } from "react";
import { useHistoryStore } from "../context/state/historyStore";
import { saveSetting, loadSetting } from "../context/state/persistence";

/**
 * Module-level flag to track canvas initialization.
 * Prevents re-initializing the canvas with white background on every remount.
 * This persists across component remounts to maintain canvas state.
 *
 * @private
 */
let canvasInitialized = false;

/**
 * Module-level storage for canvas data when component unmounts.
 * Used to preserve drawing when the component temporarily unmounts (e.g., during React updates).
 * The ImageData is restored on the next mount if available.
 *
 * IMPORTANT: This is in-memory only and does NOT persist across page refreshes.
 * For page refresh persistence, we rely on IndexedDB (saved during drawing operations).
 *
 * @private
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
	} catch {
		// Silently fail - not critical
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
	} catch {
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
		console.log('[Lifecycle] Effect running, canvasInitialized:', canvasInitialized);
		const canvas = canvasRef.current;
		if (!canvas) {
			console.log('[Lifecycle] No canvas ref');
			return;
		}

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) {
			console.log('[Lifecycle] No context');
			return;
		}

		console.log('[Lifecycle] Canvas ready:', {
			width: canvas.width,
			height: canvas.height,
			savedCanvasData: savedCanvasData ? 'exists' : 'null',
			loadedFromIndexedDB,
		});

		// Async initialization function
		const initializeCanvas = async () => {
			console.log('[Lifecycle] initializeCanvas starting');
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

			console.log('[Lifecycle] hasContent:', hasContent);

			if (hasContent) {
				console.log('[Lifecycle] Canvas has content, skipping init');
				canvasInitialized = true;
				// Don't set loadedFromIndexedDB here - this could be fresh content from fileOpen
				// and we still want to save/load from IndexedDB on actual page refresh

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
				console.log('[Lifecycle] Restoring from savedCanvasData');
				ctx.putImageData(savedCanvasData, 0, 0);
				savedCanvasData = null;
				canvasInitialized = true; // Mark as initialized
				loadedFromIndexedDB = true; // Prevent IndexedDB from overwriting this
				return;
			}

			// Priority 2: Load from IndexedDB (page refresh) - only on first mount
			if (!loadedFromIndexedDB) {
				console.log('[Lifecycle] Loading from IndexedDB');
				loadedFromIndexedDB = true;
				const persistedCanvas = await loadCanvasFromIndexedDB();
				console.log('[Lifecycle] IndexedDB result:', persistedCanvas ? 'found' : 'null');

				// CRITICAL: Check if user drew during the IndexedDB await BEFORE restoring
				// The initial content check only sampled the top-left corner, but the user
				// could have drawn anywhere during the async operation. Check for any
				// non-transparent pixel to avoid overwriting user's drawing.
				const postAwaitData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				let userDrewDuringAwait = false;
				for (let i = 3; i < postAwaitData.data.length; i += 4) {
					if (postAwaitData.data[i] !== 0) { // Check alpha channel
						userDrewDuringAwait = true;
						break;
					}
				}

				if (userDrewDuringAwait) {
					console.log('[Lifecycle] User drew during IndexedDB await, preserving their drawing');
					canvasInitialized = true;
					if (!historyTreeInitialized) {
						useHistoryStore.getState().pushState(postAwaitData, "User Drawing");
						historyTreeInitialized = true;
					}
					return;
				}

				if (persistedCanvas) {
					// Check if dimensions match
					if (persistedCanvas.width === canvas.width && persistedCanvas.height === canvas.height) {
						console.log('[Lifecycle] Restoring from IndexedDB');
						ctx.putImageData(persistedCanvas, 0, 0);
						canvasInitialized = true;

						// Initialize history tree with persisted canvas
						if (!historyTreeInitialized) {
							const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
							useHistoryStore.getState().pushState(imageData, "Restored Document");
							historyTreeInitialized = true;
						}
						return;
					}
					// If dimensions don't match, fall through to white background initialization
				}
			}

			// Priority 3: Initialize with white background (only once)
			if (!canvasInitialized) {
				console.log('[Lifecycle] Filling with white background');
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

		// Cleanup: Save to module-level for component remount, but DON'T save to IndexedDB
		//
		// CRITICAL WARNING: Do NOT save to IndexedDB in this cleanup function!
		//
		// React may clear the canvas DOM before this cleanup runs, causing
		// ctx.getImageData() to return empty/corrupted data. Saving this to
		// IndexedDB would overwrite valid saved data with blank pixels.
		//
		// IndexedDB persistence is handled by Canvas.tsx saveHistoryState()
		// which is called during actual drawing operations when we KNOW the
		// canvas contains valid data.
		//
		// Module-level savedCanvasData is safe to update here because it's
		// only used for immediate component remounts within the same page
		// session (HMR, strict mode, etc.), not for page refresh recovery.
		//
		// See top-of-file documentation for detailed explanation.
		return () => {
			console.log('[Lifecycle] Cleanup running');
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			savedCanvasData = imageData;
			console.log('[Lifecycle] Saved to module-level, size:', imageData.width, 'x', imageData.height);
			// ❌ DO NOT: saveCanvasToIndexedDB(imageData)
			// ✅ IndexedDB saving is handled by Canvas.tsx saveHistoryState()
		};
	}, [canvasRef]);
}
