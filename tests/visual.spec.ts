import { test, expect } from "@playwright/test";
import { waitForAppLoaded, selectToolByIndex, selectColor, drawOnCanvas } from "./utils/test-helpers";

test.describe("Visual Layout Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("main screenshot matches baseline", async ({ page }) => {
    await expect(page).toHaveScreenshot("main-layout.png");
  });

  test("toolbox is visible and properly positioned", async ({ page }) => {
    const toolbox = page.locator(".tools-component");
    await expect(toolbox).toBeVisible();
    await expect(toolbox).toHaveScreenshot("toolbox.png");
  });

  test("color palette is visible and properly positioned", async ({ page }) => {
    const colorbox = page.locator(".colors-component");
    await expect(colorbox).toBeVisible();
    await expect(colorbox).toHaveScreenshot("colorbox.png");
  });

  test("canvas area is visible", async ({ page }) => {
    const canvas = page.locator("canvas.main-canvas");
    await expect(canvas).toBeVisible();
  });

  test("status bar displays information", async ({ page }) => {
    const statusArea = page.locator(".status-area");
    await expect(statusArea).toBeVisible();
  });
});

test.describe("Tool Selection Visual Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("pencil tool selected appearance", async ({ page }) => {
    await selectToolByIndex(page, 6); // Pencil
    const toolbox = page.locator(".tools-component");
    await expect(toolbox).toHaveScreenshot("pencil-selected.png");
  });

  test("brush tool selected appearance", async ({ page }) => {
    await selectToolByIndex(page, 7); // Brush
    const toolbox = page.locator(".tools-component");
    await expect(toolbox).toHaveScreenshot("brush-selected.png");
  });

  test("eraser tool selected appearance", async ({ page }) => {
    await selectToolByIndex(page, 2); // Eraser
    const toolbox = page.locator(".tools-component");
    await expect(toolbox).toHaveScreenshot("eraser-selected.png");
  });

  test("fill tool selected appearance", async ({ page }) => {
    await selectToolByIndex(page, 3); // Fill
    const toolbox = page.locator(".tools-component");
    await expect(toolbox).toHaveScreenshot("fill-selected.png");
  });

  test("select tool selected appearance", async ({ page }) => {
    await selectToolByIndex(page, 1); // Select
    const toolbox = page.locator(".tools-component");
    await expect(toolbox).toHaveScreenshot("select-selected.png");
  });

  test("magnifier tool selected appearance", async ({ page }) => {
    await selectToolByIndex(page, 5); // Magnifier
    const toolbox = page.locator(".tools-component");
    await expect(toolbox).toHaveScreenshot("magnifier-selected.png");
  });

  test("line tool selected appearance", async ({ page }) => {
    await selectToolByIndex(page, 10); // Line
    const toolbox = page.locator(".tools-component");
    await expect(toolbox).toHaveScreenshot("line-selected.png");
  });

  test("rectangle tool selected appearance", async ({ page }) => {
    await selectToolByIndex(page, 12); // Rectangle
    const toolbox = page.locator(".tools-component");
    await expect(toolbox).toHaveScreenshot("rectangle-selected.png");
  });
});

test.describe("Color Selection Visual Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("selecting primary color updates foreground indicator", async ({ page }) => {
    // Select a color (e.g., red at index 20)
    await selectColor(page, 20, "left");

    const colorbox = page.locator(".colors-component");
    await expect(colorbox).toHaveScreenshot("primary-color-selected.png");
  });

  test("selecting secondary color updates background indicator", async ({ page }) => {
    // Select a color as secondary (right-click)
    await selectColor(page, 22, "right");

    const colorbox = page.locator(".colors-component");
    await expect(colorbox).toHaveScreenshot("secondary-color-selected.png");
  });

  test("foreground/background indicator shows both colors", async ({ page }) => {
    // Select different colors for primary and secondary
    await selectColor(page, 20, "left"); // Red as primary
    await selectColor(page, 24, "right"); // Blue as secondary

    const indicator = page.locator(".current-colors");
    await expect(indicator).toHaveScreenshot("color-indicator-both.png");
  });
});

test.describe("Drawing Result Visual Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("pencil stroke appearance", async ({ page }) => {
    await selectToolByIndex(page, 6); // Pencil

    await drawOnCanvas(page, {
      start: { x: 0.1, y: 0.5 },
      end: { x: 0.9, y: 0.5 },
      steps: 20,
    });

    const canvas = page.locator("canvas.main-canvas");
    await expect(canvas).toHaveScreenshot("pencil-stroke.png");
  });

  test("brush stroke appearance", async ({ page }) => {
    await selectToolByIndex(page, 7); // Brush

    await drawOnCanvas(page, {
      start: { x: 0.1, y: 0.5 },
      end: { x: 0.9, y: 0.5 },
      steps: 20,
    });

    const canvas = page.locator("canvas.main-canvas");
    await expect(canvas).toHaveScreenshot("brush-stroke.png");
  });

  test("diagonal line appearance", async ({ page }) => {
    await selectToolByIndex(page, 6); // Pencil

    await drawOnCanvas(page, {
      start: { x: 0.1, y: 0.1 },
      end: { x: 0.9, y: 0.9 },
      steps: 30,
    });

    const canvas = page.locator("canvas.main-canvas");
    await expect(canvas).toHaveScreenshot("diagonal-line.png");
  });

  test("multiple strokes appearance", async ({ page }) => {
    await selectToolByIndex(page, 6); // Pencil

    // Draw horizontal line
    await drawOnCanvas(page, {
      start: { x: 0.1, y: 0.3 },
      end: { x: 0.9, y: 0.3 },
    });

    // Draw vertical line
    await drawOnCanvas(page, {
      start: { x: 0.5, y: 0.1 },
      end: { x: 0.5, y: 0.9 },
    });

    const canvas = page.locator("canvas.main-canvas");
    await expect(canvas).toHaveScreenshot("cross-pattern.png");
  });

  test("colored stroke appearance", async ({ page }) => {
    // Select red color (typically index 20 in standard palette)
    await selectColor(page, 20, "left");

    await selectToolByIndex(page, 6); // Pencil

    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.5 },
      end: { x: 0.8, y: 0.5 },
    });

    const canvas = page.locator("canvas.main-canvas");
    await expect(canvas).toHaveScreenshot("colored-stroke.png");
  });
});

test.describe("Responsive Layout Tests", () => {
  test("layout adapts to smaller viewport", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 480 });
    await page.goto("");
    await waitForAppLoaded(page);

    await expect(page).toHaveScreenshot("small-viewport.png");
  });

  test("layout adapts to larger viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("");
    await waitForAppLoaded(page);

    await expect(page).toHaveScreenshot("large-viewport.png");
  });
});
