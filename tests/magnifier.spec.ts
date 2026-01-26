import { expect, test, type Page } from "@playwright/test";
import { selectToolByIndex, waitForAppLoaded } from "./utils/test-helpers";

async function getCanvasScale(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement | null;
    if (!canvas) return 1;
    const rect = canvas.getBoundingClientRect();
    if (!canvas.width) return 1;
    // Magnification in the React preview should match legacy behavior:
    // CSS size increases while intrinsic canvas resolution (canvas.width/height) stays constant.
    return rect.width / canvas.width;
  });
}

test.describe("Magnifier Tool", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("");
    await waitForAppLoaded(page);
  });

  test("magnifier tool changes canvas scale and updates drag handle positions", async ({ page }) => {
    // Step 1: Verify initial canvas size
    const initialCanvasBox = await page.locator("canvas.main-canvas").boundingBox();
    if (!initialCanvasBox) throw new Error("Canvas not found");

    // Canvas internal dimensions should be stable (intrinsic resolution)
    const initialCanvasWidth = await page.evaluate(() => {
      const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
      return canvas.width;
    });
    const initialCanvasHeight = await page.evaluate(() => {
      const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
      return canvas.height;
    });
    expect(initialCanvasWidth).toBeGreaterThan(0);
    expect(initialCanvasHeight).toBeGreaterThan(0);

    // Step 2: Get initial drag handle positions (canvas resize handles)
    // Canvas resize handles should be at the edges of the canvas
    const canvasResizeHandles = page.locator(".canvas-resize-handle");
    const handleCount = await canvasResizeHandles.count();

    // There should be 8 resize handles (4 corners + 4 edges)
    expect(handleCount).toBeGreaterThanOrEqual(4);

    // Get positions of a few key handles before magnification
    const topLeftHandle = canvasResizeHandles.first();
    const initialHandleBox = await topLeftHandle.boundingBox();
    if (!initialHandleBox) throw new Error("Resize handle not found");

    // Step 3: Select magnifier tool (index 5)
    await selectToolByIndex(page, 5);

    // Verify magnifier is selected
    const magnifierTool = page.locator(".tool").nth(5);
    await expect(magnifierTool).toHaveClass(/selected/);

    // Step 4: Get initial canvas scale
    const initialScale = await getCanvasScale(page);
    expect(initialScale).toBe(1);

    // Step 5: Click on canvas with magnifier to zoom in (left click = zoom in)
    const canvas = page.locator("canvas.main-canvas");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("Canvas not found");

    // Click in the center of the canvas
    await canvas.click({
      position: {
        x: canvasBox.width / 2,
        y: canvasBox.height / 2,
      },
    });

    // Wait for magnification to apply
    await page.waitForTimeout(200);

    // Step 6: Verify canvas is magnified (CSS size scale should be 2)
    const magnifiedScale = await getCanvasScale(page);
    expect(magnifiedScale).toBe(2);

    // Step 7: Verify canvas internal dimensions haven't changed
    const magnifiedCanvasWidth = await page.evaluate(() => {
      const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
      return canvas.width;
    });
    const magnifiedCanvasHeight = await page.evaluate(() => {
      const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
      return canvas.height;
    });
    expect(magnifiedCanvasWidth).toBe(initialCanvasWidth);
    expect(magnifiedCanvasHeight).toBe(initialCanvasHeight);

    // Step 8: Verify canvas bounding box has doubled (because scale is 2)
    const magnifiedCanvasBox = await canvas.boundingBox();
    if (!magnifiedCanvasBox) throw new Error("Canvas not found after magnification");

    // The displayed size should be approximately 2x the original
    // Allow for some rounding differences
    expect(magnifiedCanvasBox.width).toBeGreaterThan(initialCanvasBox.width * 1.9);
    expect(magnifiedCanvasBox.width).toBeLessThan(initialCanvasBox.width * 2.1);
    expect(magnifiedCanvasBox.height).toBeGreaterThan(initialCanvasBox.height * 1.9);
    expect(magnifiedCanvasBox.height).toBeLessThan(initialCanvasBox.height * 2.1);

    // Step 9: Verify drag handles have updated their positions
    // The handles should now be positioned relative to the magnified canvas
    const magnifiedHandleBox = await topLeftHandle.boundingBox();
    if (!magnifiedHandleBox) throw new Error("Resize handle not found after magnification");

    // The handle position should have changed (it should be further from origin due to scale)
    // Since the canvas is scaled 2x, the handle should move proportionally
    const handleXDiff = Math.abs(magnifiedHandleBox.x - initialHandleBox.x);
    const handleYDiff = Math.abs(magnifiedHandleBox.y - initialHandleBox.y);

    // Handles should have moved (not be in exactly the same position)
    // The exact amount depends on transform-origin and layout, but they should move
    expect(handleXDiff + handleYDiff).toBeGreaterThan(0);

    // Step 10: Click magnifier again to zoom in more (to 4x)
    await canvas.click({
      position: {
        x: canvasBox.width / 2,
        y: canvasBox.height / 2,
      },
    });
    await page.waitForTimeout(200);

    const scale4x = await getCanvasScale(page);
    expect(scale4x).toBe(4);

    // Step 11: Right-click to zoom out back to 2x
    await canvas.click({
      position: {
        x: canvasBox.width / 2,
        y: canvasBox.height / 2,
      },
      button: "right",
    });
    await page.waitForTimeout(200);

    const scaleAfterZoomOut = await getCanvasScale(page);
    expect(scaleAfterZoomOut).toBe(2);

    // Step 12: Continue zooming out to 1x
    await canvas.click({
      position: {
        x: canvasBox.width / 2,
        y: canvasBox.height / 2,
      },
      button: "right",
    });
    await page.waitForTimeout(200);

    const finalScale = await getCanvasScale(page);
    expect(finalScale).toBe(1);

    // Step 13: Verify drag handles are back to original positions
    const finalHandleBox = await topLeftHandle.boundingBox();
    if (!finalHandleBox) throw new Error("Resize handle not found at end");

    // Handles should be close to their initial positions
    const finalXDiff = Math.abs(finalHandleBox.x - initialHandleBox.x);
    const finalYDiff = Math.abs(finalHandleBox.y - initialHandleBox.y);

    // Allow for small rounding differences (within 5 pixels)
    expect(finalXDiff).toBeLessThan(5);
    expect(finalYDiff).toBeLessThan(5);
  });

  test("magnifier tool allows all magnification levels (1x through 8x)", async ({ page }) => {
    // Select magnifier tool
    await selectToolByIndex(page, 5);

    const canvas = page.locator("canvas.main-canvas");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("Canvas not found");

    const clickPos = {
      x: canvasBox.width / 2,
      y: canvasBox.height / 2,
    };

    // Test zooming in through all levels: 1x -> 2x -> 4x -> 6x -> 8x
    const expectedLevels = [1, 2, 4, 6, 8];

    for (let i = 0; i < expectedLevels.length; i++) {
      const currentScale = await getCanvasScale(page);

      expect(currentScale).toBe(expectedLevels[i]);

      // Click to zoom in (except on last iteration)
      if (i < expectedLevels.length - 1) {
        await canvas.click({ position: clickPos });
        await page.waitForTimeout(100);
      }
    }

    // Verify we're at max zoom (8x) and can't go higher
    await canvas.click({ position: clickPos });
    await page.waitForTimeout(100);
    const maxScale = await getCanvasScale(page);
    expect(maxScale).toBe(8); // Should still be 8, not go higher

    // Test zooming out: 8x -> 6x -> 4x -> 2x -> 1x
    for (let i = expectedLevels.length - 1; i >= 0; i--) {
      const currentScale = await getCanvasScale(page);

      expect(currentScale).toBe(expectedLevels[i]);

      // Right-click to zoom out (except on last iteration)
      if (i > 0) {
        await canvas.click({ position: clickPos, button: "right" });
        await page.waitForTimeout(100);
      }
    }

    // Verify we're at minimum zoom (1x) and can't go lower
    await canvas.click({ position: clickPos, button: "right" });
    await page.waitForTimeout(100);
    const minScale = await getCanvasScale(page);
    expect(minScale).toBe(1); // Should still be 1, not go lower
  });
});
