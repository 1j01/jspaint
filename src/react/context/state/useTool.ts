/**
 * Get tool state and actions
 */
import { useToolStore } from "./toolStore";

export function useTool() {
	const selectedToolId = useToolStore((state) => state.selectedToolId);
	const setTool = useToolStore((state) => state.setTool);

	return {
		selectedToolId,
		setTool,
	};
}
