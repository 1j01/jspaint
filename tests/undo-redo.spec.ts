import { test, expect } from "@playwright/test";
import {
  waitForAppLoaded,
  drawOnCanvas,
  selectToolByIndex,
  canvasHasContent,
  getCanvasDataUrl,
  undo,
  redo,
} from "./utils/test-helpers";

test.describe("Undo/Redo Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("undo reverts last drawing action", async ({ page }) => {
    // Select pencil
    await selectToolByIndex(page, 6);

    // Get initial canvas state
    const initialCanvas = await getCanvasDataUrl(page);

    // Draw something
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Verify something was drawn
    const canvasAfterDraw = await getCanvasDataUrl(page);
    expect(canvasAfterDraw).not.toBe(initialCanvas);

    // Undo
    await undo(page);

    // Wait a bit for undo to take effect
    await page.waitForTimeout(100);

    // Canvas should be back to initial state
    const canvasAfterUndo = await getCanvasDataUrl(page);
    expect(canvasAfterUndo).toBe(initialCanvas);
  });

  test("redo restores undone action", async ({ page }) => {
    // Select pencil
    await selectToolByIndex(page, 6);

    // Draw something
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Get canvas state after drawing
    const canvasAfterDraw = await getCanvasDataUrl(page);

    // Undo
    await undo(page);
    await page.waitForTimeout(100);

    // Verify undo worked
    const canvasAfterUndo = await getCanvasDataUrl(page);
    expect(canvasAfterUndo).not.toBe(canvasAfterDraw);

    // Redo
    await redo(page);
    await page.waitForTimeout(100);

    // Canvas should be back to state after drawing
    const canvasAfterRedo = await getCanvasDataUrl(page);
    expect(canvasAfterRedo).toBe(canvasAfterDraw);
  });

  test("multiple undos work correctly", async ({ page }) => {
    // Select pencil
    await selectToolByIndex(page, 6);

    // Get initial state
    const initialCanvas = await getCanvasDataUrl(page);

    // Draw first stroke
    await drawOnCanvas(page, {
      start: { x: 0.1, y: 0.5 },
      end: { x: 0.3, y: 0.5 },
    });
    const afterFirstStroke = await getCanvasDataUrl(page);

    // Draw second stroke
    await drawOnCanvas(page, {
      start: { x: 0.5, y: 0.5 },
      end: { x: 0.7, y: 0.5 },
    });
    const afterSecondStroke = await getCanvasDataUrl(page);

    // Verify all states are different
    expect(afterFirstStroke).not.toBe(initialCanvas);
    expect(afterSecondStroke).not.toBe(afterFirstStroke);

    // Undo second stroke
    await undo(page);
    await page.waitForTimeout(100);
    const afterFirstUndo = await getCanvasDataUrl(page);
    expect(afterFirstUndo).toBe(afterFirstStroke);

    // Undo first stroke
    await undo(page);
    await page.waitForTimeout(100);
    const afterSecondUndo = await getCanvasDataUrl(page);
    expect(afterSecondUndo).toBe(initialCanvas);
  });

  test("redo after new action clears redo stack", async ({ page }) => {
    // Select pencil
    await selectToolByIndex(page, 6);

    // Draw first stroke
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.3 },
      end: { x: 0.4, y: 0.3 },
    });
    const afterFirstStroke = await getCanvasDataUrl(page);

    // Undo
    await undo(page);
    await page.waitForTimeout(100);

    // Draw a different stroke (this should clear redo stack)
    await drawOnCanvas(page, {
      start: { x: 0.6, y: 0.7 },
      end: { x: 0.8, y: 0.7 },
    });
    const afterNewStroke = await getCanvasDataUrl(page);

    // Redo should do nothing (redo stack should be empty)
    await redo(page);
    await page.waitForTimeout(100);
    const afterRedo = await getCanvasDataUrl(page);

    // Canvas should still be the same as after the new stroke
    expect(afterRedo).toBe(afterNewStroke);
    // And different from the first stroke
    expect(afterRedo).not.toBe(afterFirstStroke);
  });

  test("status bar shows undo availability", async ({ page }) => {
    const statusArea = page.locator(".status-area");

    // Initially, no undo should be available
    // (This depends on how the status bar is implemented)

    // Select pencil and draw
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.3 },
      end: { x: 0.6, y: 0.6 },
    });

    // Status should indicate undo is available (in the third status field)
    await expect(statusArea).toContainText(/[Uu]ndo/);
  });

  test("keyboard shortcuts work for undo/redo", async ({ page }) => {
    // Select pencil
    await selectToolByIndex(page, 6);

    // Draw something
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    const canvasAfterDraw = await getCanvasDataUrl(page);

    // Test Ctrl+Z for undo
    await page.keyboard.press("Control+z");
    await page.waitForTimeout(100);

    const canvasAfterCtrlZ = await getCanvasDataUrl(page);
    expect(canvasAfterCtrlZ).not.toBe(canvasAfterDraw);

    // Test Ctrl+Y for redo
    await page.keyboard.press("Control+y");
    await page.waitForTimeout(100);

    const canvasAfterCtrlY = await getCanvasDataUrl(page);
    expect(canvasAfterCtrlY).toBe(canvasAfterDraw);
  });

  test("Ctrl+Shift+Z also works for redo", async ({ page }) => {
    // Select pencil
    await selectToolByIndex(page, 6);

    // Draw something
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    const canvasAfterDraw = await getCanvasDataUrl(page);

    // Undo
    await page.keyboard.press("Control+z");
    await page.waitForTimeout(100);

    // Test Ctrl+Shift+Z for redo
    await page.keyboard.press("Control+Shift+z");
    await page.waitForTimeout(100);

    const canvasAfterRedo = await getCanvasDataUrl(page);
    expect(canvasAfterRedo).toBe(canvasAfterDraw);
  });
});
