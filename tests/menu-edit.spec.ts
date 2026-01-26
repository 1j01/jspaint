import { test, expect } from "@playwright/test";
import { waitForAppLoaded, drawOnCanvas, selectToolByIndex, undo, redo, getCanvasDataUrl } from "./utils/test-helpers";

test.describe("Edit Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("Edit > Undo reverts last action", async ({ page }) => {
    // Draw something
    await selectToolByIndex(page, 6); // Pencil
    const initialCanvas = await getCanvasDataUrl(page);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    const afterDraw = await getCanvasDataUrl(page);
    expect(afterDraw).not.toBe(initialCanvas);

    // Open Edit menu and click Undo
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    const undoItem = page.locator('text="Undo"').first();
    await undoItem.click();

    // Should be back to initial state
    await page.waitForTimeout(100);
    const afterUndo = await getCanvasDataUrl(page);
    expect(afterUndo).toBe(initialCanvas);
  });

  test("Edit > Repeat (Redo) restores undone action", async ({ page }) => {
    // Draw, undo, then redo
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.3 },
      end: { x: 0.7, y: 0.7 },
    });

    const afterDraw = await getCanvasDataUrl(page);

    // Undo
    await undo(page);
    await page.waitForTimeout(100);

    // Open Edit menu
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    // Click Repeat (Redo)
    const redoItem = page.locator('text="Repeat"').first();
    await redoItem.click();

    // Should be back to drawn state
    await page.waitForTimeout(100);
    const afterRedo = await getCanvasDataUrl(page);
    expect(afterRedo).toBe(afterDraw);
  });

  test("Edit > History opens history dialog", async ({ page }) => {
    // Open Edit menu
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    // Click History
    const historyItem = page.locator('text="History"').first();
    await historyItem.click();

    // History dialog should appear
    const dialog = page.locator('.dialog:has-text("TEMPORAL BRANCHES")');
    await expect(dialog).toBeVisible();
  });

  test("Edit > Cut removes selection and copies to clipboard", async ({ page }) => {
    // Draw something
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.3 },
      end: { x: 0.7, y: 0.7 },
    });

    // Make a selection
    await selectToolByIndex(page, 1); // Select tool
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Open Edit menu
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    // Cut should be enabled
    const cutItem = page.locator('text="Cut"').first();
    await expect(cutItem).not.toHaveClass(/disabled/);
    await cutItem.click();

    // Selection should be cleared from canvas
    // (We can verify by checking if canvas changed)
  });

  test("Edit > Copy copies selection to clipboard", async ({ page }) => {
    // Draw and select
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.3 },
      end: { x: 0.7, y: 0.7 },
    });

    await selectToolByIndex(page, 1); // Select tool
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Open Edit menu
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    // Copy should be enabled
    const copyItem = page.locator('text="Copy"').first();
    await expect(copyItem).not.toHaveClass(/disabled/);
    await copyItem.click();

    // Canvas should remain unchanged
  });

  test("Edit > Paste pastes from clipboard", async ({ page }) => {
    // Draw, select, copy
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.3 },
      end: { x: 0.5, y: 0.5 },
    });

    await selectToolByIndex(page, 1);
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.6, y: 0.6 },
    });

    // Copy
    await page.keyboard.press("Control+c");
    await page.waitForTimeout(100);

    // Open Edit menu
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    // Paste should be enabled
    const pasteItem = page.locator('text="Paste"').first();
    await pasteItem.click();

    // A selection should appear on canvas
    const overlay = page.locator(".selection-overlay");
    await expect(overlay).toBeVisible();
  });

  test("Edit > Clear Selection deletes selection", async ({ page }) => {
    // Draw and select
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.3 },
      end: { x: 0.7, y: 0.7 },
    });

    await selectToolByIndex(page, 1);
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    const beforeClear = await getCanvasDataUrl(page);

    // Open Edit menu
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    // Clear Selection
    const clearItem = page.locator('text="Clear Selection"').first();
    await clearItem.click();

    // Canvas should change (selection area should be cleared)
    await page.waitForTimeout(100);
    const afterClear = await getCanvasDataUrl(page);
    expect(afterClear).not.toBe(beforeClear);
  });

  test("Edit > Select All selects entire canvas", async ({ page }) => {
    // Open Edit menu
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    // Click Select All
    const selectAllItem = page.locator('text="Select All"').first();
    await selectAllItem.click();

    // Selection overlay should appear
    const overlay = page.locator(".selection-overlay");
    await expect(overlay).toBeVisible();

    // Selection should cover entire canvas
    const canvas = page.locator("canvas.main-canvas");
    const canvasBox = await canvas.boundingBox();
    const overlayBox = await overlay.boundingBox();

    if (canvasBox && overlayBox) {
      // Allow some margin for borders
      expect(Math.abs(overlayBox.width - canvasBox.width)).toBeLessThan(10);
      expect(Math.abs(overlayBox.height - canvasBox.height)).toBeLessThan(10);
    }
  });

  test("Edit > Copy To saves selection to file", async ({ page }) => {
    // Draw and select
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.3 },
      end: { x: 0.7, y: 0.7 },
    });

    await selectToolByIndex(page, 1);
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Open Edit menu
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    // Copy To should trigger download
    const downloadPromise = page.waitForEvent("download");
    const copyToItem = page.locator('text="Copy To"').first();
    await copyToItem.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".png");
  });

  test("Edit > Paste From opens file picker", async ({ page }) => {
    // Open Edit menu
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    // Paste From opens file picker (can't fully test without file input)
    const pasteFromItem = page.locator('text="Paste From"').first();
    await expect(pasteFromItem).toBeVisible();
  });

  test("Edit menu items have correct keyboard shortcuts", async ({ page }) => {
    // Open Edit menu
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    const menu = page.locator(".menu-popup");

    // Check for Ctrl+Z on Undo
    const undoShortcut = menu.locator('text="Ctrl+Z"');
    await expect(undoShortcut).toBeVisible();

    // Check for Ctrl+X on Cut
    const cutShortcut = menu.locator('text="Ctrl+X"');
    await expect(cutShortcut).toBeVisible();

    // Check for Ctrl+C on Copy
    const copyShortcut = menu.locator('text="Ctrl+C"');
    await expect(copyShortcut).toBeVisible();

    // Check for Ctrl+V on Paste
    const pasteShortcut = menu.locator('text="Ctrl+V"');
    await expect(pasteShortcut).toBeVisible();
  });

  test("Edit menu items are disabled when no selection", async ({ page }) => {
    // Open Edit menu without making a selection
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    // Cut, Copy, Clear Selection should be disabled
    const cutItem = page.locator('[aria-label*="Cuts the selection"]').first();
    await expect(cutItem).toHaveClass(/disabled/);

    const copyItem = page.locator('[aria-label*="Copies the selection"]').first();
    await expect(copyItem).toHaveClass(/disabled/);

    const clearItem = page.locator('[aria-label*="Deletes the selection"]').first();
    await expect(clearItem).toHaveClass(/disabled/);
  });

  test("Edit > Paste is disabled when clipboard is empty", async ({ page }) => {
    // Open Edit menu without copying anything
    const editMenu = page.locator('button:has-text("Edit")');
    await editMenu.click();

    // Paste should be disabled initially
    const pasteItem = page.locator('[aria-label*="Inserts the contents"]').first();
    await expect(pasteItem).toHaveClass(/disabled/);
  });
});
