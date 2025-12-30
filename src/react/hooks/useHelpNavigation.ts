/**
 * Hook for managing Help window navigation history.
 * Tracks back/forward navigation similar to browser history.
 */
import { useState, useCallback, useRef } from "react";

interface UseHelpNavigationOptions {
	/** Initial URL to display */
	initialUrl: string;
}

interface UseHelpNavigationReturn {
	/** Current URL being displayed */
	currentUrl: string;
	/** Navigate to a new URL (adds to history) */
	navigate: (url: string) => void;
	/** Go back in history */
	goBack: () => void;
	/** Go forward in history */
	goForward: () => void;
	/** Whether can go back */
	canGoBack: boolean;
	/** Whether can go forward */
	canGoForward: boolean;
	/** Handle iframe load event (for external navigation) */
	handleIframeLoad: (url: string) => void;
	/** Mark next load as internal (from back/forward) */
	markInternalNavigation: () => void;
}

export function useHelpNavigation(options: UseHelpNavigationOptions): UseHelpNavigationReturn {
	const { initialUrl } = options;

	// History is stored as an array with a current index
	const [history, setHistory] = useState<string[]>([initialUrl]);
	const [currentIndex, setCurrentIndex] = useState(0);

	// Track whether the next load is from internal navigation (back/forward)
	const isInternalNavigationRef = useRef(false);

	const currentUrl = history[currentIndex];
	const canGoBack = currentIndex > 0;
	const canGoForward = currentIndex < history.length - 1;

	/**
	 * Navigate to a new URL. Clears forward history.
	 */
	const navigate = useCallback(
		(url: string) => {
			// Don't navigate to the same URL
			if (url === history[currentIndex]) return;

			setHistory((prev) => {
				// Remove any forward history and add new URL
				const newHistory = prev.slice(0, currentIndex + 1);
				newHistory.push(url);
				return newHistory;
			});
			setCurrentIndex((prev) => prev + 1);
		},
		[currentIndex, history],
	);

	/**
	 * Go back in history.
	 */
	const goBack = useCallback(() => {
		if (canGoBack) {
			isInternalNavigationRef.current = true;
			setCurrentIndex((prev) => prev - 1);
		}
	}, [canGoBack]);

	/**
	 * Go forward in history.
	 */
	const goForward = useCallback(() => {
		if (canGoForward) {
			isInternalNavigationRef.current = true;
			setCurrentIndex((prev) => prev + 1);
		}
	}, [canGoForward]);

	/**
	 * Handle iframe load event. Called when iframe navigates externally
	 * (e.g., user clicks a link within the help content).
	 */
	const handleIframeLoad = useCallback(
		(url: string) => {
			// If this was an internal navigation (back/forward), don't add to history
			if (isInternalNavigationRef.current) {
				isInternalNavigationRef.current = false;
				return;
			}

			// External navigation - add to history
			if (url && url !== history[currentIndex]) {
				navigate(url);
			}
		},
		[history, currentIndex, navigate],
	);

	/**
	 * Mark the next navigation as internal (from back/forward button).
	 */
	const markInternalNavigation = useCallback(() => {
		isInternalNavigationRef.current = true;
	}, []);

	return {
		currentUrl,
		navigate,
		goBack,
		goForward,
		canGoBack,
		canGoForward,
		handleIframeLoad,
		markInternalNavigation,
	};
}

export default useHelpNavigation;
