import React, { useCallback, useMemo, useState, useRef } from "react";
import { Canvas } from "../react/components/Canvas";
import { ColorBox } from "../react/components/ColorBox";
import { DialogManager } from "../react/components/DialogManager";
import { ErrorBoundary } from "../react/components/ErrorBoundary";
import type { AttributesValues } from "../react/components/dialogs/AttributesDialog";
import type { FlipRotateAction } from "../react/components/dialogs/FlipRotateDialog";
import type { StretchSkewValues } from "../react/components/dialogs/StretchSkewDialog";
import { DEFAULT_STATUS_TEXT, Frame } from "../react/components/Frame";
import { type Tool, ToolBox } from "../react/components/ToolBox";
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
import { TOOLBOX_ITEMS } from "../react/data/toolboxItems";
import { createMenus } from "../react/menus/menuDefinitions";
import { useMenuActions } from "../react/hooks/useMenuActions";
import { useKeyboardShortcuts } from "../react/hooks/useKeyboardShortcuts";
import { useDialogHandlers } from "../react/hooks/useDialogHandlers";
import { useFontState } from "../react/hooks/useFontState";

// Store initialization wrapper
function StoreInitializer({ children }: { children: React.ReactNode }) {
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

	// Wrapper for saveState that captures canvas imageData
	const saveHistoryState = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		saveState(imageData);
	}, [canvasRef, saveState]);

	const { magnification, setMagnification } = useMagnification();
	const { canvasWidth, canvasHeight, setCanvasSize } = useCanvasDimensions();

	// Use stores directly
	const { textBox } = useToolStore(useShallow(
		(state) => ({ textBox: state.textBox })
	));

	// Use font state hook for FontBoxWindow integration
	const { fontState, handleFontChange, showFontBox } = useFontState(selectedToolId, textBox?.isActive);

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

	// Dialog state from uiStore
	const dialogs = useUIStore((state) => state.dialogs);
	const openDialog = useUIStore((state) => state.openDialog);
	const closeDialog = useUIStore((state) => state.closeDialog);

	const activeTool = useMemo(
		() => TOOLBOX_ITEMS.find((tool) => tool.id === selectedToolId) ?? TOOLBOX_ITEMS[6],
		[selectedToolId],
	);

	const statusMessage = hoveredTool?.description ?? activeTool?.description ?? DEFAULT_STATUS_TEXT;

	// Use dialog handlers hook
	const dialogHandlers = useDialogHandlers({
		canvasRef,
		saveState: saveHistoryState,
		setCanvasSize,
		canvasWidth,
		canvasHeight,
		secondaryColor,
		setPrimaryColor,
		setSelection,
		clearSelection,
		setTool,
		goToNode,
		setShowNewConfirm,
		setCustomColors,
	});

	// Create menu actions using extracted hook
	const menuActions = useMenuActions({
		canvasRef,
		saveState: saveHistoryState,
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
		handleSelectAll: dialogHandlers.handleSelectAll,
		handleInvertColors: dialogHandlers.handleInvertColors,
		handleClearImage: dialogHandlers.handleClearImage,
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
		onShowNewConfirm: () => setShowNewConfirm(true),
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
		handleSelectAll: dialogHandlers.handleSelectAll,
		handleInvertColors: dialogHandlers.handleInvertColors,
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

		<MessageBoxDialog
			isOpen={showNewConfirm}
			onClose={dialogHandlers.handleNewConfirm}
			title="Paint"
			message="Clear the current image and start new?"
			buttons="yesNo"
			icon="question"
			defaultButton="yes"
		/>

		<DialogManager
			dialogs={dialogs}
			closeDialog={closeDialog}
			handleFlipRotate={dialogHandlers.handleFlipRotate}
			handleStretchSkew={dialogHandlers.handleStretchSkew}
			handleAttributes={dialogHandlers.handleAttributes}
			handleLoadFromUrl={dialogHandlers.handleLoadFromUrl}
			handleSaveAs={dialogHandlers.handleSaveAs}
			handleColorSelect={dialogHandlers.handleColorSelect}
			handleHistoryNavigate={dialogHandlers.handleHistoryNavigate}
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
