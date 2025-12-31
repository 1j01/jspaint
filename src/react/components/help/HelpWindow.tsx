/**
 * Main Help window component.
 * A resizable floating window with toolbar, TOC sidebar, and content iframe.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDraggable } from "../../hooks/useDraggable";
import { useHelpNavigation } from "../../hooks/useHelpNavigation";
import { useResizable } from "../../hooks/useResizable";
import { parseHelpContents, type HelpItem } from "../../utils/helpParser";
import { HelpContent } from "./HelpContent";
import { HelpContents } from "./HelpContents";
import { HelpToolbar } from "./HelpToolbar";
import "./HelpWindow.css";
import { ResizableSplitPane } from "./ResizableSplitPane";

export interface HelpWindowProps {
	isOpen: boolean;
	onClose: () => void;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const HELP_ROOT = "/help";
const CONTENTS_FILE = "/help/mspaint.hhc";
const DEFAULT_PAGE = "default.html";
const WEB_HELP_PAGE = "online_support.htm";

export function HelpWindow({ isOpen, onClose }: HelpWindowProps) {
	const previousActiveElement = useRef<Element | null>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const windowRef = useRef<HTMLDivElement>(null);

	// TOC state
	const [tocItems, setTocItems] = useState<HelpItem[]>([]);
	const [tocLoading, setTocLoading] = useState(true);
	const [tocError, setTocError] = useState<string | null>(null);

	// Sidebar visibility
	const [sidebarVisible, setSidebarVisible] = useState(true);

	// Navigation
	const {
		currentUrl,
		navigate,
		goBack,
		goForward,
		canGoBack,
		canGoForward,
		handleIframeLoad,
		markInternalNavigation,
	} = useHelpNavigation({ initialUrl: DEFAULT_PAGE });

	// Dragging
	const { position, elementRef, handleProps, isDragging, center, setPosition } = useDraggable({
		enabled: true,
	});

	// Resizing
	const {
		size,
		setSize,
		resizeHandleProps,
		isResizing,
		positionOffset,
		resetPositionOffset,
	} = useResizable({
		initialSize: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
		minWidth: MIN_WIDTH,
		minHeight: MIN_HEIGHT,
	});

	// Apply position offset from resizing to the draggable position
	useEffect(() => {
		if (positionOffset.x !== 0 || positionOffset.y !== 0) {
			// The offset is handled by the useDraggable hook via CSS transform
			resetPositionOffset();
		}
	}, [positionOffset, resetPositionOffset]);

	// Handle escape key
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		},
		[onClose],
	);

	// Load TOC on mount
	useEffect(() => {
		if (isOpen && tocItems.length === 0 && !tocError) {
			setTocLoading(true);
			parseHelpContents(CONTENTS_FILE)
				.then((items) => {
					setTocItems(items);
					setTocLoading(false);
				})
				.catch((err) => {
					setTocError(err.message || "Failed to load help contents");
					setTocLoading(false);
				});
		}
	}, [isOpen, tocItems.length, tocError]);

	// Focus management and event listeners
	useEffect(() => {
		if (isOpen) {
			previousActiveElement.current = document.activeElement;
			requestAnimationFrame(() => {
				contentRef.current?.focus();
			});
			document.addEventListener("keydown", handleKeyDown);
		} else {
			document.removeEventListener("keydown", handleKeyDown);
			if (previousActiveElement.current instanceof HTMLElement) {
				previousActiveElement.current.focus();
			}
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, handleKeyDown]);

	// Center on first open
	useEffect(() => {
		if (isOpen && !position) {
			requestAnimationFrame(() => {
				center();
			});
		}
	}, [isOpen, position, center]);

	// Measure sidebar width (matching jQuery's measure_sidebar_width)
	const measureSidebarWidth = useCallback(() => {
		if (!windowRef.current) return 0;
		const contentsEl = windowRef.current.querySelector('.help-contents');
		const resizerEl = windowRef.current.querySelector('.resizer');
		if (!contentsEl || !resizerEl) return 0;

		const contentsWidth = (contentsEl as HTMLElement).offsetWidth;
		const contentsStyle = getComputedStyle(contentsEl);
		const marginLeft = parseFloat(contentsStyle.marginLeft);
		const marginRight = parseFloat(contentsStyle.marginRight);
		const resizerWidth = (resizerEl as HTMLElement).offsetWidth;

		return contentsWidth + marginLeft + marginRight + resizerWidth;
	}, []);

	// Handlers
	const handleToggleSidebar = useCallback(() => {
		if (!windowRef.current || !position) return;

		const togglingWidth = measureSidebarWidth();
		const currentWindowX = (position?.x ?? 0) + positionOffset.x;

		setSidebarVisible((prev) => {
			const willBeVisible = !prev;

			// Use setTimeout to ensure DOM has updated after state change
			setTimeout(() => {
				if (willBeVisible) {
					// Showing sidebar: increase width, move left
					const newWidth = size.width + togglingWidth;
					const newLeft = currentWindowX - togglingWidth;

					// Trim if going off left edge (like jQuery does)
					if (newLeft < 0) {
						// Window would go off screen - trim the width instead
						const trimmedWidth = size.width + togglingWidth + newLeft;
						setSize({ width: trimmedWidth, height: size.height });
						setPosition({ x: 0, y: position.y });
					} else {
						// Normal case - just adjust position and size
						setSize({ width: newWidth, height: size.height });
						setPosition({ x: newLeft, y: position.y });
					}
				} else {
					// Hiding sidebar: decrease width, move right
					const newWidth = size.width - togglingWidth;
					const newLeft = currentWindowX + togglingWidth;

					setSize({ width: newWidth, height: size.height });
					setPosition({ x: newLeft, y: position.y });
				}
			}, 0);

			return willBeVisible;
		});
	}, [measureSidebarWidth, position, positionOffset, size, setSize, setPosition]);

	const handleBack = useCallback(() => {
		markInternalNavigation();
		goBack();
	}, [markInternalNavigation, goBack]);

	const handleForward = useCallback(() => {
		markInternalNavigation();
		goForward();
	}, [markInternalNavigation, goForward]);

	const handleWebHelp = useCallback(() => {
		navigate(WEB_HELP_PAGE);
	}, [navigate]);

	const handleSelectTopic = useCallback(
		(url: string) => {
			navigate(url);
		},
		[navigate],
	);

	const handleContentLoad = useCallback(
		(url: string) => {
			// Extract relative path from full URL
			try {
				const urlObj = new URL(url);
				const pathname = urlObj.pathname;
				// Extract just the filename or relative path within help/
				const helpIndex = pathname.indexOf("/help/");
				if (helpIndex >= 0) {
					const relativePath = pathname.slice(helpIndex + 6); // Skip "/help/"
					handleIframeLoad(relativePath);
				}
			} catch {
				// Not a valid URL, use as-is
				handleIframeLoad(url);
			}
		},
		[handleIframeLoad],
	);

	if (!isOpen) {
		return null;
	}

	// Calculate position with resize offset
	const windowX = (position?.x ?? 0) + positionOffset.x;
	const windowY = (position?.y ?? 0) + positionOffset.y;

	const windowStyle: React.CSSProperties = {
		position: "fixed",
		width: size.width,
		height: size.height,
		zIndex: 10000,
		...(position
			? {
					left: windowX,
					top: windowY,
				}
			: {
					left: "50%",
					top: "50%",
					transform: "translate(-50%, -50%)",
				}),
	};

	const windowContent = (
		<div
			ref={(el) => {
				// Merge refs
				if (el) {
					(elementRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
					(windowRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
				}
			}}
			className={`window os-window focused help-window dialog ${isDragging ? "dragging" : ""} ${isResizing ? "resizing" : ""}`}
			style={windowStyle}
			role="dialog"
			aria-modal={false}
			aria-labelledby="help-window-title"
		>
			{/* Resize handles */}
			<div className="resize-handle resize-n" {...resizeHandleProps.n} />
			<div className="resize-handle resize-s" {...resizeHandleProps.s} />
			<div className="resize-handle resize-e" {...resizeHandleProps.e} />
			<div className="resize-handle resize-w" {...resizeHandleProps.w} />
			<div className="resize-handle resize-ne" {...resizeHandleProps.ne} />
			<div className="resize-handle resize-nw" {...resizeHandleProps.nw} />
			<div className="resize-handle resize-se" {...resizeHandleProps.se} />
			<div className="resize-handle resize-sw" {...resizeHandleProps.sw} />

			{/* Title bar */}
			<div className="window-titlebar" {...handleProps}>
				<img
					src="/images/chm-16x16.png"
					width={16}
					height={16}
					draggable={false}
					alt=""
				/>
				<div className="window-title-area">
					<span className="window-title" id="help-window-title">
						Paint Help
					</span>
				</div>
				<button
					className="window-close-button window-action-close window-button"
					aria-label="Close"
					onClick={onClose}
				>
					<span className="window-button-icon"></span>
				</button>
			</div>

			{/* Window content */}
			<div className="window-content" ref={contentRef} tabIndex={-1}>
				<HelpToolbar
					onToggleSidebar={handleToggleSidebar}
					sidebarVisible={sidebarVisible}
					onBack={handleBack}
					onForward={handleForward}
					onWebHelp={handleWebHelp}
					canGoBack={canGoBack}
					canGoForward={canGoForward}
				/>
				<div className="main">
					<ResizableSplitPane
						left={
							<HelpContents
								items={tocItems}
								onSelectTopic={handleSelectTopic}
								selectedUrl={currentUrl}
								isLoading={tocLoading}
								error={tocError}
							/>
						}
						right={
							<HelpContent
								src={currentUrl}
								basePath={HELP_ROOT}
								onLoad={handleContentLoad}
								windowRef={windowRef}
							/>
						}
						leftVisible={sidebarVisible}
						initialLeftWidth={200}
						minLeftWidth={100}
						minRightWidth={200}
					/>
				</div>
			</div>
		</div>
	);

	return createPortal(windowContent, document.body);
}

export default HelpWindow;
