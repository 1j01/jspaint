import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Canvas } from "../react/components/Canvas";
import { ColorBox } from "../react/components/ColorBox";
import { DialogManager } from "../react/components/DialogManager";
import { ErrorBoundary } from "../react/components/ErrorBoundary";
import { DEFAULT_STATUS_TEXT, Frame } from "../react/components/Frame";
import { type Tool, ToolBox } from "../react/components/ToolBox";
import { ToolOptions } from "../react/components/ToolOptions";
import { AISidePanel } from "../react/components/ai/AISidePanel";
import { MessageBoxDialog } from "../react/components/dialogs/MessageBoxDialog";
import { useSettingsStore } from "../react/context/state/settingsStore";
import { useToolStore } from "../react/context/state/toolStore";
import { TOOL_IDS } from "../react/context/state/types";
import { useUIStore } from "../react/context/state/uiStore";
import { useApp } from "../react/context/state/useApp";
import { useCanvasDimensions } from "../react/context/state/useCanvasDimensions";
import { useColors } from "../react/context/state/useColors";
import { useCursorPosition } from "../react/context/state/useCursorPosition";
import { useInitializeStores } from "../react/context/state/useInitializeStores";
import { useMagnification } from "../react/context/state/useMagnification";
import { useTool } from "../react/context/state/useTool";
import { defaultCustomColors } from "../react/data/basicColors";
import { TOOLBOX_ITEMS } from "../react/data/toolboxItems";
import { useCanvasHistory } from "../react/hooks/useCanvasHistory";
import { useClipboardOperations } from "../react/hooks/useClipboardOperations";
import { useDialogHandlers } from "../react/hooks/useDialogHandlers";
import { useFontState } from "../react/hooks/useFontState";
import { useKeyboardShortcuts } from "../react/hooks/useKeyboardShortcuts";
import { useMenuActions } from "../react/hooks/useMenuActions";
import { createMenus } from "../react/menus/menuDefinitions";

/**
 * Props for StoreInitializer component
 */
interface StoreInitializerProps {
  children: React.ReactNode;
}

/**
 * Store initialization wrapper component
 * Displays loading state while Zustand stores are being initialized from persisted state.
 * Shows error message if initialization fails, but continues with defaults.
 *
 * @param {StoreInitializerProps} props - Component props
 * @returns {JSX.Element} Loading state or children once initialized
 */
function StoreInitializer({ children }: StoreInitializerProps) {
  const { isInitialized, error: storeInitError } = useInitializeStores();

  // Show loading state while stores are initializing
  if (!isInitialized) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "Arial",
          fontSize: "14px",
        }}
      >
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

/**
 * Main application content component
 * Orchestrates the entire MCPaint UI including:
 * - Canvas with drawing tools
 * - ToolBox and ColorBox sidebars
 * - Menu system with all File/Edit/View/Image/Colors/Help menus
 * - Dialog management
 * - Keyboard shortcuts
 * - State management via Zustand stores
 *
 * This component connects all Zustand stores to the UI and provides
 * handlers for user interactions that modify canvas state.
 *
 * @returns {JSX.Element} Complete MCPaint application UI
 *
 * @example
 * // Used inside StoreInitializer wrapper
 * <StoreInitializer>
 *   <AppContent />
 * </StoreInitializer>
 */
