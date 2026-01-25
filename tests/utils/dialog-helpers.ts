import { Page, Locator, expect } from "@playwright/test";

/**
 * Opens a dialog by clicking on menu items
 * @param page - Playwright page
 * @param menuName - Top-level menu name (e.g., "Image", "Edit", "Colors")
 * @param menuItem - Menu item text to click
 * @returns The dialog locator
 */
export async function openDialogFromMenu(
	page: Page,
	menuName: string,
	menuItem: string,
): Promise<Locator> {
	// Click the menu button
	await page.locator(`.menu-button:has-text("${menuName}")`).click();

	// Wait for menu popup to be visible
	await page.waitForSelector(".menu-popup", { state: "visible" });

	// Click the menu item
	await page.locator(`.menu-popup .menu-item:has-text("${menuItem}")`).first().click();

	// Wait for dialog to appear
	const dialog = page.locator(".window").last();
	await expect(dialog).toBeVisible();

	return dialog;
}

/**
 * Opens a dialog from a submenu
 * @param page - Playwright page
 * @param menuName - Top-level menu name
 * @param submenuName - Submenu name
 * @param menuItem - Final menu item text
 * @returns The dialog locator
 */
export async function openDialogFromSubmenu(
	page: Page,
	menuName: string,
	submenuName: string,
	menuItem: string,
): Promise<Locator> {
	// Click the menu button
	await page.locator(`.menu-button:has-text("${menuName}")`).click();

	// Wait for menu popup to be visible
	await page.waitForSelector(".menu-popup", { state: "visible" });

	// Hover over submenu item to open submenu
	await page.locator(`.menu-popup .menu-item:has-text("${submenuName}")`).first().hover();

	// Wait for submenu to appear and click the item
	await page.waitForTimeout(100);
	await page.locator(`.menu-popup .menu-item:has-text("${menuItem}")`).first().click();

	// Wait for dialog to appear
	const dialog = page.locator(".window").last();
	await expect(dialog).toBeVisible();

	return dialog;
}

/**
 * Closes a dialog by clicking a button
 * @param dialog - The dialog locator
 * @param buttonText - Button text to click (default: "OK")
 */
export async function closeDialog(dialog: Locator, buttonText = "OK"): Promise<void> {
	await dialog.locator(`button:has-text("${buttonText}")`).click();
	await expect(dialog).not.toBeVisible();
}

/**
 * Closes a dialog by clicking the X button in the title bar
 * @param dialog - The dialog locator
 */
export async function closeDialogWithX(dialog: Locator): Promise<void> {
	await dialog.locator(".window-close-button, .title-bar-button.close").click();
	await expect(dialog).not.toBeVisible();
}

/**
 * Gets the title text of a dialog
 * @param dialog - The dialog locator
 * @returns The dialog title text
 */
export async function getDialogTitle(dialog: Locator): Promise<string> {
	return await dialog.locator(".window-title").textContent() || "";
}

/**
 * Sets a number input value in a dialog
 * @param dialog - The dialog locator
 * @param inputSelector - CSS selector for the input (e.g., 'input[name="width"]')
 * @param value - The value to set
 */
export async function setDialogNumberInput(
	dialog: Locator,
	inputSelector: string,
	value: number,
): Promise<void> {
	const input = dialog.locator(inputSelector);
	await input.fill(value.toString());
}

/**
 * Sets a text input value in a dialog
 * @param dialog - The dialog locator
 * @param inputSelector - CSS selector for the input
 * @param value - The value to set
 */
export async function setDialogTextInput(
	dialog: Locator,
	inputSelector: string,
	value: string,
): Promise<void> {
	const input = dialog.locator(inputSelector);
	await input.fill(value);
}

/**
 * Gets a number input value from a dialog
 * @param dialog - The dialog locator
 * @param inputSelector - CSS selector for the input
 * @returns The current value
 */
export async function getDialogNumberInput(
	dialog: Locator,
	inputSelector: string,
): Promise<number> {
	const input = dialog.locator(inputSelector);
	const value = await input.inputValue();
	return parseInt(value, 10);
}

/**
 * Selects a radio option in a dialog by value
 * @param dialog - The dialog locator
 * @param value - The radio input value to select
 */
export async function selectRadioOption(dialog: Locator, value: string): Promise<void> {
	await dialog.locator(`input[type="radio"][value="${value}"]`).check();
}

/**
 * Selects a radio option by its label text
 * @param dialog - The dialog locator
 * @param labelText - The label text associated with the radio button
 */
export async function selectRadioByLabel(dialog: Locator, labelText: string): Promise<void> {
	await dialog.locator(`label:has-text("${labelText}") input[type="radio"]`).check();
}

/**
 * Checks or unchecks a checkbox in a dialog
 * @param dialog - The dialog locator
 * @param selector - CSS selector for the checkbox
 * @param checked - Whether to check or uncheck
 */
export async function setCheckbox(
	dialog: Locator,
	selector: string,
	checked: boolean,
): Promise<void> {
	const checkbox = dialog.locator(selector);
	if (checked) {
		await checkbox.check();
	} else {
		await checkbox.uncheck();
	}
}

/**
 * Selects an option from a dropdown/select in a dialog
 * @param dialog - The dialog locator
 * @param selectSelector - CSS selector for the select element
 * @param value - The option value to select
 */
export async function selectDropdownOption(
	dialog: Locator,
	selectSelector: string,
	value: string,
): Promise<void> {
	await dialog.locator(selectSelector).selectOption(value);
}

/**
 * Verifies a dialog contains specific text
 * @param dialog - The dialog locator
 * @param text - The text to check for
 */
export async function verifyDialogContainsText(dialog: Locator, text: string): Promise<void> {
	await expect(dialog).toContainText(text);
}

/**
 * Waits for a dialog to close
 * @param dialog - The dialog locator
 * @param timeout - Timeout in milliseconds (default: 5000)
 */
export async function waitForDialogClosed(dialog: Locator, timeout = 5000): Promise<void> {
	await expect(dialog).not.toBeVisible({ timeout });
}

/**
 * Gets all visible dialogs on the page
 * @param page - Playwright page
 * @returns Array of dialog locators
 */
export async function getVisibleDialogs(page: Page): Promise<Locator[]> {
	const dialogs = page.locator(".window:visible");
	const count = await dialogs.count();
	const result: Locator[] = [];
	for (let i = 0; i < count; i++) {
		result.push(dialogs.nth(i));
	}
	return result;
}

/**
 * Click a button within a dialog
 * @param dialog - The dialog locator
 * @param buttonText - The button text to click
 */
export async function clickDialogButton(dialog: Locator, buttonText: string): Promise<void> {
	await dialog.locator(`button:has-text("${buttonText}")`).click();
}

/**
 * Wait for a dialog to be visible with a specific title
 * @param page - Playwright page
 * @param titleText - Expected dialog title
 * @param timeout - Timeout in milliseconds
 * @returns The dialog locator
 */
export async function waitForDialogWithTitle(
	page: Page,
	titleText: string,
	timeout = 5000,
): Promise<Locator> {
	const dialog = page.locator(`.window:has(.window-title:has-text("${titleText}"))`);
	await expect(dialog).toBeVisible({ timeout });
	return dialog;
}
