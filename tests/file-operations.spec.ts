import { expect, test } from "@playwright/test";
import {
    canvasHasContent,
    drawOnCanvas,
    selectToolByIndex,
    waitForAppLoaded
} from "./utils/test-helpers";

test.describe("File Operations", () => {
    test.beforeEach(async ({ page }) => {
        // Clear IndexedDB to ensure clean state
        await page.goto("");
        await page.evaluate(async () => {
            const dbs = await window.indexedDB.databases();
            for (const db of dbs) {
                if (db.name) window.indexedDB.deleteDatabase(db.name);
            }
        });
        await page.reload();
        await waitForAppLoaded(page);
    });

    test("New File clears canvas and history", async ({ page }) => {
        // 1. Draw something
        await selectToolByIndex(page, 6); // Pencil
        await drawOnCanvas(page, {
            start: { x: 0.5, y: 0.5 },
            end: { x: 0.6, y: 0.6 },
        });
        const hasContentBefore = await canvasHasContent(page);
        expect(hasContentBefore).toBe(true);

        // 2. Click File > New
        await page.click("text=File");
        await page.click("text=New");

        // 3. Handle confirmation dialog
        const dialog = page.locator(".message-box-window");
        await expect(dialog).toBeVisible();
        await dialog.locator("button", { hasText: "No" }).click();

        // 4. Verify canvas is white - wait for update
        // The checking logic might be fast, so we retry a few times or wait
        await page.waitForTimeout(100); // Allow requestAnimationFrame to fire
        
        // Wait for canvas to be clear
        await expect.poll(async () => {
            return await canvasHasContent(page);
        }, {
            message: 'Canvas should be empty after New File',
            timeout: 5000,
        }).toBe(false);

        // 5. Draw again to verify fresh state
        await drawOnCanvas(page, {
            start: { x: 0.2, y: 0.2 },
            end: { x: 0.3, y: 0.3 },
        });
        expect(await canvasHasContent(page)).toBe(true);

        // 6. Verify Undo is NOT available or clears to blank
        await page.keyboard.press("Control+z");
        // Wait for undo
        await page.waitForTimeout(100);
        
        // Check if back to blank
        expect(await canvasHasContent(page)).toBe(false); 

        // Try to undo again (should remain blank)
        await page.keyboard.press("Control+z");
        await page.waitForTimeout(100);
        expect(await canvasHasContent(page)).toBe(false);
    });
});
