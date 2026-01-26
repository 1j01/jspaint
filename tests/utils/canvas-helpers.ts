import { Page, expect } from "@playwright/test";

/**
 * Performs multiple clicks on the canvas at specified positions
 * Used for tools like curve (4 clicks) and polygon (N clicks)
 * @param page - Playwright page
 * @param clicks - Array of click positions with relative coordinates (0-1)
 * @param options - Additional options
 */
export async function multiClickOnCanvas(
  page: Page,
  clicks: Array<{ x: number; y: number }>,
  options: {
    doubleClickLast?: boolean;
    delayBetweenClicks?: number;
  } = {},
): Promise<void> {
  const { doubleClickLast = false, delayBetweenClicks = 50 } = options;

  const canvas = page.locator("canvas.main-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");

  for (let i = 0; i < clicks.length; i++) {
    const absX = box.x + clicks[i].x * box.width;
    const absY = box.y + clicks[i].y * box.height;

    if (i === clicks.length - 1 && doubleClickLast) {
      await page.mouse.dblclick(absX, absY);
    } else {
      await page.mouse.click(absX, absY);
      if (i < clicks.length - 1) {
        await page.waitForTimeout(delayBetweenClicks);
      }
    }
  }
}

/**
 * Gets the pixel color at a specific position on the canvas
 * @param page - Playwright page
 * @param relX - Relative X coordinate (0-1)
 * @param relY - Relative Y coordinate (0-1)
 * @returns RGBA tuple [r, g, b, a]
 */
export async function getPixelColor(page: Page, relX: number, relY: number): Promise<[number, number, number, number]> {
  return await page.evaluate(
    ({ x, y }) => {
      const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
      const ctx = canvas.getContext("2d");
      if (!ctx) return [0, 0, 0, 0] as [number, number, number, number];
      const absX = Math.floor(x * canvas.width);
      const absY = Math.floor(y * canvas.height);
      const pixel = ctx.getImageData(absX, absY, 1, 1).data;
      return [pixel[0], pixel[1], pixel[2], pixel[3]] as [number, number, number, number];
    },
    { x: relX, y: relY },
  );
}

/**
 * Verifies the canvas has specific dimensions
 * @param page - Playwright page
 * @param expectedWidth - Expected width in pixels
 * @param expectedHeight - Expected height in pixels
 */
export async function verifyCanvasDimensions(page: Page, expectedWidth: number, expectedHeight: number): Promise<void> {
  const dimensions = await page.evaluate(() => {
    const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
    return { width: canvas.width, height: canvas.height };
  });
  expect(dimensions.width).toBe(expectedWidth);
  expect(dimensions.height).toBe(expectedHeight);
}

/**
 * Gets the current canvas dimensions
 * @param page - Playwright page
 * @returns Object with width and height
 */
export async function getCanvasDimensions(page: Page): Promise<{ width: number; height: number }> {
  return await page.evaluate(() => {
    const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
    return { width: canvas.width, height: canvas.height };
  });
}

/**
 * Checks if a pixel at the given position is a specific color
 * @param page - Playwright page
 * @param relX - Relative X coordinate (0-1)
 * @param relY - Relative Y coordinate (0-1)
 * @param expectedColor - Expected RGB color [r, g, b]
 * @param tolerance - Color matching tolerance (default: 5)
 * @returns True if color matches within tolerance
 */
export async function isPixelColor(
  page: Page,
  relX: number,
  relY: number,
  expectedColor: [number, number, number],
  tolerance = 5,
): Promise<boolean> {
  const [r, g, b] = await getPixelColor(page, relX, relY);
  return (
    Math.abs(r - expectedColor[0]) <= tolerance &&
    Math.abs(g - expectedColor[1]) <= tolerance &&
    Math.abs(b - expectedColor[2]) <= tolerance
  );
}

/**
 * Checks if a pixel at the given position is white
 * @param page - Playwright page
 * @param relX - Relative X coordinate (0-1)
 * @param relY - Relative Y coordinate (0-1)
 * @returns True if pixel is white
 */
export async function isPixelWhite(page: Page, relX: number, relY: number): Promise<boolean> {
  return await isPixelColor(page, relX, relY, [255, 255, 255]);
}

/**
 * Checks if a pixel at the given position is black
 * @param page - Playwright page
 * @param relX - Relative X coordinate (0-1)
 * @param relY - Relative Y coordinate (0-1)
 * @returns True if pixel is black
 */
export async function isPixelBlack(page: Page, relX: number, relY: number): Promise<boolean> {
  return await isPixelColor(page, relX, relY, [0, 0, 0]);
}

/**
 * Counts non-white pixels in a region of the canvas
 * @param page - Playwright page
 * @param region - Region to check (relative coordinates 0-1)
 * @returns Count of non-white pixels
 */
