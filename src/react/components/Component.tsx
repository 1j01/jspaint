import React, { useMemo, CSSProperties, ReactNode } from "react";

interface ComponentProps {
	title: string;
	className?: string;
	orientation?: "tall" | "wide";
	children: ReactNode;
}

/**
 * Minimal recreation of the legacy $Component helper for docked panels.
 * Mirrors the original DOM structure so existing CSS themes continue to apply.
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
