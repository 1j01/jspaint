import React, { useCallback, useMemo } from "react";
import { Component } from "./Component.jsx";

/** @typedef {import("react").ReactNode} ReactNode */

/**
 * @typedef {Object} Tool
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} [iconIndex]
 * @property {ReactNode | ((tool: Tool) => ReactNode)} [options]
 */

const ensureTools = (tools = []) => tools.map((tool) => ({
        ...tool,
        id: tool.id ?? tool.name,
}));

const resolveOptionsContent = (tool) => {
        if (!tool) {
                return null;
        }
        if (typeof tool.options === "function") {
                return tool.options(tool);
        }
        return tool.options ?? null;
};

const TOOL_ICON_STYLE = {
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
 *
 * @param {object} props
 * @param {Tool[]} props.tools
 * @param {string[]} [props.selectedToolIds]
 * @param {(toolIds: string[], tools: Tool[]) => void} [props.onSelectionChange]
 * @param {(tool: Tool | null) => void} [props.onHoverChange]
 * @param {boolean} [props.isExtras]
 * @param {string} [props.title]
 * @returns {import("react").ReactElement}
 */
export function ToolBox({
        tools: toolsProp,
        selectedToolIds = [],
        onSelectionChange,
        onHoverChange,
        isExtras = false,
        title,
}) {
        const tools = useMemo(() => ensureTools(toolsProp), [toolsProp]);

        // Use selectedToolIds directly (controlled component - no internal state)
        const selected = useMemo(() => {
                if (selectedToolIds.length) {
                        return selectedToolIds;
                }
                // Fallback to first tool if nothing selected
                return tools[0] ? [tools[0].id] : [];
        }, [selectedToolIds, tools]);

        const selectTool = useCallback((tool) => {
                if (selected.length === 1 && selected[0] === tool.id) {
                        return; // Already selected
                }
                const next = [tool.id];
                const resolvedTools = tools.filter((t) => next.includes(t.id));
                onSelectionChange?.(next, resolvedTools);
        }, [selected, tools, onSelectionChange]);

        const activeTool = useMemo(() => tools.find((tool) => selected.includes(tool.id)) ?? null, [tools, selected]);

        const handlePointerEnter = useCallback((tool) => {
                onHoverChange?.(tool);
        }, [onHoverChange]);

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
                                        const iconStyle = tool.iconIndex != null
                                                ? { ...TOOL_ICON_STYLE, "--icon-index": tool.iconIndex }
                                                : TOOL_ICON_STYLE;
                                        return (
                                                <button
                                                        key={tool.id}
                                                        type="button"
                                                        className={["tool", isSelected ? "selected" : ""].filter(Boolean).join(" ")}
                                                        title={tool.name}
                                                        aria-pressed={isSelected}
                                                        onClick={() => selectTool(tool)}
                                                        onPointerEnter={() => handlePointerEnter(tool)}
                                                        onPointerLeave={handlePointerLeave}
                                                        onFocus={() => handlePointerEnter(tool)}
                                                        onBlur={handlePointerLeave}
                                                >
                                                        <span
                                                                className="tool-icon"
                                                                aria-hidden="true"
                                                                style={iconStyle}
                                                        />
                                                </button>
                                        );
                                })}
                        </div>
                        <div className="tool-options" aria-live="polite">
                                {resolveOptionsContent(activeTool)}
                        </div>
                </Component>
        );
}

export default ToolBox;
