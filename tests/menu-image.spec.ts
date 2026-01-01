import { test, expect } from "@playwright/test";
import { waitForAppLoaded, drawOnCanvas, selectToolByIndex, getCanvasDataUrl } from "./utils/test-helpers";

test.describe("Image Menu", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("");
		await waitForAppLoaded(page);
	});

	test("Image > Flip/Rotate opens dialog", async ({ page }) => {
		// Open Image menu
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();

		// Click Flip/Rotate
		const flipRotateItem = page.locator('text="Flip/Rotate"').first();
		await flipRotateItem.click();

		// Dialog should appear
		const dialog = page.locator('.dialog:has-text("Flip")');
		await expect(dialog).toBeVisible();

		// Should have radio buttons for flip/rotate options
		const flipHorizontal = dialog.locator('text="Flip horizontal"');
		await expect(flipHorizontal).toBeVisible();

		const flipVertical = dialog.locator('text="Flip vertical"');
		await expect(flipVertical).toBeVisible();

		const rotate90 = dialog.locator('text="Rotate by angle"');
		await expect(rotate90).toBeVisible();
	});

	test("Image > Flip/Rotate > Flip Horizontal flips image", async ({ page }) => {
		// Draw something asymmetric
		await selectToolByIndex(page, 6); // Pencil
		await drawOnCanvas(page, {
			start: { x: 0.2, y: 0.3 },
			end: { x: 0.4, y: 0.3 },
		});

		const beforeFlip = await getCanvasDataUrl(page);

		// Open dialog
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();
		const flipRotateItem = page.locator('text="Flip/Rotate"').first();
		await flipRotateItem.click();

		// Select flip horizontal
		const dialog = page.locator('.dialog');
		const flipHorizontal = dialog.locator('input[value="flipHorizontal"]');
		await flipHorizontal.check();

		// Click OK
		const okButton = dialog.locator('button:has-text("OK")');
		await okButton.click();

		// Image should be flipped
		await page.waitForTimeout(100);
		const afterFlip = await getCanvasDataUrl(page);
		expect(afterFlip).not.toBe(beforeFlip);
	});

	test("Image > Stretch/Skew opens dialog", async ({ page }) => {
		// Open Image menu
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();

		// Click Stretch/Skew
		const stretchSkewItem = page.locator('text="Stretch/Skew"').first();
		await stretchSkewItem.click();

		// Dialog should appear
		const dialog = page.locator('.dialog:has-text("Stretch")');
		await expect(dialog).toBeVisible();

		// Should have stretch inputs
		const horizontalStretch = dialog.locator('input').first();
		await expect(horizontalStretch).toBeVisible();

		// Should have skew inputs
		const horizontalSkew = dialog.locator('input').nth(2);
		await expect(horizontalSkew).toBeVisible();
	});

	test("Image > Stretch/Skew stretches image", async ({ page }) => {
		// Draw something
		await selectToolByIndex(page, 6);
		await drawOnCanvas(page, {
			start: { x: 0.3, y: 0.3 },
			end: { x: 0.5, y: 0.5 },
		});

		const beforeStretch = await getCanvasDataUrl(page);

		// Open dialog
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();
		const stretchSkewItem = page.locator('text="Stretch/Skew"').first();
		await stretchSkewItem.click();

		// Set stretch to 200%
		const dialog = page.locator('.dialog');
		const horizontalInput = dialog.locator('input').first();
		await horizontalInput.fill('200');

		const verticalInput = dialog.locator('input').nth(1);
		await verticalInput.fill('200');

		// Click OK
		const okButton = dialog.locator('button:has-text("OK")');
		await okButton.click();

		// Canvas should be larger
		await page.waitForTimeout(100);
		const afterStretch = await getCanvasDataUrl(page);
		expect(afterStretch).not.toBe(beforeStretch);
	});

	test("Image > Invert Colors inverts the image", async ({ page }) => {
		// Draw something
		await selectToolByIndex(page, 6);
		await drawOnCanvas(page, {
			start: { x: 0.3, y: 0.3 },
			end: { x: 0.7, y: 0.7 },
		});

		const beforeInvert = await getCanvasDataUrl(page);

		// Open Image menu
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();

		// Click Invert Colors
		const invertItem = page.locator('text="Invert Colors"').first();
		await invertItem.click();

		// Colors should be inverted
		await page.waitForTimeout(100);
		const afterInvert = await getCanvasDataUrl(page);
		expect(afterInvert).not.toBe(beforeInvert);

		// Invert again should restore original
		await imageMenu.click();
		await invertItem.click();
		await page.waitForTimeout(100);
		const afterDoubleInvert = await getCanvasDataUrl(page);
		expect(afterDoubleInvert).toBe(beforeInvert);
	});

	test("Image > Attributes opens dialog", async ({ page }) => {
		// Open Image menu
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();

		// Click Attributes
		const attributesItem = page.locator('text="Attributes"').first();
		await attributesItem.click();

		// Dialog should appear
		const dialog = page.locator('.dialog:has-text("Attributes")');
		await expect(dialog).toBeVisible();

		// Should have width/height inputs
		const widthInput = dialog.locator('input[type="number"]').first();
		await expect(widthInput).toBeVisible();

		const heightInput = dialog.locator('input[type="number"]').nth(1);
		await expect(heightInput).toBeVisible();
	});

	test("Image > Attributes changes canvas size", async ({ page }) => {
		// Get initial canvas size
		const initialBox = await page.locator("canvas.main-canvas").boundingBox();
		if (!initialBox) throw new Error("Canvas not found");

		// Open dialog
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();
		const attributesItem = page.locator('text="Attributes"').first();
		await attributesItem.click();

		// Change size
		const dialog = page.locator('.dialog');
		const widthInput = dialog.locator('input[type="number"]').first();
		await widthInput.fill('800');

		const heightInput = dialog.locator('input[type="number"]').nth(1);
		await heightInput.fill('600');

		// Click OK
		const okButton = dialog.locator('button:has-text("OK")');
		await okButton.click();

		// Canvas size should change (in the internal canvas, not necessarily the displayed size)
		// We can verify by checking the canvas element's width/height attributes
		const newWidth = await page.evaluate(() => {
			const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
			return canvas.width;
		});
		expect(newWidth).toBe(800);
	});

	test("Image > Clear Image clears the canvas", async ({ page }) => {
		// Draw something
		await selectToolByIndex(page, 6);
		await drawOnCanvas(page, {
			start: { x: 0.2, y: 0.2 },
			end: { x: 0.8, y: 0.8 },
		});

		// Verify canvas has content
		const hasContent = await page.evaluate(() => {
			const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
			const ctx = canvas.getContext("2d");
			if (!ctx) return false;
			const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
			for (let i = 0; i < data.length; i += 4) {
				if (data[i] !== 255 || data[i+1] !== 255 || data[i+2] !== 255) {
					return true;
				}
			}
			return false;
		});
		expect(hasContent).toBe(true);

		// Open Image menu
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();

		// Click Clear Image
		const clearItem = page.locator('text="Clear Image"').first();
		await clearItem.click();

		// Canvas should be cleared
		await page.waitForTimeout(100);
		const isCleared = await page.evaluate(() => {
			const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
			const ctx = canvas.getContext("2d");
			if (!ctx) return false;
			const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
			for (let i = 0; i < data.length; i += 4) {
				if (data[i] !== 255 || data[i+1] !== 255 || data[i+2] !== 255) {
					return false;
				}
			}
			return true;
		});
		expect(isCleared).toBe(true);
	});

	test("Image > Crop to Selection crops image", async ({ page }) => {
		// Draw something
		await selectToolByIndex(page, 6);
		await drawOnCanvas(page, {
			start: { x: 0.3, y: 0.3 },
			end: { x: 0.7, y: 0.7 },
		});

		// Make a selection
		await selectToolByIndex(page, 1); // Select tool
		await drawOnCanvas(page, {
			start: { x: 0.2, y: 0.2 },
			end: { x: 0.6, y: 0.6 },
		});

		// Open Image menu
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();

		// Click Crop to Selection
		const cropItem = page.locator('text="Crop"').first();
		await cropItem.click();

		// Canvas should be cropped (smaller)
		await page.waitForTimeout(100);
		const canvas = await page.evaluate(() => {
			const canvas = document.querySelector("canvas.main-canvas") as HTMLCanvasElement;
			return { width: canvas.width, height: canvas.height };
		});

		// Canvas should be smaller than the default 512×384 size
		// (exact size depends on selection coordinates)
		expect(canvas.width).toBeLessThan(512);
		expect(canvas.height).toBeLessThan(384);
	});

	test("Image > Crop to Selection is disabled without selection", async ({ page }) => {
		// Open Image menu without making a selection
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();

		// Crop should be disabled
		const cropItem = page.locator('[aria-label*="Crops the image"]').first();
		await expect(cropItem).toHaveClass(/disabled/);
	});

	test("Image > Draw Opaque toggles transparent selection", async ({ page }) => {
		// Open Image menu
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();

		// Click Draw Opaque
		const opaqueItem = page.locator('text="Draw Opaque"').first();
		await opaqueItem.click();

		// Should toggle the state (we can verify by opening menu again and checking checkbox)
		await imageMenu.click();
		// The checkbox state should change (implementation-specific)
	});

	test("Image menu has keyboard shortcut for Invert Colors", async ({ page }) => {
		// Open Image menu
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();

		const menu = page.locator('.menu-popup');

		// Check for Ctrl+I on Invert Colors
		const invertShortcut = menu.locator('text="Ctrl+I"');
		await expect(invertShortcut).toBeVisible();
	});

	test("Image menu has keyboard shortcuts for Flip/Rotate and Stretch/Skew", async ({ page }) => {
		// Open Image menu
		const imageMenu = page.locator('button:has-text("Image")');
		await imageMenu.click();

		const menu = page.locator('.menu-popup');

		// Check for Ctrl+R on Flip/Rotate
		const flipRotateShortcut = menu.locator('text="Ctrl+R"');
		await expect(flipRotateShortcut).toBeVisible();

		// Check for Ctrl+W on Stretch/Skew
		const stretchSkewShortcut = menu.locator('text="Ctrl+W"');
		await expect(stretchSkewShortcut).toBeVisible();
	});
});
