import React, { ErrorInfo, Component as ReactComponent, ReactNode, useMemo, useState, useCallback } from "react";
import { Canvas } from "../react/components/Canvas";
import { ColorBox } from "../react/components/ColorBox";
import { DEFAULT_STATUS_TEXT, Frame } from "../react/components/Frame";
import { Tool, ToolBox } from "../react/components/ToolBox";
import { ToolOptions } from "../react/components/ToolOptions";
import {
	AppProvider,
	TOOL_IDS,
	useApp,
	useCanvas,
	useClipboard,
	useColors,
	useCursorPosition,
	useHistory,
	useMagnification,
	useSelection,
	useTool,
	useViewState,
} from "../react/context/AppContext";
import { createMenus, MenuActions } from "../react/menus/menuDefinitions";
import {
	AboutDialog,
	AttributesDialog,
	CustomZoomDialog,
	EditColorsDialog,
	FlipRotateDialog,
	LoadFromUrlDialog,
	StretchSkewDialog,
	ImgurUploadDialog,
	ManageStorageDialog,
	HistoryDialog,
} from "../react/components/dialogs";
import { HelpWindow } from "../react/components/help";
import type { FlipRotateAction } from "../react/components/dialogs/FlipRotateDialog";
import type { StretchSkewValues } from "../react/components/dialogs/StretchSkewDialog";
import type { AttributesValues } from "../react/components/dialogs/AttributesDialog";
import {
	flipHorizontal,
	flipVertical,
	rotate,
	stretch,
	skew,
	invertColors,
	applyToCanvas,
	transformCanvas,
} from "../react/utils/imageTransforms";
import { defaultCustomColors } from "../react/data/basicColors";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

// Error boundary to catch rendering errors
class ErrorBoundary extends ReactComponent<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}
	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("React Error:", error, errorInfo);
	}
	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: 20, color: "red", background: "white" }}>
					<h2>Something went wrong:</h2>
					<pre>{this.state.error?.message}</pre>
					<pre>{this.state.error?.stack}</pre>
				</div>
			);
		}
		return this.props.children;
	}
}

const TOOLBOX_ITEMS: Tool[] = [
	{
		id: TOOL_IDS.FREE_FORM_SELECT,
		name: "Free-Form Select",
		description: "Selects a free-form part of the picture to move, copy, or edit.",
		iconIndex: 0,
	},
	{
		id: TOOL_IDS.SELECT,
		name: "Select",
		description: "Selects a rectangular part of the picture to move, copy, or edit.",
		iconIndex: 1,
	},
	{
		id: TOOL_IDS.ERASER,
		name: "Eraser",
		description: "Erases a portion of the picture, using the selected eraser shape.",
		iconIndex: 2,
	},
	{
		id: TOOL_IDS.FILL,
		name: "Fill With Color",
		description: "Fills an area with the selected drawing color.",
		iconIndex: 3,
	},
	{
		id: TOOL_IDS.PICK_COLOR,
		name: "Pick Color",
		description: "Picks up a color from the picture for drawing.",
		iconIndex: 4,
	},
	{
		id: TOOL_IDS.MAGNIFIER,
		name: "Magnifier",
		description: "Changes the magnification.",
		iconIndex: 5,
	},
	{
		id: TOOL_IDS.PENCIL,
		name: "Pencil",
		description: "Draws a free-form line one pixel wide.",
		iconIndex: 6,
	},
	{
		id: TOOL_IDS.BRUSH,
		name: "Brush",
		description: "Draws using a brush with the selected shape and size.",
		iconIndex: 7,
	},
	{
		id: TOOL_IDS.AIRBRUSH,
		name: "Airbrush",
		description: "Draws using an airbrush of the selected size.",
		iconIndex: 8,
	},
	{
		id: TOOL_IDS.TEXT,
		name: "Text",
		description: "Inserts text into the picture.",
		iconIndex: 9,
	},
	{
		id: TOOL_IDS.LINE,
		name: "Line",
		description: "Draws a straight line with the selected line width.",
		iconIndex: 10,
	},
	{
		id: TOOL_IDS.CURVE,
		name: "Curve",
		description: "Draws a curved line with the selected line width.",
		iconIndex: 11,
	},
	{
		id: TOOL_IDS.RECTANGLE,
		name: "Rectangle",
		description: "Draws a rectangle with the selected fill style.",
		iconIndex: 12,
	},
	{
		id: TOOL_IDS.POLYGON,
		name: "Polygon",
		description: "Draws a polygon with the selected fill style.",
		iconIndex: 13,
	},
	{
		id: TOOL_IDS.ELLIPSE,
		name: "Ellipse",
		description: "Draws an ellipse with the selected fill style.",
		iconIndex: 14,
	},
	{
		id: TOOL_IDS.ROUNDED_RECTANGLE,
		name: "Rounded Rectangle",
		description: "Draws a rounded rectangle with the selected fill style.",
		iconIndex: 15,
	},
];

