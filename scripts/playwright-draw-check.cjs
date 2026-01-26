const { chromium } = require("playwright");

(async () => {
	const url = process.argv[2] || "http://localhost:2000/new/";
	const browser = await chromium.launch();
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: "networkidle" });

	const canvas = page.locator("canvas.main-canvas");
	await canvas.waitFor({ state: "visible" });

	const box = await canvas.boundingBox();
	if (!box) throw new Error("No canvas bounding box");

	const sample = async (x, y) => {
		return await page.evaluate(
			({ x, y }) => {
				const c = document.querySelector("canvas.main-canvas");
				if (!c) return { err: "no canvas" };
				const ctx = c.getContext("2d", { willReadFrequently: true });
				if (!ctx) return { err: "no ctx" };
				const d = ctx.getImageData(x, y, 1, 1).data;
				return { r: d[0], g: d[1], b: d[2], a: d[3] };
			},
			{ x, y },
		);
	};

	const before = await sample(10, 10);
	console.log("pixel before", before);

	const startX = box.x + 20;
	const startY = box.y + 20;
	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(startX + 50, startY, { steps: 10 });
	await page.mouse.up();

	const after = await sample(10, 10);
	console.log("pixel after", after);

	await page.screenshot({ path: "playwright-draw-check.png", fullPage: true });
	console.log("screenshot saved playwright-draw-check.png");

	await browser.close();
})();