export async function countNonWhitePixels(
  page: Page,
  region: { x1: number; y1: number; x2: number; y2: number },
): Promise<number> {
  return await page.evaluate(
    ({ x1, y1, x2, y2 }) => {
      const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
      const ctx = canvas.getContext("2d");
      if (!ctx) return 0;

      const startX = Math.floor(x1 * canvas.width);
      const startY = Math.floor(y1 * canvas.height);
      const endX = Math.floor(x2 * canvas.width);
      const endY = Math.floor(y2 * canvas.height);
      const width = endX - startX;
      const height = endY - startY;

      const imageData = ctx.getImageData(startX, startY, width, height);
      const data = imageData.data;

      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
          count++;
        }
      }
      return count;
    },
    { x1: region.x1, y1: region.y1, x2: region.x2, y2: region.y2 },
  );
}

/**
 * Checks if a region has any drawn content (non-white pixels)
 * @param page - Playwright page
 * @param region - Region to check (relative coordinates 0-1)
 * @returns True if region has content
 */
export async function regionHasContent(
  page: Page,
  region: { x1: number; y1: number; x2: number; y2: number },
): Promise<boolean> {
  const count = await countNonWhitePixels(page, region);
  return count > 0;
}

/**
 * Clicks at a specific position on the canvas
 * @param page - Playwright page
 * @param relX - Relative X coordinate (0-1)
 * @param relY - Relative Y coordinate (0-1)
 * @param button - Mouse button to use
 */
export async function clickOnCanvas(
  page: Page,
  relX: number,
  relY: number,
  button: "left" | "right" = "left",
): Promise<void> {
  const canvas = page.locator("canvas.main-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");

  const absX = box.x + relX * box.width;
  const absY = box.y + relY * box.height;

  await page.mouse.click(absX, absY, { button });
}

/**
 * Double-clicks at a specific position on the canvas
 * @param page - Playwright page
 * @param relX - Relative X coordinate (0-1)
 * @param relY - Relative Y coordinate (0-1)
 */
export async function doubleClickOnCanvas(page: Page, relX: number, relY: number): Promise<void> {
  const canvas = page.locator("canvas.main-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");

  const absX = box.x + relX * box.width;
  const absY = box.y + relY * box.height;

  await page.mouse.dblclick(absX, absY);
}

/**
 * Drags from one position to another on the canvas
 * @param page - Playwright page
 * @param from - Starting position (relative coordinates 0-1)
 * @param to - Ending position (relative coordinates 0-1)
 * @param steps - Number of intermediate steps
 */
export async function dragOnCanvas(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 10,
): Promise<void> {
  const canvas = page.locator("canvas.main-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");

  const startX = box.x + from.x * box.width;
  const startY = box.y + from.y * box.height;
  const endX = box.x + to.x * box.width;
  const endY = box.y + to.y * box.height;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const x = startX + (endX - startX) * progress;
    const y = startY + (endY - startY) * progress;
    await page.mouse.move(x, y);
  }

  await page.mouse.up();
}

/**
 * Fills the canvas with a solid color using the fill tool
 * @param page - Playwright page
 * @param colorIndex - Index in the color palette to use
 */
export async function fillCanvasWithColor(page: Page, colorIndex: number): Promise<void> {
  // Import from test-helpers to avoid duplication
  const { selectToolByIndex, selectColor } = await import("./test-helpers");

  // Select fill tool (index 3)
  await selectToolByIndex(page, 3);

  // Select the color
  await selectColor(page, colorIndex);

  // Click in the center of the canvas to fill
  await clickOnCanvas(page, 0.5, 0.5);
}

/**
 * Takes a screenshot of the canvas for visual comparison
 * @param page - Playwright page
 * @returns Buffer containing the screenshot
 */
export async function getCanvasScreenshot(page: Page): Promise<Buffer> {
  const canvas = page.locator("canvas.main-canvas");
  return await canvas.screenshot();
}

/**
 * Waits for the canvas to be fully rendered
 * @param page - Playwright page
 * @param timeout - Maximum wait time
 */
export async function waitForCanvasReady(page: Page, timeout = 5000): Promise<void> {
  await page.waitForSelector("canvas.main-canvas", { state: "visible", timeout });
  // Small delay to ensure any pending renders complete
  await page.waitForTimeout(50);
}

/**
 * Gets the absolute coordinates for a relative canvas position
 * @param page - Playwright page
 * @param relX - Relative X (0-1)
 * @param relY - Relative Y (0-1)
 * @returns Absolute page coordinates
 */
export async function getAbsoluteCanvasCoords(
  page: Page,
  relX: number,
  relY: number,
): Promise<{ x: number; y: number }> {
  const canvas = page.locator("canvas.main-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");

  return {
    x: box.x + relX * box.width,
    y: box.y + relY * box.height,
  };
}
