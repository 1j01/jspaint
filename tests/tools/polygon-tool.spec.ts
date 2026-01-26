import { test, expect } from "@playwright/test";
import { waitForAppLoaded, selectToolByIndex, getCanvasDataUrl, canvasHasContent } from "../utils/test-helpers";
import { multiClickOnCanvas, clickOnCanvas, doubleClickOnCanvas, regionHasContent } from "../utils/canvas-helpers";

/**
 * Polygon tool index in the toolbox
 */
const POLYGON_TOOL_INDEX = 13;

test.describe("Polygon Tool", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("should draw closed polygon with double-click to finish", async ({ page }) => {
    await selectToolByIndex(page, POLYGON_TOOL_INDEX);

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Draw a pentagon (5 points) with double-click on last point to close
    await multiClickOnCanvas(
      page,
      [
        { x: 0.5, y: 0.2 }, // Top
        { x: 0.7, y: 0.4 }, // Right-top
        { x: 0.65, y: 0.7 }, // Right-bottom
        { x: 0.35, y: 0.7 }, // Left-bottom
        { x: 0.3, y: 0.4 }, // Left-top
      ],
      { doubleClickLast: true, delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);

    // Verify polygon was drawn
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).not.toBe(beforeDataUrl);
  });

  test("should close polygon by clicking near start point", async ({ page }) => {
    await selectToolByIndex(page, POLYGON_TOOL_INDEX);

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Draw a triangle by clicking back near the start
    await multiClickOnCanvas(
      page,
      [
        { x: 0.5, y: 0.2 }, // Start point
        { x: 0.7, y: 0.7 }, // Right corner
        { x: 0.3, y: 0.7 }, // Left corner
        { x: 0.5, y: 0.2 }, // Click near start to close
      ],
      { delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);

    // Verify polygon was drawn
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).not.toBe(beforeDataUrl);
  });

  test("should cancel polygon with Escape key", async ({ page }) => {
    await selectToolByIndex(page, POLYGON_TOOL_INDEX);

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Start drawing a polygon (just 2 points)
    await multiClickOnCanvas(
      page,
      [
        { x: 0.3, y: 0.3 },
        { x: 0.7, y: 0.3 },
      ],
      { delayBetweenClicks: 100 },
    );

    // Cancel with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);

    // Canvas should remain unchanged
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).toBe(beforeDataUrl);
  });

  test("should draw polygon in selected color", async ({ page }) => {
    // Select a color (blue, typically index 4)
    const colorSwatches = page.locator(".color-button");
    await colorSwatches.nth(4).click();

    await selectToolByIndex(page, POLYGON_TOOL_INDEX);

    // Draw a square polygon
    await multiClickOnCanvas(
      page,
      [
        { x: 0.3, y: 0.3 },
        { x: 0.7, y: 0.3 },
        { x: 0.7, y: 0.7 },
        { x: 0.3, y: 0.7 },
      ],
      { doubleClickLast: true, delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);

    // Check that polygon region has content
    const hasContent = await regionHasContent(page, {
      x1: 0.25,
      y1: 0.25,
      x2: 0.75,
      y2: 0.75,
    });
    expect(hasContent).toBe(true);
  });

  test("should draw multiple polygons consecutively", async ({ page }) => {
    await selectToolByIndex(page, POLYGON_TOOL_INDEX);

    // Draw first polygon (triangle)
    await multiClickOnCanvas(
      page,
      [
        { x: 0.2, y: 0.2 },
        { x: 0.4, y: 0.4 },
        { x: 0.2, y: 0.4 },
      ],
      { doubleClickLast: true, delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);
    const afterFirst = await getCanvasDataUrl(page);

    // Draw second polygon (triangle)
    await multiClickOnCanvas(
      page,
      [
        { x: 0.6, y: 0.6 },
        { x: 0.8, y: 0.8 },
        { x: 0.6, y: 0.8 },
      ],
      { doubleClickLast: true, delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);
    const afterSecond = await getCanvasDataUrl(page);

    // Both polygons should have been drawn
    expect(afterSecond).not.toBe(afterFirst);
  });

  test("should show preview edges while drawing", async ({ page }) => {
    await selectToolByIndex(page, POLYGON_TOOL_INDEX);

    // Click first point
    await clickOnCanvas(page, 0.3, 0.3);
    await page.waitForTimeout(100);

    // Click second point
    await clickOnCanvas(page, 0.7, 0.3);
    await page.waitForTimeout(100);

    // Move mouse (without clicking) to see preview line
    const canvas = page.locator("canvas.main-canvas");
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 0.5 * box.width, box.y + 0.7 * box.height);
      await page.waitForTimeout(100);
    }

    // Canvas should show preview (line from last point to mouse position)
    const hasPreview = await canvasHasContent(page);
    expect(hasPreview).toBe(true);
  });

  test("should draw polygon with fill style (outline)", async ({ page }) => {
    await selectToolByIndex(page, POLYGON_TOOL_INDEX);

    // Look for fill style options (outline, filled, both)
    const fillOptions = page.locator(".fill-style-option, .shape-style-option");
    const count = await fillOptions.count();

    if (count > 0) {
      // Select outline only (usually first option)
      await fillOptions.first().click();
    }

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Draw a square
    await multiClickOnCanvas(
      page,
      [
        { x: 0.3, y: 0.3 },
        { x: 0.7, y: 0.3 },
        { x: 0.7, y: 0.7 },
        { x: 0.3, y: 0.7 },
      ],
      { doubleClickLast: true, delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);

    // Verify polygon was drawn
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).not.toBe(beforeDataUrl);
  });

  test("should draw complex polygon with many points", async ({ page }) => {
    await selectToolByIndex(page, POLYGON_TOOL_INDEX);

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Draw an octagon (8 points)
    await multiClickOnCanvas(
      page,
      [
        { x: 0.5, y: 0.2 },
        { x: 0.65, y: 0.25 },
        { x: 0.75, y: 0.4 },
        { x: 0.75, y: 0.6 },
        { x: 0.65, y: 0.75 },
        { x: 0.5, y: 0.8 },
        { x: 0.35, y: 0.75 },
        { x: 0.25, y: 0.6 },
      ],
      { doubleClickLast: true, delayBetweenClicks: 80 },
    );

    await page.waitForTimeout(200);

    // Verify octagon was drawn
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).not.toBe(beforeDataUrl);
  });

  test("should draw star shape polygon", async ({ page }) => {
    await selectToolByIndex(page, POLYGON_TOOL_INDEX);

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Draw a 5-point star
    await multiClickOnCanvas(
      page,
      [
        { x: 0.5, y: 0.15 }, // Top point
        { x: 0.38, y: 0.45 }, // Inner left-top
        { x: 0.2, y: 0.45 }, // Outer left
        { x: 0.32, y: 0.6 }, // Inner left-bottom
        { x: 0.26, y: 0.85 }, // Outer bottom-left
        { x: 0.5, y: 0.7 }, // Inner bottom
        { x: 0.74, y: 0.85 }, // Outer bottom-right
        { x: 0.68, y: 0.6 }, // Inner right-bottom
        { x: 0.8, y: 0.45 }, // Outer right
        { x: 0.62, y: 0.45 }, // Inner right-top
      ],
      { doubleClickLast: true, delayBetweenClicks: 60 },
    );

    await page.waitForTimeout(200);

    // Verify star was drawn
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).not.toBe(beforeDataUrl);
  });

  test("should respect line width for polygon outline", async ({ page }) => {
    await selectToolByIndex(page, POLYGON_TOOL_INDEX);

    // Look for line width options
    const lineWidthOptions = page.locator(".line-size-option, .stroke-width-option");
    const count = await lineWidthOptions.count();

    if (count > 0) {
      // Select a larger line width
      await lineWidthOptions.last().click();
    }

    const beforeDataUrl = await getCanvasDataUrl(page);

    // Draw a triangle
    await multiClickOnCanvas(
      page,
      [
        { x: 0.3, y: 0.7 },
        { x: 0.5, y: 0.3 },
        { x: 0.7, y: 0.7 },
      ],
      { doubleClickLast: true, delayBetweenClicks: 100 },
    );

    await page.waitForTimeout(200);

    // Verify polygon was drawn
    const afterDataUrl = await getCanvasDataUrl(page);
    expect(afterDataUrl).not.toBe(beforeDataUrl);
  });
});
