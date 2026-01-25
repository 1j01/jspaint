/**
 * Main Help window component - matching jQuery implementation exactly
 * Features:
 * - Window with titlebar (minimize, maximize, close buttons)
 * - Toolbar with Hide/Show, Back/Forward, Options, Web Help buttons
 * - Resizable split pane (contents list + iframe)
 * - 8 resize handles
 * - Draggable titlebar
 * - i18n-aware: automatically loads language-specific help when available
 *
 * Refactored to use:
 * - useDraggable hook for window dragging
 * - useResizable hook for window resizing
 * - useHelpNavigation hook for back/forward navigation
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { parseHelpContents, type HelpItem } from "../../utils/helpParser";
import { useDraggable } from "../../hooks/useDraggable";
import { useResizable } from "../../hooks/useResizable";
import { useHelpNavigation } from "../../hooks/useHelpNavigation";
import "./HelpWindow.css";

export interface HelpWindowProps {
	isOpen: boolean;
	onClose: () => void;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;

// Base paths for help system - language-specific versions use /help/{lang}/ pattern
const HELP_BASE = "/help";
const CONTENTS_FILENAME = "mspaint.hhc";
const DEFAULT_PAGE_FILENAME = "default.html";
const WEB_HELP_FILENAME = "online_support.htm";

/**
 * Get language-specific help path.
 * Tries /help/{lang}/{filename} first, falls back to /help/{filename}
 *
 * @param lang - Language code (e.g., "en", "fr", "de")
 * @param filename - Help file name (e.g., "mspaint.hhc", "default.html")
 * @returns Full path to help file
 */
function getHelpPath(lang: string | undefined, filename: string): string {
	// Extract base language code (e.g., "en" from "en-US")
	const baseLang = lang?.split("-")[0]?.toLowerCase();

	// English or undefined uses root /help/ directory
	if (!baseLang || baseLang === "en") {
		return `${HELP_BASE}/${filename}`;
	}

	// Other languages use /help/{lang}/ subdirectory
	return `${HELP_BASE}/${baseLang}/${filename}`;
}

/**
 * Try to fetch a resource, returning null if not found.
 * Used for checking if language-specific help exists.
 */
async function tryFetch(url: string): Promise<boolean> {
	try {
		const response = await fetch(url, { method: "HEAD" });
		return response.ok;
	} catch {
		return false;
	}
}

