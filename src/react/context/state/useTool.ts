/**
 * Get tool state and actions
 */
import { useToolStore } from "./toolStore";

/**
 * Hook to access current tool state and tool switching
 * @returns {{
 *   selectedToolId: string;
 *   setTool: (toolId: string) => void;
 * }} Tool state and actions
 */
export function useTool() {
	const selectedToolId = useToolStore((state) => state.selectedToolId);
	const setTool = useToolStore((state) => state.setTool);

	return {
		selectedToolId,
		setTool,
	};
}
