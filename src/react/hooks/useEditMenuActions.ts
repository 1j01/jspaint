/**
 * Edit menu actions hook
 * Handles Edit menu operations: Undo, Redo, Cut, Copy, Paste, etc.
 */

import { RefObject, useCallback } from "react";
import { useUIStore } from "../context/state/uiStore";

/**
 * Edit menu actions interface
 */
export interface EditMenuActions {
  editUndo: () => void;
  editRedo: () => void;
  editHistory: () => void;
  editCut: () => void;
  editCopy: () => void;
  editPaste: () => void;
  editClearSelection: () => void;
  editSelectAll: () => void;
  editCopyTo: () => void;
  editPasteFrom: () => void;
}

/**
 * Selection state interface
 */
interface SelectionState {
  x: number;
  y: number;
  width: number;
  height: number;
  imageData?: ImageData;
}

/**
 * Parameters for the edit menu actions hook
 */
export interface UseEditMenuActionsParams {
  canvasRef: RefObject<HTMLCanvasElement>;
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  hasSelection: boolean;
  selection: SelectionState | null;
  copy: () => void;
  cut: () => void;
  paste: () => ImageData | undefined;
  hasClipboard: boolean;
  clearSelection: () => void;
  handleSelectAll: () => void;
  secondaryColor: string;
  setSelection: (selection: SelectionState) => void;
  setTool: (toolId: string) => void;
}

/**
 * Hook for Edit menu action handlers
 *
 * @param {UseEditMenuActionsParams} params - Hook parameters
 * @returns {EditMenuActions} Edit menu action handlers
 *
 * @example
 * const editActions = useEditMenuActions({
 *   canvasRef,
 *   saveState,
 *   undo,
 *   redo,
 *   hasSelection,
 *   selection,
 *   copy,
 *   cut,
 *   paste,
 *   hasClipboard,
 *   clearSelection,
 *   handleSelectAll,
 *   secondaryColor,
 *   setSelection,
 *   setTool,
 * });
 */
export function useEditMenuActions(params: UseEditMenuActionsParams): EditMenuActions {
  const {
    canvasRef,
    saveState,
    undo,
    redo,
    hasSelection,
    selection,
    copy,
    cut,
    paste,
    hasClipboard,
    clearSelection,
    handleSelectAll,
    secondaryColor,
    setSelection,
    setTool,
  } = params;

  const openDialog = useUIStore((state) => state.openDialog);

  const editHistory = useCallback(() => openDialog("history"), [openDialog]);

  const editCut = useCallback(() => {
    if (hasSelection && selection) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          // Copy to clipboard first
          cut();
          // Save state before clearing
          saveState();
          // Clear the selection area with secondary color
          ctx.fillStyle = secondaryColor;
          ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
        }
      }
      clearSelection();
    }
  }, [hasSelection, selection, cut, clearSelection, canvasRef, saveState, secondaryColor]);

  const editCopy = useCallback(() => {
    if (hasSelection) copy();
  }, [hasSelection, copy]);

  const editPaste = useCallback(() => {
    if (hasClipboard) {
      const clipboardData = paste();
      if (clipboardData) {
        // Create a floating selection from clipboard data at (0, 0)
        setSelection({
          x: 0,
          y: 0,
          width: clipboardData.width,
          height: clipboardData.height,
          imageData: clipboardData,
        });
        setTool("select");
      }
    }
  }, [hasClipboard, paste, setSelection, setTool]);

  const editClearSelection = useCallback(() => {
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
  }, [hasSelection, canvasRef, selection, saveState, secondaryColor, clearSelection]);

  const editCopyTo = useCallback(() => {
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
            const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
            tempCtx.putImageData(imageData, 0, 0);
            const link = document.createElement("a");
            link.download = "selection.png";
            link.href = tempCanvas.toDataURL("image/png");
            link.click();
          }
        }
      }
    }
  }, [hasSelection, canvasRef, selection]);

  const editPasteFrom = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    // Limit to well-supported image formats: PNG, JPEG, and BMP
    input.accept = ".png,.jpg,.jpeg,.bmp,image/png,image/jpeg,image/bmp";
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
            setTool("select");
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [setSelection, setTool]);

  return {
    editUndo: undo,
    editRedo: redo,
    editHistory,
    editCut,
    editCopy,
    editPaste,
    editClearSelection,
    editSelectAll: handleSelectAll,
    editCopyTo,
    editPasteFrom,
  };
}