export function HelpWindow({ isOpen, onClose }: HelpWindowProps) {
	const { t, i18n } = useTranslation();
	const contentRef = useRef<HTMLDivElement>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const contentsListRef = useRef<HTMLUListElement>(null);

	// Use draggable hook for window movement
	const {
		position,
		elementRef: windowRef,
		handleProps: titlebarProps,
		isDragging,
		setPosition,
	} = useDraggable({
		initialPosition: { x: 100, y: 150 },
		enabled: true,
	});

	// Use resizable hook for window sizing
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

	// Apply position offset from resizing (for north/west edges)
	useEffect(() => {
		if (positionOffset.x !== 0 || positionOffset.y !== 0) {
			if (position) {
				setPosition({
					x: position.x + positionOffset.x,
					y: position.y + positionOffset.y,
				});
			}
			resetPositionOffset();
		}
	}, [positionOffset, position, setPosition, resetPositionOffset]);

	// Window state
	const [isMinimized, setIsMinimized] = useState(false);
	const [isMaximized, setIsMaximized] = useState(false);
	const [savedState, setSavedState] = useState<{ position: { x: number; y: number }; size: { width: number; height: number } } | null>(null);

	// TOC state
	const [tocItems, setTocItems] = useState<HelpItem[]>([]);
	const [sidebarVisible, setSidebarVisible] = useState(true);
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

	// Track the resolved help paths for current language
	const [helpBasePath, setHelpBasePath] = useState<string>(`${HELP_BASE}/`);

	// Get default page path (updated when language changes)
	const defaultPagePath = `${helpBasePath}${DEFAULT_PAGE_FILENAME}`;

	// Use navigation hook for history
	const {
		currentUrl,
		navigate,
		goBack,
		goForward,
		canGoBack,
		canGoForward,
		reset: resetNavigation,
	} = useHelpNavigation({ initialUrl: `${HELP_BASE}/${DEFAULT_PAGE_FILENAME}` });

	// Split pane resizing state (kept inline as it's simple and specific to this component)
	const [isSplitResizing, setIsSplitResizing] = useState(false);
	const [splitPosition, setSplitPosition] = useState(200);
	const [tempResizerPosition, setTempResizerPosition] = useState<number | null>(null);
	const splitResizeRef = useRef<{ startX: number; originalWidth: number } | null>(null);

	// Load TOC on mount or when language changes
	useEffect(() => {
		if (!isOpen) return;

		const loadHelpContents = async () => {
			const lang = i18n.language;

			// Try language-specific path first, then fall back to English
			const langPath = getHelpPath(lang, CONTENTS_FILENAME);
			const defaultPath = `${HELP_BASE}/${CONTENTS_FILENAME}`;

			// Check if language-specific help exists
			let hhcPath = defaultPath;
			let basePath = `${HELP_BASE}/`;

			if (lang && !lang.startsWith("en")) {
				const langExists = await tryFetch(langPath);
				if (langExists) {
					hhcPath = langPath;
					const baseLang = lang.split("-")[0].toLowerCase();
					basePath = `${HELP_BASE}/${baseLang}/`;
				}
			}

			setHelpBasePath(basePath);

			try {
				const items = await parseHelpContents(hhcPath);
				const defaultItem: typeof items[0] = {
					id: "welcome",
					name: "Welcome to Help",
					title: "Welcome to Help",
					url: `${basePath}${DEFAULT_PAGE_FILENAME}`,
					local: DEFAULT_PAGE_FILENAME,
				};
				setTocItems([defaultItem, ...items]);

				// Navigate to the language-specific default page
				resetNavigation(`${basePath}${DEFAULT_PAGE_FILENAME}`);
			} catch (err) {
				console.error("Failed to load help contents:", err);

				// Fall back to English if language-specific load fails
				if (hhcPath !== defaultPath) {
					try {
						const items = await parseHelpContents(defaultPath);
						const defaultItem: typeof items[0] = {
							id: "welcome",
							name: "Welcome to Help",
							title: "Welcome to Help",
							url: `${HELP_BASE}/${DEFAULT_PAGE_FILENAME}`,
							local: DEFAULT_PAGE_FILENAME,
						};
						setTocItems([defaultItem, ...items]);
						setHelpBasePath(`${HELP_BASE}/`);
						resetNavigation(`${HELP_BASE}/${DEFAULT_PAGE_FILENAME}`);
					} catch (fallbackErr) {
						console.error("Failed to load fallback help contents:", fallbackErr);
					}
				}
			}
		};

		loadHelpContents();
	}, [isOpen, i18n.language, resetNavigation]);

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

	// Split pane pointer move/up handlers
	useEffect(() => {
		if (!isSplitResizing) return;

		const handlePointerMove = (e: PointerEvent) => {
			if (splitResizeRef.current) {
				const deltaX = e.clientX - splitResizeRef.current.startX;
				const newWidth = Math.max(100, Math.min(size.width - 200, splitResizeRef.current.originalWidth + deltaX));
				setTempResizerPosition(newWidth);
			}
		};

		const handlePointerUp = () => {
			if (tempResizerPosition !== null) {
				setSplitPosition(tempResizerPosition);
				setTempResizerPosition(null);
			}
			setIsSplitResizing(false);
			splitResizeRef.current = null;
		};

		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		return () => {
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
		};
	}, [isSplitResizing, size.width, tempResizerPosition]);

	// Window control handlers
	const handleMinimize = useCallback(() => {
		setIsMinimized(prev => !prev);
	}, []);

	const handleMaximize = useCallback(() => {
		if (isMaximized) {
			if (savedState) {
				setPosition(savedState.position);
				setSize(savedState.size);
			}
			setIsMaximized(false);
		} else {
			if (position) {
				setSavedState({ position, size });
			}
			setPosition({ x: 0, y: 0 });
			setSize({ width: window.innerWidth, height: window.innerHeight });
			setIsMaximized(true);
		}
	}, [isMaximized, savedState, position, size, setPosition, setSize]);

	const handleToggleSidebar = useCallback(() => {
		setSidebarVisible(prev => !prev);
	}, []);

	const handleWebHelp = useCallback(() => {
		navigate(`${helpBasePath}${WEB_HELP_FILENAME}`);
	}, [navigate, helpBasePath]);

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
		const isSelected = item.url === currentUrl;
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
					{item.id === "welcome" ? t(item.title) : item.title}
				</div>
				{isFolder && (
					<ul>
						{item.children!.map(child => renderTocItem(child, depth + 1))}
					</ul>
				)}
			</li>
		);
	}, [currentUrl, expandedFolders, toggleFolder, navigate]);

	if (!isOpen) return null;

	const windowStyle: React.CSSProperties = {
		touchAction: "none",
		position: "absolute",
		zIndex: 22,
		left: position?.x ?? 100,
		top: position?.y ?? 150,
		width: size.width,
		height: size.height,
		display: isMinimized ? "none" : undefined,
	};

	const contentsStyle: React.CSSProperties = {
		flexBasis: isSplitResizing ? undefined : (sidebarVisible ? splitPosition : 0),
		marginRight: isSplitResizing ? 4 : undefined,
		margin: "1px",
		display: sidebarVisible ? undefined : "none",
	};

	const resizerStyle: React.CSSProperties = {
		position: isSplitResizing ? "absolute" : undefined,
		left: isSplitResizing ? tempResizerPosition ?? splitPosition : undefined,
		top: isSplitResizing ? 0 : undefined,
		bottom: isSplitResizing ? 0 : undefined,
		display: sidebarVisible ? undefined : "none",
	};

	return createPortal(
		<div
			ref={windowRef}
			className={`window os-window help-window focused ${isDragging ? "dragging" : ""} ${isResizing ? "resizing" : ""}`}
			style={windowStyle}
		>
			{/* Titlebar */}
			<div
				className="window-titlebar"
				{...titlebarProps}
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
					<span className="window-title">{t("Paint Help")}</span>
				</div>
				<button
					className="window-minimize-button window-action-minimize window-button"
					aria-label={t("Minimize window")}
					onClick={handleMinimize}
				>
					<span className="window-button-icon"></span>
				</button>
				<button
					className="window-maximize-button window-action-maximize window-button"
					aria-label={t("Maximize or restore window")}
					onClick={handleMaximize}
				>
					<span className="window-button-icon"></span>
				</button>
				<button
					className="window-close-button window-action-close window-button"
					aria-label={t("Close window")}
					onClick={onClose}
				>
					<span className="window-button-icon"></span>
				</button>
			</div>

			{/* Window content */}
			<div className="window-content" ref={contentRef} tabIndex={-1} style={{ flexDirection: "column", outline: "none" }}>
				{/* Toolbar */}
				<div className="toolbar">
					<button className="lightweight" onClick={handleToggleSidebar}>
						<span>{sidebarVisible ? t("Hide") : t("Show")}</span>
						<div className="icon" style={{ backgroundPosition: sidebarVisible ? "0px 0px" : "-275px 0px" }}></div>
					</button>
					<button className="lightweight" disabled={!canGoBack} onClick={goBack}>
						<span>{t("Back")}</span>
						<div className="icon" style={{ backgroundPosition: "-55px 0px" }}></div>
					</button>
					<button className="lightweight" disabled={!canGoForward} onClick={goForward}>
						<span>{t("Forward")}</span>
						<div className="icon" style={{ backgroundPosition: "-110px 0px" }}></div>
					</button>
					<button className="lightweight" disabled>
						<span>{t("Options")}</span>
						<div className="icon" style={{ backgroundPosition: "-165px 0px" }}></div>
					</button>
					<button className="lightweight" onClick={handleWebHelp}>
						<span>{t("Web Help")}</span>
						<div className="icon" style={{ backgroundPosition: "-220px 0px" }}></div>
					</button>
				</div>

				{/* Main content area */}
				<div className="main" style={{ position: "relative" }}>
					{/* Contents list */}
					<ul
						ref={contentsListRef}
						className="contents inset-deep"
						style={contentsStyle}
					>
						{tocItems.map(item => renderTocItem(item))}
					</ul>

					{/* Resizer */}
					<div
						className="resizer"
						style={resizerStyle}
						onPointerDown={handleSplitResizePointerDown}
					/>

					{/* Content iframe */}
					<iframe
						ref={iframeRef}
						allowFullScreen
						sandbox="allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-modals allow-popups allow-downloads"
						src={currentUrl}
						className="inset-deep"
						name="help-frame"
						style={{
							margin: "1px",
							backgroundColor: "white",
							border: "",
						}}
					/>
				</div>
			</div>

			{/* Window resize handles - using useResizable hook */}
			<div className="handle" {...resizeHandleProps.ne} />
			<div className="handle" {...resizeHandleProps.n} />
			<div className="handle" {...resizeHandleProps.nw} />
			<div className="handle" {...resizeHandleProps.w} />
			<div className="handle" {...resizeHandleProps.sw} />
			<div className="handle" {...resizeHandleProps.s} />
			<div className="handle" {...resizeHandleProps.se} />
			<div className="handle" {...resizeHandleProps.e} />
		</div>,
		document.body
	);
}

export default HelpWindow;
