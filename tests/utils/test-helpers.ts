import { Page, Locator, expect } from "@playwright/test";

/**
 * Helper to wait for the React app to be fully loaded
 */
export async function waitForAppLoaded(page: Page): Promise<void> {
  // Wait for the main canvas to be present and visible
  await page.waitForSelector("canvas.main-canvas", { state: "visible", timeout: 15000 });
  // Wait for the toolbox to be present
  await page.waitForSelector(".tools-component", { state: "visible", timeout: 15000 });
  // Wait for the color palette to be present
  await page.waitForSelector(".colors-component", { state: "visible", timeout: 15000 });
}

/**
 * Get canvas coordinates relative to the canvas element
 */
export async function getCanvasCenter(page: Page): Promise<{ x: number; y: number }> {
  const canvas = page.locator("canvas.main-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

/**
 * Simulate a drawing gesture on the canvas
 */
export async function drawOnCanvas(
  page: Page,
  options: {
    start: { x: number; y: number };
    end: { x: number; y: number };
    button?: "left" | "right";
    steps?: number;
  },
): Promise<void> {
  const canvas = page.locator("canvas.main-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");

  const { start, end, button = "left", steps = 10 } = options;

  // Convert relative coordinates (0-1) to absolute canvas coordinates
  const startX = box.x + start.x * box.width;
  const startY = box.y + start.y * box.height;
  const endX = box.x + end.x * box.width;
  const endY = box.y + end.y * box.height;

  // Perform the drawing gesture
  await page.mouse.move(startX, startY);
  await page.mouse.down({ button });

  // Draw line with intermediate points
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const x = startX + (endX - startX) * progress;
    const y = startY + (endY - startY) * progress;
    await page.mouse.move(x, y);
  }

  await page.mouse.up({ button });
}

/**
 * Select a tool from the toolbox by index
 */
export async function selectToolByIndex(page: Page, index: number): Promise<void> {
  const tools = page.locator(".tool");
  await tools.nth(index).click();
}

/**
 * Select a tool from the toolbox by name/title
 */
export async function selectToolByName(page: Page, name: string): Promise<void> {
  const tool = page.locator(`.tool[title="${name}"]`);
  if ((await tool.count()) > 0) {
    await tool.click();
  } else {
    // Try to find by aria-label or other selector
    const toolByAriaLabel = page.locator(`.tool[aria-label="${name}"]`);
    if ((await toolByAriaLabel.count()) > 0) {
      await toolByAriaLabel.click();
    } else {
      // Find tool that contains the name in any attribute
      const allTools = page.locator(".tool");
      const count = await allTools.count();
      for (let i = 0; i < count; i++) {
        const toolElement = allTools.nth(i);
        const title = await toolElement.getAttribute("title");
        if (title && title.toLowerCase().includes(name.toLowerCase())) {
          await toolElement.click();
          return;
        }
      }
      throw new Error(`Tool with name "${name}" not found`);
    }
  }
}

/**
 * Select a color from the palette
 */
export async function selectColor(page: Page, colorIndex: number, button: "left" | "right" = "left"): Promise<void> {
  const swatches = page.locator(".color-button");
  const swatch = swatches.nth(colorIndex);

  if (button === "left") {
    await swatch.click();
  } else {
    await swatch.click({ button: "right" });
  }
}

/**
 * Get the current canvas image data as a data URL
 */
export async function getCanvasDataUrl(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
    return canvas.toDataURL();
  });
}

/**
 * Check if canvas has been drawn on (not completely white)
 */
export async function canvasHasContent(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Check if all pixels are white (255, 255, 255)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r !== 255 || g !== 255 || b !== 255) {
        return true; // Found a non-white pixel
      }
    }
    return false;
  });
}

/**
 * Clear the canvas by reloading the page
 */
export async function clearCanvas(page: Page): Promise<void> {
  await page.goto("");
  await waitForAppLoaded(page);
}

/**
 * Get the currently selected tool index
 */
export async function getSelectedToolIndex(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const selectedTool = document.querySelector(".tool.selected");
    if (!selectedTool) return -1;
    const allTools = Array.from(document.querySelectorAll(".tool"));
    return allTools.indexOf(selectedTool);
  });
}

/**
 * Verify a tool is selected
 */
export async function verifyToolSelected(page: Page, name: string): Promise<void> {
  const tool = page.locator(`.tool[title="${name}"]`);
  await expect(tool).toHaveClass(/selected/);
}

/**
 * Type keyboard shortcut
 */
export async function pressShortcut(page: Page, key: string, modifiers: string[] = []): Promise<void> {
  const shortcut = [...modifiers, key].join("+");
  await page.keyboard.press(shortcut);
}

/**
 * Perform undo operation
 */
export async function undo(page: Page): Promise<void> {
  await pressShortcut(page, "z", ["Control"]);
}

/**
 * Perform redo operation
 */
export async function redo(page: Page): Promise<void> {
  await pressShortcut(page, "y", ["Control"]);
}
