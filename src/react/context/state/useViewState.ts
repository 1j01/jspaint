/**
 * Get view state toggles
 */
import { useUIStore } from "./uiStore";
import { useSettingsStore } from "./settingsStore";

/**
 * Hook to access view state (panel visibility and display modes)
 * @returns {{
 *   showToolBox: boolean;
 *   showColorBox: boolean;
 *   showStatusBar: boolean;
 *   showTextToolbar: boolean;
 *   showGrid: boolean;
 *   showThumbnail: boolean;
 *   toggleToolBox: () => void;
 *   toggleColorBox: () => void;
 *   toggleStatusBar: () => void;
 *   toggleTextToolbar: () => void;
 *   toggleGrid: () => void;
 *   toggleThumbnail: () => void;
 *   drawOpaque: boolean;
 *   toggleDrawOpaque: () => void;
 * }} View state and actions
 */
export function useViewState() {
	const showToolBox = useUIStore((state) => state.showToolBox);
	const showColorBox = useUIStore((state) => state.showColorBox);
	const showStatusBar = useUIStore((state) => state.showStatusBar);
	const showTextToolbar = useUIStore((state) => state.showTextToolbar);
	const showGrid = useUIStore((state) => state.showGrid);
	const showThumbnail = useUIStore((state) => state.showThumbnail);
	const toggleToolBox = useUIStore((state) => state.toggleToolBox);
	const toggleColorBox = useUIStore((state) => state.toggleColorBox);
	const toggleStatusBar = useUIStore((state) => state.toggleStatusBar);
	const toggleTextToolbar = useUIStore((state) => state.toggleTextToolbar);
	const toggleGrid = useUIStore((state) => state.toggleGrid);
	const toggleThumbnail = useUIStore((state) => state.toggleThumbnail);
	const drawOpaque = useSettingsStore((state) => state.drawOpaque);
	const toggleDrawOpaque = useSettingsStore((state) => state.toggleDrawOpaque);

	return {
		showToolBox,
		showColorBox,
		showStatusBar,
		showTextToolbar,
		showGrid,
		showThumbnail,
		toggleToolBox,
		toggleColorBox,
		toggleStatusBar,
		toggleTextToolbar,
		toggleGrid,
		toggleThumbnail,
		drawOpaque,
		toggleDrawOpaque,
	};
}
