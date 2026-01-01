/**
 * Main Help window component - matching jQuery implementation exactly
 * Features:
 * - Window with titlebar (minimize, maximize, close buttons)
 * - Toolbar with Hide/Show, Back/Forward, Options, Web Help buttons
 * - Resizable split pane (contents list + iframe)
 * - 8 resize handles
 * - Draggable titlebar
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { parseHelpContents, type HelpItem } from "../../utils/helpParser";
import "./HelpWindow.css";

export interface HelpWindowProps {
	isOpen: boolean;
	onClose: () => void;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const CONTENTS_FILE = "/help/mspaint.hhc";
const DEFAULT_PAGE = "/help/default.html";
const WEB_HELP_PAGE = "/help/online_support.htm";

export function HelpWindow({ isOpen, onClose }: HelpWindowProps) {
	const windowRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const contentsListRef = useRef<HTMLUListElement>(null);
	const resizerRef = useRef<HTMLDivElement>(null);

	// Window state
	const [position, setPosition] = useState({ left: 0, top: 150 });
	const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
	const [isMinimized, setIsMinimized] = useState(false);
	const [isMaximized, setIsMaximized] = useState(false);
	const [savedState, setSavedState] = useState<{ position: typeof position; size: typeof size } | null>(null);

	// TOC state
	const [tocItems, setTocItems] = useState<HelpItem[]>([]);
	const [sidebarVisible, setSidebarVisible] = useState(true);
	const [selectedUrl, setSelectedUrl] = useState(DEFAULT_PAGE);
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

	// Navigation state
	const [history, setHistory] = useState<string[]>([DEFAULT_PAGE]);
	const [historyIndex, setHistoryIndex] = useState(0);
	const canGoBack = historyIndex > 0;
	const canGoForward = historyIndex < history.length - 1;

	// Dragging state
	const [isDragging, setIsDragging] = useState(false);
	const dragStateRef = useRef<{ startX: number; startY: number; originalLeft: number; originalTop: number } | null>(null);

	// Resizing state
	const [isResizing, setIsResizing] = useState(false);
	const resizeStateRef = useRef<{
		direction: string;
		startX: number;
		startY: number;
		originalLeft: number;
		originalTop: number;
		originalWidth: number;
		originalHeight: number;
	} | null>(null);

	// Split pane resizing state
	const [isSplitResizing, setIsSplitResizing] = useState(false);
	const [splitPosition, setSplitPosition] = useState(200); // Contents width
	const splitResizeRef = useRef<{ startX: number; originalWidth: number } | null>(null);

	// Load TOC on mount
	useEffect(() => {
		if (isOpen && tocItems.length === 0) {
			parseHelpContents(CONTENTS_FILE)
				.then((items) => setTocItems(items))
				.catch((err) => console.error("Failed to load help contents:", err));
		}
	}, [isOpen, tocItems.length]);

	// Handle titlebar drag
	const handleTitlebarPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		if ((e.target as HTMLElement).closest('button')) return;

		e.preventDefault();
		setIsDragging(true);
		dragStateRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			originalLeft: position.left,
			originalTop: position.top,
		};
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		document.body.classList.add("cursor-bully");
	}, [position]);

	const handlePointerMove = useCallback((e: PointerEvent) => {
		if (isDragging && dragStateRef.current) {
			const deltaX = e.clientX - dragStateRef.current.startX;
			const deltaY = e.clientY - dragStateRef.current.startY;
			setPosition({
				left: dragStateRef.current.originalLeft + deltaX,
				top: dragStateRef.current.originalTop + deltaY,
			});
		} else if (isResizing && resizeStateRef.current) {
			const { direction, startX, startY, originalLeft, originalTop, originalWidth, originalHeight } = resizeStateRef.current;
			const deltaX = e.clientX - startX;
			const deltaY = e.clientY - startY;

			let newLeft = originalLeft;
			let newTop = originalTop;
			let newWidth = originalWidth;
			let newHeight = originalHeight;

			if (direction.includes('n')) {
				newTop = originalTop + deltaY;
				newHeight = Math.max(MIN_HEIGHT, originalHeight - deltaY);
			}
			if (direction.includes('s')) {
				newHeight = Math.max(MIN_HEIGHT, originalHeight + deltaY);
			}
			if (direction.includes('w')) {
				newLeft = originalLeft + deltaX;
				newWidth = Math.max(MIN_WIDTH, originalWidth - deltaX);
			}
			if (direction.includes('e')) {
				newWidth = Math.max(MIN_WIDTH, originalWidth + deltaX);
			}

			setPosition({ left: newLeft, top: newTop });
			setSize({ width: newWidth, height: newHeight });
		} else if (isSplitResizing && splitResizeRef.current) {
			const deltaX = e.clientX - splitResizeRef.current.startX;
			const newWidth = Math.max(100, Math.min(size.width - 200, splitResizeRef.current.originalWidth + deltaX));
			setSplitPosition(newWidth);
		}
	}, [isDragging, isResizing, isSplitResizing, size.width]);

	const handlePointerUp = useCallback(() => {
		setIsDragging(false);
		setIsResizing(false);
		setIsSplitResizing(false);
		dragStateRef.current = null;
		resizeStateRef.current = null;
		splitResizeRef.current = null;
		document.body.classList.remove("cursor-bully");
	}, []);

	// Handle window resize handles
	const handleResizePointerDown = useCallback((direction: string, e: React.PointerEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsResizing(true);
		resizeStateRef.current = {
			direction,
			startX: e.clientX,
			startY: e.clientY,
			originalLeft: position.left,
			originalTop: position.top,
			originalWidth: size.width,
			originalHeight: size.height,
		};
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}, [position, size]);

	// Handle split pane resizer
	const handleSplitResizePointerDown = useCallback((e: React.PointerEvent) => {
		e.preventDefault();
		setIsSplitResizing(true);
		splitResizeRef.current = {
			startX: e.clientX,
			originalWidth: splitPosition,
		};
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}, [splitPosition]);

	// Global event listeners
	useEffect(() => {
		if (isDragging || isResizing || isSplitResizing) {
			window.addEventListener('pointermove', handlePointerMove);
			window.addEventListener('pointerup', handlePointerUp);
			return () => {
				window.removeEventListener('pointermove', handlePointerMove);
				window.removeEventListener('pointerup', handlePointerUp);
			};
		}
	}, [isDragging, isResizing, isSplitResizing, handlePointerMove, handlePointerUp]);

	// Navigation handlers
	const navigate = useCallback((url: string) => {
		setSelectedUrl(url);
		setHistory(prev => [...prev.slice(0, historyIndex + 1), url]);
		setHistoryIndex(prev => prev + 1);
	}, [historyIndex]);

	const goBack = useCallback(() => {
		if (canGoBack) {
			const newIndex = historyIndex - 1;
			setHistoryIndex(newIndex);
			setSelectedUrl(history[newIndex]);
		}
	}, [canGoBack, historyIndex, history]);

	const goForward = useCallback(() => {
		if (canGoForward) {
			const newIndex = historyIndex + 1;
			setHistoryIndex(newIndex);
			setSelectedUrl(history[newIndex]);
		}
	}, [canGoForward, historyIndex, history]);

	// Window control handlers
	const handleMinimize = useCallback(() => {
		setIsMinimized(prev => !prev);
	}, []);

	const handleMaximize = useCallback(() => {
		if (isMaximized) {
			// Restore
			if (savedState) {
				setPosition(savedState.position);
				setSize(savedState.size);
			}
			setIsMaximized(false);
		} else {
			// Maximize
			setSavedState({ position, size });
			setPosition({ left: 0, top: 0 });
			setSize({ width: window.innerWidth, height: window.innerHeight });
			setIsMaximized(true);
		}
	}, [isMaximized, savedState, position, size]);

	const handleToggleSidebar = useCallback(() => {
		setSidebarVisible(prev => !prev);
	}, []);

	const handleWebHelp = useCallback(() => {
		navigate(WEB_HELP_PAGE);
	}, [navigate]);

	// Toggle folder expansion
	const toggleFolder = useCallback((folderId: string) => {
		setExpandedFolders(prev => {
			const newSet = new Set(prev);
			if (newSet.has(folderId)) {
				newSet.delete(folderId);
			} else {
				newSet.add(folderId);
			}
			return newSet;
		});
	}, []);

	// Render TOC item recursively
	const renderTocItem = useCallback((item: HelpItem, depth = 0): React.ReactNode => {
		const isFolder = item.children && item.children.length > 0;
		const isSelected = item.url === selectedUrl;
		const isExpanded = expandedFolders.has(item.id);

		const handleClick = () => {
			if (isFolder) {
				toggleFolder(item.id);
			}
			if (item.url) {
				navigate(item.url);
			}
		};

		return (
			<li key={item.id} className={`${isFolder ? "folder" : "page"}${isExpanded ? " expanded" : ""}`}>
				<div
					className={`item ${isSelected ? "selected" : ""}`}
					onClick={handleClick}
					style={{ paddingLeft: `${depth * 16}px`, cursor: "pointer" }}
				>
					{item.title}
				</div>
				{isFolder && (
					<ul>
						{item.children!.map(child => renderTocItem(child, depth + 1))}
					</ul>
				)}
			</li>
		);
	}, [selectedUrl, expandedFolders, toggleFolder, navigate]);

	if (!isOpen) return null;

	const windowStyle: React.CSSProperties = {
		touchAction: "none",
		position: "absolute",
		zIndex: 22,
		left: position.left,
		top: position.top,
		width: size.width,
		height: size.height,
		display: isMinimized ? "none" : "block",
	};

	const mainStyle: React.CSSProperties = {
		position: "relative",
		display: "flex",
		flexDirection: "row",
		height: "calc(100% - 28px)", // Subtract toolbar height
		overflow: "hidden",
	};

	const contentsStyle: React.CSSProperties = {
		width: sidebarVisible ? splitPosition : 0,
		flexShrink: 0,
		overflow: "auto",
		margin: 1,
		display: sidebarVisible ? "block" : "none",
	};

	const resizerStyle: React.CSSProperties = {
		cursor: "ew-resize",
		width: 4,
		flexShrink: 0,
		boxSizing: "border-box",
		background: "var(--ButtonFace)",
		borderLeft: "1px solid var(--ButtonShadow)",
		boxShadow: "inset 1px 0 0 var(--ButtonHilight)",
		display: sidebarVisible ? "block" : "none",
	};

	const iframeStyle: React.CSSProperties = {
		flex: 1,
		minWidth: 0,
		minHeight: 0,
		border: "none",
		backgroundColor: "white",
		margin: 1,
	};

	return createPortal(
		<div
			ref={windowRef}
			className="window os-window help-window"
			style={windowStyle}
		>
			{/* Titlebar */}
			<div
				className="window-titlebar"
				style={{ touchAction: "none" }}
				onPointerDown={handleTitlebarPointerDown}
			>
				<img
					src="/images/chm-16x16.png"
					width={16}
					height={16}
					draggable={false}
					style={{ width: 16, height: 16 }}
					alt=""
				/>
				<div className="window-title-area">
					<span className="window-title">Paint Help</span>
				</div>
				<button
					className="window-minimize-button window-action-minimize window-button"
					aria-label="Minimize window"
					onClick={handleMinimize}
				>
					<span className="window-button-icon"></span>
				</button>
				<button
					className="window-maximize-button window-action-maximize window-button"
					aria-label="Maximize or restore window"
					onClick={handleMaximize}
				>
					<span className="window-button-icon"></span>
				</button>
				<button
					className="window-close-button window-action-close window-button"
					aria-label="Close window"
					onClick={onClose}
				>
					<span className="window-button-icon"></span>
				</button>
			</div>

			{/* Window content */}
			<div className="window-content" ref={contentRef} tabIndex={-1} style={{ outline: "none" }}>
				{/* Toolbar */}
				<div className="toolbar">
					<button className="lightweight" onClick={handleToggleSidebar}>
						<span>{sidebarVisible ? "Hide" : "Show"}</span>
						<div className="icon" style={{ backgroundPosition: sidebarVisible ? "0px 0px" : "-275px 0px" }}></div>
					</button>
					<button className="lightweight" disabled={!canGoBack} onClick={goBack}>
						<span>Back</span>
						<div className="icon" style={{ backgroundPosition: "-55px 0px" }}></div>
					</button>
					<button className="lightweight" disabled={!canGoForward} onClick={goForward}>
						<span>Forward</span>
						<div className="icon" style={{ backgroundPosition: "-110px 0px" }}></div>
					</button>
					<button className="lightweight" disabled>
						<span>Options</span>
						<div className="icon" style={{ backgroundPosition: "-165px 0px" }}></div>
					</button>
					<button className="lightweight" onClick={handleWebHelp}>
						<span>Web Help</span>
						<div className="icon" style={{ backgroundPosition: "-220px 0px" }}></div>
					</button>
				</div>

				{/* Main content area */}
				<div className="main" style={mainStyle}>
					{/* Contents list */}
					<div
						ref={contentRef}
						className="contents inset-deep"
						style={contentsStyle}
					>
						<ul ref={contentsListRef}>
							{tocItems.map(item => renderTocItem(item))}
						</ul>
					</div>

					{/* Resizer */}
					<div
						ref={resizerRef}
						className="resizer"
						style={resizerStyle}
						onPointerDown={handleSplitResizePointerDown}
					/>

					{/* Content iframe */}
					<iframe
						ref={iframeRef}
						allowFullScreen
						sandbox="allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-modals allow-popups allow-downloads"
						src={selectedUrl}
						className="inset-deep"
						name="help-frame"
						style={iframeStyle}
					/>
				</div>
			</div>

			{/* Window resize handles */}
			<div
				className="handle"
				style={{ position: "absolute", top: -2, right: -2, width: 4, height: 4, touchAction: "none", cursor: "ne-resize" }}
				onPointerDown={(e) => handleResizePointerDown("ne", e)}
			/>
			<div
				className="handle"
				style={{ position: "absolute", top: -2, left: "calc(2px)", width: "calc(100% - 4px)", height: 4, touchAction: "none", cursor: "n-resize" }}
				onPointerDown={(e) => handleResizePointerDown("n", e)}
			/>
			<div
				className="handle"
				style={{ position: "absolute", top: -2, left: -2, width: 4, height: 4, touchAction: "none", cursor: "nw-resize" }}
				onPointerDown={(e) => handleResizePointerDown("nw", e)}
			/>
			<div
				className="handle"
				style={{ position: "absolute", top: "calc(2px)", left: -2, width: 4, height: "calc(100% - 4px)", touchAction: "none", cursor: "w-resize" }}
				onPointerDown={(e) => handleResizePointerDown("w", e)}
			/>
			<div
				className="handle"
				style={{ position: "absolute", bottom: -2, left: -2, width: 4, height: 4, touchAction: "none", cursor: "sw-resize" }}
				onPointerDown={(e) => handleResizePointerDown("sw", e)}
			/>
			<div
				className="handle"
				style={{ position: "absolute", bottom: -2, left: "calc(2px)", width: "calc(100% - 4px)", height: 4, touchAction: "none", cursor: "s-resize" }}
				onPointerDown={(e) => handleResizePointerDown("s", e)}
			/>
			<div
				className="handle"
				style={{ position: "absolute", bottom: -2, right: -2, width: 4, height: 4, touchAction: "none", cursor: "se-resize" }}
				onPointerDown={(e) => handleResizePointerDown("se", e)}
			/>
			<div
				className="handle"
				style={{ position: "absolute", top: "calc(2px)", right: -2, width: 4, height: "calc(100% - 4px)", touchAction: "none", cursor: "e-resize" }}
				onPointerDown={(e) => handleResizePointerDown("e", e)}
			/>
		</div>,
		document.body
	);
}

export default HelpWindow;
