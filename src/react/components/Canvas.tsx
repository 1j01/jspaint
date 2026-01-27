/**
 * Canvas Component
 *
 * Main drawing canvas component for the Paint application.
 * Handles all drawing operations, tool interactions, and canvas state management.
 *
 * Features:
 * - 16 drawing tools (pencil, brush, shapes, selection, text, etc.)
 * - Persistent canvas state across remounts
 * - Magnification/zoom support (1x-8x)
 * - Selection with resize handles
 * - Text input overlay
 * - Canvas resize handles
 * - Pointer event handling for all tools
 */

import React, { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { saveSetting } from "../context/state/persistence";
import { useSettingsStore } from "../context/state/settingsStore";
import { TOOL_IDS, useToolStore } from "../context/state/toolStore";
import { useUIStore } from "../context/state/uiStore";
import { useCanvasDimensions } from "../context/state/useCanvasDimensions";
import { useColors } from "../context/state/useColors";
import { useCursorPosition } from "../context/state/useCursorPosition";
import { useHistory } from "../context/state/useHistory";
import { useSelection } from "../context/state/useSelection";
import { useTool } from "../context/state/useTool";
import { useTreeHistory } from "../context/state/useTreeHistory";
import { useAirbrushEffect } from "../hooks/useAirbrushEffect";
import { useCanvasCurvePolygon } from "../hooks/useCanvasCurvePolygon";
import { useCanvasDrawing } from "../hooks/useCanvasDrawing";
import { useCanvasEventHandlers } from "../hooks/useCanvasEventHandlers";
import { useCanvasLifecycle } from "../hooks/useCanvasLifecycle";
import { useCanvasSelection } from "../hooks/useCanvasSelection";
import { useCanvasShapes } from "../hooks/useCanvasShapes";
import { useCanvasTextBox } from "../hooks/useCanvasTextBox";
import { getCanvasStyle, prepareCanvasResize, resizeSelection, restoreCanvasAfterResize } from "../utils/canvasHelpers";
import { commitSelectionToCanvas } from "../utils/selectionDrawing";
import { CanvasOverlay } from "./CanvasOverlay";
import { CanvasResizeHandles } from "./CanvasResizeHandles";
import { VirtualCursor } from "./VirtualCursor";
import { CanvasTextBox } from "./CanvasTextBox";
import { SelectionHandles } from "./SelectionHandles";

/**
 * Canvas component - the main drawing surface.
 *
 * This component orchestrates all drawing operations by:
 * - Managing canvas lifecycle (initialization, preservation across remounts)
 * - Coordinating tool-specific hooks (drawing, selection, shapes, text)
 * - Delegating all pointer events to useCanvasEventHandlers hook
 * - Rendering overlay elements (selection handles, text box, resize handles)
 *
 * @param {Object} props - Component props
 * @param {React.RefObject<HTMLCanvasElement>} props.canvasRef - Ref to canvas element
 * @param {string} [props.className=""] - Additional CSS class names
 * @returns {JSX.Element} Canvas element with overlays and handles
 */
export function Canvas({
  canvasRef,
  className = "",
}: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  className?: string;
}) {
  const { t } = useTranslation();
  const { selectedToolId } = useTool();
  const { saveState } = useHistory();
  const { pushState: pushTreeState } = useTreeHistory();
  const magnification = useUIStore((state) => state.magnification);
  const setMagnification = useUIStore((state) => state.setMagnification);
  const { setCursorPosition } = useCursorPosition();
  const { selection: currentSelection, setSelection } = useSelection();
  const { canvasWidth, canvasHeight, setCanvasSize } = useCanvasDimensions();
  const drawOpaque = useSettingsStore((state) => state.drawOpaque);
  const { secondaryColor } = useColors();

  // Overlay canvas ref for selection marching ants
  const overlayRef = useRef<HTMLCanvasElement>(null);

  // Container ref for selection handles - use canvas parent (.canvas-area)
  const containerRef = useRef<HTMLDivElement>(null);

  // Text input ref
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Set container ref to canvas parent on mount
  useEffect(() => {
    if (canvasRef.current && canvasRef.current.parentElement) {
      containerRef.current = canvasRef.current.parentElement as HTMLDivElement;
    }
  }, [canvasRef]);

  // Initialize drawing hook
  const drawing = useCanvasDrawing(canvasRef);

  // Initialize selection hook
  const selectionHook = useCanvasSelection({
    canvasRef,
    overlayRef,
    getCanvasCoords: drawing.getCanvasCoords,
  });

  // Initialize text box hook
  const textBoxHook = useCanvasTextBox({ canvasRef });

  // Initialize shapes hook
  const shapes = useCanvasShapes({
    canvasRef,
    getDrawColor: drawing.getDrawColor,
  });

  // Initialize curve/polygon hook
  const curvePolygon = useCanvasCurvePolygon({
    canvasRef,
    getDrawColor: drawing.getDrawColor,
  });

  // Initialize canvas lifecycle (initialization, persistence, cleanup)
  useCanvasLifecycle(canvasRef);

  // Initialize airbrush effect (continuous painting)
  useAirbrushEffect({ canvasRef, selectedToolId, drawing, shapes });

  /**
   * Helper to save state to tree history.
   * Captures current canvas state and stores it in the history tree.
   * Also persists canvas content to IndexedDB for page refresh persistence.
   *
   * IMPORTANT: This is the PRIMARY save point for IndexedDB persistence!
   *
   * This function is called after every drawing operation (pencil stroke, fill, etc.)
   * and is the ONLY place where we save canvas data to IndexedDB. We do NOT save
   * to IndexedDB in useCanvasLifecycle cleanup because React may clear the canvas
   * before cleanup runs, resulting in corrupted empty data being saved.
   *
   * By saving here during active drawing, we guarantee the canvas has valid data.
   * This ensures the canvas restores correctly after page refresh.
   *
   * @param operationName - Human-readable name for the operation (e.g., "Pencil", "Fill")
   * @see useCanvasLifecycle for detailed persistence strategy documentation
   */
  const saveHistoryState = useCallback(
    (operationName: string = "Edit") => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Get current canvas state
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Get current selection from store directly (avoids dependency on unstable object)
      const currentSelection = useToolStore.getState().selection;

      // Save to tree history
      pushTreeState(imageData, operationName, {
        selectionImageData: currentSelection?.imageData,
        selectionX: currentSelection?.x,
        selectionY: currentSelection?.y,
        selectionWidth: currentSelection?.width,
        selectionHeight: currentSelection?.height,
      });

      // Also persist canvas content to IndexedDB for page refresh
      const canvasData = {
        data: Array.from(imageData.data),
        width: imageData.width,
        height: imageData.height,
      };
      saveSetting("savedCanvas", canvasData);

      // console.warn(`[Canvas] 🌳 Saved to history tree: ${operationName}`);
    },
    [canvasRef, pushTreeState],
  );

  // Initialize all event handlers from the hook
  const eventHandlers = useCanvasEventHandlers({
    canvasRef,
    selectedToolId,
    drawing,
    selectionHook,
    textBoxHook,
    shapes,
    curvePolygon,
    setCursorPosition,
    saveHistoryState,
    magnification,
    setMagnification,
  });

  // Focus text input when text box is active
  useEffect(() => {
    if (textBoxHook.textBox?.isActive && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textBoxHook.textBox?.isActive]);

  // Track previous tool ID for tool change detection
  const prevToolIdRef = useRef<string>(selectedToolId);

  /**
   * Auto-commit selection and text box when switching tools.
   * Matches jQuery behavior where floating selection is committed when switching away.
   */
  useEffect(() => {
    const prevToolId = prevToolIdRef.current;
    const isSelectionTool = (toolId: string) => toolId === TOOL_IDS.SELECT || toolId === TOOL_IDS.FREE_FORM_SELECT;
    const isTextTool = (toolId: string) => toolId === TOOL_IDS.TEXT;

    // Only act when tool actually changes
    if (prevToolId !== selectedToolId) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d", { willReadFrequently: true });

      // Commit selection when switching away from selection tools
      if (isSelectionTool(prevToolId) && !isSelectionTool(selectedToolId)) {
        const selection = useToolStore.getState().selection;
        if (selection?.imageData && ctx) {
          commitSelectionToCanvas(ctx, selection.imageData, selection.x, selection.y, drawOpaque, secondaryColor);
          useToolStore.getState().clearSelection();
          saveHistoryState("Deselect");
        }
      }

      // Commit text box when switching away from text tool
      if (isTextTool(prevToolId) && !isTextTool(selectedToolId)) {
        const textBox = useToolStore.getState().textBox;
        if (textBox?.isActive && textBox.text.trim()) {
          textBoxHook.commitTextBox();
          saveHistoryState("Text");
        } else if (textBox?.isActive) {
          textBoxHook.clearTextBox();
        }
      }

      // Update previous tool reference
      prevToolIdRef.current = selectedToolId;
    }
  }, [selectedToolId, canvasRef, textBoxHook, saveHistoryState, drawOpaque, secondaryColor]);

  /**
   * Selection resize handler.
   * Called when user drags selection resize handles.
   */
  const handleSelectionResize = useCallback(
    (newRect: { x: number; y: number; width: number; height: number }) => {
      // Get current selection from store directly (avoids dependency on unstable object)
      const currentSelection = useToolStore.getState().selection;
      const resized = resizeSelection(currentSelection, newRect);
      if (resized) {
        setSelection(resized);
      }
    },
    [setSelection],
  );

  /**
   * Canvas resize handler.
   * Called when user drags canvas resize handles (bottom or right edge).
   */
  const handleCanvasResize = useCallback(
    (width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Save current canvas content
      const currentImageData = prepareCanvasResize(canvas, canvasWidth, canvasHeight);
      if (!currentImageData) return;

      // Set canvas dimensions directly (this clears the canvas)
      canvas.width = width;
      canvas.height = height;

      // Restore content with white background
      restoreCanvasAfterResize(canvas, currentImageData, width, height);

      // Update the Zustand store (for status bar, other components)
      setCanvasSize(width, height);

      // Save to history
      saveHistoryState("Resize Canvas");
    },
    [canvasRef, canvasWidth, canvasHeight, setCanvasSize, saveHistoryState],
  );

  // Compute canvas style (cursor and magnification transform)
  const canvasStyle = {
    ...getCanvasStyle(selectedToolId, magnification),
    // Match legacy jQuery implementation: magnification affects CSS size,
    // which in turn drives scroll extents and handle positioning.
    width: canvasWidth * magnification,
    height: canvasHeight * magnification,
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="main-canvas"
        style={canvasStyle}
        onPointerDown={eventHandlers.handlePointerDown}
        onPointerMove={eventHandlers.handlePointerMove}
        onPointerUp={eventHandlers.handlePointerUp}
        onPointerLeave={(e) => {
          eventHandlers.handlePointerUp(e);
          eventHandlers.handlePointerLeave();
        }}
        onContextMenu={eventHandlers.handleContextMenu}
        aria-label={t("Drawing canvas")}
      />
      <CanvasOverlay ref={overlayRef} width={canvasWidth} height={canvasHeight} magnification={magnification} />
      <VirtualCursor magnification={magnification} />
      {currentSelection && (
        <SelectionHandles selection={currentSelection} onResize={handleSelectionResize} containerRef={containerRef} />
      )}
      {textBoxHook.textBox?.isActive && (
        <CanvasTextBox
          ref={textInputRef}
          textBox={textBoxHook.textBox}
          magnification={magnification}
          primaryColor={drawing.primaryColor}
          secondaryColor={drawing.secondaryColor}
          onChange={eventHandlers.handleTextChange}
          onKeyDown={eventHandlers.handleTextKeyDown}
          onBlur={eventHandlers.handleTextBlur}
          onMove={textBoxHook.moveTextBox}
          onResize={textBoxHook.resizeTextBox}
        />
      )}
      <CanvasResizeHandles
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onResize={handleCanvasResize}
        containerRef={containerRef}
      />
    </>
  );
}

export default Canvas;
