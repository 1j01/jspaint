/**
 * Store Initialization Hook
 * Use this hook in your root App component to load persisted state
 */

import { useEffect, useState } from "react";
import { useSettingsStore } from "./settingsStore";
import { useUIStore } from "./uiStore";
import { useCanvasStore } from "./canvasStore";

/**
 * Hook to initialize all Zustand stores with persisted data from IndexedDB
 * Should be called once at the root App component level
 *
 * This hook loads persisted state for:
 * - User settings (colors, tool sizes, fonts, etc.)
 * - UI state (panel visibility, magnification, etc.)
 * - Canvas state (dimensions)
 *
 * @returns {{
 *   isInitialized: boolean;
 *   error: Error | null;
 * }} Initialization status
 *
 * @example
 * function App() {
 *   const { isInitialized, error } = useInitializeStores();
 *
 *   if (!isInitialized) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   if (error) {
 *     console.error("Failed to load settings:", error);
 *   }
 *
 *   return <YourApp />;
 * }
 */
export function useInitializeStores() {
	const [isInitialized, setIsInitialized] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		/**
		 * Load all store data from IndexedDB
		 * @returns {Promise<void>}
		 */
		async function loadStores() {
			try {
				// Load persisted settings, UI state, and canvas state
				await Promise.all([
					useSettingsStore.getState().loadPersistedSettings(),
					useUIStore.getState().loadPersistedUIState(),
					useCanvasStore.getState().loadPersistedCanvasState(),
				]);

				setIsInitialized(true);
			} catch (err) {
				// console.error("Failed to initialize stores:", err);
				setError(err instanceof Error ? err : new Error("Unknown error"));
				// Continue anyway - app will use default values
				setIsInitialized(true);
			}
		}

		loadStores();
	}, []);

	return { isInitialized, error };
}
