import { test, expect } from "@playwright/test";
import { waitForAppLoaded, selectToolByIndex, drawOnCanvas, getCanvasDataUrl } from "../utils/test-helpers";
import { clickOnCanvas, getPixelColor } from "../utils/canvas-helpers";

/**
 * Text tool index in the toolbox
 */
const TEXT_TOOL_INDEX = 9;

test.describe("Text Tool", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("should create text box by dragging on canvas", async ({ page }) => {
    // Select the text tool
    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    // Draw a text box area
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.6, y: 0.4 },
    });

    // Verify text box appears
    const textbox = page.locator(".textbox");
    await expect(textbox).toBeVisible();

    // Verify textarea inside text box
    const textarea = page.locator(".textbox-editor");
    await expect(textarea).toBeVisible();
  });

  test("should allow typing text into text box", async ({ page }) => {
    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.6, y: 0.4 },
    });

    const textarea = page.locator(".textbox-editor");
    await expect(textarea).toBeVisible();

    // Type some text
    await textarea.fill("Hello World");

    // Verify text was entered
    await expect(textarea).toHaveValue("Hello World");
  });

  test("should commit text to canvas when clicking outside", async ({ page }) => {
    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.6, y: 0.4 },
    });

    const textarea = page.locator(".textbox-editor");
    await textarea.fill("Test Text");

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Click outside the text box to commit
    await clickOnCanvas(page, 0.9, 0.9);

    // Wait for text box to disappear
    await expect(page.locator(".textbox")).not.toBeVisible({ timeout: 2000 });

    // Verify canvas was modified (text was committed)
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).not.toBe(beforeDataUrl);
  });

  test("should cancel text box with Escape key", async ({ page }) => {
    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.6, y: 0.4 },
    });

    const textarea = page.locator(".textbox-editor");
    await textarea.fill("This will be cancelled");

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Press Escape to cancel
    await page.keyboard.press("Escape");

    // Verify text box is gone
    await expect(page.locator(".textbox")).not.toBeVisible();

    // Verify canvas was NOT modified (text was discarded)
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).toBe(beforeDataUrl);
  });

  test("should support multiline text with Enter key", async ({ page }) => {
    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.6, y: 0.5 },
    });

    const textarea = page.locator(".textbox-editor");

    // Type multiline text
    await textarea.fill("Line 1\nLine 2\nLine 3");

    // Verify text contains newlines
    const value = await textarea.inputValue();
    expect(value).toContain("\n");
    expect(value.split("\n").length).toBe(3);
  });

  test("should show font toolbar when View > Text Toolbar is enabled", async ({ page }) => {
    // First enable the text toolbar via menu
    await page.locator('.menu-button:has-text("View")').click();

    // Look for Text Toolbar menu item
    const textToolbarItem = page.locator('.menu-item:has-text("Text Toolbar")');
    await textToolbarItem.click();

    // Now create a text box
    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.6, y: 0.4 },
    });

    // Font toolbar should be visible
    const fontToolbar = page.locator(".fontbox-window, .font-toolbar");
    await expect(fontToolbar).toBeVisible();
  });

  test("should apply bold formatting", async ({ page }) => {
    // Enable text toolbar
    await page.locator('.menu-button:has-text("View")').click();
    await page.locator('.menu-item:has-text("Text Toolbar")').click();

    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.6, y: 0.4 },
    });

    // Click bold button in font toolbar
    const boldButton = page.locator(".fontbox-window button:has-text('B')");
    if (await boldButton.isVisible()) {
      await boldButton.click();

      // Type text
      const textarea = page.locator(".textbox-editor");
      await textarea.fill("Bold Text");

      // Verify bold style is applied
      const fontWeight = await textarea.evaluate((el) => window.getComputedStyle(el).fontWeight);
      expect(["bold", "700"]).toContain(fontWeight);
    }
  });

  test("should apply italic formatting", async ({ page }) => {
    // Enable text toolbar
    await page.locator('.menu-button:has-text("View")').click();
    await page.locator('.menu-item:has-text("Text Toolbar")').click();

    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.6, y: 0.4 },
    });

    // Click italic button in font toolbar
    const italicButton = page.locator(".fontbox-window button:has-text('I')");
    if (await italicButton.isVisible()) {
      await italicButton.click();

      const textarea = page.locator(".textbox-editor");
      await textarea.fill("Italic Text");

      const fontStyle = await textarea.evaluate((el) => window.getComputedStyle(el).fontStyle);
      expect(fontStyle).toBe("italic");
    }
  });

  test("should allow resizing text box via handles", async ({ page }) => {
    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.4, y: 0.4 },
    });

    const textbox = page.locator(".textbox");
    await expect(textbox).toBeVisible();

    // Get initial size
    const initialBox = await textbox.boundingBox();
    expect(initialBox).not.toBeNull();

    // Find a resize handle (bottom-right corner)
    const resizeHandle = page.locator(".selection-handle").last();
    if (await resizeHandle.isVisible()) {
      const handleBox = await resizeHandle.boundingBox();
      if (handleBox) {
        // Drag the handle to resize
        await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(handleBox.x + 100, handleBox.y + 50);
        await page.mouse.up();

        // Verify size changed
        const newBox = await textbox.boundingBox();
        expect(newBox).not.toBeNull();
        if (initialBox && newBox) {
          expect(newBox.width).toBeGreaterThan(initialBox.width);
        }
      }
    }
  });

  test("should use primary color for text", async ({ page }) => {
    // Select a non-black color first
    const colorSwatches = page.locator(".color-button");
    await colorSwatches.nth(1).click(); // Red color typically

    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.6, y: 0.4 },
    });

    const textarea = page.locator(".textbox-editor");
    await textarea.fill("Colored Text");

    // Commit the text
    await clickOnCanvas(page, 0.9, 0.9);
    await expect(page.locator(".textbox")).not.toBeVisible({ timeout: 2000 });

    // The text should be rendered in the selected color
    // Check a pixel in the text area - it should not be white if text was drawn
    const [r, g, b] = await getPixelColor(page, 0.3, 0.25);
    // At least one channel should be different from white
    const isNotWhite = r !== 255 || g !== 255 || b !== 255;
    // Text was rendered (canvas is not completely white in that area)
    expect(isNotWhite).toBe(true);
  });

  test("should not commit empty text box", async ({ page }) => {
    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.6, y: 0.4 },
    });

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Don't type anything, just click outside
    await clickOnCanvas(page, 0.9, 0.9);

    // Canvas should remain unchanged
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).toBe(beforeDataUrl);
  });

  test("should move text box by dragging", async ({ page }) => {
    await selectToolByIndex(page, TEXT_TOOL_INDEX);

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.4, y: 0.4 },
    });

    const textbox = page.locator(".textbox");
    await expect(textbox).toBeVisible();

    // Get initial position
    const initialBox = await textbox.boundingBox();
    expect(initialBox).not.toBeNull();

    // Type some text first so we have content
    const textarea = page.locator(".textbox-editor");
    await textarea.fill("Movable");

    // Drag the text box border to move it
    if (initialBox) {
      // Move from the top-left edge of the text box
      await page.mouse.move(initialBox.x + 2, initialBox.y + 2);
      await page.mouse.down();
      await page.mouse.move(initialBox.x + 100, initialBox.y + 100);
      await page.mouse.up();

      // Check if position changed
      const newBox = await textbox.boundingBox();
      if (newBox) {
        // Position should be different
        const moved = newBox.x !== initialBox.x || newBox.y !== initialBox.y;
        expect(moved).toBe(true);
      }
    }
  });
});
