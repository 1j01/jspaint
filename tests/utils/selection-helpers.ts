import { Page, Locator, expect } from "@playwright/test";
import { selectToolByIndex, drawOnCanvas } from "./test-helpers";
import { dragOnCanvas, multiClickOnCanvas } from "./canvas-helpers";

/**
 * Tool index for rectangular selection
 */
export const RECTANGULAR_SELECT_TOOL_INDEX = 1;

/**
 * Tool index for free-form selection
 */
export const FREE_FORM_SELECT_TOOL_INDEX = 0;

/**
 * Creates a rectangular selection on the canvas
 * @param page - Playwright page
 * @param bounds - Selection bounds in relative coordinates (0-1)
 */
export async function createRectangularSelection(
  page: Page,
  bounds: { x1: number; y1: number; x2: number; y2: number },
): Promise<void> {
  await selectToolByIndex(page, RECTANGULAR_SELECT_TOOL_INDEX);
  await drawOnCanvas(page, {
    start: { x: bounds.x1, y: bounds.y1 },
    end: { x: bounds.x2, y: bounds.y2 },
  });
}

/**
 * Creates a free-form selection by drawing a path on the canvas
 * @param page - Playwright page
 * @param points - Array of points forming the selection path (relative coordinates 0-1)
 */
export async function createFreeFormSelection(page: Page, points: Array<{ x: number; y: number }>): Promise<void> {
  await selectToolByIndex(page, FREE_FORM_SELECT_TOOL_INDEX);

  const canvas = page.locator("canvas.main-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");

  // Move to the first point and start drawing
  const startX = box.x + points[0].x * box.width;
  const startY = box.y + points[0].y * box.height;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Draw through all points
  for (let i = 1; i < points.length; i++) {
    const x = box.x + points[i].x * box.width;
    const y = box.y + points[i].y * box.height;
    await page.mouse.move(x, y);
  }

  // Release to close the selection
  await page.mouse.up();
}

/**
 * Verifies that a selection is currently active (marching ants visible)
 * @param page - Playwright page
 */
export async function verifySelectionActive(page: Page): Promise<void> {
  // Look for selection overlay or marching ants animation
  const selectionIndicator = page.locator(
    ".selection-overlay, .marching-ants, canvas.selection-canvas, .selection-handles",
  );
  await expect(selectionIndicator.first()).toBeVisible();
}

/**
 * Verifies that no selection is active
 * @param page - Playwright page
 */
export async function verifyNoSelection(page: Page): Promise<void> {
  const selectionIndicator = page.locator(".selection-overlay, .selection-handles");
  await expect(selectionIndicator).toHaveCount(0);
}

/**
 * Cancels the current selection by pressing Escape
 * @param page - Playwright page
 */
export async function cancelSelection(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
}

/**
 * Moves the current selection by dragging
 * @param page - Playwright page
 * @param deltaX - Relative X movement (-1 to 1, where 1 = canvas width)
 * @param deltaY - Relative Y movement (-1 to 1, where 1 = canvas height)
 */
export async function moveSelection(page: Page, deltaX: number, deltaY: number): Promise<void> {
  const canvas = page.locator("canvas.main-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");

  // Start from center of canvas (assume selection is there)
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + deltaX * box.width, centerY + deltaY * box.height);
  await page.mouse.up();
}

/**
 * Cuts the current selection (Ctrl+X)
 * @param page - Playwright page
 */
export async function cutSelection(page: Page): Promise<void> {
  await page.keyboard.press("Control+x");
}

/**
 * Copies the current selection (Ctrl+C)
 * @param page - Playwright page
 */
export async function copySelection(page: Page): Promise<void> {
  await page.keyboard.press("Control+c");
}

/**
 * Pastes from clipboard (Ctrl+V)
 * @param page - Playwright page
 */
export async function paste(page: Page): Promise<void> {
  await page.keyboard.press("Control+v");
}

/**
 * Deletes the current selection content (Delete key)
 * @param page - Playwright page
 */
export async function deleteSelection(page: Page): Promise<void> {
  await page.keyboard.press("Delete");
}

/**
 * Selects all (Ctrl+A)
 * @param page - Playwright page
 */
