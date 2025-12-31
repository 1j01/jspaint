import { test, expect } from "@playwright/test";
import { waitForAppLoaded } from "./utils/test-helpers";

test.describe("Help Window", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("");
		await waitForAppLoaded(page);
	});

	test("opens help window from menu", async ({ page }) => {
		// Open Help menu
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();

		// Click "Help Topics"
		const helpTopics = page.locator('text="Help Topics"');
		await helpTopics.click();

		// Wait for help window to appear
		const helpWindow = page.locator(".help-window");
		await expect(helpWindow).toBeVisible();

		// Verify help window title
		const title = helpWindow.locator(".window-title");
		await expect(title).toContainText("Paint Help");
	});

	test("help window has table of contents", async ({ page }) => {
		// Open help window
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').click();

		// Verify TOC is visible
		const toc = page.locator(".help-contents");
		await expect(toc).toBeVisible();

		// Verify "Welcome to Help" item is present
		const welcomeItem = toc.locator('text="Welcome to Help"');
		await expect(welcomeItem).toBeVisible();
	});

	test("clicking TOC item navigates to help page", async ({ page }) => {
		// Open help window
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').click();

		// Click on "Welcome to Help"
		const welcomeItem = page.locator('.help-contents .item:has-text("Welcome to Help")');
		await welcomeItem.click();

		// Verify iframe loads content
		const iframe = page.frameLocator(".help-content-iframe");
		await expect(iframe.locator("body")).toBeVisible();
	});

	test("only one folder can be expanded at a time", async ({ page }) => {
		// Open help window
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').click();

		// Find all folders in TOC
		const folders = page.locator(".help-contents .folder");
		const firstFolder = folders.first();
		const secondFolder = folders.nth(1);

		// Expand first folder
		await firstFolder.locator(".item").click();
		await expect(firstFolder).toHaveClass(/expanded/);

		// Expand second folder
		await secondFolder.locator(".item").click();

		// First folder should be collapsed
		await expect(firstFolder).not.toHaveClass(/expanded/);
		// Second folder should be expanded
		await expect(secondFolder).toHaveClass(/expanded/);
	});

	test("hide sidebar button works", async ({ page }) => {
		// Open help window
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').click();

		// Get initial window width
		const helpWindow = page.locator(".help-window");
		const initialBox = await helpWindow.boundingBox();
		if (!initialBox) throw new Error("Help window not found");
		const initialWidth = initialBox.width;

		// Click hide button
		const hideButton = page.locator('button:has-text("Hide")').first();
		await hideButton.click();

		// Sidebar should be hidden
		const toc = page.locator(".help-contents");
		await expect(toc).not.toBeVisible();

		// Window should be narrower
		const newBox = await helpWindow.boundingBox();
		if (!newBox) throw new Error("Help window not found after hide");
		expect(newBox.width).toBeLessThan(initialWidth);

		// Show button should be visible
		const showButton = page.locator('button:has-text("Show")').first();
		await expect(showButton).toBeVisible();
	});

	test("show sidebar button works", async ({ page }) => {
		// Open help window
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').click();

		// Hide sidebar first
		const hideButton = page.locator('button:has-text("Hide")').first();
		await hideButton.click();

		// Get window width with hidden sidebar
		const helpWindow = page.locator(".help-window");
		const hiddenBox = await helpWindow.boundingBox();
		if (!hiddenBox) throw new Error("Help window not found");
		const hiddenWidth = hiddenBox.width;

		// Click show button
		const showButton = page.locator('button:has-text("Show")').first();
		await showButton.click();

		// Sidebar should be visible
		const toc = page.locator(".help-contents");
		await expect(toc).toBeVisible();

		// Window should be wider
		const shownBox = await helpWindow.boundingBox();
		if (!shownBox) throw new Error("Help window not found after show");
		expect(shownBox.width).toBeGreaterThan(hiddenWidth);
	});

	test("back button navigates to previous page", async ({ page }) => {
		// Open help window
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').click();

		// Click on first help topic
		const firstTopic = page.locator(".help-contents .item").nth(1);
		await firstTopic.click();

		// Wait for navigation
		await page.waitForTimeout(500);

		// Click on second help topic
		const secondTopic = page.locator(".help-contents .item").nth(2);
		await secondTopic.click();

		// Wait for navigation
		await page.waitForTimeout(500);

		// Click back button
		const backButton = page.locator('button[title="Back"]');
		await backButton.click();

		// Should navigate back to first topic
		// (We can't easily verify iframe content due to cross-origin, but we can verify button state)
		await expect(backButton).toBeEnabled();
	});

	test("forward button navigates to next page after going back", async ({ page }) => {
		// Open help window
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').click();

		// Navigate to two different pages
		await page.locator(".help-contents .item").nth(1).click();
		await page.waitForTimeout(500);
		await page.locator(".help-contents .item").nth(2).click();
		await page.waitForTimeout(500);

		// Go back
		const backButton = page.locator('button[title="Back"]');
		await backButton.click();
		await page.waitForTimeout(500);

		// Forward button should be enabled
		const forwardButton = page.locator('button[title="Forward"]');
		await expect(forwardButton).toBeEnabled();

		// Click forward
		await forwardButton.click();

		// Should navigate forward
		await expect(forwardButton).toBeDisabled();
	});

	test("escape key closes help window", async ({ page }) => {
		// Open help window
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').click();

		// Verify window is open
		const helpWindow = page.locator(".help-window");
		await expect(helpWindow).toBeVisible();

		// Press Escape
		await page.keyboard.press("Escape");

		// Window should be closed
		await expect(helpWindow).not.toBeVisible();
	});

	test("close button closes help window", async ({ page }) => {
		// Open help window
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').click();

		// Click close button
		const closeButton = page.locator(".help-window .window-close-button");
		await closeButton.click();

		// Window should be closed
		const helpWindow = page.locator(".help-window");
		await expect(helpWindow).not.toBeVisible();
	});

	test("help window is draggable", async ({ page }) => {
		// Open help window
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').click();

		// Get initial position
		const helpWindow = page.locator(".help-window");
		const initialBox = await helpWindow.boundingBox();
		if (!initialBox) throw new Error("Help window not found");

		// Drag titlebar
		const titlebar = helpWindow.locator(".window-titlebar");
		await titlebar.hover();
		await page.mouse.down();
		await page.mouse.move(initialBox.x + 100, initialBox.y + 50);
		await page.mouse.up();

		// Window should have moved
		const newBox = await helpWindow.boundingBox();
		if (!newBox) throw new Error("Help window not found after drag");
		expect(newBox.x).not.toBe(initialBox.x);
		expect(newBox.y).not.toBe(initialBox.y);
	});

	test("help window is resizable", async ({ page }) => {
		// Open help window
		const helpMenu = page.locator('button:has-text("Help")');
		await helpMenu.click();
		await page.locator('text="Help Topics"').click();

		// Get initial size
		const helpWindow = page.locator(".help-window");
		const initialBox = await helpWindow.boundingBox();
		if (!initialBox) throw new Error("Help window not found");

		// Drag resize handle (southeast corner)
		const resizeHandle = helpWindow.locator(".resize-se");
		const handleBox = await resizeHandle.boundingBox();
		if (!handleBox) throw new Error("Resize handle not found");

		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
		await page.mouse.down();
		await page.mouse.move(handleBox.x + 100, handleBox.y + 100);
		await page.mouse.up();

		// Window should be larger
		const newBox = await helpWindow.boundingBox();
		if (!newBox) throw new Error("Help window not found after resize");
		expect(newBox.width).toBeGreaterThan(initialBox.width);
		expect(newBox.height).toBeGreaterThan(initialBox.height);
	});
});
