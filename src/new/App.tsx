import React, { ErrorInfo, Component as ReactComponent, ReactNode, useCallback, useMemo, useState } from "react";
import { Canvas } from "../react/components/Canvas";
import { ColorBox } from "../react/components/ColorBox";
import { DialogManager } from "../react/components/DialogManager";
import type { AttributesValues } from "../react/components/dialogs/AttributesDialog";
import type { FlipRotateAction } from "../react/components/dialogs/FlipRotateDialog";
import type { StretchSkewValues } from "../react/components/dialogs/StretchSkewDialog";
import { DEFAULT_STATUS_TEXT, Frame } from "../react/components/Frame";
import { Tool, ToolBox } from "../react/components/ToolBox";
import { ToolOptions } from "../react/components/ToolOptions";
import { MessageBoxDialog, type MessageBoxResult } from "../react/components/dialogs/MessageBoxDialog";
import { useInitializeStores } from "../react/context/state/useInitializeStores";
import { useUIStore } from "../react/context/state/uiStore";
import { useSettingsStore } from "../react/context/state/settingsStore";
import { useToolStore } from "../react/context/state/toolStore";
import { TOOL_IDS } from "../react/context/state/types";
import { useTreeHistory } from "../react/context/state/useTreeHistory";
import { useColors } from "../react/context/state/useColors";
import { useTool } from "../react/context/state/useTool";
import { useHistory } from "../react/context/state/useHistory";
import { useSelection } from "../react/context/state/useSelection";
import { useMagnification } from "../react/context/state/useMagnification";
import { useCursorPosition } from "../react/context/state/useCursorPosition";
import { useApp } from "../react/context/state/useApp";
import { useCanvasDimensions } from "../react/context/state/useCanvasDimensions";
import { useShallow } from "zustand/react/shallow";
import { defaultCustomColors } from "../react/data/basicColors";
import { createMenus } from "../react/menus/menuDefinitions";
import { useMenuActions } from "../react/hooks/useMenuActions";
import { useKeyboardShortcuts } from "../react/hooks/useKeyboardShortcuts";
import {
    applyToCanvas,
    flipHorizontal,
    flipVertical,
    invertColors,
    rotate,
    skew,
    stretch,
    transformCanvas,
} from "../react/utils/imageTransforms";
import { downloadCanvas } from "../react/utils/imageFormats";

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
		// console.error("React Error:", error, errorInfo);
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

// Store initialization wrapper
function StoreInitializer({ children }: { children: ReactNode }) {
	const { isInitialized, error: storeInitError } = useInitializeStores();

	// Show loading state while stores are initializing
	if (!isInitialized) {
		return (
			<div style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100vh',
				fontFamily: 'Arial',
				fontSize: '14px'
			}}>
				Loading persisted settings...
			</div>
		);
	}

	// Log initialization errors but continue (will use defaults)
	if (storeInitError) {
		// console.warn('[Store Init] Failed to load persisted settings, using defaults:', storeInitError);
	}

	return <>{children}</>;
}