export async function selectAll(page: Page): Promise<void> {
  await page.keyboard.press("Control+a");
}

/**
 * Gets selection bounds if a selection exists
 * @param page - Playwright page
 * @returns Selection bounds or null if no selection
 */
export async function getSelectionBounds(
  page: Page,
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return await page.evaluate(() => {
    // Try to find the selection overlay or handles
    const overlay = document.querySelector(".selection-overlay, .selection-handles") as HTMLElement;
    if (!overlay) return null;

    const style = window.getComputedStyle(overlay);
    return {
      x: parseInt(style.left) || 0,
      y: parseInt(style.top) || 0,
      width: parseInt(style.width) || 0,
      height: parseInt(style.height) || 0,
    };
  });
}

/**
 * Checks if a selection currently exists
 * @param page - Playwright page
 * @returns True if a selection is active
 */
export async function hasActiveSelection(page: Page): Promise<boolean> {
  const count = await page.locator(".selection-overlay, .selection-handles, canvas.selection-canvas").count();
  return count > 0;
}

/**
 * Inverts the current selection (Ctrl+I or menu)
 * @param page - Playwright page
 */
export async function invertSelection(page: Page): Promise<void> {
  // Use menu since keyboard shortcut varies
  await page.locator('.menu-button:has-text("Edit")').click();
  await page.locator('.menu-item:has-text("Invert Selection")').click();
}

/**
 * Flips the selection horizontally
 * @param page - Playwright page
 */
export async function flipSelectionHorizontal(page: Page): Promise<void> {
  await page.locator('.menu-button:has-text("Image")').click();
  await page.locator('.menu-item:has-text("Flip/Rotate")').click();
  // Dialog handling would be done by the test
}

/**
 * Flips the selection vertically
 * @param page - Playwright page
 */
export async function flipSelectionVertical(page: Page): Promise<void> {
  await page.locator('.menu-button:has-text("Image")').click();
  await page.locator('.menu-item:has-text("Flip/Rotate")').click();
  // Dialog handling would be done by the test
}

/**
 * Resizes selection by dragging a handle
 * @param page - Playwright page
 * @param handle - Which handle to drag ('nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w')
 * @param deltaX - Relative X movement
 * @param deltaY - Relative Y movement
 */
export async function resizeSelection(
  page: Page,
  handle: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w",
  deltaX: number,
  deltaY: number,
): Promise<void> {
  const handleLocator = page.locator(`.selection-handle.${handle}, .resize-handle-${handle}`);
  const handleBox = await handleLocator.boundingBox();

  if (!handleBox) {
    throw new Error(`Selection handle ${handle} not found`);
  }

  const canvas = page.locator("canvas.main-canvas");
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error("Canvas not found");

  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX * canvasBox.width, startY + deltaY * canvasBox.height);
  await page.mouse.up();
}

/**
 * Creates a selection and immediately copies it
 * @param page - Playwright page
 * @param bounds - Selection bounds in relative coordinates
 */
export async function selectAndCopy(
  page: Page,
  bounds: { x1: number; y1: number; x2: number; y2: number },
): Promise<void> {
  await createRectangularSelection(page, bounds);
  await copySelection(page);
}

/**
 * Creates a selection and immediately cuts it
 * @param page - Playwright page
 * @param bounds - Selection bounds in relative coordinates
 */
export async function selectAndCut(
  page: Page,
  bounds: { x1: number; y1: number; x2: number; y2: number },
): Promise<void> {
  await createRectangularSelection(page, bounds);
  await cutSelection(page);
}

/**
 * Creates a selection, copies it, and pastes at a new location
 * @param page - Playwright page
 * @param bounds - Selection bounds in relative coordinates
 * @param pasteOffset - Where to move the pasted content
 */
export async function copyAndPaste(
  page: Page,
  bounds: { x1: number; y1: number; x2: number; y2: number },
  pasteOffset?: { x: number; y: number },
): Promise<void> {
  await selectAndCopy(page, bounds);
  await paste(page);

  if (pasteOffset) {
    await moveSelection(page, pasteOffset.x, pasteOffset.y);
  }
}
