import React, { useMemo, CSSProperties, ReactNode } from "react";

/**
 * Props for Component wrapper
 */
interface ComponentProps {
  /** Component title (stored in data-component-title attribute) */
  title: string;
  /** CSS class name for component type (e.g., "tools-component", "colors-component") */
  className?: string;
  /** Layout orientation: "tall" for vertical, "wide" for horizontal */
  orientation?: "tall" | "wide";
  /** Component content */
  children: ReactNode;
}

/**
 * Component wrapper - Layout container for docked panels
 * Minimal recreation of the legacy $Component helper.
 * Provides consistent structure for ToolBox, ColorBox, and other docked panels.
 * Mirrors the original DOM structure for CSS theme compatibility.
 *
 * Features:
 * - Disables touch scrolling (touch-action: none)
 * - Applies orientation class (tall/wide)
 * - Special margin handling for wide ColorBox in RTL mode
 * - Stores component title in data attribute
 *
 * @param {ComponentProps} props - Component props
 * @returns {JSX.Element} Wrapper div with component class and styling
 *
 * @example
 * <Component title="Tools" className="tools-component" orientation="tall">
 *   <div className="tools">...</div>
 * </Component>
 */
export function Component({ title, className = "", orientation = "tall", children }: ComponentProps) {
  const resolvedClassName = useMemo(
    () => ["component", className, orientation].filter(Boolean).join(" "),
    [className, orientation],
  );

  const style = useMemo((): CSSProperties => {
    const baseStyle: CSSProperties = { touchAction: "none" };
    if (className.includes("colors-component") && orientation === "wide") {
      baseStyle.position = "relative";
      const isRTL = typeof document !== "undefined" && document.documentElement.dir === "rtl";
      if (isRTL) {
        baseStyle.marginRight = 3;
      } else {
        baseStyle.marginLeft = 3;
      }
    }
    return baseStyle;
  }, [className, orientation]);

  return (
    <div className={resolvedClassName} data-component-title={title} style={style}>
      {children}
    </div>
  );
}

export default Component;
