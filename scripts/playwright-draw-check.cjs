const { chromium } = require("playwright");

(async () => {
	const url = process.argv[2] || "http://localhost:2000/new/";
	const browser = await chromium.launch();
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: "networkidle" });

	// Ensure the app has mounted and the canvas exists.
	const canvas = page.locator("canvas.main-canvas");
	await canvas.waitFor({ state: "visible" });

	// Attach a simple event probe in the page context
	await page.evaluate(() => {
		window.__mcpaintProbe = { pointerDown: 0, pointerMove: 0 };
		const c = document.querySelector("canvas.main-canvas");
		if (c) {
			c.addEventListener("pointerdown", () => window.__mcpaintProbe.pointerDown++);
			c.addEventListener("pointermove", () => window.__mcpaintProbe.pointerMove++);
		}
	});

	const env = await page.evaluate(() => {
		const main = document.querySelector("canvas.main-canvas");
		const overlay = document.querySelector("canvas.selection-overlay");
		const selectedToolTitles = Array.from(document.querySelectorAll(".tools .tool.selected")).map((el) =>
			(el.getAttribute("title") || "").trim(),
		);
		const readStyle = (el) => {
			if (!el) return null;
			const s = getComputedStyle(el);
			return {
				display: s.display,
				visibility: s.visibility,
				opacity: s.opacity,
				pointerEvents: s.pointerEvents,
				zIndex: s.zIndex,
				backgroundColor: s.backgroundColor,
				transform: s.transform,
				transformOrigin: s.transformOrigin,
			};
		};
		return {
			selectedToolTitles,
			main: {
				w: main ? main.width : null,
				h: main ? main.height : null,
				cssW: main ? getComputedStyle(main).width : null,
				cssH: main ? getComputedStyle(main).height : null,
				style: readStyle(main),
			},
			overlay: {
				exists: !!overlay,
				w: overlay ? overlay.width : null,
				h: overlay ? overlay.height : null,
				style: readStyle(overlay),
			},
			body: readStyle(document.body),
		};
	});
	console.log("env", env);

	const box = await canvas.boundingBox();
	if (!box) throw new Error("No canvas bounding box");

	const sample = async (selector, x, y) => {
		return await page.evaluate(
			({ selector, x, y }) => {
				const c = document.querySelector(selector);
				if (!c) return { err: "no canvas" };
				const ctx = c.getContext("2d", { willReadFrequently: true });
				if (!ctx) return { err: "no ctx" };
				const d = ctx.getImageData(x, y, 1, 1).data;
				return { r: d[0], g: d[1], b: d[2], a: d[3] };
			},
			{ selector, x, y },
		);
	};

	const px = 20;
	const py = 20;
	const beforeMain = await sample("canvas.main-canvas", px, py);
	const beforeOverlay = await sample("canvas.selection-overlay", px, py);
	console.log("pixel before main", beforeMain);
	console.log("pixel before overlay", beforeOverlay);

	const startX = box.x + px;
	const startY = box.y + py;

	// 1) Single click (should make a dot for pencil/brush/eraser)
	await page.mouse.click(startX, startY);
	await page.waitForTimeout(50);

	const afterClickMain = await sample("canvas.main-canvas", px, py);
	const afterClickOverlay = await sample("canvas.selection-overlay", px, py);
	console.log("pixel after click main", afterClickMain);
	console.log("pixel after click overlay", afterClickOverlay);

	// 2) Drag (should draw a line/trail)
	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(startX + 50, startY, { steps: 10 });
	await page.mouse.up();
	await page.waitForTimeout(50);

	const probe = await page.evaluate(() => window.__mcpaintProbe || null);
	console.log("event probe", probe);

	const afterDragMain = await sample("canvas.main-canvas", px, py);
	const afterDragOverlay = await sample("canvas.selection-overlay", px, py);
	console.log("pixel after drag main", afterDragMain);
	console.log("pixel after drag overlay", afterDragOverlay);

	await page.screenshot({ path: "playwright-draw-check.png", fullPage: true });
	console.log("screenshot saved playwright-draw-check.png");

	await browser.close();
})();