function AppContent() {
  // console.warn('[AppContent] 🎨 RENDER START');

  // Get translation function for menu labels
  const { t, i18n, ready } = useTranslation();

  // Create canvas ref locally (was in AppProvider)
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Use Zustand hooks instead of AppContext
  const { state } = useApp();
  const { primaryColor, secondaryColor, palette, setPrimaryColor, setSecondaryColor } = useColors();
  const { selectedToolId, setTool } = useTool();
  const { cursorPosition } = useCursorPosition();

  // Use extracted hooks for canvas history and clipboard
  const { saveHistoryState, undo, redo, canUndo, canRedo, getRoot, goToNode, rootNode } = useCanvasHistory({ canvasRef });

  const { hasClipboard, hasSelection, selection, setSelection, clearSelection, copy, cut, paste } =
    useClipboardOperations();

  // console.warn('[AppContent] 📦 All hooks called successfully');

  const { magnification, setMagnification } = useMagnification();
  const { canvasWidth, canvasHeight, setCanvasSize } = useCanvasDimensions();

  // Use stores directly
  const { textBox } = useToolStore(useShallow((state) => ({ textBox: state.textBox })));

  // Use font state hook for FontBoxWindow integration
  const { fontState, handleFontChange, showFontBox } = useFontState(selectedToolId, textBox?.isActive);

  const {
    showToolBox,
    showColorBox,
    showStatusBar,
    showTextToolbar,
    showGrid,
    showThumbnail,
    showAIPanel,
    toggleToolBox,
    toggleColorBox,
    toggleStatusBar,
    toggleTextToolbar,
    toggleGrid,
    toggleThumbnail,
    toggleAIPanel,
  } = useUIStore(
    useShallow((state) => ({
      showToolBox: state.showToolBox,
      showColorBox: state.showColorBox,
      showStatusBar: state.showStatusBar,
      showTextToolbar: state.showTextToolbar,
      showGrid: state.showGrid,
      showThumbnail: state.showThumbnail,
      showAIPanel: state.showAIPanel,
      toggleToolBox: state.toggleToolBox,
      toggleColorBox: state.toggleColorBox,
      toggleStatusBar: state.toggleStatusBar,
      toggleTextToolbar: state.toggleTextToolbar,
      toggleGrid: state.toggleGrid,
      toggleThumbnail: state.toggleThumbnail,
      toggleAIPanel: state.toggleAIPanel,
    })),
  );

  const { drawOpaque, toggleDrawOpaque } = useSettingsStore(
    useShallow((state) => ({
      drawOpaque: state.drawOpaque,
      toggleDrawOpaque: state.toggleDrawOpaque,
    })),
  );

  const [hoveredTool, setHoveredTool] = React.useState<Tool | null>(null);

  // Custom colors state for the color editor
  const [customColors, setCustomColors] = useState<string[]>(defaultCustomColors);

  // MessageBox state for File > New confirmation
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  // Dialog state from uiStore
  const dialogs = useUIStore((state) => state.dialogs);
  const closeDialog = useUIStore((state) => state.closeDialog);

  const activeTool = useMemo(
    () => TOOLBOX_ITEMS.find((tool) => tool.id === selectedToolId) ?? TOOLBOX_ITEMS[6],
    [selectedToolId],
  );

  const statusMessage = t(hoveredTool?.description ?? activeTool?.description ?? DEFAULT_STATUS_TEXT);

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
    setMagnification,
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
    showAIPanel,
    toggleToolBox,
    toggleColorBox,
    toggleStatusBar,
    toggleTextToolbar,
    toggleGrid,
    toggleThumbnail,
    toggleAIPanel,
    toggleDrawOpaque,
    drawOpaque,
    magnification,
    setMagnification,
    palette,
    onShowNewConfirm: () => setShowNewConfirm(true),
  });

  // Create the menu structure
  // Include i18n.language and ready in deps to force menu recreation on language change
  // and after translations are loaded
  const menuTranslationVersion = [
    t("&File"),
    t("&Edit"),
    t("&View"),
    t("&Image"),
    t("&Colors"),
    t("E&xtras"),
    t("🌍 &Language"),
    t("&Help"),
    // Include some frequently-missed submenu labels so the menu refreshes
    // when translation resources arrive after the initial render.
    t("&History"),
    t("Zoom To &Window"),
    t("&Fullscreen"),
    t("Crop To Se&lection"),
    t("Set As Wallpaper (&Centered)"),
    t("&Load From URL..."),
    t("&Upload To Imgur"),
    t("&Print..."),
  ].join("|");
  const menu = useMemo(
    () => createMenus(menuActions, t),
    // menuTranslationVersion changes when i18next finishes loading resources
    // for the current language (fixes cases where i18n.language updates before
    // translations are available for menu labels).
    [menuActions, t, i18n.language, ready, menuTranslationVersion],
  );

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
    isTextToolActive: selectedToolId === TOOL_IDS.TEXT,
    hasActiveTextBox: textBox?.isActive ?? false,
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
        magnification={magnification}
        leftContent={
          showToolBox ? (
            <ToolBox
              tools={TOOLBOX_ITEMS}
              selectedToolIds={[selectedToolId]}
              onSelectionChange={(toolIds) => setTool(toolIds[0] as typeof selectedToolId)}
              onHoverChange={setHoveredTool}
            >
              <ToolOptions />
            </ToolBox>
          ) : null
        }
        rightContent={showAIPanel ? <AISidePanel canvasRef={canvasRef} onClose={toggleAIPanel} /> : null}
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
        title={t("Paint")}
        message={t("Save changes to {{filename}}?", { filename: t("Untitled") })}
        buttons="yesNoCancel"
        icon="warning"
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
        rootNode={rootNode}
        currentNode={null} // Dialog will get this directly from store
        canvasRef={canvasRef}
        showFontBox={showFontBox}
        toggleTextToolbar={toggleTextToolbar}
        fontState={fontState}
        handleFontChange={handleFontChange}
        textBox={textBox}
        showThumbnail={showThumbnail}
        toggleThumbnail={toggleThumbnail}
        setTool={setTool}
      />
    </>
  );
}

/**
 * Root application component for MCPaint React preview
 * Wraps the application in error boundary and store initialization.
 *
 * This is the entry point for the React version of MCPaint.
 *
 * @returns {JSX.Element} Root app with error handling and store initialization
 *
 * @example
 * // In main.tsx
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>
 * )
 */
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
