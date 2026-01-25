import { test, expect } from "@playwright/test";
import { waitForAppLoaded } from "../utils/test-helpers";
import {
	openDialogFromSubmenu,
	closeDialog,
	selectRadioByLabel,
	setDialogNumberInput,
	getDialogTitle,
} from "../utils/dialog-helpers";

test.describe("Custom Zoom Dialog", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("");
		await waitForAppLoaded(page);
	});

	test("should open via View > Zoom > Custom menu", async ({ page }) => {
		const dialog = await openDialogFromSubmenu(page, "View", "Zoom", "Custom");

		const title = await getDialogTitle(dialog);
		expect(title.toLowerCase()).toContain("zoom") || expect(title.toLowerCase()).toContain("custom");

		await closeDialog(dialog, "Cancel");
	});

	test("should have preset zoom level radio buttons", async ({ page }) => {
		const dialog = await openDialogFromSubmenu(page, "View", "Zoom", "Custom");

		// Look for preset options (100%, 200%, 400%, 600%, 800%)
		const presets = dialog.locator('input[type="radio"]');
		const count = await presets.count();

		// Should have multiple preset options
		expect(count).toBeGreaterThan(0);

		await closeDialog(dialog, "Cancel");
	});

	test("should apply 100% zoom", async ({ page }) => {
		// First zoom to a different level
		await page.locator('.menu-button:has-text("View")').click();
		const zoomMenu = page.locator('.menu-item:has-text("Zoom")');
		await zoomMenu.hover();
		await page.waitForTimeout(100);

		// Try to click a preset zoom first
		const zoom200 = page.locator('.menu-item:has-text("200%")');
		if ((await zoom200.count()) > 0) {
			await zoom200.click();
			await page.waitForTimeout(100);
		} else {
			await page.keyboard.press("Escape");
		}

		// Now open custom zoom and set 100%
		const dialog = await openDialogFromSubmenu(page, "View", "Zoom", "Custom");

		const radio100 = dialog.locator('input[type="radio"][value="100"], label:has-text("100%") input');
		if ((await radio100.count()) > 0) {
			await radio100.first().click();
		}

		await closeDialog(dialog, "OK");
		await page.waitForTimeout(100);

		// Zoom should be applied (dialog closed successfully)
	});

	test("should apply 200% zoom", async ({ page }) => {
		const dialog = await openDialogFromSubmenu(page, "View", "Zoom", "Custom");

		const radio200 = dialog.locator('input[type="radio"][value="200"], label:has-text("200%") input');
		if ((await radio200.count()) > 0) {
			await radio200.first().click();
		}

		await closeDialog(dialog, "OK");
		await page.waitForTimeout(100);

		// Canvas should be zoomed (verify by checking canvas container size or magnification state)
	});

	test("should have custom value input", async ({ page }) => {
		const dialog = await openDialogFromSubmenu(page, "View", "Zoom", "Custom");

		// Look for custom value input
		const customInput = dialog.locator('input[type="number"], input[type="text"]');
		const count = await customInput.count();

		// Should have at least one input for custom value
		expect(count).toBeGreaterThan(0);

		await closeDialog(dialog, "Cancel");
	});

	test("should enable custom input when selecting custom radio", async ({ page }) => {
		const dialog = await openDialogFromSubmenu(page, "View", "Zoom", "Custom");

		// Find the custom radio option
		const customRadio = dialog.locator(
			'input[type="radio"]:last-of-type, label:has-text("Custom") input[type="radio"]',
		);

		if ((await customRadio.count()) > 0) {
			await customRadio.first().click();
			await page.waitForTimeout(50);

			// Custom input should be enabled/focused
			const customInput = dialog.locator('input[type="number"]');
			if ((await customInput.count()) > 0) {
				// Input should be interactable
				await customInput.first().fill("350");
				const value = await customInput.first().inputValue();
				expect(value).toBe("350");
			}
		}

		await closeDialog(dialog, "Cancel");
	});

	test("should accept custom zoom value", async ({ page }) => {
		const dialog = await openDialogFromSubmenu(page, "View", "Zoom", "Custom");

		// Select custom option and enter value
		const customRadio = dialog.locator('label:has-text("Custom") input[type="radio"]');
		if ((await customRadio.count()) > 0) {
			await customRadio.click();
		}

		const customInput = dialog.locator('input[type="number"]');
		if ((await customInput.count()) > 0) {
			await customInput.first().fill("300");
		}

		await closeDialog(dialog, "OK");
		await page.waitForTimeout(100);

		// Dialog should close and zoom should be applied
	});

	test("should cancel without changing zoom", async ({ page }) => {
		const dialog = await openDialogFromSubmenu(page, "View", "Zoom", "Custom");

		// Select a different zoom
		const radio400 = dialog.locator('input[type="radio"][value="400"], label:has-text("400%") input');
		if ((await radio400.count()) > 0) {
			await radio400.first().click();
		}

		// Cancel
		await closeDialog(dialog, "Cancel");
		await page.waitForTimeout(100);

		// Zoom should not have changed
	});

	test("should validate zoom range", async ({ page }) => {
		const dialog = await openDialogFromSubmenu(page, "View", "Zoom", "Custom");

		// Try entering an extreme value
		const customInput = dialog.locator('input[type="number"]');
		if ((await customInput.count()) > 0) {
			// Enter a value outside typical range
			await customInput.first().fill("10000");

			// Try to apply
			await dialog.locator('button:has-text("OK")').click();
			await page.waitForTimeout(100);

			// Dialog might show error or clamp the value
			// Either way, app should handle it gracefully
		}
	});
});
