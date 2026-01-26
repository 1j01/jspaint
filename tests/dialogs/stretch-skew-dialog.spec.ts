import { test, expect } from "@playwright/test";
import { waitForAppLoaded, selectToolByIndex, drawOnCanvas, getCanvasDataUrl } from "../utils/test-helpers";
import {
  openDialogFromMenu,
  closeDialog,
  setDialogNumberInput,
  getDialogNumberInput,
  getDialogTitle,
} from "../utils/dialog-helpers";
import { getCanvasDimensions } from "../utils/canvas-helpers";

test.describe("Stretch/Skew Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("should open via Image > Stretch/Skew menu", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Image", "Stretch/Skew");

    const title = await getDialogTitle(dialog);
    expect(title.toLowerCase()).toContain("stretch");

    await closeDialog(dialog, "Cancel");
  });

  test("should have default stretch values of 100%", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Image", "Stretch/Skew");

    // Look for horizontal and vertical stretch inputs
    const horizontalInput = dialog.locator('input[name*="horizontal"], input#horizontal-stretch, input').first();
    const value = await horizontalInput.inputValue();

    // Default should be 100
    expect(value).toBe("100");

    await closeDialog(dialog, "Cancel");
  });

  test("should stretch image horizontally 200%", async ({ page }) => {
    const { width: origWidth } = await getCanvasDimensions(page);

    // Draw content
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.4, y: 0.4 },
      end: { x: 0.6, y: 0.6 },
    });

    const dialog = await openDialogFromMenu(page, "Image", "Stretch/Skew");

    // Find and set horizontal stretch to 200%
    const horizontalInputs = dialog.locator('input[type="number"]');
    if ((await horizontalInputs.count()) > 0) {
      await horizontalInputs.first().fill("200");
    }

    await closeDialog(dialog, "OK");
    await page.waitForTimeout(100);

    // Width should have doubled
    const { width: newWidth } = await getCanvasDimensions(page);
    expect(newWidth).toBe(origWidth * 2);
  });

  test("should stretch image vertically 50%", async ({ page }) => {
    const { height: origHeight } = await getCanvasDimensions(page);

    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.4, y: 0.4 },
      end: { x: 0.6, y: 0.6 },
    });

    const dialog = await openDialogFromMenu(page, "Image", "Stretch/Skew");

    // Find vertical stretch input (usually second)
    const inputs = dialog.locator('input[type="number"]');
    if ((await inputs.count()) > 1) {
      await inputs.nth(1).fill("50");
    }

    await closeDialog(dialog, "OK");
    await page.waitForTimeout(100);

    // Height should be halved
    const { height: newHeight } = await getCanvasDimensions(page);
    expect(newHeight).toBe(Math.round(origHeight / 2));
  });

  test("should skew image horizontally", async ({ page }) => {
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.4, y: 0.3 },
      end: { x: 0.6, y: 0.7 },
    });

    const beforeSkew = await getCanvasDataUrl(page);

    const dialog = await openDialogFromMenu(page, "Image", "Stretch/Skew");

    // Find horizontal skew input (usually 3rd or 4th input)
    const inputs = dialog.locator('input[type="number"]');
    const count = await inputs.count();
    if (count >= 3) {
      // Skew inputs are typically after stretch inputs
      await inputs.nth(2).fill("15");
    }

    await closeDialog(dialog, "OK");
    await page.waitForTimeout(100);

    const afterSkew = await getCanvasDataUrl(page);
    expect(afterSkew).not.toBe(beforeSkew);
  });

  test("should have default skew values of 0 degrees", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Image", "Stretch/Skew");

    // Skew inputs should default to 0
    const inputs = dialog.locator('input[type="number"]');
    const count = await inputs.count();

    if (count >= 4) {
      // Third and fourth inputs are typically skew
      const hSkew = await inputs.nth(2).inputValue();
      const vSkew = await inputs.nth(3).inputValue();
      expect(hSkew).toBe("0");
      expect(vSkew).toBe("0");
    }

    await closeDialog(dialog, "Cancel");
  });

  test("should cancel without applying changes", async ({ page }) => {
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.4, y: 0.4 },
      end: { x: 0.6, y: 0.6 },
    });

    const { width: origWidth, height: origHeight } = await getCanvasDimensions(page);
    const beforeDialog = await getCanvasDataUrl(page);

    const dialog = await openDialogFromMenu(page, "Image", "Stretch/Skew");

    // Change values
    const inputs = dialog.locator('input[type="number"]');
    if ((await inputs.count()) > 0) {
      await inputs.first().fill("150");
    }

    await closeDialog(dialog, "Cancel");
    await page.waitForTimeout(100);

    // Dimensions should be unchanged
    const { width: newWidth, height: newHeight } = await getCanvasDimensions(page);
    expect(newWidth).toBe(origWidth);
    expect(newHeight).toBe(origHeight);

    // Canvas should be unchanged
    const afterCancel = await getCanvasDataUrl(page);
    expect(afterCancel).toBe(beforeDialog);
  });
});
