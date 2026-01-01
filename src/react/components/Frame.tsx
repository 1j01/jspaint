import React, { useEffect, useMemo, useRef, CSSProperties, ReactNode } from "react";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from "../constants/canvas";
import "../../../lib/os-gui/MenuBar.js";

// Declare global types for os-gui MenuBar
declare global {
	interface Window {
		MenuBar: (menu: Record<string, unknown[]>) => MenuBarInstance;
		MENU_DIVIDER: symbol;
		__jspaintReactPreviewMenuBars?: Map<object, MenuBarInstance>;
	}
}

interface MenuBarInstance {
	element: HTMLElement;
	setKeyboardScope: (element: HTMLElement) => void;
	closeMenus: () => void;
}

const MenuBar = (globalThis as typeof globalThis & { MenuBar: (menu: Record<string, unknown[]>) => MenuBarInstance })
	.MenuBar;
const MENU_DIVIDER = (globalThis as typeof globalThis & { MENU_DIVIDER: symbol }).MENU_DIVIDER;

const MENU_BAR_STORE_KEY = "__jspaintReactPreviewMenuBars";

const DEFAULT_MENU = {
	"&File": [
		{
			label: "&New",
			shortcutLabel: "Ctrl+N",
			ariaKeyShortcuts: "Control+N",
			description: "Start a fresh drawing.",
			action: () => console.info("[preview] File > New"),
		},
		{
			label: "&Open…",
			shortcutLabel: "Ctrl+O",
			ariaKeyShortcuts: "Control+O",
			description: "Pick an existing image to open.",
			action: () => console.info("[preview] File > Open"),
		},
		MENU_DIVIDER,
		{
			label: "Recen&t Files",
			description: "Quickly reopen recent work.",
			submenu: [
				{ label: "landscape.png", action: () => console.info("[preview] Open recent: landscape.png") },
				{ label: "sprite-sheet.bmp", action: () => console.info("[preview] Open recent: sprite-sheet.bmp") },
				MENU_DIVIDER,
				{ label: "Clea&r List", action: () => console.info("[preview] Clear recent files") },
			],
		},
		MENU_DIVIDER,
		{
			label: "E&xit",
			description: "Close the preview window.",
			disabled: true,
			action: () => {},
		},
	],
	"&Edit": [
		{
			label: "&Undo",
			shortcutLabel: "Ctrl+Z",
			ariaKeyShortcuts: "Control+Z",
			disabled: true,
			description: "Undo is disabled in this preview.",
			action: () => {},
		},
		{
			label: "&Redo",
			shortcutLabel: "Ctrl+Y",
			ariaKeyShortcuts: "Control+Y",
			disabled: true,
			description: "Redo is disabled in this preview.",
			action: () => {},
		},
		MENU_DIVIDER,
		{
			label: "Pr&eferences…",
			description: "Open prototype settings.",
			action: () => console.info("[preview] Edit > Preferences"),
		},
	],
	"&View": [
		{
			label: "Zoom",
			submenu: [
				{ label: "100%", action: () => console.info("[preview] View > Zoom 100%") },
				{ label: "200%", action: () => console.info("[preview] View > Zoom 200%") },
				{ label: "400%", action: () => console.info("[preview] View > Zoom 400%") },
			],
		},
		{
			label: "Show &Grid",
			description: "Toggle the canvas grid overlay.",
			action: () => console.info("[preview] View > Show Grid"),
		},
		{
			label: "&Fullscreen",
			shortcutLabel: "F11",
			ariaKeyShortcuts: "F11",
			description: "Try the app without browser chrome.",
			action: () => console.info("[preview] View > Fullscreen"),
		},
	],
	"&Help": [
		{
			label: "View &Help",
			description: "Open documentation for the classic app.",
			action: () => console.info("[preview] Help > View Help"),
		},
		MENU_DIVIDER,
		{
			label: "&About React Preview",
			description: "Learn about the in-progress React UI.",
			action: () => console.info("[preview] Help > About"),
		},
	],
};

export const DEFAULT_STATUS_TEXT = "For Help, click Help Topics on the Help Menu.";

const DEFAULT_CANVAS_PLACEHOLDER = <canvas className="main-canvas" width={DEFAULT_CANVAS_WIDTH} height={DEFAULT_CANVAS_HEIGHT} aria-hidden="true" />;

/**
 * Gets or creates the global MenuBar instance store
 * Stores MenuBar instances by menu object reference to enable reuse
 * across React re-renders. This prevents recreating MenuBar DOM on every render.
 *
 * @returns {Map<object, MenuBarInstance> | null} Map of menu objects to MenuBar instances, or null if SSR
 */
const getMenuBarStore = (): Map<object, MenuBarInstance> | null => {
	if (typeof window === "undefined") {
		return null;
	}
	if (!window.__jspaintReactPreviewMenuBars) {
		window.__jspaintReactPreviewMenuBars = new Map();
	}
	return window.__jspaintReactPreviewMenuBars;
};

