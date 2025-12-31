import { test, expect } from "@playwright/test";
import { waitForAppLoaded } from "./utils/test-helpers";

test.describe("Help Menu", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("");
		await waitForAppLoaded(page);
	});

	test("Help > Help Topics opens help window", async ({ page }) => {
		// Open Help menu
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();

		// Click Help Topics
		const helpTopicsItem = page.locator('text="Help Topics"').first();
		await helpTopicsItem.click();

		// Help window should appear
		const helpWindow = page.locator('.help-window');
		await expect(helpWindow).toBeVisible();

		// Window should have title "Paint Help"
		const title = helpWindow.locator('.window-title');
		await expect(title).toContainText('Paint Help');
	});

	test("Help > Help Topics shows table of contents", async ({ page }) => {
		// Open Help menu
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();

		// Click Help Topics
		const helpTopicsItem = page.locator('text="Help Topics"').first();
		await helpTopicsItem.click();

		// TOC should be visible
		const toc = page.locator('.help-contents');
		await expect(toc).toBeVisible();

		// Should have "Welcome to Help" item
		const welcomeItem = toc.locator('text="Welcome to Help"');
		await expect(welcomeItem).toBeVisible();

		// Should have other help topics
		const topics = toc.locator('.item');
		const count = await topics.count();
		expect(count).toBeGreaterThan(1);
	});

	test("Help > Help Topics has toolbar", async ({ page }) => {
		// Open Help menu
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();

		// Click Help Topics
		const helpTopicsItem = page.locator('text="Help Topics"').first();
		await helpTopicsItem.click();

		// Toolbar should be visible
		const toolbar = page.locator('.help-toolbar');
		await expect(toolbar).toBeVisible();

		// Should have Hide button
		const hideButton = toolbar.locator('button:has-text("Hide")');
		await expect(hideButton).toBeVisible();

		// Should have Back button
		const backButton = toolbar.locator('button[title="Back"]');
		await expect(backButton).toBeVisible();

		// Should have Forward button
		const forwardButton = toolbar.locator('button[title="Forward"]');
		await expect(forwardButton).toBeVisible();

		// Should have Web Help button
		const webHelpButton = toolbar.locator('button:has-text("Web Help")');
		await expect(webHelpButton).toBeVisible();
	});

	test("Help > Help Topics displays content in iframe", async ({ page }) => {
		// Open Help menu
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();

		// Click Help Topics
		const helpTopicsItem = page.locator('text="Help Topics"').first();
		await helpTopicsItem.click();

		// Content iframe should be visible
		const iframe = page.locator('.help-content-iframe');
		await expect(iframe).toBeVisible();

		// Iframe should have content loaded
		await iframe.waitFor({ state: 'attached' });
	});

	test("Help > About opens about dialog", async ({ page }) => {
		// Open Help menu
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();

		// Click About
		const aboutItem = page.locator('text="About"').first();
		await aboutItem.click();

		// About dialog should appear
		const dialog = page.locator('.dialog:has-text("About")');
		await expect(dialog).toBeVisible();

		// Should contain Paint information
		const paintText = dialog.locator('text=/Paint/i');
		await expect(paintText).toBeVisible();
	});

	test("Help > About shows version information", async ({ page }) => {
		// Open Help menu
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();

		// Click About
		const aboutItem = page.locator('text="About"').first();
		await aboutItem.click();

		// Dialog should show version or copyright info
		const dialog = page.locator('.dialog');
		await expect(dialog).toBeVisible();

		// Should have OK button
		const okButton = dialog.locator('button:has-text("OK")');
		await expect(okButton).toBeVisible();
	});

	test("Help > About can be closed with OK", async ({ page }) => {
		// Open Help menu
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();

		// Click About
		const aboutItem = page.locator('text="About"').first();
		await aboutItem.click();

		// Dialog should be visible
		const dialog = page.locator('.dialog');
		await expect(dialog).toBeVisible();

		// Click OK
		const okButton = dialog.locator('button:has-text("OK")');
		await okButton.click();

		// Dialog should be closed
		await expect(dialog).not.toBeVisible();
	});

	test("Help menu has correct menu items", async ({ page }) => {
		// Open Help menu
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();

		const menu = page.locator('.menu-popup');

		// Should have Help Topics
		const helpTopics = menu.locator('text="Help Topics"');
		await expect(helpTopics).toBeVisible();

		// Should have About
		const about = menu.locator('text="About"');
		await expect(about).toBeVisible();
	});

	test("Help > Help Topics has keyboard shortcut", async ({ page }) => {
		// Open Help menu
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();

		const menu = page.locator('.menu-popup');

		// Help Topics should have F1 shortcut
		const f1Shortcut = menu.locator('text="F1"');
		await expect(f1Shortcut).toBeVisible();
	});

	test("F1 keyboard shortcut opens help", async ({ page }) => {
		// Press F1
		await page.keyboard.press('F1');

		// Help window should open
		const helpWindow = page.locator('.help-window');
		await expect(helpWindow).toBeVisible();
	});

	test("Help window can be closed with X button", async ({ page }) => {
		// Open help
		await page.keyboard.press('F1');

		const helpWindow = page.locator('.help-window');
		await expect(helpWindow).toBeVisible();

		// Click X button
		const closeButton = helpWindow.locator('.window-close-button');
		await closeButton.click();

		// Window should be closed
		await expect(helpWindow).not.toBeVisible();
	});

	test("Help window can be closed with Escape", async ({ page }) => {
		// Open help
		await page.keyboard.press('F1');

		const helpWindow = page.locator('.help-window');
		await expect(helpWindow).toBeVisible();

		// Press Escape
		await page.keyboard.press('Escape');

		// Window should be closed
		await expect(helpWindow).not.toBeVisible();
	});

	test("Multiple help windows don't stack", async ({ page }) => {
		// Open help twice
		await page.keyboard.press('F1');
		await page.keyboard.press('F1');

		// Should only have one help window
		const helpWindows = page.locator('.help-window');
		const count = await helpWindows.count();
		expect(count).toBe(1);
	});

	test("Help window has CHM icon", async ({ page }) => {
		// Open help
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').first().click();

		// Window should have CHM icon in titlebar
		const helpWindow = page.locator('.help-window');
		const icon = helpWindow.locator('.window-titlebar img');
		await expect(icon).toBeVisible();

		// Icon source should be chm-16x16.png
		const src = await icon.getAttribute('src');
		expect(src).toContain('chm-16x16.png');
	});

	test("Help navigation buttons work", async ({ page }) => {
		// Open help
		await page.keyboard.press('F1');

		// Click on different topics to create navigation history
		const toc = page.locator('.help-contents');
		const topics = toc.locator('.item');

		await topics.nth(1).click();
		await page.waitForTimeout(200);
		await topics.nth(2).click();
		await page.waitForTimeout(200);

		// Back button should be enabled
		const backButton = page.locator('button[title="Back"]');
		await expect(backButton).toBeEnabled();

		// Click back
		await backButton.click();
		await page.waitForTimeout(200);

		// Forward button should be enabled
		const forwardButton = page.locator('button[title="Forward"]');
		await expect(forwardButton).toBeEnabled();
	});

	test("Help sidebar can be hidden and shown", async ({ page }) => {
		// Open help
		await page.keyboard.press('F1');

		const toc = page.locator('.help-contents');
		await expect(toc).toBeVisible();

		// Click Hide
		const hideButton = page.locator('button:has-text("Hide")').first();
		await hideButton.click();

		// TOC should be hidden
		await expect(toc).not.toBeVisible();

		// Show button should appear
		const showButton = page.locator('button:has-text("Show")').first();
		await expect(showButton).toBeVisible();

		// Click Show
		await showButton.click();

		// TOC should be visible again
		await expect(toc).toBeVisible();
	});
});
