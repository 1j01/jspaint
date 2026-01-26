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

	const pt = {
		x: box.x + Math.min(20, box.width / 2),
		y: box.y + Math.min(20, box.height / 2),
	};

	const info = await page.evaluate(({ x, y }) => {
		const el = document.elementFromPoint(x, y);
		const path = [];
		let cur = el;
		let depth = 0;
		while (cur && depth < 8) {
			path.push({
				tag: cur.tagName,
				id: cur.id || null,
				className: typeof cur.className === "string" ? cur.className : null,
				pointerEvents: getComputedStyle(cur).pointerEvents,
				zIndex: getComputedStyle(cur).zIndex,
			});
			cur = cur.parentElement;
			depth++;
		}

		const canvasEl = document.querySelector("canvas.main-canvas");
		return {
			point: { x, y },
			top: path[0] || null,
			path,
			hasTextBox: Boolean(document.querySelector(".on-canvas-object.textbox")),
			hasSelectionHandles: Boolean(document.querySelector(".selection-handle")),
			bodyClasses: document.body.className,
			canvas: canvasEl
				? {
					width: canvasEl.width,
					height: canvasEl.height,
					cssWidth: getComputedStyle(canvasEl).width,
					cssHeight: getComputedStyle(canvasEl).height,
					pe: getComputedStyle(canvasEl).pointerEvents,
				}
				: null,
		};
	}, pt);

	console.log(JSON.stringify(info, null, 2));
	await browser.close();
})();
