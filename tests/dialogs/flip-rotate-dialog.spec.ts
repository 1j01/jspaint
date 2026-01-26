import { test, expect } from "@playwright/test";
import { waitForAppLoaded, selectToolByIndex, drawOnCanvas, getCanvasDataUrl } from "../utils/test-helpers";
import {
  openDialogFromMenu,
  closeDialog,
  selectRadioByLabel,
  setDialogNumberInput,
  getDialogTitle,
} from "../utils/dialog-helpers";
import { getCanvasDimensions } from "../utils/canvas-helpers";

test.describe("Flip/Rotate Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("should open via Image > Flip/Rotate menu", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Image", "Flip/Rotate");

    // Verify dialog is visible with correct title
    const title = await getDialogTitle(dialog);
    expect(title.toLowerCase()).toContain("flip");

    await closeDialog(dialog, "Cancel");
  });

  test("should flip image horizontally", async ({ page }) => {
    // Draw something asymmetric
    await selectToolByIndex(page, 6); // Pencil
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.5 },
      end: { x: 0.4, y: 0.3 },
    });

    const beforeFlip = await getCanvasDataUrl(page);

    // Open dialog and select horizontal flip
    const dialog = await openDialogFromMenu(page, "Image", "Flip/Rotate");

    // Select "Flip horizontal" radio option
    await selectRadioByLabel(dialog, "Flip horizontal");

    await closeDialog(dialog, "OK");
    await page.waitForTimeout(100);

    // Canvas should be different after flip
    const afterFlip = await getCanvasDataUrl(page);
    expect(afterFlip).not.toBe(beforeFlip);
  });

  test("should flip image vertically", async ({ page }) => {
    // Draw something
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.5, y: 0.2 },
      end: { x: 0.5, y: 0.4 },
    });

    const beforeFlip = await getCanvasDataUrl(page);

    const dialog = await openDialogFromMenu(page, "Image", "Flip/Rotate");

    await selectRadioByLabel(dialog, "Flip vertical");

    await closeDialog(dialog, "OK");
    await page.waitForTimeout(100);

    const afterFlip = await getCanvasDataUrl(page);
    expect(afterFlip).not.toBe(beforeFlip);
  });

  test("should rotate 90 degrees and swap dimensions", async ({ page }) => {
    const { width: origWidth, height: origHeight } = await getCanvasDimensions(page);

    // Draw something to see the rotation effect
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.4, y: 0.3 },
    });

    const dialog = await openDialogFromMenu(page, "Image", "Flip/Rotate");

    // Select rotate option
    await selectRadioByLabel(dialog, "Rotate by angle");

    // Select 90 degrees (if there's a sub-option)
    const rotate90 = dialog.locator('input[type="radio"][value="90"], label:has-text("90")');
    if ((await rotate90.count()) > 0) {
      await rotate90.first().click();
    }

    await closeDialog(dialog, "OK");
    await page.waitForTimeout(100);

    // After 90° rotation, width and height should swap
    const { width: newWidth, height: newHeight } = await getCanvasDimensions(page);

    // Dimensions should have swapped (or close to it)
    expect(Math.abs(newWidth - origHeight) < 10 || Math.abs(newHeight - origWidth) < 10).toBe(true);
  });

  test("should rotate 180 degrees and preserve dimensions", async ({ page }) => {
    const { width: origWidth, height: origHeight } = await getCanvasDimensions(page);

    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.4, y: 0.4 },
    });

    const beforeRotate = await getCanvasDataUrl(page);

    const dialog = await openDialogFromMenu(page, "Image", "Flip/Rotate");

    await selectRadioByLabel(dialog, "Rotate by angle");

    const rotate180 = dialog.locator('input[type="radio"][value="180"], label:has-text("180")');
    if ((await rotate180.count()) > 0) {
      await rotate180.first().click();
    }

    await closeDialog(dialog, "OK");
    await page.waitForTimeout(100);

    // Dimensions should be preserved after 180° rotation
    const { width: newWidth, height: newHeight } = await getCanvasDimensions(page);
    expect(newWidth).toBe(origWidth);
    expect(newHeight).toBe(origHeight);

    // But image should be different
    const afterRotate = await getCanvasDataUrl(page);
    expect(afterRotate).not.toBe(beforeRotate);
  });

  test("should cancel without applying changes", async ({ page }) => {
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.5 },
      end: { x: 0.4, y: 0.3 },
    });

    const beforeDialog = await getCanvasDataUrl(page);

    const dialog = await openDialogFromMenu(page, "Image", "Flip/Rotate");

    // Select an option but cancel
    await selectRadioByLabel(dialog, "Flip horizontal");

    await closeDialog(dialog, "Cancel");
    await page.waitForTimeout(100);

    // Canvas should be unchanged
    const afterCancel = await getCanvasDataUrl(page);
    expect(afterCancel).toBe(beforeDialog);
  });
});
