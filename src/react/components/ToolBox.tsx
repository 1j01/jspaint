import React, { useCallback, useMemo, ReactNode } from "react";
import { Component } from "./Component";

export interface Tool {
	id: string;
	name: string;
	description: string;
	iconIndex?: number;
}

interface ToolBoxProps {
	tools: Tool[];
	selectedToolIds?: string[];
	onSelectionChange?: (toolIds: string[], tools: Tool[]) => void;
	onHoverChange?: (tool: Tool | null) => void;
	isExtras?: boolean;
	title?: string;
	children?: ReactNode; // Tool options content
}

const ensureTools = (tools: Tool[] = []): Tool[] =>
	tools.map((tool) => ({
		...tool,
		id: tool.id ?? tool.name,
	}));

const TOOL_ICON_STYLE: React.CSSProperties = {
	display: "block",
	position: "absolute",
	left: 4,
	top: 4,
	width: 16,
	height: 16,
};

/**
 * React counterpart for the legacy ToolBox component.
 * Mirrors the markup structure so the classic CSS and sprites apply unchanged.
 */
export function ToolBox({
	tools: toolsProp,
	selectedToolIds = [],
	onSelectionChange,
	onHoverChange,
	isExtras = false,
	title,
	children,
}: ToolBoxProps) {
	const tools = useMemo(() => ensureTools(toolsProp), [toolsProp]);

	// Use selectedToolIds directly (controlled component - no internal state)
	const selected = useMemo(() => {
		if (selectedToolIds.length) {
			return selectedToolIds;
		}
		// Fallback to first tool if nothing selected
		return tools[0] ? [tools[0].id] : [];
	}, [selectedToolIds, tools]);

	const selectTool = useCallback(
		(tool: Tool) => {
			if (selected.length === 1 && selected[0] === tool.id) {
				return; // Already selected
			}
			const next = [tool.id];
			const resolvedTools = tools.filter((t) => next.includes(t.id));
			onSelectionChange?.(next, resolvedTools);
		},
		[selected, tools, onSelectionChange],
	);

	const handlePointerEnter = useCallback(
		(tool: Tool) => {
			onHoverChange?.(tool);
		},
		[onHoverChange],
	);

	const handlePointerLeave = useCallback(() => {
		onHoverChange?.(null);
	}, [onHoverChange]);

	const componentTitle = title || (isExtras ? "Extra Tools" : "Tools");
	const className = ["tools-component", isExtras ? "extra-tools-component" : ""].filter(Boolean).join(" ");

	return (
		<Component title={componentTitle} className={className} orientation="tall">
			<div className="tools" role="toolbar" aria-label={componentTitle}>
				{tools.map((tool) => {
					const isSelected = selected.includes(tool.id);
					const iconStyle: React.CSSProperties =
						tool.iconIndex != null
							? ({ ...TOOL_ICON_STYLE, "--icon-index": tool.iconIndex } as React.CSSProperties)
							: TOOL_ICON_STYLE;
					return (
						<div
							key={tool.id}
							className={["tool", isSelected ? "selected" : ""].filter(Boolean).join(" ")}
							title={tool.name}
							role="button"
							tabIndex={0}
							aria-pressed={isSelected}
							onClick={() => selectTool(tool)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") selectTool(tool);
							}}
							onPointerEnter={() => handlePointerEnter(tool)}
							onPointerLeave={handlePointerLeave}
							onFocus={() => handlePointerEnter(tool)}
							onBlur={handlePointerLeave}
						>
							<span className="tool-icon" aria-hidden="true" style={iconStyle} />
						</div>
					);
				})}
			</div>
			{children}
		</Component>
	);
}

export default ToolBox;
