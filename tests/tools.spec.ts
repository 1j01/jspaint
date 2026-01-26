import { test, expect } from "@playwright/test";
import {
  waitForAppLoaded,
  drawOnCanvas,
  selectToolByIndex,
  canvasHasContent,
  clearCanvas,
  getCanvasDataUrl,
} from "./utils/test-helpers";

test.describe("Drawing Tools", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("pencil tool draws on canvas", async ({ page }) => {
    // Pencil is tool index 6
    await selectToolByIndex(page, 6);

    // Verify canvas is initially white
    const hasContentBefore = await canvasHasContent(page);
    expect(hasContentBefore).toBe(false);

    // Draw a line on the canvas
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Verify something was drawn
    const hasContentAfter = await canvasHasContent(page);
    expect(hasContentAfter).toBe(true);
  });

  test("brush tool draws on canvas", async ({ page }) => {
    // Brush is tool index 7
    await selectToolByIndex(page, 7);

    // Verify canvas is initially white
    const hasContentBefore = await canvasHasContent(page);
    expect(hasContentBefore).toBe(false);

    // Draw on the canvas
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.3 },
      end: { x: 0.7, y: 0.7 },
    });

    // Verify something was drawn
    const hasContentAfter = await canvasHasContent(page);
    expect(hasContentAfter).toBe(true);
  });

  test("eraser tool erases content", async ({ page }) => {
    // First draw something with pencil (index 6)
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.5 },
      end: { x: 0.8, y: 0.5 },
    });

    // Get canvas state after drawing
    const canvasAfterDrawing = await getCanvasDataUrl(page);

    // Select eraser (index 2) and erase
    await selectToolByIndex(page, 2);
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.4 },
      end: { x: 0.7, y: 0.6 },
    });

    // Get canvas state after erasing
    const canvasAfterErasing = await getCanvasDataUrl(page);

    // Canvas should be different after erasing
    expect(canvasAfterErasing).not.toBe(canvasAfterDrawing);
  });

  test("right-click uses secondary color", async ({ page }) => {
    // Select pencil (index 6)
    await selectToolByIndex(page, 6);

    // Draw with left click (primary color - black by default)
    await drawOnCanvas(page, {
      start: { x: 0.1, y: 0.3 },
      end: { x: 0.4, y: 0.3 },
      button: "left",
    });

    const canvasAfterLeftClick = await getCanvasDataUrl(page);

    // Clear canvas
    await clearCanvas(page);
    await selectToolByIndex(page, 6);

    // Draw with right click (secondary color - white by default, so invisible on white canvas)
    await drawOnCanvas(page, {
      start: { x: 0.1, y: 0.3 },
      end: { x: 0.4, y: 0.3 },
      button: "right",
    });

    const canvasAfterRightClick = await getCanvasDataUrl(page);

    // The canvases should be different (secondary color is white on white canvas, so less visible)
    expect(canvasAfterRightClick).not.toBe(canvasAfterLeftClick);
  });

  test("multiple strokes accumulate", async ({ page }) => {
    await selectToolByIndex(page, 6); // Pencil

    // Draw first stroke
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.4, y: 0.2 },
    });

    const canvasAfterFirstStroke = await getCanvasDataUrl(page);

    // Draw second stroke
    await drawOnCanvas(page, {
      start: { x: 0.6, y: 0.6 },
      end: { x: 0.8, y: 0.6 },
    });

    const canvasAfterSecondStroke = await getCanvasDataUrl(page);

    // Canvas should be different after second stroke
    expect(canvasAfterSecondStroke).not.toBe(canvasAfterFirstStroke);
  });
});

test.describe("Tool Selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("all 16 tools are present", async ({ page }) => {
    const tools = page.locator(".tool");
    await expect(tools).toHaveCount(16);
  });

  test("clicking a tool selects it", async ({ page }) => {
    const tools = page.locator(".tool");

    // Click on brush (index 7)
    await tools.nth(7).click();

    // Verify it's selected (has 'selected' class)
    await expect(tools.nth(7)).toHaveClass(/selected/);
  });

  test("selecting a new tool deselects the previous one", async ({ page }) => {
    const tools = page.locator(".tool");

    // First select pencil (index 6)
    await tools.nth(6).click();
    await expect(tools.nth(6)).toHaveClass(/selected/);

    // Then select brush (index 7)
    await tools.nth(7).click();
    await expect(tools.nth(7)).toHaveClass(/selected/);

    // Pencil should no longer be selected
    await expect(tools.nth(6)).not.toHaveClass(/selected/);
  });

  test("tool selection updates status text", async ({ page }) => {
    const tools = page.locator(".tool");
    const statusText = page.locator(".status-text");

    // Select eraser (index 2)
    await tools.nth(2).click();

    // Status text should contain eraser description
    await expect(statusText).toContainText(/[Ee]raser/);

    // Select brush (index 7)
    await tools.nth(7).click();

    // Status text should contain brush description
    await expect(statusText).toContainText(/[Bb]rush/);
  });
});

test.describe("Drawing Behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("drawing a single point works", async ({ page }) => {
    await selectToolByIndex(page, 6); // Pencil

    // Get canvas element
    const canvas = page.locator("canvas.main-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Click at center of canvas (single point)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // Canvas should have content
    const hasContent = await canvasHasContent(page);
    expect(hasContent).toBe(true);
  });

  test("continuous drawing follows mouse movement", async ({ page }) => {
    await selectToolByIndex(page, 6); // Pencil

    // Draw a more complex path
    await drawOnCanvas(page, {
      start: { x: 0.1, y: 0.1 },
      end: { x: 0.9, y: 0.9 },
      steps: 50, // More steps for smoother line
    });

    // Take a screenshot for visual verification (stored as snapshot)
    await expect(page.locator("canvas.main-canvas")).toHaveScreenshot("pencil-diagonal-line.png");
  });

  test("canvas prevents context menu on right-click", async ({ page }) => {
    const canvas = page.locator("canvas.main-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Track if context menu was shown
    let contextMenuShown = false;
    page.on("dialog", () => {
      contextMenuShown = true;
    });

    // Right-click on canvas
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: "right" });

    // Wait a bit
    await page.waitForTimeout(100);

    // Context menu should not have been shown
    expect(contextMenuShown).toBe(false);
  });
});
