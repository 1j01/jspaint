import { test, expect } from "@playwright/test";
import {
  waitForAppLoaded,
  selectToolByIndex,
  drawOnCanvas,
  getCanvasDataUrl,
  selectColor,
} from "../utils/test-helpers";
import { clickOnCanvas, regionHasContent, isPixelWhite } from "../utils/canvas-helpers";
import {
  createRectangularSelection,
  createFreeFormSelection,
  cancelSelection,
  cutSelection,
  copySelection,
  paste,
  deleteSelection,
  selectAll,
  moveSelection,
  hasActiveSelection,
  RECTANGULAR_SELECT_TOOL_INDEX,
  FREE_FORM_SELECT_TOOL_INDEX,
} from "../utils/selection-helpers";

/**
 * Pencil tool index for drawing test content
 */
const PENCIL_TOOL_INDEX = 6;

test.describe("Selection Tools", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test.describe("Rectangular Selection", () => {
    test("should create rectangular selection with marching ants", async ({ page }) => {
      // Draw something first
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await drawOnCanvas(page, {
        start: { x: 0.3, y: 0.3 },
        end: { x: 0.7, y: 0.7 },
      });

      // Create selection
      await createRectangularSelection(page, {
        x1: 0.2,
        y1: 0.2,
        x2: 0.8,
        y2: 0.8,
      });

      await page.waitForTimeout(100);

      // Check for selection indicator (marching ants or selection handles)
      const hasSelection = await hasActiveSelection(page);
      expect(hasSelection).toBe(true);
    });

    test("should move selection by dragging", async ({ page }) => {
      // Draw a square in the center
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await selectColor(page, 0); // Black
      await drawOnCanvas(page, {
        start: { x: 0.4, y: 0.4 },
        end: { x: 0.6, y: 0.6 },
      });

      // Create selection around it
      await createRectangularSelection(page, {
        x1: 0.35,
        y1: 0.35,
        x2: 0.65,
        y2: 0.65,
      });

      const beforeMove = await getCanvasDataUrl(page);

      // Move the selection
      await moveSelection(page, 0.2, 0.2);
      await page.waitForTimeout(100);

      // Canvas should be different after moving
      const afterMove = await getCanvasDataUrl(page);
      expect(afterMove).not.toBe(beforeMove);
    });

    test("should cut selection (Ctrl+X)", async ({ page }) => {
      // Draw content
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await drawOnCanvas(page, {
        start: { x: 0.3, y: 0.3 },
        end: { x: 0.7, y: 0.7 },
      });

      // Select a portion
      await createRectangularSelection(page, {
        x1: 0.25,
        y1: 0.25,
        x2: 0.75,
        y2: 0.75,
      });

      const beforeCut = await getCanvasDataUrl(page);

      // Cut the selection
      await cutSelection(page);
      await page.waitForTimeout(100);

      // Canvas should be different (cut content removed)
      const afterCut = await getCanvasDataUrl(page);
      expect(afterCut).not.toBe(beforeCut);
    });

    test("should copy selection (Ctrl+C)", async ({ page }) => {
      // Draw content
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await drawOnCanvas(page, {
        start: { x: 0.4, y: 0.4 },
        end: { x: 0.6, y: 0.6 },
      });

      // Select it
      await createRectangularSelection(page, {
        x1: 0.35,
        y1: 0.35,
        x2: 0.65,
        y2: 0.65,
      });

      const beforeCopy = await getCanvasDataUrl(page);

      // Copy the selection
      await copySelection(page);
      await page.waitForTimeout(100);

      // Canvas should be unchanged after copy (content preserved)
      const afterCopy = await getCanvasDataUrl(page);
      // Copy should not change the canvas
      expect(afterCopy).toBe(beforeCopy);
    });

    test("should paste from clipboard (Ctrl+V)", async ({ page }) => {
      // Draw content
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await drawOnCanvas(page, {
        start: { x: 0.3, y: 0.3 },
        end: { x: 0.5, y: 0.5 },
      });

      // Select and copy
      await createRectangularSelection(page, {
        x1: 0.25,
        y1: 0.25,
        x2: 0.55,
        y2: 0.55,
      });
      await copySelection(page);
      await page.waitForTimeout(100);

      // Cancel selection first
      await cancelSelection(page);
      await page.waitForTimeout(100);

      // Paste
      await paste(page);
      await page.waitForTimeout(100);

      // There should be a new selection (the pasted content)
      const hasSelection = await hasActiveSelection(page);
      expect(hasSelection).toBe(true);
    });

    test("should delete selection content (Delete key)", async ({ page }) => {
      // Draw content
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await drawOnCanvas(page, {
        start: { x: 0.4, y: 0.4 },
        end: { x: 0.6, y: 0.6 },
      });

      // Verify content exists
      const hasContentBefore = await regionHasContent(page, {
        x1: 0.35,
        y1: 0.35,
        x2: 0.65,
        y2: 0.65,
      });
      expect(hasContentBefore).toBe(true);

      // Select it
      await createRectangularSelection(page, {
        x1: 0.35,
        y1: 0.35,
        x2: 0.65,
        y2: 0.65,
      });

      // Delete
      await deleteSelection(page);
      await page.waitForTimeout(100);

      // Center should now be white (deleted)
      const isWhite = await isPixelWhite(page, 0.5, 0.5);
      expect(isWhite).toBe(true);
    });

    test("should cancel selection with Escape key", async ({ page }) => {
      // Draw content
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await drawOnCanvas(page, {
        start: { x: 0.3, y: 0.3 },
        end: { x: 0.7, y: 0.7 },
      });

      // Create selection
      await createRectangularSelection(page, {
        x1: 0.2,
        y1: 0.2,
        x2: 0.8,
        y2: 0.8,
      });

      // Verify selection exists
      const hasSelectionBefore = await hasActiveSelection(page);
      expect(hasSelectionBefore).toBe(true);

      // Cancel
      await cancelSelection(page);
      await page.waitForTimeout(100);

      // Selection should be gone
      const hasSelectionAfter = await hasActiveSelection(page);
      expect(hasSelectionAfter).toBe(false);
    });

    test("should select all (Ctrl+A)", async ({ page }) => {
      // Draw something
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await drawOnCanvas(page, {
        start: { x: 0.1, y: 0.1 },
        end: { x: 0.9, y: 0.9 },
      });

      // Select all
      await selectAll(page);
      await page.waitForTimeout(100);

      // There should be a selection covering the entire canvas
      const hasSelection = await hasActiveSelection(page);
      expect(hasSelection).toBe(true);
    });
  });

  test.describe("Free-Form Selection", () => {
    test("should create free-form selection by drawing path", async ({ page }) => {
      // Draw something first
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await drawOnCanvas(page, {
        start: { x: 0.4, y: 0.4 },
        end: { x: 0.6, y: 0.6 },
      });

      // Create free-form selection (irregular shape)
      await createFreeFormSelection(page, [
        { x: 0.3, y: 0.3 },
        { x: 0.7, y: 0.3 },
        { x: 0.7, y: 0.7 },
        { x: 0.3, y: 0.7 },
      ]);

      await page.waitForTimeout(100);

      // Should have active selection
      const hasSelection = await hasActiveSelection(page);
      expect(hasSelection).toBe(true);
    });

    test("should support move/cut/copy for free-form selection", async ({ page }) => {
      // Draw content
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await drawOnCanvas(page, {
        start: { x: 0.4, y: 0.4 },
        end: { x: 0.6, y: 0.6 },
      });

      // Create free-form selection
      await createFreeFormSelection(page, [
        { x: 0.35, y: 0.35 },
        { x: 0.65, y: 0.35 },
        { x: 0.65, y: 0.65 },
        { x: 0.35, y: 0.65 },
      ]);

      await page.waitForTimeout(100);

      const beforeCopy = await getCanvasDataUrl(page);

      // Copy should work
      await copySelection(page);
      await page.waitForTimeout(100);

      // Canvas unchanged after copy
      const afterCopy = await getCanvasDataUrl(page);
      expect(afterCopy).toBe(beforeCopy);
    });

    test("should close path when mouse is released", async ({ page }) => {
      await selectToolByIndex(page, FREE_FORM_SELECT_TOOL_INDEX);

      const canvas = page.locator("canvas.main-canvas");
      const box = await canvas.boundingBox();
      if (!box) throw new Error("Canvas not found");

      // Draw a curved path
      await page.mouse.move(box.x + 0.3 * box.width, box.y + 0.3 * box.height);
      await page.mouse.down();

      // Draw an irregular path
      await page.mouse.move(box.x + 0.6 * box.width, box.y + 0.2 * box.height);
      await page.mouse.move(box.x + 0.7 * box.width, box.y + 0.5 * box.height);
      await page.mouse.move(box.x + 0.5 * box.width, box.y + 0.7 * box.height);

      // Release should close the selection
      await page.mouse.up();
      await page.waitForTimeout(100);

      // Should have active selection
      const hasSelection = await hasActiveSelection(page);
      expect(hasSelection).toBe(true);
    });
  });

  test.describe("Selection Operations", () => {
    test("should maintain selection after changing colors", async ({ page }) => {
      // Draw content
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await drawOnCanvas(page, {
        start: { x: 0.4, y: 0.4 },
        end: { x: 0.6, y: 0.6 },
      });

      // Create selection
      await createRectangularSelection(page, {
        x1: 0.3,
        y1: 0.3,
        x2: 0.7,
        y2: 0.7,
      });

      // Verify selection exists
      const hasSelectionBefore = await hasActiveSelection(page);
      expect(hasSelectionBefore).toBe(true);

      // Change color
      await selectColor(page, 1);

      // Selection should still exist
      const hasSelectionAfter = await hasActiveSelection(page);
      expect(hasSelectionAfter).toBe(true);
    });

    test("should copy and paste multiple times", async ({ page }) => {
      // Draw content
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await selectColor(page, 0);
      await drawOnCanvas(page, {
        start: { x: 0.2, y: 0.2 },
        end: { x: 0.3, y: 0.3 },
      });

      // Select and copy
      await createRectangularSelection(page, {
        x1: 0.15,
        y1: 0.15,
        x2: 0.35,
        y2: 0.35,
      });
      await copySelection(page);

      // Cancel and paste first copy
      await cancelSelection(page);
      await page.waitForTimeout(50);

      await paste(page);
      await moveSelection(page, 0.3, 0);
      await cancelSelection(page);

      const afterFirst = await getCanvasDataUrl(page);

      // Paste second copy
      await paste(page);
      await moveSelection(page, 0.3, 0.3);
      await cancelSelection(page);

      const afterSecond = await getCanvasDataUrl(page);

      // Both pastes should have modified the canvas
      expect(afterSecond).not.toBe(afterFirst);
    });

    test("should cut and paste to different location", async ({ page }) => {
      // Draw content in specific area
      await selectToolByIndex(page, PENCIL_TOOL_INDEX);
      await drawOnCanvas(page, {
        start: { x: 0.2, y: 0.2 },
        end: { x: 0.3, y: 0.3 },
      });

      // Verify original location has content
      const originalHasContent = await regionHasContent(page, {
        x1: 0.15,
        y1: 0.15,
        x2: 0.35,
        y2: 0.35,
      });
      expect(originalHasContent).toBe(true);

      // Select and cut
      await createRectangularSelection(page, {
        x1: 0.15,
        y1: 0.15,
        x2: 0.35,
        y2: 0.35,
      });
      await cutSelection(page);
      await page.waitForTimeout(100);

      // Original location should be empty now
      const originalAfterCut = await regionHasContent(page, {
        x1: 0.15,
        y1: 0.15,
        x2: 0.35,
        y2: 0.35,
      });
      expect(originalAfterCut).toBe(false);

      // Paste in new location
      await paste(page);
      await moveSelection(page, 0.4, 0.4);
      await cancelSelection(page);
      await page.waitForTimeout(100);

      // New location should have content
      const newHasContent = await regionHasContent(page, {
        x1: 0.55,
        y1: 0.55,
        x2: 0.75,
        y2: 0.75,
      });
      expect(newHasContent).toBe(true);
    });
  });
});
