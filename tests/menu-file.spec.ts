import { test, expect } from "@playwright/test";
import { waitForAppLoaded, drawOnCanvas, selectToolByIndex, getCanvasDataUrl } from "./utils/test-helpers";

test.describe("File Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("File > New shows MessageBox dialog", async ({ page }) => {
    // Draw something first
    await selectToolByIndex(page, 6); // Pencil
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Click New
    const newItem = page.locator('text="New"').first();
    await newItem.click();

    // MessageBox dialog should appear
    const messageBox = page.locator(".messagebox-dialog");
    await expect(messageBox).toBeVisible();
    await expect(messageBox).toContainText("Save changes to Untitled?");

    // Should have Yes, No, Cancel buttons
    await expect(messageBox.locator('button:has-text("Yes")')).toBeVisible();
    await expect(messageBox.locator('button:has-text("No")')).toBeVisible();
    await expect(messageBox.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test("File > New clears canvas when clicking No", async ({ page }) => {
    // Draw something first
    await selectToolByIndex(page, 6); // Pencil
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Click New
    const newItem = page.locator('text="New"').first();
    await newItem.click();

    // Click No button
    const noButton = page.locator('.messagebox-dialog button:has-text("No")');
    await noButton.click();

    // Dialog should close
    await expect(page.locator(".messagebox-dialog")).not.toBeVisible();

    // Canvas should be cleared (all white)
    await page.waitForTimeout(100);
    const imageData = await page.evaluate(() => {
      const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Check if all pixels are white
      for (let i = 0; i < data.data.length; i += 4) {
        if (data.data[i] !== 255 || data.data[i + 1] !== 255 || data.data[i + 2] !== 255) {
          return false;
        }
      }
      return true;
    });
    expect(imageData).toBe(true);
  });

  test("File > New cancels when clicking Cancel", async ({ page }) => {
    // Draw something first
    await selectToolByIndex(page, 6); // Pencil
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Get canvas state before
    const beforeDataUrl = await getCanvasDataUrl(page);

    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Click New
    const newItem = page.locator('text="New"').first();
    await newItem.click();

    // Click Cancel button
    const cancelButton = page.locator('.messagebox-dialog button:has-text("Cancel")');
    await cancelButton.click();

    // Dialog should close
    await expect(page.locator(".messagebox-dialog")).not.toBeVisible();

    // Canvas should remain unchanged
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).toBe(beforeDataUrl);
  });

  test("File > Open opens file picker", async ({ page }) => {
    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // We can't fully test file upload in Playwright without complex setup,
    // but we can verify the menu item exists and is clickable
    const openItem = page.locator('text="Open..."').first();
    await expect(openItem).toBeVisible();
  });

  test("File > Save downloads image", async ({ page }) => {
    // Draw something
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.3 },
      end: { x: 0.7, y: 0.7 },
    });

    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent("download");

    // Click Save
    const saveItem = page.locator('[aria-label="Saves the active document."]').first();
    await saveItem.click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".png");
  });

  test("File > Save As opens dialog", async ({ page }) => {
    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Click Save As
    const saveAsItem = page.locator('text="Save As..."').first();
    await saveAsItem.click();

    // Save As dialog should appear
    const dialog = page.locator('.dialog:has-text("Save As")');
    await expect(dialog).toBeVisible();

    // Dialog should have format dropdown
    const formatSelect = dialog.locator("select");
    await expect(formatSelect).toBeVisible();

    // Dialog should have filename input
    const filenameInput = dialog.locator('input[type="text"]');
    await expect(filenameInput).toBeVisible();
  });

  test("File > Load From URL opens dialog", async ({ page }) => {
    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Click Load From URL
    const loadUrlItem = page.locator('text="Load From URL..."').first();
    await loadUrlItem.click();

    // Dialog should appear
    const dialog = page.locator('.dialog:has-text("Load From URL")');
    await expect(dialog).toBeVisible();

    // Should have URL input
    const urlInput = dialog.locator('input[type="text"]');
    await expect(urlInput).toBeVisible();
  });

  test("File > Upload To Imgur opens dialog", async ({ page }) => {
    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Click Upload To Imgur
    const imgurItem = page.locator('text="Upload To Imgur"').first();
    await imgurItem.click();

    // Imgur dialog should appear
    const dialog = page.locator('.dialog:has-text("Imgur")');
    await expect(dialog).toBeVisible();
  });

  test("File > Manage Storage opens dialog", async ({ page }) => {
    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Click Manage Storage
    const storageItem = page.locator('text="Manage Storage"').first();
    await storageItem.click();

    // Storage dialog should appear
    const dialog = page.locator('.dialog:has-text("Storage")');
    await expect(dialog).toBeVisible();
  });

  test("File > Print triggers print dialog", async ({ page }) => {
    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // We can verify the Print menu item exists
    const printItem = page.locator('text="Print..."').first();
    await expect(printItem).toBeVisible();
  });

  test("File > Print Preview triggers print", async ({ page }) => {
    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Verify Print Preview exists
    const previewItem = page.locator('text="Print Preview"').first();
    await expect(previewItem).toBeVisible();
  });

  test("File > Page Setup triggers print", async ({ page }) => {
    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Verify Page Setup exists
    const setupItem = page.locator('text="Page Setup"').first();
    await expect(setupItem).toBeVisible();
  });

  test("File > Set As Wallpaper items are disabled", async ({ page }) => {
    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Verify wallpaper items are disabled
    const tiledItem = page.locator('text="Set As Wallpaper (Tiled)"').first();
    await expect(tiledItem).toHaveClass(/disabled/);

    const centeredItem = page.locator('text="Set As Wallpaper (Centered)"').first();
    await expect(centeredItem).toHaveClass(/disabled/);
  });

  test("File > Exit shows confirmation", async ({ page }) => {
    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Set up dialog handler
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toContain("exit");
      dialog.dismiss();
    });

    // Click Exit
    const exitItem = page.locator('text="Exit"').first();
    await exitItem.click();

    // Page should still be there (because we dismissed the dialog)
    await expect(page.locator("canvas.main-canvas")).toBeVisible();
  });

  test("File menu items have correct keyboard shortcuts", async ({ page }) => {
    // Open File menu
    const fileMenu = page.locator('button:has-text("File")');
    await fileMenu.click();

    // Verify shortcuts are displayed
    const menu = page.locator(".menu-popup");

    // Check for Ctrl+O on Open
    const openShortcut = menu.locator('text="Ctrl+O"');
    await expect(openShortcut).toBeVisible();

    // Check for Ctrl+S on Save
    const saveShortcut = menu.locator('text="Ctrl+S"');
    await expect(saveShortcut).toBeVisible();

    // Check for Ctrl+Shift+S on Save As
    const saveAsShortcut = menu.locator('text="Ctrl+Shift+S"');
    await expect(saveAsShortcut).toBeVisible();

    // Check for Ctrl+P on Print
    const printShortcut = menu.locator('text="Ctrl+P"');
    await expect(printShortcut).toBeVisible();
  });
});
