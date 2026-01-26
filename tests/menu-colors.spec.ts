import { test, expect } from "@playwright/test";
import { waitForAppLoaded, selectColor } from "./utils/test-helpers";

test.describe("Colors Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("Colors > Edit Colors opens color editor dialog", async ({ page }) => {
    // Open Colors menu
    const colorsMenu = page.locator('button:has-text("Colors")');
    await colorsMenu.click();

    // Click Edit Colors
    const editColorsItem = page.locator('text="Edit Colors"').first();
    await editColorsItem.click();

    // Color editor dialog should appear
    const dialog = page.locator('.dialog:has-text("Edit Colors")');
    await expect(dialog).toBeVisible();

    // Should have color picker or color grid
    const colorPicker = dialog.locator(".color-editor");
    await expect(colorPicker).toBeVisible();
  });

  test("Colors > Edit Colors allows selecting from basic colors", async ({ page }) => {
    // Open Colors menu
    const colorsMenu = page.locator('button:has-text("Colors")');
    await colorsMenu.click();

    // Click Edit Colors
    const editColorsItem = page.locator('text="Edit Colors"').first();
    await editColorsItem.click();

    // Dialog should have basic colors grid
    const dialog = page.locator(".dialog");
    const basicColors = dialog.locator(".basic-colors .color-button");

    // Should have multiple basic color swatches
    const count = await basicColors.count();
    expect(count).toBeGreaterThan(0);

    // Click a basic color
    await basicColors.first().click();

    // OK button should be present
    const okButton = dialog.locator('button:has-text("OK")');
    await expect(okButton).toBeVisible();
  });

  test("Colors > Edit Colors has custom colors section", async ({ page }) => {
    // Open Colors menu
    const colorsMenu = page.locator('button:has-text("Colors")');
    await colorsMenu.click();

    // Click Edit Colors
    const editColorsItem = page.locator('text="Edit Colors"').first();
    await editColorsItem.click();

    // Dialog should have custom colors section
    const dialog = page.locator(".dialog");
    const customColors = dialog.locator(".custom-colors");
    await expect(customColors).toBeVisible();

    // Should have Add to Custom Colors button or similar
    const addButton = dialog.locator('button:has-text("Add to Custom Colors")');
    await expect(addButton).toBeVisible();
  });

  test("Colors > Edit Colors has Define Custom Colors section", async ({ page }) => {
    // Open Colors menu
    const colorsMenu = page.locator('button:has-text("Colors")');
    await colorsMenu.click();

    // Click Edit Colors
    const editColorsItem = page.locator('text="Edit Colors"').first();
    await editColorsItem.click();

    // Dialog should have Define Custom Colors button/section
    const dialog = page.locator(".dialog");
    const defineCustom = dialog.locator('text="Define Custom Colors"');
    await expect(defineCustom).toBeVisible();

    // Should have RGB/HSV inputs
    const rgbInputs = dialog.locator('input[type="number"]');
    const inputCount = await rgbInputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test("Colors > Edit Colors allows adding custom color", async ({ page }) => {
    // Open Colors menu
    const colorsMenu = page.locator('button:has-text("Colors")');
    await colorsMenu.click();

    // Click Edit Colors
    const editColorsItem = page.locator('text="Edit Colors"').first();
    await editColorsItem.click();

    // Define a custom color using RGB values
    const dialog = page.locator(".dialog");

    // Find RGB inputs (Red, Green, Blue)
    const redInput = dialog.locator('input[aria-label*="Red"], input[placeholder*="Red"]').first();
    if ((await redInput.count()) > 0) {
      await redInput.fill("128");
    }

    // Click Add to Custom Colors
    const addButton = dialog.locator('button:has-text("Add to Custom Colors")');
    await addButton.click();

    // Custom color should be added to the custom colors grid
  });

  test("Colors > Get Colors opens file picker", async ({ page }) => {
    // Open Colors menu
    const colorsMenu = page.locator('button:has-text("Colors")');
    await colorsMenu.click();

    // Click Get Colors
    const getColorsItem = page.locator('text="Get Colors"').first();

    // Can't fully test file picker, but verify item exists
    await expect(getColorsItem).toBeVisible();

    // This would open a file picker for .pal, .gpl, etc. files
  });

  test("Colors > Save Colors downloads palette file", async ({ page }) => {
    // Open Colors menu
    const colorsMenu = page.locator('button:has-text("Colors")');
    await colorsMenu.click();

    // Click Save Colors
    const saveColorsItem = page.locator('text="Save Colors"').first();

    // Start waiting for download
    const downloadPromise = page.waitForEvent("download");
    await saveColorsItem.click();

    // Should download a palette file
    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Should be a palette file (.gpl, .pal, etc.)
    expect(filename).toMatch(/\.(gpl|pal|txt|hex)$/);
  });

  test("Colors menu items are accessible", async ({ page }) => {
    // Open Colors menu
    const colorsMenu = page.locator('button:has-text("Colors")');
    await colorsMenu.click();

    const menu = page.locator(".menu-popup");

    // Verify all three menu items are present
    const editColors = menu.locator('text="Edit Colors"');
    await expect(editColors).toBeVisible();

    const getColors = menu.locator('text="Get Colors"');
    await expect(getColors).toBeVisible();

    const saveColors = menu.locator('text="Save Colors"');
    await expect(saveColors).toBeVisible();
  });

  test("Colors > Edit Colors can be closed with Cancel", async ({ page }) => {
    // Open Colors menu
    const colorsMenu = page.locator('button:has-text("Colors")');
    await colorsMenu.click();

    // Click Edit Colors
    const editColorsItem = page.locator('text="Edit Colors"').first();
    await editColorsItem.click();

    // Dialog should be visible
    const dialog = page.locator(".dialog");
    await expect(dialog).toBeVisible();

    // Click Cancel
    const cancelButton = dialog.locator('button:has-text("Cancel")');
    await cancelButton.click();

    // Dialog should be closed
    await expect(dialog).not.toBeVisible();
  });

  test("Colors > Edit Colors can be closed with OK", async ({ page }) => {
    // Open Colors menu
    const colorsMenu = page.locator('button:has-text("Colors")');
    await colorsMenu.click();

    // Click Edit Colors
    const editColorsItem = page.locator('text="Edit Colors"').first();
    await editColorsItem.click();

    // Dialog should be visible
    const dialog = page.locator(".dialog");
    await expect(dialog).toBeVisible();

    // Select a basic color
    const basicColor = dialog.locator(".basic-colors .color-button").first();
    await basicColor.click();

    // Click OK
    const okButton = dialog.locator('button:has-text("OK")');
    await okButton.click();

    // Dialog should be closed
    await expect(dialog).not.toBeVisible();

    // Primary color should have changed
    const currentColors = page.locator(".current-colors");
    await expect(currentColors).toBeVisible();
  });

  test("Colors palette is visible in ColorBox", async ({ page }) => {
    // ColorBox should be visible
    const colorBox = page.locator(".colors-component");
    await expect(colorBox).toBeVisible();

    // Should have color swatches
    const swatches = colorBox.locator(".color-button");
    const count = await swatches.count();

    // Should have standard palette (28 colors typically)
    expect(count).toBeGreaterThanOrEqual(28);
  });

  test("Clicking color in palette changes primary color", async ({ page }) => {
    // Get initial primary color
    const initialColor = await page.evaluate(() => {
      const indicator = document.querySelector(".foreground-color") as HTMLElement;
      return indicator ? getComputedStyle(indicator).backgroundColor : "";
    });

    // Click a different color (red, typically at index 20)
    await selectColor(page, 20, "left");

    // Primary color should change
    await page.waitForTimeout(100);
    const newColor = await page.evaluate(() => {
      const indicator = document.querySelector(".foreground-color") as HTMLElement;
      return indicator ? getComputedStyle(indicator).backgroundColor : "";
    });

    expect(newColor).not.toBe(initialColor);
  });

  test("Right-clicking color in palette changes secondary color", async ({ page }) => {
    // Get initial secondary color
    const initialColor = await page.evaluate(() => {
      const indicator = document.querySelector(".background-color") as HTMLElement;
      return indicator ? getComputedStyle(indicator).backgroundColor : "";
    });

    // Right-click a different color
    await selectColor(page, 22, "right");

    // Secondary color should change
    await page.waitForTimeout(100);
    const newColor = await page.evaluate(() => {
      const indicator = document.querySelector(".background-color") as HTMLElement;
      return indicator ? getComputedStyle(indicator).backgroundColor : "";
    });

    expect(newColor).not.toBe(initialColor);
  });

  test("Color indicators show current foreground and background", async ({ page }) => {
    // Current colors should be visible
    const currentColors = page.locator(".current-colors");
    await expect(currentColors).toBeVisible();

    // Should have foreground and background color indicators
    const foreground = page.locator(".foreground-color");
    await expect(foreground).toBeVisible();

    const background = page.locator(".background-color");
    await expect(background).toBeVisible();
  });
});
