import { expect, test } from "@playwright/test";
import { drawOnCanvas, waitForAppLoaded } from "./utils/test-helpers";

test.describe("Drawing Visibility", () => {
  test("pencil tool produces visible black pixels", async ({ page }) => {
    console.log("Starting visibility test");
    page.on("console", (msg) => console.log(`[Browser] ${msg.text()}`));
    await page.goto("");
    await waitForAppLoaded(page);

    // DEBUG: Listen to all pointer events on window
    await page.evaluate(() => {
      window.addEventListener("pointerdown", (e) => console.log("[Window] pointerdown", e.target), { capture: true });
      window.addEventListener("mousedown", (e) => console.log("[Window] mousedown", e.target), { capture: true });
    });

    // Select pencil tool explicitly
    await page.click('.tool[title="Pencil"]');

    // 1. Verify start state: Center pixel should be White
    const startPixel = await getCenterPixel(page);
    console.log("Start pixel:", startPixel);
    expect(startPixel).toEqual([255, 255, 255, 255]);

    // DEBUG: Check what is at the center
    await page.evaluate(() => {
      const canvas = document.querySelector("canvas.main-canvas");
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const topElement = document.elementFromPoint(x, y);
      console.log(`[Browser] Top element at center:`, topElement?.tagName, topElement?.className);
    });

    // 2. Draw a black line across the center
    // Assuming default tool is Pencil and color is Black
    // Helper expects normalized coordinates (0-1)
    await drawOnCanvas(page, {
      start: { x: 50 / 512, y: 192 / 384 }, // Middle of 384 height
      end: { x: 450 / 512, y: 192 / 384 },
      steps: 20,
    });

    // 3. Verify end state: Center pixel should be Black
    const endPixel = await getCenterPixel(page);
    console.log("End pixel:", endPixel);

    // Fail if it remains White (User's report)
    expect(endPixel).not.toEqual([255, 255, 255, 255]);

    // Fail if it somehow became Transparent (Previous bug)
    expect(endPixel).not.toEqual([0, 0, 0, 0]);

    // Should be Black (or close to it/anti-aliased)
    // For pencil it should be exact black if using fillRect 1x1
    expect(endPixel[0]).toBeLessThan(50); // R
    expect(endPixel[1]).toBeLessThan(50); // G
    expect(endPixel[2]).toBeLessThan(50); // B
    expect(endPixel[3]).toBe(255); // A
  });
});

async function getCenterPixel(page: any) {
  return await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    // Get center pixel
    const x = Math.floor(canvas.width / 2);
    const y = Math.floor(canvas.height / 2);
    const data = ctx.getImageData(x, y, 1, 1).data;
    return Array.from(data);
  });
}
