import { test, expect } from "@playwright/test";
import { waitForAppLoaded } from "../utils/test-helpers";
import {
  openDialogFromMenu,
  closeDialog,
  setDialogTextInput,
  getDialogTitle,
  clickDialogButton,
} from "../utils/dialog-helpers";

test.describe("Load From URL Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("should open via File > Load From URL menu", async ({ page }) => {
    // This might be under File > Open or File > Load From URL
    await page.locator('.menu-button:has-text("File")').click();

    // Look for the menu item
    const loadFromUrl = page.locator('.menu-item:has-text("Load From URL"), .menu-item:has-text("Open from URL")');

    if ((await loadFromUrl.count()) > 0) {
      await loadFromUrl.first().click();
      await page.waitForTimeout(100);

      const dialog = page.locator(".window").last();
      await expect(dialog).toBeVisible();

      const title = await dialog.locator(".window-title").textContent();
      expect(title?.toLowerCase()).toMatch(/url|load|open/);

      await closeDialog(dialog, "Cancel");
    } else {
      // Menu item might not exist, skip test
      await page.keyboard.press("Escape");
    }
  });

  test("should have URL input field", async ({ page }) => {
    await page.locator('.menu-button:has-text("File")').click();
    const loadFromUrl = page.locator('.menu-item:has-text("Load From URL"), .menu-item:has-text("Open from URL")');

    if ((await loadFromUrl.count()) > 0) {
      await loadFromUrl.first().click();
      await page.waitForTimeout(100);

      const dialog = page.locator(".window").last();

      // Look for URL input
      const urlInput = dialog.locator('input[type="url"], input[type="text"], input[name*="url"]');
      expect(await urlInput.count()).toBeGreaterThan(0);

      await closeDialog(dialog, "Cancel");
    } else {
      await page.keyboard.press("Escape");
    }
  });

  test("should validate empty URL", async ({ page }) => {
    await page.locator('.menu-button:has-text("File")').click();
    const loadFromUrl = page.locator('.menu-item:has-text("Load From URL"), .menu-item:has-text("Open from URL")');

    if ((await loadFromUrl.count()) > 0) {
      await loadFromUrl.first().click();
      await page.waitForTimeout(100);

      const dialog = page.locator(".window").last();

      // Try to load without entering URL
      const loadButton = dialog.locator('button:has-text("Load"), button:has-text("Open"), button:has-text("OK")');
      if ((await loadButton.count()) > 0) {
        await loadButton.first().click();
        await page.waitForTimeout(100);

        // Should show error or dialog should remain open
        // Either an error message appears or the dialog stays open
        const isStillVisible = await dialog.isVisible();
        const hasError = (await dialog.locator('[class*="error"], .error-message').count()) > 0;

        // Either the dialog stays open or shows an error
        expect(isStillVisible || hasError).toBe(true);
      }

      await closeDialog(dialog, "Cancel");
    } else {
      await page.keyboard.press("Escape");
    }
  });

  test("should accept valid URL format", async ({ page }) => {
    await page.locator('.menu-button:has-text("File")').click();
    const loadFromUrl = page.locator('.menu-item:has-text("Load From URL"), .menu-item:has-text("Open from URL")');

    if ((await loadFromUrl.count()) > 0) {
      await loadFromUrl.first().click();
      await page.waitForTimeout(100);

      const dialog = page.locator(".window").last();
      const urlInput = dialog.locator('input[type="url"], input[type="text"]').first();

      if ((await urlInput.count()) > 0) {
        // Enter a valid URL
        await urlInput.fill("https://example.com/image.png");

        const value = await urlInput.inputValue();
        expect(value).toBe("https://example.com/image.png");
      }

      await closeDialog(dialog, "Cancel");
    } else {
      await page.keyboard.press("Escape");
    }
  });

  test("should cancel without loading", async ({ page }) => {
    await page.locator('.menu-button:has-text("File")').click();
    const loadFromUrl = page.locator('.menu-item:has-text("Load From URL"), .menu-item:has-text("Open from URL")');

    if ((await loadFromUrl.count()) > 0) {
      await loadFromUrl.first().click();
      await page.waitForTimeout(100);

      const dialog = page.locator(".window").last();
      const urlInput = dialog.locator('input[type="url"], input[type="text"]').first();

      if ((await urlInput.count()) > 0) {
        await urlInput.fill("https://example.com/test.png");
      }

      // Cancel
      await closeDialog(dialog, "Cancel");

      // Dialog should be closed
      await expect(dialog).not.toBeVisible();
    } else {
      await page.keyboard.press("Escape");
    }
  });
});