// Dialog state type
interface DialogState {
	about: boolean;
	flipRotate: boolean;
	stretchSkew: boolean;
	attributes: boolean;
	customZoom: boolean;
	loadFromUrl: boolean;
	helpTopics: boolean;
	editColors: boolean;
	imgurUpload: boolean;
	manageStorage: boolean;
	history: boolean;
}

function AppContent() {
	const { state } = useApp();
	const { primaryColor, secondaryColor, palette, setPrimaryColor, setSecondaryColor } = useColors();
	const { selectedToolId, setTool } = useTool();
	const { canUndo, canRedo, undo, redo, saveState } = useHistory();
	const { cursorPosition } = useCursorPosition();
	const { selection, setSelection, clearSelection, hasSelection } = useSelection();
	const { copy, cut, paste, hasClipboard } = useClipboard();
	const { magnification, setMagnification } = useMagnification();
	const { canvasRef, canvasWidth, canvasHeight, setCanvasSize } = useCanvas();
	const {
		showToolBox,
		showColorBox,
		showStatusBar,
		showTextToolbar,
		showGrid,
		showThumbnail,
		drawOpaque,
		toggleToolBox,
		toggleColorBox,
		toggleStatusBar,
		toggleTextToolbar,
		toggleGrid,
		toggleThumbnail,
		toggleDrawOpaque,
	} = useViewState();

	const [hoveredTool, setHoveredTool] = React.useState<Tool | null>(null);

	// Custom colors state for the color editor
	const [customColors, setCustomColors] = useState<string[]>(defaultCustomColors);

	// Dialog state
	const [dialogs, setDialogs] = useState<DialogState>({
		about: false,
		flipRotate: false,
		stretchSkew: false,
		attributes: false,
		customZoom: false,
		loadFromUrl: false,
		helpTopics: false,
		editColors: false,
		imgurUpload: false,
		manageStorage: false,
		history: false,
	});

	const openDialog = useCallback((dialog: keyof DialogState) => {
		setDialogs((prev) => ({ ...prev, [dialog]: true }));
	}, []);

	const closeDialog = useCallback((dialog: keyof DialogState) => {
		setDialogs((prev) => ({ ...prev, [dialog]: false }));
	}, []);

	const activeTool = useMemo(
		() => TOOLBOX_ITEMS.find((tool) => tool.id === selectedToolId) ?? TOOLBOX_ITEMS[6],
		[selectedToolId],
	);

	const statusMessage = hoveredTool?.description ?? activeTool?.description ?? DEFAULT_STATUS_TEXT;

	// Dialog handlers
	const handleFlipRotate = useCallback(
		(action: FlipRotateAction) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			saveState();

			let result: ImageData;
			if (action.type === "flipHorizontal") {
				result = transformCanvas(ctx, flipHorizontal);
			} else if (action.type === "flipVertical") {
				result = transformCanvas(ctx, flipVertical);
			} else {
				result = transformCanvas(ctx, (data) => rotate(data, action.degrees));
			}

			applyToCanvas(ctx, result, true);
			if (canvas.width !== result.width || canvas.height !== result.height) {
				setCanvasSize(result.width, result.height);
			}
		},
		[canvasRef, saveState, setCanvasSize],
	);

	const handleStretchSkew = useCallback(
		(values: StretchSkewValues) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			saveState();

			let result = ctx.getImageData(0, 0, canvas.width, canvas.height);

			// Apply stretch if not 100%
			if (values.stretchHorizontal !== 100 || values.stretchVertical !== 100) {
				result = stretch(result, values.stretchHorizontal / 100, values.stretchVertical / 100);
			}

			// Apply skew if not 0
			if (values.skewHorizontal !== 0 || values.skewVertical !== 0) {
				result = skew(result, values.skewHorizontal, values.skewVertical);
			}

			applyToCanvas(ctx, result, true);
			setCanvasSize(result.width, result.height);
		},
		[canvasRef, saveState, setCanvasSize],
	);

	const handleAttributes = useCallback(
		(values: AttributesValues) => {
			if (values.width !== canvasWidth || values.height !== canvasHeight) {
				saveState();
				setCanvasSize(values.width, values.height);
			}
		},
		[canvasWidth, canvasHeight, saveState, setCanvasSize],
	);

	const handleLoadFromUrl = useCallback(
		(url: string) => {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				if (!ctx) return;

				saveState();
				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage(img, 0, 0);
				setCanvasSize(img.width, img.height);
			};
			img.onerror = () => {
				alert("Failed to load image from URL. The image may not allow cross-origin access.");
			};
			img.src = url;
		},
		[canvasRef, saveState, setCanvasSize],
	);

	const handleInvertColors = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		saveState();
		const result = transformCanvas(ctx, invertColors);
		applyToCanvas(ctx, result, false);
	}, [canvasRef, saveState]);

	const handleColorSelect = useCallback(
		(color: string, newCustomColors: string[]) => {
			setPrimaryColor(color);
			setCustomColors(newCustomColors);
		},
		[setPrimaryColor],
	);

	const handleClearImage = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		saveState();
		ctx.fillStyle = secondaryColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}, [canvasRef, saveState, secondaryColor]);

	const handleSelectAll = useCallback(() => {
		setSelection({
			x: 0,
			y: 0,
			width: canvasWidth,
			height: canvasHeight,
			imageData: null,
		});
		setTool(TOOL_IDS.SELECT);
	}, [canvasWidth, canvasHeight, setSelection, setTool]);

	// Create menu actions
	const menuActions: MenuActions = useMemo(
		() => ({
			// File menu
			fileNew: () => {
				if (confirm("Clear the current image and start new?")) {
					saveState();
					const canvas = canvasRef.current;
					if (canvas) {
						const ctx = canvas.getContext("2d", { willReadFrequently: true });
						if (ctx) {
							ctx.fillStyle = "#FFFFFF";
							ctx.fillRect(0, 0, canvas.width, canvas.height);
						}
					}
				}
			},
			fileOpen: () => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = "image/*";
				input.onchange = (e) => {
					const file = (e.target as HTMLInputElement).files?.[0];
					if (!file) return;
					const reader = new FileReader();
					reader.onload = (ev) => {
						const img = new Image();
						img.onload = () => {
							const canvas = canvasRef.current;
							if (!canvas) return;
							const ctx = canvas.getContext("2d", { willReadFrequently: true });
							if (!ctx) return;
							saveState();
							canvas.width = img.width;
							canvas.height = img.height;
							ctx.drawImage(img, 0, 0);
							setCanvasSize(img.width, img.height);
						};
						img.src = ev.target?.result as string;
					};
					reader.readAsDataURL(file);
				};
				input.click();
			},
			fileSave: () => {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const link = document.createElement("a");
				link.download = "image.png";
				link.href = canvas.toDataURL("image/png");
				link.click();
			},
			fileSaveAs: () => {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const link = document.createElement("a");
				link.download = "image.png";
				link.href = canvas.toDataURL("image/png");
				link.click();
			},
			fileLoadFromUrl: () => openDialog("loadFromUrl"),
			fileUploadToImgur: () => {
				openDialog("imgurUpload");
			},
			fileManageStorage: () => {
				openDialog("manageStorage");
			},
			filePrint: () => window.print(),
			fileExit: () => {
				if (confirm("Are you sure you want to exit?")) {
					window.close();
				}
			},

			// Edit menu
			editUndo: undo,
			editRedo: redo,
			editHistory: () => {
				openDialog("history");
			},
			editCut: () => {
				if (hasSelection) {
					cut();
					clearSelection();
				}
			},
			editCopy: () => {
				if (hasSelection) copy();
			},
			editPaste: () => {
				if (hasClipboard) paste();
			},
			editClearSelection: () => {
				if (hasSelection) {
					const canvas = canvasRef.current;
					if (canvas && selection) {
						const ctx = canvas.getContext("2d", { willReadFrequently: true });
						if (ctx) {
							saveState();
							ctx.fillStyle = secondaryColor;
							ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
						}
					}
					clearSelection();
				}
			},
			editSelectAll: handleSelectAll,
			editCopyTo: () => {
				if (hasSelection) {
					const canvas = canvasRef.current;
					if (canvas && selection) {
						const tempCanvas = document.createElement("canvas");
						tempCanvas.width = selection.width;
						tempCanvas.height = selection.height;
						const tempCtx = tempCanvas.getContext("2d");
						if (tempCtx) {
							const ctx = canvas.getContext("2d", { willReadFrequently: true });
							if (ctx) {
								const imageData = ctx.getImageData(
									selection.x,
									selection.y,
									selection.width,
									selection.height,
								);
								tempCtx.putImageData(imageData, 0, 0);
								const link = document.createElement("a");
								link.download = "selection.png";
								link.href = tempCanvas.toDataURL("image/png");
								link.click();
							}
						}
					}
				}
			},
			editPasteFrom: () => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = "image/*";
				input.onchange = (e) => {
					const file = (e.target as HTMLInputElement).files?.[0];
					if (!file) return;
					const reader = new FileReader();
					reader.onload = (ev) => {
						const img = new Image();
						img.onload = () => {
							const tempCanvas = document.createElement("canvas");
							tempCanvas.width = img.width;
							tempCanvas.height = img.height;
							const tempCtx = tempCanvas.getContext("2d");
							if (tempCtx) {
								tempCtx.drawImage(img, 0, 0);
								const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
								setSelection({
									x: 0,
									y: 0,
									width: img.width,
									height: img.height,
									imageData,
								});
								setTool(TOOL_IDS.SELECT);
							}
						};
						img.src = ev.target?.result as string;
					};
					reader.readAsDataURL(file);
				};
				input.click();
			},

			// View menu
			viewToggleToolBox: toggleToolBox,
			viewToggleColorBox: toggleColorBox,
			viewToggleStatusBar: toggleStatusBar,
			viewToggleTextToolbar: toggleTextToolbar,
			viewZoomNormal: () => setMagnification(1),
			viewZoomLarge: () => setMagnification(4),
			viewZoomToWindow: () => {
				// Calculate zoom to fit window
				const container = document.querySelector(".canvas-area");
				if (container && canvasRef.current) {
					const containerRect = container.getBoundingClientRect();
					const canvas = canvasRef.current;
					const scaleX = containerRect.width / canvas.width;
					const scaleY = containerRect.height / canvas.height;
					const scale = Math.min(scaleX, scaleY, 8);
					setMagnification(Math.max(0.1, scale));
				}
			},
			viewZoomCustom: () => openDialog("customZoom"),
			viewToggleGrid: toggleGrid,
			viewToggleThumbnail: toggleThumbnail,
			viewBitmap: () => {
				const canvas = canvasRef.current;
				if (canvas) {
					const dataUrl = canvas.toDataURL("image/png");
					const win = window.open();
					if (win) {
						win.document.write(`<img src="${dataUrl}" style="image-rendering: pixelated;">`);
					}
				}
			},
			viewFullscreen: () => {
				if (document.fullscreenElement) {
					document.exitFullscreen();
				} else {
					document.documentElement.requestFullscreen();
				}
			},

			// Image menu
			imageFlipRotate: () => openDialog("flipRotate"),
			imageStretchSkew: () => openDialog("stretchSkew"),
			imageInvertColors: handleInvertColors,
			imageAttributes: () => openDialog("attributes"),
			imageClearImage: handleClearImage,
			imageCropToSelection: () => {
				if (!selection) return;
				const canvas = canvasRef.current;
				if (!canvas) return;
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				if (!ctx) return;

				saveState();

				// Get the selection area from the canvas
				const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);

				// Resize canvas to selection size
				canvas.width = selection.width;
				canvas.height = selection.height;

				// Draw the cropped content
				ctx.putImageData(imageData, 0, 0);

				// Update canvas size in state
				setCanvasSize(selection.width, selection.height);

				// Clear the selection
				clearSelection();
			},
			imageToggleDrawOpaque: toggleDrawOpaque,

			// Colors menu
			colorsEditColors: () => {
				openDialog("editColors");
			},
			colorsGetColors: () => {
				// Open file picker for palette files
				const input = document.createElement("input");
				input.type = "file";
				input.accept = ".pal,.gpl,.act,.aco,.ase,.txt";
				input.onchange = (e) => {
					const file = (e.target as HTMLInputElement).files?.[0];
					if (!file) return;
					const reader = new FileReader();
					reader.onload = (ev) => {
						const text = ev.target?.result as string;
						// Simple PAL/GPL parser - just extract hex colors
						const hexColorRegex = /#([0-9A-Fa-f]{6})/g;
						const colors: string[] = [];
						let match;
						while ((match = hexColorRegex.exec(text)) !== null) {
							colors.push(`#${match[1]}`);
						}
						if (colors.length > 0) {
							// For now, just show success - full palette updating would require palette state management
							alert(`Loaded ${colors.length} colors from palette file. Full palette integration coming soon.`);
						} else {
							alert("No colors found in the palette file. Please make sure it's a valid .PAL or .GPL file.");
						}
					};
					reader.readAsText(file);
				};
				input.click();
			},
			colorsSaveColors: () => {
				// Save current palette as a simple GIMP Palette (.gpl) file
				let gplContent = "GIMP Palette\nName: JS Paint Colors\nColumns: 14\n#\n";
				for (let i = 0; i < palette.length; i++) {
					const color = palette[i];
					// Convert hex to RGB
					const r = parseInt(color.slice(1, 3), 16);
					const g = parseInt(color.slice(3, 5), 16);
					const b = parseInt(color.slice(5, 7), 16);
					gplContent += `${r.toString().padStart(3)} ${g.toString().padStart(3)} ${b.toString().padStart(3)}\tColor ${i + 1}\n`;
				}

				// Download the file
				const blob = new Blob([gplContent], { type: "text/plain" });
				const link = document.createElement("a");
				link.download = "palette.gpl";
				link.href = URL.createObjectURL(blob);
				link.click();
				URL.revokeObjectURL(link.href);
			},

			// Help menu
			helpTopics: () => openDialog("helpTopics"),
			helpAbout: () => openDialog("about"),

			// State checks
			canUndo: () => canUndo,
			canRedo: () => canRedo,
			hasSelection: () => hasSelection,
			hasClipboard: () => hasClipboard,
			isToolBoxVisible: () => showToolBox,
			isColorBoxVisible: () => showColorBox,
			isStatusBarVisible: () => showStatusBar,
			isTextToolbarVisible: () => showTextToolbar,
			isGridVisible: () => showGrid,
			isThumbnailVisible: () => showThumbnail,
			isFullscreen: () => !!document.fullscreenElement,
			isDrawOpaque: () => drawOpaque,
			getMagnification: () => magnification,
		}),
		[
			canUndo,
			canRedo,
			undo,
			redo,
			hasSelection,
			hasClipboard,
			copy,
			cut,
			paste,
			clearSelection,
			selection,
			secondaryColor,
			handleSelectAll,
			handleInvertColors,
			handleClearImage,
			showToolBox,
			showColorBox,
			showStatusBar,
			showTextToolbar,
			showGrid,
			showThumbnail,
			drawOpaque,
			magnification,
			toggleToolBox,
			toggleColorBox,
			toggleStatusBar,
			toggleTextToolbar,
			toggleGrid,
			toggleThumbnail,
			toggleDrawOpaque,
			setMagnification,
			openDialog,
			saveState,
			canvasRef,
			setCanvasSize,
			setSelection,
			setTool,
		],
	);

	// Create the menu structure
	const menu = useMemo(() => createMenus(menuActions), [menuActions]);

	// Handle keyboard shortcuts
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't handle shortcuts if typing in a text input
			const target = e.target as HTMLElement;
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
				// Allow Escape to exit text input
				if (e.key === "Escape") {
					target.blur();
				}
				return;
			}

			// Modifier key detection (Ctrl on Windows/Linux, Cmd on Mac)
			const isMod = e.ctrlKey || e.metaKey;

			// Ctrl/Cmd+Z for undo
			if (isMod && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				if (canUndo) undo();
				return;
			}

			// Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z for redo
			if (
				(isMod && e.key === "y") ||
				(isMod && e.shiftKey && e.key === "z") ||
				(isMod && e.shiftKey && e.key === "Z")
			) {
				e.preventDefault();
				if (canRedo) redo();
				return;
			}

			// Ctrl/Cmd+A for select all
			if (isMod && e.key === "a") {
				e.preventDefault();
				handleSelectAll();
				return;
			}

			// Ctrl/Cmd+C for copy
			if (isMod && e.key === "c") {
				if (hasSelection) {
					e.preventDefault();
					copy();
				}
				return;
			}

			// Ctrl/Cmd+X for cut
			if (isMod && e.key === "x") {
				if (hasSelection) {
					e.preventDefault();
					cut();
					clearSelection();
				}
				return;
			}

			// Ctrl/Cmd+V for paste
			if (isMod && e.key === "v") {
				if (hasClipboard) {
					e.preventDefault();
					paste();
				}
				return;
			}

			// Ctrl/Cmd+I for invert colors
			if (isMod && e.key === "i") {
				e.preventDefault();
				handleInvertColors();
				return;
			}

			// Delete or Backspace to clear selection
			if (e.key === "Delete" || e.key === "Backspace") {
				if (hasSelection) {
					e.preventDefault();
					menuActions.editClearSelection();
				}
				return;
			}

			// Escape to cancel current operation / deselect
			if (e.key === "Escape") {
				e.preventDefault();
				clearSelection();
				return;
			}

			// F11 for fullscreen
			if (e.key === "F11") {
				e.preventDefault();
				menuActions.viewFullscreen();
				return;
			}

			// Tool shortcuts (single keys)
			if (!isMod && !e.shiftKey && !e.altKey) {
				switch (e.key.toLowerCase()) {
					case "p":
						setTool(TOOL_IDS.PENCIL);
						break;
					case "b":
						setTool(TOOL_IDS.BRUSH);
						break;
					case "e":
						setTool(TOOL_IDS.ERASER);
						break;
					case "f":
						setTool(TOOL_IDS.FILL);
						break;
					case "k":
						setTool(TOOL_IDS.PICK_COLOR);
						break;
					case "l":
						setTool(TOOL_IDS.LINE);
						break;
					case "r":
						setTool(TOOL_IDS.RECTANGLE);
						break;
					case "o":
						setTool(TOOL_IDS.ELLIPSE);
						break;
					case "s":
						setTool(TOOL_IDS.SELECT);
						break;
					case "a":
						setTool(TOOL_IDS.AIRBRUSH);
						break;
					case "t":
						setTool(TOOL_IDS.TEXT);
						break;
					case "m":
						setTool(TOOL_IDS.MAGNIFIER);
						break;
					case "c":
						setTool(TOOL_IDS.CURVE);
						break;
					case "g":
						setTool(TOOL_IDS.POLYGON);
						break;
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		canUndo,
		canRedo,
		undo,
		redo,
		setTool,
		hasSelection,
		copy,
		cut,
		paste,
		hasClipboard,
		clearSelection,
		handleSelectAll,
		handleInvertColors,
		menuActions,
	]);

	// Format cursor position for status bar
	const positionText = cursorPosition ? `${cursorPosition.x}, ${cursorPosition.y}` : "";

	// Format selection or canvas size for status bar
	const sizeText = selection
		? `${Math.abs(selection.width)}x${Math.abs(selection.height)}`
		: `${state.canvasWidth}x${state.canvasHeight}`;

	return (
		<>
			<Frame
				menu={menu}
				leftContent={
					showToolBox ? (
						<ToolBox
							tools={TOOLBOX_ITEMS}
							selectedToolIds={[selectedToolId]}
							onSelectionChange={(toolIds) => setTool(toolIds[0])}
							onHoverChange={setHoveredTool}
						>
							<ToolOptions />
						</ToolBox>
					) : null
				}
				bottomContent={
					showColorBox ? (
						<ColorBox
							palette={palette}
							initialPrimary={primaryColor}
							initialSecondary={secondaryColor}
							onPrimaryChange={setPrimaryColor}
							onSecondaryChange={setSecondaryColor}
						/>
					) : null
				}
				canvasContent={<Canvas />}
				statusText={showStatusBar ? statusMessage : ""}
				statusPosition={showStatusBar ? positionText : ""}
				statusSize={showStatusBar ? sizeText : ""}
			/>

			{/* Dialogs */}
			<AboutDialog isOpen={dialogs.about} onClose={() => closeDialog("about")} />
			<FlipRotateDialog
				isOpen={dialogs.flipRotate}
				onClose={() => closeDialog("flipRotate")}
				onApply={handleFlipRotate}
			/>
			<StretchSkewDialog
				isOpen={dialogs.stretchSkew}
				onClose={() => closeDialog("stretchSkew")}
				onApply={handleStretchSkew}
			/>
			<AttributesDialog
				isOpen={dialogs.attributes}
				onClose={() => closeDialog("attributes")}
				onApply={handleAttributes}
				currentWidth={canvasWidth}
				currentHeight={canvasHeight}
			/>
			<CustomZoomDialog
				isOpen={dialogs.customZoom}
				onClose={() => closeDialog("customZoom")}
				onApply={setMagnification}
				currentMagnification={magnification}
			/>
			<LoadFromUrlDialog
				isOpen={dialogs.loadFromUrl}
				onClose={() => closeDialog("loadFromUrl")}
				onLoad={handleLoadFromUrl}
			/>
			<EditColorsDialog
				isOpen={dialogs.editColors}
				onClose={() => closeDialog("editColors")}
				initialColor={primaryColor}
				customColors={customColors}
				onColorSelect={handleColorSelect}
			/>
			<HelpWindow isOpen={dialogs.helpTopics} onClose={() => closeDialog("helpTopics")} />
			<ImgurUploadDialog
				isOpen={dialogs.imgurUpload}
				onClose={() => closeDialog("imgurUpload")}
				onUpload={() => {}}
				imageDataUrl={canvasRef.current?.toDataURL("image/png") || ""}
			/>
			<ManageStorageDialog
				isOpen={dialogs.manageStorage}
				onClose={() => closeDialog("manageStorage")}
			/>
			<HistoryDialog
				isOpen={dialogs.history}
				onClose={() => closeDialog("history")}
				undoStack={state.undoStack}
				redoStack={state.redoStack}
				onGoToState={(index, isRedo) => {
					if (isRedo) {
						redo();
					} else {
						undo();
					}
				}}
			/>
		</>
	);
}

export function App() {
	return (
		<ErrorBoundary>
			<AppProvider>
				<AppContent />
			</AppProvider>
		</ErrorBoundary>
	);
}

export default App;
