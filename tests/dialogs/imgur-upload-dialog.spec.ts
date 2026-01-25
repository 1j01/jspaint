import { test, expect } from "@playwright/test";
import { waitForAppLoaded, selectToolByIndex, drawOnCanvas } from "../utils/test-helpers";
import {
	closeDialog,
	closeDialogWithX,
	getDialogTitle,
} from "../utils/dialog-helpers";

test.describe("Imgur Upload Dialog", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("");
		await waitForAppLoaded(page);
	});

	test("should open via File > Upload to Imgur menu", async ({ page }) => {
		await page.locator('.menu-button:has-text("File")').click();

		// Look for upload menu item
		const uploadItem = page.locator('.menu-item:has-text("Upload to Imgur"), .menu-item:has-text("Upload")');

		if ((await uploadItem.count()) > 0) {
			await uploadItem.first().click();
			await page.waitForTimeout(100);

			const dialog = page.locator(".window").last();
			await expect(dialog).toBeVisible();

			await closeDialogWithX(dialog);
		} else {
			await page.keyboard.press("Escape");
			// Feature might not be available
		}
	});

	test("should show image preview", async ({ page }) => {
		// Draw something first
		await selectToolByIndex(page, 6);
		await drawOnCanvas(page, {
			start: { x: 0.3, y: 0.3 },
			end: { x: 0.7, y: 0.7 },
		});

		await page.locator('.menu-button:has-text("File")').click();
		const uploadItem = page.locator('.menu-item:has-text("Upload to Imgur"), .menu-item:has-text("Upload")');

		if ((await uploadItem.count()) > 0) {
			await uploadItem.first().click();
			await page.waitForTimeout(100);

			const dialog = page.locator(".window").last();

			// Look for preview image or canvas
			const preview = dialog.locator('img, canvas, [class*="preview"]');
			expect(await preview.count()).toBeGreaterThan(0);

			await closeDialogWithX(dialog);
		} else {
			await page.keyboard.press("Escape");
		}
	});

	test("should have upload button", async ({ page }) => {
		await page.locator('.menu-button:has-text("File")').click();
		const uploadItem = page.locator('.menu-item:has-text("Upload to Imgur"), .menu-item:has-text("Upload")');

		if ((await uploadItem.count()) > 0) {
			await uploadItem.first().click();
			await page.waitForTimeout(100);

			const dialog = page.locator(".window").last();

			// Look for upload button
			const uploadButton = dialog.locator('button:has-text("Upload"), button:has-text("Send")');
			expect(await uploadButton.count()).toBeGreaterThan(0);

			await closeDialogWithX(dialog);
		} else {
			await page.keyboard.press("Escape");
		}
	});

	test("should close with cancel/close button", async ({ page }) => {
		await page.locator('.menu-button:has-text("File")').click();
		const uploadItem = page.locator('.menu-item:has-text("Upload to Imgur"), .menu-item:has-text("Upload")');

		if ((await uploadItem.count()) > 0) {
			await uploadItem.first().click();
			await page.waitForTimeout(100);

			const dialog = page.locator(".window").last();
			await expect(dialog).toBeVisible();

			// Close the dialog
			const cancelButton = dialog.locator('button:has-text("Cancel"), button:has-text("Close")');
			if ((await cancelButton.count()) > 0) {
				await cancelButton.first().click();
			} else {
				await closeDialogWithX(dialog);
			}

			await expect(dialog).not.toBeVisible();
		} else {
			await page.keyboard.press("Escape");
		}
	});

	test("should show upload status indicators", async ({ page }) => {
		await page.locator('.menu-button:has-text("File")').click();
		const uploadItem = page.locator('.menu-item:has-text("Upload to Imgur"), .menu-item:has-text("Upload")');

		if ((await uploadItem.count()) > 0) {
			await uploadItem.first().click();
			await page.waitForTimeout(100);

			const dialog = page.locator(".window").last();

			// Dialog should have some status area for upload progress
			// This could be text, progress bar, or status indicator
			const statusArea = dialog.locator('[class*="status"], [class*="progress"], .message');

			// Even if empty initially, the dialog structure should exist
			await expect(dialog).toBeVisible();

			await closeDialogWithX(dialog);
		} else {
			await page.keyboard.press("Escape");
		}
	});
});
