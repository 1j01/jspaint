/**
 * Store Initialization Hook
 * Use this hook in your root App component to load persisted state
 */

import { useEffect, useState } from "react";
import { useSettingsStore } from "./settingsStore";
import { useUIStore } from "./uiStore";

export function useInitializeStores() {
	const [isInitialized, setIsInitialized] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		async function loadStores() {
			try {
				// Load persisted settings and UI state
				await Promise.all([
					useSettingsStore.getState().loadPersistedSettings(),
					useUIStore.getState().loadPersistedUIState(),
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
