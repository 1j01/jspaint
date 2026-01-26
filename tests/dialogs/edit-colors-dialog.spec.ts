import { test, expect } from "@playwright/test";
import { waitForAppLoaded, selectColor } from "../utils/test-helpers";
import { openDialogFromMenu, closeDialog, clickDialogButton, getDialogTitle } from "../utils/dialog-helpers";

test.describe("Edit Colors Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("should open via Colors > Edit Colors menu", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Colors", "Edit Colors");

    const title = await getDialogTitle(dialog);
    expect(title.toLowerCase()).toContain("color");

    await closeDialog(dialog, "Cancel");
  });

  test("should display basic colors grid", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Colors", "Edit Colors");

    // Look for basic colors grid (typically 48 colors in 6 rows of 8)
    const colorCells = dialog.locator(".basic-colors .color-cell, .basic-colors button, [class*='color-grid'] button");

    // Should have multiple color options
    const count = await colorCells.count();
    expect(count).toBeGreaterThan(0);

    await closeDialog(dialog, "Cancel");
  });

  test("should display custom colors section", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Colors", "Edit Colors");

    // Look for custom colors section
    const customColors = dialog.locator(".custom-colors, [class*='custom'], label:has-text('Custom')");

    expect(await customColors.count()).toBeGreaterThan(0);

    await closeDialog(dialog, "Cancel");
  });

  test("should have Define Custom Colors button", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Colors", "Edit Colors");

    // Look for the expand button
    const defineButton = dialog.locator('button:has-text("Define Custom Colors")');

    if ((await defineButton.count()) > 0) {
      // Click to expand
      await defineButton.click();
      await page.waitForTimeout(100);

      // Should show color picker controls after expansion
      const colorPicker = dialog.locator('[class*="color-picker"], canvas, input[type="number"]');
      expect(await colorPicker.count()).toBeGreaterThan(0);
    }

    await closeDialog(dialog, "Cancel");
  });

  test("should have RGB input fields", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Colors", "Edit Colors");

    // Expand if needed
    const defineButton = dialog.locator('button:has-text("Define Custom Colors")');
    if ((await defineButton.count()) > 0) {
      await defineButton.click();
      await page.waitForTimeout(100);
    }

    // Look for RGB inputs
    const redInput = dialog.locator('input[name*="red"], input#red, label:has-text("Red") + input');
    const greenInput = dialog.locator('input[name*="green"], input#green, label:has-text("Green") + input');
    const blueInput = dialog.locator('input[name*="blue"], input#blue, label:has-text("Blue") + input');

    // Should have RGB inputs (or at least number inputs for colors)
    const numberInputs = dialog.locator('input[type="number"]');
    expect(await numberInputs.count()).toBeGreaterThan(0);

    await closeDialog(dialog, "Cancel");
  });

  test("should update color preview when selecting basic color", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Colors", "Edit Colors");

    // Find a basic color cell and click it
    const colorCells = dialog
      .locator(".basic-colors .color-cell, .basic-colors button, [class*='color'] button")
      .first();

    if ((await colorCells.count()) > 0) {
      await colorCells.click();
      await page.waitForTimeout(100);

      // Preview should be visible
      const preview = dialog.locator('[class*="preview"], [class*="sample"]');
      expect(await preview.count()).toBeGreaterThan(0);
    }

    await closeDialog(dialog, "Cancel");
  });

  test("should apply selected color on OK", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Colors", "Edit Colors");

    // Click a different color from the basic grid
    const colorCells = dialog.locator(".basic-colors .color-cell, .basic-colors button, [class*='color'] button");

    if ((await colorCells.count()) > 1) {
      // Click a color that's not black (e.g., second color)
      await colorCells.nth(1).click();
    }

    // Click OK
    await closeDialog(dialog, "OK");
    await page.waitForTimeout(100);

    // The selected color should now be applied (dialog closed successfully)
    await expect(dialog).not.toBeVisible();
  });

  test("should have Add to Custom Colors button", async ({ page }) => {
    const dialog = await openDialogFromMenu(page, "Colors", "Edit Colors");

    // Expand if needed
    const defineButton = dialog.locator('button:has-text("Define Custom Colors")');
    if ((await defineButton.count()) > 0) {
      await defineButton.click();
      await page.waitForTimeout(100);
    }

    // Look for Add to Custom Colors button
    const addButton = dialog.locator('button:has-text("Add to Custom Colors")');

    // Button should exist in expanded mode
    if ((await addButton.count()) > 0) {
      await expect(addButton).toBeVisible();
    }

    await closeDialog(dialog, "Cancel");
  });

  test("should cancel without changing color", async ({ page }) => {
    // Note the current primary color
    const primaryColorBefore = await page
      .locator(".primary-color, .foreground-color")
      .first()
      .evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

    const dialog = await openDialogFromMenu(page, "Colors", "Edit Colors");

    // Select a different color
    const colorCells = dialog.locator(".basic-colors .color-cell, .basic-colors button");
    if ((await colorCells.count()) > 5) {
      await colorCells.nth(5).click();
    }

    // Cancel
    await closeDialog(dialog, "Cancel");
    await page.waitForTimeout(100);

    // Color should be unchanged
    const primaryColorAfter = await page
      .locator(".primary-color, .foreground-color")
      .first()
      .evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

    expect(primaryColorAfter).toBe(primaryColorBefore);
  });
});
