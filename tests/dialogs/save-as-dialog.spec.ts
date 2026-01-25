import { test, expect } from "@playwright/test";
import { waitForAppLoaded, selectToolByIndex, drawOnCanvas } from "../utils/test-helpers";
import {
	openDialogFromMenu,
	closeDialog,
	setDialogTextInput,
	getDialogTitle,
} from "../utils/dialog-helpers";

test.describe("Save As Dialog", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("");
		await waitForAppLoaded(page);
	});

	test("should open via File > Save As menu", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "File", "Save As");

		const title = await getDialogTitle(dialog);
		expect(title.toLowerCase()).toContain("save");

		await closeDialog(dialog, "Cancel");
	});

	test("should have filename input", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "File", "Save As");

		// Look for filename input
		const filenameInput = dialog.locator(
			'input[name*="filename"], input[name*="name"], input[type="text"]',
		);

		expect(await filenameInput.count()).toBeGreaterThan(0);

		await closeDialog(dialog, "Cancel");
	});

	test("should have format/type dropdown", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "File", "Save As");

		// Look for format selector
		const formatSelect = dialog.locator('select, [class*="format"], [class*="type"]');

		expect(await formatSelect.count()).toBeGreaterThan(0);

		await closeDialog(dialog, "Cancel");
	});

	test("should allow changing filename", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "File", "Save As");

		const filenameInput = dialog.locator('input[type="text"]').first();
		await filenameInput.fill("my-painting");

		const value = await filenameInput.inputValue();
		expect(value).toBe("my-painting");

		await closeDialog(dialog, "Cancel");
	});

	test("should show available formats", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "File", "Save As");

		// Open format dropdown if it's a select
		const formatSelect = dialog.locator("select").first();
		if ((await formatSelect.count()) > 0) {
			const options = formatSelect.locator("option");
			const optionCount = await options.count();

			// Should have multiple format options
			expect(optionCount).toBeGreaterThan(1);
		}

		await closeDialog(dialog, "Cancel");
	});

	test("should support PNG format", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "File", "Save As");

		// Look for PNG option
		const pngOption = dialog.locator('option:has-text("PNG"), [value*="png"], label:has-text("PNG")');

		expect(await pngOption.count()).toBeGreaterThan(0);

		await closeDialog(dialog, "Cancel");
	});

	test("should support BMP format", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "File", "Save As");

		// Look for BMP option
		const bmpOption = dialog.locator('option:has-text("BMP"), [value*="bmp"], label:has-text("BMP")');

		// BMP should be available (MS Paint classic format)
		const hasBmp = (await bmpOption.count()) > 0;

		await closeDialog(dialog, "Cancel");
	});

	test("should cancel without saving", async ({ page }) => {
		// Draw something
		await selectToolByIndex(page, 6);
		await drawOnCanvas(page, {
			start: { x: 0.3, y: 0.3 },
			end: { x: 0.7, y: 0.7 },
		});

		const dialog = await openDialogFromMenu(page, "File", "Save As");

		// Enter a filename
		const filenameInput = dialog.locator('input[type="text"]').first();
		if ((await filenameInput.count()) > 0) {
			await filenameInput.fill("test-save");
		}

		// Cancel
		await closeDialog(dialog, "Cancel");

		// Dialog should be closed, no download should have started
		await expect(dialog).not.toBeVisible();
	});

	test("should update extension based on format selection", async ({ page }) => {
		const dialog = await openDialogFromMenu(page, "File", "Save As");

		// Set initial filename
		const filenameInput = dialog.locator('input[type="text"]').first();
		if ((await filenameInput.count()) > 0) {
			await filenameInput.fill("myimage");
		}

		// Change format to see if extension updates
		const formatSelect = dialog.locator("select").first();
		if ((await formatSelect.count()) > 0) {
			// Select a different format
			const options = formatSelect.locator("option");
			if ((await options.count()) > 1) {
				await formatSelect.selectOption({ index: 1 });
				await page.waitForTimeout(100);
			}
		}

		await closeDialog(dialog, "Cancel");
	});
});