/**
 * Props for Frame component
 */
interface FrameProps {
	/** Menu structure compatible with os-gui MenuBar (default: DEFAULT_MENU) */
	menu?: Record<string, unknown[]>;
	/** Content to render in top component area (above canvas) */
	topContent?: ReactNode;
	/** Content to render in left component area (typically ToolBox) */
	leftContent?: ReactNode;
	/** Content to render in right component area */
	rightContent?: ReactNode;
	/** Content to render in bottom component area (typically ColorBox) */
	bottomContent?: ReactNode;
	/** Main canvas content to render in center area */
	canvasContent?: ReactNode;
	/** Main status text (left field) */
	statusText?: string;
	/** Cursor position text (middle field) */
	statusPosition?: string;
	/** Canvas/selection size text (right field) */
	statusSize?: string;
	/** Additional CSS class name for root element */
	className?: string;
	/** Additional inline styles for root element */
	style?: CSSProperties;
}

/**
 * Main application frame component
 * Provides the classic MS Paint layout with menu bar, component areas, canvas, and status bar.
 * Uses legacy os-gui MenuBar for menu rendering to maintain Windows 98 aesthetic.
 *
 * Layout structure:
 * - Menu bar (os-gui)
 * - Top component area (optional)
 * - Horizontal row:
 *   - Left component area (ToolBox)
 *   - Canvas area (center, with inset-deep border)
 *   - Right component area (optional)
 * - Bottom component area (ColorBox)
 * - Status bar (3 fields: text, position, size)
 *
 * @param {FrameProps} props - Component props
 * @returns {JSX.Element} Application frame with menu, canvas area, and status bar
 *
 * @example
 * <Frame
 *   menu={createMenus(menuActions)}
 *   leftContent={<ToolBox />}
 *   bottomContent={<ColorBox />}
 *   canvasContent={<Canvas />}
 *   statusText="Ready"
 *   statusPosition="100, 200"
 *   statusSize="640x480"
 * />
 */
export function Frame({
	menu = DEFAULT_MENU,
	topContent = null,
	leftContent = null,
	rightContent = null,
	bottomContent = null,
	canvasContent = DEFAULT_CANVAS_PLACEHOLDER,
	statusText = DEFAULT_STATUS_TEXT,
	statusPosition = "",
	statusSize = "",
	className = "",
	style,
}: FrameProps) {
	const verticalRef = useRef(null);

	useEffect(() => {
		const store = getMenuBarStore();
		const vertical = verticalRef.current;
		if (!store || !vertical) {
			return () => {};
		}

		let menuBar = store.get(menu) || null;
		if (!menuBar) {
			menuBar = MenuBar(menu);
			store.set(menu, menuBar);
		}

		const { element } = menuBar;
		if (element.parentElement !== vertical) {
			vertical.insertBefore(element, vertical.firstChild);
		}
		menuBar.setKeyboardScope(vertical);
		menuBar.closeMenus();

		return () => {
			menuBar.closeMenus();
			if (element.parentElement === vertical) {
				vertical.removeChild(element);
			}
		};
	}, [menu]);

	const resolvedClassName = useMemo(() => ["jspaint", className].filter(Boolean).join(" "), [className]);

	const resolvedCanvas = canvasContent ?? DEFAULT_CANVAS_PLACEHOLDER;
	// Only render top component-area if there's actual content
	// An empty div can still take up space and push the canvas down
	const resolvedTop = topContent ? <div className="component-area top">{topContent}</div> : null;
	const resolvedLeft = leftContent ? (
		<div className="component-area left">{leftContent}</div>
	) : (
		<div className="component-area left" aria-hidden="true" />
	);
	const resolvedRight = rightContent ? (
		<div className="component-area right">{rightContent}</div>
	) : (
		<div className="component-area right" aria-hidden="true" />
	);
	const resolvedBottom = bottomContent ? (
		<div className="component-area bottom">{bottomContent}</div>
	) : (
		<div className="component-area bottom" aria-hidden="true" />
	);

	return (
		<div className={resolvedClassName} style={style} role="application">
			<div className="vertical" ref={verticalRef}>
				{resolvedTop}
				<div className="horizontal">
					{resolvedLeft}
					<div className="canvas-area inset-deep">{resolvedCanvas}</div>
					{resolvedRight}
				</div>
				{resolvedBottom}
				<div className="status-area">
					<div className="status-text status-field inset-shallow" aria-live="polite">
						{statusText}
					</div>
					<div className="status-coordinates status-field inset-shallow">{statusPosition}</div>
					<div className="status-coordinates status-field inset-shallow">{statusSize}</div>
				</div>
			</div>
		</div>
	);
}

export default Frame;