function AppContent() {
	// console.warn('[AppContent] 🎨 RENDER START');

	// Create canvas ref locally (was in AppProvider)
	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	// Use Zustand hooks instead of AppContext
	const { state } = useApp();
	const { primaryColor, secondaryColor, palette, setPrimaryColor, setSecondaryColor } = useColors();
	const { selectedToolId, setTool } = useTool();
	const { canUndo, canRedo, undo, redo, saveState } = useHistory();
	const { getRoot, goToNode } = useTreeHistory();
	const { cursorPosition } = useCursorPosition();
	const { selection, setSelection, clearSelection, hasSelection } = useSelection();

	// console.warn('[AppContent] 📦 All hooks called successfully');

	// Clipboard actions using direct store access to avoid infinite loops
	const clipboard = useToolStore((state) => state.clipboard);
	const setClipboard = useToolStore((state) => state.setClipboard);
	const hasClipboard = clipboard !== null;
	const copy = useCallback(() => {
		if (selection?.imageData) {
			setClipboard(selection.imageData);
		}
	}, [selection, setClipboard]);
	const cut = useCallback(() => {
		if (selection?.imageData) {
			setClipboard(selection.imageData);
		}
	}, [selection, setClipboard]);
	const paste = useCallback(() => clipboard, [clipboard]);

	const { magnification, setMagnification } = useMagnification();
	const { canvasWidth, canvasHeight, setCanvasSize } = useCanvasDimensions();

	// Use stores directly
	const { textBox } = useToolStore(useShallow(
		(state) => ({ textBox: state.textBox })
	));

	const {
		fontFamily,
		fontSize,
		fontBold,
		fontItalic,
		fontUnderline,
		setFontFamily,
		setFontSize,
		setFontStyle,
	} = useSettingsStore(useShallow(
		(state) => ({
			fontFamily: state.fontFamily,
			fontSize: state.fontSize,
			fontBold: state.fontBold,
			fontItalic: state.fontItalic,
			fontUnderline: state.fontUnderline,
			setFontFamily: state.setFontFamily,
			setFontSize: state.setFontSize,
			setFontStyle: state.setFontStyle,
		})
	));

	const {
		showToolBox,
		showColorBox,
		showStatusBar,
		showTextToolbar,
		showGrid,
		showThumbnail,
		toggleToolBox,
		toggleColorBox,
		toggleStatusBar,
		toggleTextToolbar,
		toggleGrid,
		toggleThumbnail,
	} = useUIStore(useShallow(
		(state) => ({
			showToolBox: state.showToolBox,
			showColorBox: state.showColorBox,
			showStatusBar: state.showStatusBar,
			showTextToolbar: state.showTextToolbar,
			showGrid: state.showGrid,
			showThumbnail: state.showThumbnail,
			toggleToolBox: state.toggleToolBox,
			toggleColorBox: state.toggleColorBox,
			toggleStatusBar: state.toggleStatusBar,
			toggleTextToolbar: state.toggleTextToolbar,
			toggleGrid: state.toggleGrid,
			toggleThumbnail: state.toggleThumbnail,
		})
	));

	const { drawOpaque, toggleDrawOpaque } = useSettingsStore(useShallow(
		(state) => ({
			drawOpaque: state.drawOpaque,
			toggleDrawOpaque: state.toggleDrawOpaque,
		})
	));

	const [hoveredTool, setHoveredTool] = React.useState<Tool | null>(null);

	// Custom colors state for the color editor
	const [customColors, setCustomColors] = useState<string[]>(defaultCustomColors);

	// MessageBox state for File > New confirmation
	const [showNewConfirm, setShowNewConfirm] = useState(false);

	// Font state for FontBoxWindow
	const fontState = useMemo(
		() => ({
			family: fontFamily,
			size: fontSize,
			bold: fontBold,
			italic: fontItalic,
			underline: fontUnderline,
			vertical: false,
		}),
		[fontFamily, fontSize, fontBold, fontItalic, fontUnderline],
	);

	const handleFontChange = useCallback(
		(newFontState: typeof fontState) => {
			if (newFontState.family !== fontFamily) {
				setFontFamily(newFontState.family);
			}
			if (newFontState.size !== fontSize) {
				setFontSize(newFontState.size);
			}
			if (
				newFontState.bold !== fontBold ||
				newFontState.italic !== fontItalic ||
				newFontState.underline !== fontUnderline
			) {
				setFontStyle(newFontState.bold, newFontState.italic, newFontState.underline);
			}
		},
		[fontFamily, fontSize, fontBold, fontItalic, fontUnderline, setFontFamily, setFontSize, setFontStyle],
	);

	// Show font box when text tool is selected or text box is active
	// Use useMemo to stabilize this value - only recalculate when selectedToolId or textBox.isActive actually changes
	const showFontBox = useMemo(() => {
		return selectedToolId === TOOL_IDS.TEXT || textBox?.isActive;
	}, [selectedToolId, textBox?.isActive]);

	// Dialog state from uiStore
	const dialogs = useUIStore((state) => state.dialogs);
	const openDialog = useUIStore((state) => state.openDialog);
	const closeDialog = useUIStore((state) => state.closeDialog);

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

	const handleSaveAs = useCallback(
		async (filename: string, formatId: string) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			try {
				await downloadCanvas(canvas, filename, formatId);
			} catch (error) {
				// console.error("Failed to save file:", error);
				alert(`Failed to save file: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		},
		[canvasRef],
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

	const handleHistoryNavigate = useCallback(
		(nodeId: string) => {
			const node = goToNode(nodeId);
			if (node && canvasRef.current) {
				// Restore canvas from history node
				const ctx = canvasRef.current.getContext("2d");
				if (ctx) {
					ctx.putImageData(node.imageData, 0, 0);
				}

				// Restore selection if present
				if (node.selectionImageData) {
					setSelection({
						x: node.selectionX ?? 0,
						y: node.selectionY ?? 0,
						width: node.selectionWidth ?? 0,
						height: node.selectionHeight ?? 0,
						imageData: node.selectionImageData,
					});
				} else {
					clearSelection();
				}
			}
		},
		[goToNode, canvasRef, setSelection, clearSelection],
	);

	// Create menu actions using extracted hook
	const menuActions = useMenuActions({
		canvasRef,
		saveState,
		setCanvasSize,
		undo,
		redo,
		canUndo,
		canRedo,
		hasSelection,
		selection,
		copy,
		cut,
		paste,
		hasClipboard,
		clearSelection,
		handleSelectAll,
		handleInvertColors,
		handleClearImage,
		secondaryColor,
		setSelection,
		setTool,
		showToolBox,
		showColorBox,
		showStatusBar,
		showTextToolbar,
		showGrid,
		showThumbnail,
		toggleToolBox,
		toggleColorBox,
		toggleStatusBar,
		toggleTextToolbar,
		toggleGrid,
		toggleThumbnail,
		toggleDrawOpaque,
		drawOpaque,
		magnification,
		setMagnification,
		palette,
	});

	// Create the menu structure
	const menu = useMemo(() => createMenus(menuActions), [menuActions]);

	// Handle keyboard shortcuts
	useKeyboardShortcuts({
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
	});

	// Format cursor position for status bar
	const positionText = cursorPosition ? `${cursorPosition.x}, ${cursorPosition.y}` : "";

	// Format selection or canvas size for status bar
	const sizeText = selection
		? `${Math.abs(selection.width)}x${Math.abs(selection.height)}`
		: `${state.canvasWidth}x${state.canvasHeight}`;

	// console.warn('[AppContent] 🎨 RENDER END - returning JSX');

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
				canvasContent={<Canvas canvasRef={canvasRef} key="main-canvas" />}
				statusText={showStatusBar ? statusMessage : ""}
				statusPosition={showStatusBar ? positionText : ""}
				statusSize={showStatusBar ? sizeText : ""}
			/>

		<DialogManager
			dialogs={dialogs}
			closeDialog={closeDialog}
			handleFlipRotate={handleFlipRotate}
			handleStretchSkew={handleStretchSkew}
			handleAttributes={handleAttributes}
			handleLoadFromUrl={handleLoadFromUrl}
			handleSaveAs={handleSaveAs}
			handleColorSelect={handleColorSelect}
			handleHistoryNavigate={handleHistoryNavigate}
			canvasWidth={canvasWidth}
			canvasHeight={canvasHeight}
			magnification={magnification}
			setMagnification={setMagnification}
			primaryColor={primaryColor}
			customColors={customColors}
			rootNode={getRoot()}
			currentNode={null}  // Dialog will get this directly from store
			canvasRef={canvasRef}
			showFontBox={showFontBox}
			toggleTextToolbar={toggleTextToolbar}
			fontState={fontState}
			handleFontChange={handleFontChange}
			textBox={textBox}
			showThumbnail={showThumbnail}
			toggleThumbnail={toggleThumbnail}
		/>
	</>
);
}

export function App() {
	return (
		<ErrorBoundary>
			<StoreInitializer>
				<AppContent />
			</StoreInitializer>
		</ErrorBoundary>
	);
}

export default App;
