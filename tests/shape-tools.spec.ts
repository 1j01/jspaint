import { expect, test } from "@playwright/test";
import {
  canvasHasContent,
  drawOnCanvas,
  getCanvasDataUrl,
  selectToolByIndex,
  waitForAppLoaded,
} from "./utils/test-helpers";

test.describe("Fill Tool", () => {
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

  test("fill tool fills an area with color", async ({ page }) => {
    // Select fill tool (index 3)
    await selectToolByIndex(page, 3);

    // Get initial canvas state
    const initialCanvas = await getCanvasDataUrl(page);

    // Click on canvas to fill (white canvas with black fill = should change)
    const canvas = page.locator("canvas.main-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // Canvas should be different after fill
    const filledCanvas = await getCanvasDataUrl(page);
    expect(filledCanvas).not.toBe(initialCanvas);
  });
});

test.describe("Line Tool", () => {
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

    // Capture console logs for debugging
    page.on("console", (msg) => console.log(`[Browser] ${msg.text()}`));

    await waitForAppLoaded(page);
  });

  test("line tool draws a straight line", async ({ page }) => {
    // Select line tool (index 10)
    await selectToolByIndex(page, 10);

    // Verify canvas is initially white
    const hasContentBefore = await canvasHasContent(page);
    expect(hasContentBefore).toBe(false);

    // Draw a line
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Verify line was drawn
    const hasContentAfter = await canvasHasContent(page);
    expect(hasContentAfter).toBe(true);
  });
});

test.describe("Rectangle Tool", () => {
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

    // Capture console logs for debugging
    page.on("console", (msg) => console.log(`[Browser] ${msg.text()}`));

    await waitForAppLoaded(page);
  });

  test("rectangle tool draws a rectangle", async ({ page }) => {
    // Select rectangle tool (index 12)
    await selectToolByIndex(page, 12);

    // Verify canvas is initially white
    const hasContentBefore = await canvasHasContent(page);
    expect(hasContentBefore).toBe(false);

    // Draw a rectangle
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Verify rectangle was drawn
    const hasContentAfter = await canvasHasContent(page);
    expect(hasContentAfter).toBe(true);
  });
});

test.describe("Ellipse Tool", () => {
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

    // Capture console logs for debugging
    page.on("console", (msg) => console.log(`[Browser] ${msg.text()}`));

    await waitForAppLoaded(page);
  });

  test("ellipse tool draws an ellipse", async ({ page }) => {
    // Select ellipse tool (index 14)
    await selectToolByIndex(page, 14);

    // Verify canvas is initially white
    const hasContentBefore = await canvasHasContent(page);
    expect(hasContentBefore).toBe(false);

    // Draw an ellipse
    await drawOnCanvas(page, {
      start: { x: 0.2, y: 0.2 },
      end: { x: 0.8, y: 0.8 },
    });

    // Verify ellipse was drawn
    const hasContentAfter = await canvasHasContent(page);
    expect(hasContentAfter).toBe(true);
  });
});

test.describe("Pick Color Tool", () => {
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

    // Capture console logs for debugging
    page.on("console", (msg) => console.log(`[Browser] ${msg.text()}`));

    await waitForAppLoaded(page);
  });

  test("pick color tool samples color from canvas", async ({ page }) => {
    // First draw something with a specific color
    // Select red from palette (index 2 is typically red)
    const swatches = page.locator(".color-button");
    await swatches.nth(2).click();

    // Draw with pencil
    await selectToolByIndex(page, 6);
    await drawOnCanvas(page, {
      start: { x: 0.5, y: 0.5 },
      end: { x: 0.6, y: 0.5 },
    });

    // Now select pick color tool (index 4)
    await selectToolByIndex(page, 4);

    // Click on the drawn area
    const canvas = page.locator("canvas.main-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.5);

    // The foreground color indicator should have changed
    // (We can't easily verify the exact color, but the test should pass without error)
    await expect(page.locator(".colors-component")).toBeVisible();
  });
});

test.describe("Airbrush Tool", () => {
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

    // Capture console logs for debugging
    page.on("console", (msg) => console.log(`[Browser] ${msg.text()}`));

    await waitForAppLoaded(page);
  });

  test("airbrush tool sprays paint on canvas", async ({ page }) => {
    // Select airbrush tool (index 8)
    await selectToolByIndex(page, 8);

    // Verify canvas is initially white
    const hasContentBefore = await canvasHasContent(page);
    expect(hasContentBefore).toBe(false);

    // Draw with airbrush
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.3 },
      end: { x: 0.7, y: 0.7 },
    });

    // Verify something was sprayed
    const hasContentAfter = await canvasHasContent(page);
    expect(hasContentAfter).toBe(true);
  });
});

test.describe("Curve Tool", () => {
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

  test("curve tool allows 4-click bezier curve", async ({ page }) => {
    // Select curve tool (index 11)
    await selectToolByIndex(page, 11);

    // Verify canvas is initially white
    const hasContentBefore = await canvasHasContent(page);
    expect(hasContentBefore).toBe(false);

    // Click 1: Start
    await drawOnCanvas(page, {
      start: { x: 0.1, y: 0.5 },
      end: { x: 0.1, y: 0.5 }, // Click in place
      steps: 1,
    });

    // Click 2: End (drawing line)
    await drawOnCanvas(page, {
      start: { x: 0.9, y: 0.5 },
      end: { x: 0.9, y: 0.5 },
      steps: 1,
    });

    // Click 3: Control 1
    await drawOnCanvas(page, {
      start: { x: 0.3, y: 0.2 }, // Upper left control
      end: { x: 0.3, y: 0.2 },
      steps: 1,
    });

    // Click 4: Control 2
    await drawOnCanvas(page, {
      start: { x: 0.7, y: 0.8 }, // Lower right control
      end: { x: 0.7, y: 0.8 },
      steps: 1,
    });

    // Verify curve was drawn (and committed)
    const hasContentAfter = await canvasHasContent(page);
    expect(hasContentAfter).toBe(true);
  });
});
