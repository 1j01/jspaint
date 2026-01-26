import React, { useCallback, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Component } from "./Component";

/**
 * Tool data structure
 */
export interface Tool {
  /** Unique tool identifier (e.g., "pencil", "brush") */
  id: string;
  /** Human-readable tool name */
  name: string;
  /** Description shown in status bar on hover */
  description: string;
  /** Sprite sheet index for tool icon (CSS custom property --icon-index) */
  iconIndex?: number;
}

/**
 * Props for ToolBox component
 */
interface ToolBoxProps {
  /** Array of tools to display in the grid */
  tools: Tool[];
  /** Currently selected tool IDs (controlled component) */
  selectedToolIds?: string[];
  /** Callback when tool selection changes */
  onSelectionChange?: (toolIds: string[], tools: Tool[]) => void;
  /** Callback when hovering over a tool (for status bar updates) */
  onHoverChange?: (tool: Tool | null) => void;
  /** Whether this is an extra tools palette (affects styling) */
  isExtras?: boolean;
  /** Custom title (default: "Tools" or "Extra Tools") */
  title?: string;
  /** Tool options panel content (rendered below tool grid) */
  children?: ReactNode;
}

/**
 * Ensures all tools have valid IDs
 * If a tool doesn't have an id, uses its name as fallback.
 *
 * @param {Tool[]} tools - Array of tools to validate
 * @returns {Tool[]} Tools with guaranteed IDs
 */
const ensureTools = (tools: Tool[] = []): Tool[] =>
  tools.map((tool) => ({
    ...tool,
    id: tool.id ?? tool.name,
  }));

/**
 * Base style for tool icons using CSS custom property for sprite positioning
 */
const TOOL_ICON_STYLE: React.CSSProperties = {
  display: "block",
  position: "absolute",
  left: 4,
  top: 4,
  width: 16,
  height: 16,
};

/**
 * ToolBox component - Tool selection grid
 * Renders the classic MS Paint toolbox with tool icons and selection state.
 * Mirrors the legacy $ToolBox markup structure for CSS compatibility.
 *
 * Features:
 * - Grid of clickable tool buttons
 * - Visual selection state (blue highlight)
 * - Hover callbacks for status bar integration
 * - Keyboard navigation (Tab, Enter, Space)
 * - Tool options panel (children)
 * - CSS sprite-based icons via --icon-index custom property
 *
 * @param {ToolBoxProps} props - Component props
 * @returns {JSX.Element} Tool selection grid with optional options panel
 *
 * @example
 * <ToolBox
 *   tools={TOOLBOX_ITEMS}
 *   selectedToolIds={["pencil"]}
 *   onSelectionChange={(ids) => setTool(ids[0])}
 *   onHoverChange={setHoveredTool}
 * >
 *   <ToolOptions />
 * </ToolBox>
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
  const { t } = useTranslation();
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

  const componentTitle = title || (isExtras ? t("Extra Tools") : t("Tools"));
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
          // Translate tool name and description for i18n
          const translatedTool = {
            ...tool,
            name: t(tool.name),
            description: t(tool.description),
          };
          return (
            <div
              key={tool.id}
              className={["tool", isSelected ? "selected" : ""].filter(Boolean).join(" ")}
              title={translatedTool.name}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => selectTool(tool)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") selectTool(tool);
              }}
              onPointerEnter={() => handlePointerEnter(translatedTool)}
              onPointerLeave={handlePointerLeave}
              onFocus={() => handlePointerEnter(translatedTool)}
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
