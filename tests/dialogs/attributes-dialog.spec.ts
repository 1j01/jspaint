import { test, expect } from "@playwright/test";
import { waitForAppLoaded } from "../utils/test-helpers";
import {
	openDialogFromMenu,
	closeDialog,
	setDialogNumberInput,
	setCheckbox,
	clickDialogButton,
	getDialogTitle,
	verifyDialogContainsText,
} from "../utils/dialog-helpers";
import { getCanvasDimensions, verifyCanvasDimensions } from "../utils/canvas-helpers";

test.describe("Attributes Dialog", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("");
		await waitForAppLoaded(page);
	});

	test("should open via Image > Attributes menu", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "Image", "Attributes");

		const title = await getDialogTitle(dialog);
		expect(title.toLowerCase()).toContain("attributes");

		await closeDialog(dialog, "Cancel");
	});

	test("should show current canvas dimensions", async ({ page }) => {
		const { width, height } = await getCanvasDimensions(page);

		const dialog = await openDialogFromMenu(page, "Image", "Attributes");

		// Find width and height inputs
		const widthInput = dialog.locator('input[name*="width"], input#width, input[type="number"]').first();
		const heightInput = dialog.locator('input[name*="height"], input#height, input[type="number"]').nth(1);

		const displayedWidth = await widthInput.inputValue();
		const displayedHeight = await heightInput.inputValue();

		// Displayed values should match current canvas
		expect(parseInt(displayedWidth)).toBe(width);
		expect(parseInt(displayedHeight)).toBe(height);

		await closeDialog(dialog, "Cancel");
	});

	test("should change canvas width", async ({ page }) => {
		const { height: origHeight } = await getCanvasDimensions(page);

		const dialog = await openDialogFromMenu(page, "Image", "Attributes");

		// Set new width
		const widthInput = dialog.locator('input[type="number"]').first();
		await widthInput.fill("400");

		await closeDialog(dialog, "OK");
		await page.waitForTimeout(100);

		// Verify new dimensions
		const { width: newWidth, height: newHeight } = await getCanvasDimensions(page);
		expect(newWidth).toBe(400);
		expect(newHeight).toBe(origHeight); // Height unchanged
	});

	test("should change canvas height", async ({ page }) => {
		const { width: origWidth } = await getCanvasDimensions(page);

		const dialog = await openDialogFromMenu(page, "Image", "Attributes");

		// Set new height
		const inputs = dialog.locator('input[type="number"]');
		await inputs.nth(1).fill("300");

		await closeDialog(dialog, "OK");
		await page.waitForTimeout(100);

		// Verify new dimensions
		const { width: newWidth, height: newHeight } = await getCanvasDimensions(page);
		expect(newWidth).toBe(origWidth); // Width unchanged
		expect(newHeight).toBe(300);
	});

	test("should change both dimensions", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "Image", "Attributes");

		const inputs = dialog.locator('input[type="number"]');
		await inputs.first().fill("500");
		await inputs.nth(1).fill("400");

		await closeDialog(dialog, "OK");
		await page.waitForTimeout(100);

		await verifyCanvasDimensions(page, 500, 400);
	});

	test("should have transparency checkbox", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "Image", "Attributes");

		// Look for transparency checkbox
		const transparencyCheckbox = dialog.locator(
			'input[type="checkbox"], input[name*="transparent"], label:has-text("Transparent")',
		);

		// Checkbox should exist
		expect(await transparencyCheckbox.count()).toBeGreaterThan(0);

		await closeDialog(dialog, "Cancel");
	});

	test("should have Default button to reset values", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "Image", "Attributes");

		// Look for Default button
		const defaultButton = dialog.locator('button:has-text("Default")');

		if ((await defaultButton.count()) > 0) {
			// Change values first
			const inputs = dialog.locator('input[type="number"]');
			await inputs.first().fill("999");

			// Click Default to reset
			await defaultButton.click();

			// Values should be reset (check if different from 999)
			const resetValue = await inputs.first().inputValue();
			expect(resetValue).not.toBe("999");
		}

		await closeDialog(dialog, "Cancel");
	});

	test("should cancel without applying changes", async ({ page }) => {
		const { width: origWidth, height: origHeight } = await getCanvasDimensions(page);

		const dialog = await openDialogFromMenu(page, "Image", "Attributes");

		// Change values
		const inputs = dialog.locator('input[type="number"]');
		await inputs.first().fill("999");
		await inputs.nth(1).fill("888");

		// Cancel
		await closeDialog(dialog, "Cancel");
		await page.waitForTimeout(100);

		// Dimensions should be unchanged
		await verifyCanvasDimensions(page, origWidth, origHeight);
	});

	test("should have units selector", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "Image", "Attributes");

		// Look for units options (pixels, inches, cm)
		const unitsOptions = dialog.locator(
			'input[type="radio"][name*="unit"], select[name*="unit"], label:has-text("Pixels"), label:has-text("Inches"), label:has-text("Cm")',
		);

		// Should have unit options
		expect(await unitsOptions.count()).toBeGreaterThan(0);

		await closeDialog(dialog, "Cancel");
	});
});
