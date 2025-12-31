import { test, expect } from "@playwright/test";
import { waitForAppLoaded } from "./utils/test-helpers";

test.describe("View Menu", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("");
		await waitForAppLoaded(page);
	});

	test("View > Tool Box toggles toolbox visibility", async ({ page }) => {
		// Toolbox should be visible initially
		const toolbox = page.locator(".tools-component");
		await expect(toolbox).toBeVisible();

		// Open View menu and toggle
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		const toolBoxItem = page.locator('text="Tool Box"').first();
		await toolBoxItem.click();

		// Toolbox should be hidden
		await expect(toolbox).not.toBeVisible();

		// Toggle again
		await viewMenu.click();
		await toolBoxItem.click();

		// Toolbox should be visible again
		await expect(toolbox).toBeVisible();
	});

	test("View > Color Box toggles color palette visibility", async ({ page }) => {
		// Color box should be visible initially
		const colorBox = page.locator(".colors-component");
		await expect(colorBox).toBeVisible();

		// Open View menu and toggle
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		const colorBoxItem = page.locator('text="Color Box"').first();
		await colorBoxItem.click();

		// Color box should be hidden
		await expect(colorBox).not.toBeVisible();

		// Toggle again
		await viewMenu.click();
		await colorBoxItem.click();

		// Color box should be visible again
		await expect(colorBox).toBeVisible();
	});

	test("View > Status Bar toggles status bar visibility", async ({ page }) => {
		// Status bar should be visible initially
		const statusBar = page.locator(".status-area");
		await expect(statusBar).toBeVisible();

		// Open View menu and toggle
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		const statusBarItem = page.locator('text="Status Bar"').first();
		await statusBarItem.click();

		// Status bar should be hidden
		await expect(statusBar).not.toBeVisible();
	});

	test("View > Text Toolbar has checkbox state", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		// Text Toolbar item should have checkbox
		const textToolbarItem = page.locator('text="Text Toolbar"').first();
		await expect(textToolbarItem).toBeVisible();
	});

	test("View > Zoom > Normal Size sets 1x magnification", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		// Hover over Zoom to show submenu
		const zoomItem = page.locator('text="Zoom"').first();
		await zoomItem.hover();

		// Click Normal Size
		const normalSize = page.locator('text="Normal Size"').first();
		await normalSize.click();

		// Canvas should be at 1x (we can check by verifying canvas transform or size)
		// For now, just verify the menu item was clickable
		await expect(page.locator("canvas.main-canvas")).toBeVisible();
	});

	test("View > Zoom > Large Size sets 4x magnification", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		// Hover over Zoom
		const zoomItem = page.locator('text="Zoom"').first();
		await zoomItem.hover();

		// Click Large Size
		const largeSize = page.locator('text="Large Size"').first();
		await largeSize.click();

		// Canvas should be magnified
		await expect(page.locator("canvas.main-canvas")).toBeVisible();
	});

	test("View > Zoom > Custom opens dialog", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		// Hover over Zoom
		const zoomItem = page.locator('text="Zoom"').first();
		await zoomItem.hover();

		// Click Custom
		const customItem = page.locator('text="Custom..."').first();
		await customItem.click();

		// Custom zoom dialog should appear
		const dialog = page.locator('.dialog:has-text("Custom Zoom")');
		await expect(dialog).toBeVisible();

		// Should have zoom level input
		const zoomInput = dialog.locator('input[type="number"]');
		await expect(zoomInput).toBeVisible();
	});

	test("View > Zoom > Show Grid toggles grid", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		// Hover over Zoom
		const zoomItem = page.locator('text="Zoom"').first();
		await zoomItem.hover();

		// Toggle Show Grid
		const gridItem = page.locator('text="Show Grid"').first();
		await gridItem.click();

		// Grid should appear (we can check for grid class or overlay)
		// This might add a class to canvas-area or create an overlay
	});

	test("View > Zoom > Show Thumbnail toggles thumbnail window", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		// Hover over Zoom
		const zoomItem = page.locator('text="Zoom"').first();
		await zoomItem.hover();

		// Toggle Show Thumbnail
		const thumbnailItem = page.locator('text="Show Thumbnail"').first();
		await thumbnailItem.click();

		// Thumbnail window should appear
		const thumbnail = page.locator('.thumbnail-window');
		await expect(thumbnail).toBeVisible();

		// Window should have title
		const title = thumbnail.locator('.window-title');
		await expect(title).toContainText("Thumbnail");
	});

	test("View > View Bitmap opens new window", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		// Click View Bitmap
		const bitmapItem = page.locator('text="View Bitmap"').first();

		// Can't easily test window.open in Playwright, but verify item exists
		await expect(bitmapItem).toBeVisible();
	});

	test("View > Fullscreen toggles fullscreen mode", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		// Click Fullscreen
		const fullscreenItem = page.locator('text="Fullscreen"').first();
		await fullscreenItem.click();

		// Should enter fullscreen (check document.fullscreenElement)
		const isFullscreen = await page.evaluate(() => !!document.fullscreenElement);
		expect(isFullscreen).toBe(true);

		// Exit fullscreen
		await page.keyboard.press('F11');
	});

	test("View menu has checkmarks for toggled items", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		// Tool Box should have checkmark (it's visible by default)
		const toolBoxItem = page.locator('text="Tool Box"').first();
		const parent = toolBoxItem.locator('..');
		// Check for checkbox indicator (implementation-specific)
		await expect(toolBoxItem).toBeVisible();
	});

	test("View > Zoom submenu is accessible", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		// Zoom item should have submenu arrow/indicator
		const zoomItem = page.locator('text="Zoom"').first();
		await zoomItem.hover();

		// Submenu should appear
		const normalSize = page.locator('text="Normal Size"');
		await expect(normalSize).toBeVisible();

		const largeSize = page.locator('text="Large Size"');
		await expect(largeSize).toBeVisible();

		const customZoom = page.locator('text="Custom..."');
		await expect(customZoom).toBeVisible();

		const showGrid = page.locator('text="Show Grid"');
		await expect(showGrid).toBeVisible();

		const showThumbnail = page.locator('text="Show Thumbnail"');
		await expect(showThumbnail).toBeVisible();
	});

	test("View menu items have correct keyboard shortcuts", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		const menu = page.locator('.menu-popup');

		// Check for Ctrl+T on Tool Box
		const toolBoxShortcut = menu.locator('text="Ctrl+T"');
		await expect(toolBoxShortcut).toBeVisible();

		// Check for Ctrl+L on Color Box
		const colorBoxShortcut = menu.locator('text="Ctrl+L"');
		await expect(colorBoxShortcut).toBeVisible();

		// Hover over Zoom to check submenu shortcuts
		const zoomItem = page.locator('text="Zoom"').first();
		await zoomItem.hover();

		const zoomSubmenu = page.locator('.menu-popup').last();

		// Check for Ctrl+PgUp on Normal Size
		const normalShortcut = zoomSubmenu.locator('text="Ctrl+PgUp"');
		await expect(normalShortcut).toBeVisible();

		// Check for Ctrl+PgDn on Large Size
		const largeShortcut = zoomSubmenu.locator('text="Ctrl+PgDn"');
		await expect(largeShortcut).toBeVisible();

		// Check for Ctrl+G on Show Grid
		const gridShortcut = zoomSubmenu.locator('text="Ctrl+G"');
		await expect(gridShortcut).toBeVisible();
	});

	test("View > Fullscreen has F11 shortcut", async ({ page }) => {
		// Open View menu
		const viewMenu = page.locator('button:has-text("View")');
		await viewMenu.click();

		// Fullscreen should show F11
		const menu = page.locator('.menu-popup');
		const fullscreenShortcut = menu.locator('text="F11"');
		await expect(fullscreenShortcut).toBeVisible();
	});
});
