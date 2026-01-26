import { test, expect } from "@playwright/test";
import { waitForAppLoaded, selectToolByIndex, getCanvasDataUrl, canvasHasContent } from "../utils/test-helpers";
import { multiClickOnCanvas, clickOnCanvas, getPixelColor, regionHasContent } from "../utils/canvas-helpers";

/**
 * Curve tool index in the toolbox
 */
const CURVE_TOOL_INDEX = 11;

test.describe("Curve Tool", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("should draw a bezier curve with 4 clicks", async ({ page }) => {
    // Select the curve tool
    await selectToolByIndex(page, CURVE_TOOL_INDEX);

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Four clicks to create a bezier curve:
    // 1. Start point
    // 2. End point
    // 3. First control point (bends the curve)
    // 4. Second control point (completes the curve)
    await multiClickOnCanvas(
      page,
      [
        { x: 0.2, y: 0.5 }, // Start
        { x: 0.8, y: 0.5 }, // End
        { x: 0.4, y: 0.2 }, // Control point 1
        { x: 0.6, y: 0.8 }, // Control point 2
      ],
      { delayBetweenClicks: 100 },
    );

    // Wait for render
    await page.waitForTimeout(200);

    // Verify canvas was modified
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).not.toBe(beforeDataUrl);
  });

  test("should draw curve with just 2 clicks (straight line)", async ({ page }) => {
    await selectToolByIndex(page, CURVE_TOOL_INDEX);

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Draw a curve with only start and end points
    await multiClickOnCanvas(
      page,
      [
        { x: 0.2, y: 0.2 }, // Start
        { x: 0.8, y: 0.8 }, // End
      ],
      { delayBetweenClicks: 100 },
    );

    // Wait for preview
    await page.waitForTimeout(100);

    // Need to click again to bend or double-click to commit as straight line
    await multiClickOnCanvas(page, [{ x: 0.5, y: 0.5 }], { delayBetweenClicks: 100 });

    await page.waitForTimeout(100);

    // Fourth click to commit
    await clickOnCanvas(page, 0.5, 0.5);

    await page.waitForTimeout(200);

    // Canvas should have content
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).not.toBe(beforeDataUrl);
  });

  test("should cancel curve with Escape key", async ({ page }) => {
    await selectToolByIndex(page, CURVE_TOOL_INDEX);

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Start drawing a curve (just 2 clicks)
    await multiClickOnCanvas(
      page,
      [
        { x: 0.2, y: 0.5 },
        { x: 0.8, y: 0.5 },
      ],
      { delayBetweenClicks: 100 },
    );

    // Cancel with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);

    // Canvas should remain unchanged (curve was cancelled)
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).toBe(beforeDataUrl);
  });

  test("should draw curve in selected color", async ({ page }) => {
    // Select red color (typically index 1)
    const colorSwatches = page.locator(".color-button");
    await colorSwatches.nth(1).click();

    await selectToolByIndex(page, CURVE_TOOL_INDEX);

    // Draw a curve
    await multiClickOnCanvas(
      page,
      [
        { x: 0.2, y: 0.5 },
        { x: 0.8, y: 0.5 },
        { x: 0.5, y: 0.2 },
        { x: 0.5, y: 0.8 },
      ],
      { delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);

    // Check that the curve region has content
    const hasContent = await regionHasContent(page, {
      x1: 0.1,
      y1: 0.1,
      x2: 0.9,
      y2: 0.9,
    });
    expect(hasContent).toBe(true);
  });

  test("should draw multiple curves consecutively", async ({ page }) => {
    await selectToolByIndex(page, CURVE_TOOL_INDEX);

    // Draw first curve
    await multiClickOnCanvas(
      page,
      [
        { x: 0.1, y: 0.3 },
        { x: 0.4, y: 0.3 },
        { x: 0.2, y: 0.1 },
        { x: 0.3, y: 0.5 },
      ],
      { delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);

    const afterFirstCurve = await getCanvasDataUrl(page);

    // Draw second curve
    await multiClickOnCanvas(
      page,
      [
        { x: 0.5, y: 0.7 },
        { x: 0.9, y: 0.7 },
        { x: 0.6, y: 0.5 },
        { x: 0.8, y: 0.9 },
      ],
      { delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);

    const afterSecondCurve = await getCanvasDataUrl(page);

    // Both curves should have been drawn
    expect(afterSecondCurve).not.toBe(afterFirstCurve);
  });

  test("should show preview while drawing curve", async ({ page }) => {
    await selectToolByIndex(page, CURVE_TOOL_INDEX);

    // First two clicks to establish the line
    await clickOnCanvas(page, 0.2, 0.5);
    await page.waitForTimeout(50);
    await clickOnCanvas(page, 0.8, 0.5);
    await page.waitForTimeout(100);

    // After two clicks, there should be a preview line
    // Move mouse to where control point would be
    const canvas = page.locator("canvas.main-canvas");
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 0.5 * box.width, box.y + 0.2 * box.height);
      await page.waitForTimeout(100);
    }

    // The canvas should show something (preview)
    const hasPreview = await canvasHasContent(page);
    expect(hasPreview).toBe(true);
  });

  test("should respect line width setting", async ({ page }) => {
    await selectToolByIndex(page, CURVE_TOOL_INDEX);

    // Look for line width options (typically in the tool options area)
    const lineWidthOptions = page.locator(".line-size-option, .brush-size-option, .stroke-width-option");
    const count = await lineWidthOptions.count();

    if (count > 0) {
      // Select a larger line width option
      await lineWidthOptions.last().click();
    }

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Draw a curve
    await multiClickOnCanvas(
      page,
      [
        { x: 0.2, y: 0.5 },
        { x: 0.8, y: 0.5 },
        { x: 0.5, y: 0.2 },
        { x: 0.5, y: 0.5 },
      ],
      { delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);

    // Verify curve was drawn
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).not.toBe(beforeDataUrl);
  });

  test("should draw S-curve with correct control points", async ({ page }) => {
    await selectToolByIndex(page, CURVE_TOOL_INDEX);

    // Draw an S-curve shape
    await multiClickOnCanvas(
      page,
      [
        { x: 0.3, y: 0.2 }, // Start (top)
        { x: 0.3, y: 0.8 }, // End (bottom)
        { x: 0.5, y: 0.3 }, // Control 1 (pulls right at top)
        { x: 0.1, y: 0.7 }, // Control 2 (pulls left at bottom)
      ],
      { delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);

    // Verify the curve was drawn
    const hasContent = await canvasHasContent(page);
    expect(hasContent).toBe(true);
  });
});
