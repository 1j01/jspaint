// This script copies inkscape:label attributes from one SVG to another.
// I have SVGs with ids that correspond because they're tweaked copies of the same SVG.
// I added labels to the first SVG, and wanted to copy them to the second SVG.
// First I tried a proper XML approach, but whitespace wasn't preserved,
// even when using a library that claims to preserve it. (Maybe this feature only works with JSDOM? I don't know.)
// Regex is fragile, but it's a quick way to get a very readable diff.

// // import { default as XMLSerializer } from "https://cdn.skypack.dev/@teclone/xml-serializer@1.3.0/build/esm/main.js";

// async function fetchSVG(url) {
// 	const response = await fetch(url);
// 	const text = await response.text();
// 	const parser = new DOMParser();
// 	return parser.parseFromString(text, "image/svg+xml");
// }

// async function applyLabels() {
// 	const svgDoc1 = await fetchSVG("images/modern/tools-dark.svg");
// 	const svgDoc2 = await fetchSVG("images/modern/tools.svg");

// 	// Find all elements with inkscape:label
// 	const labeledElements = svgDoc1.querySelectorAll("[inkscape\\:label]");

// 	// Apply labels from first SVG to corresponding elements in the second SVG
// 	labeledElements.forEach(labeledElement => {
// 		const id = labeledElement.getAttribute("id");
// 		const element = svgDoc2.getElementById(id);
// 		if (element) {
// 			element.setAttribute("inkscape:label", labeledElement.getAttribute("inkscape:label"));
// 		}
// 	});

// 	// Output the resulting XML
// 	const serializer = new XMLSerializer(true);
// 	// const resultXML = serializer.serializeToString(svgDoc2.documentElement);
// 	const resultXML = serializer.serializeToString(svgDoc2);
// 	return resultXML;
// }

// applyLabels();

async function fetchSVGText(url) {
	const response = await fetch(url);
	const text = await response.text();
	return text.replace(/<!-- Code injected by live-server -->[\s\S]*<\/script>\n?/m, "");
}

async function applyLabels(sourceURL, targetURL) {
	const sourceSVG = await fetchSVGText(sourceURL);
	let targetSVG = await fetchSVGText(targetURL);

	// Find all elements with inkscape:label
	const labeledOpeningTags = sourceSVG.match(/<[^>]+\sinkscape:label="([^"]+)"[^>]*>/g) || [];

	// Apply labels from first SVG to corresponding elements in the second SVG
	for (const labeledOpeningTag of labeledOpeningTags) {
		const label = labeledOpeningTag.match(/inkscape:label="([^"]+)"/)[1];
		const idMatch = labeledOpeningTag.match(/id="([^"]+)"/);
		if (idMatch) {
			const id = idMatch[1];
			const regex = new RegExp(`<[^>]+id="${id}"[^>]*>`);
			targetSVG = targetSVG.replace(regex, (match) => {
				if (match.includes("inkscape:label")) {
					return match.replace(/inkscape:label="[^"]+"/, `inkscape:label="${label}"`);
				} else {
					return match.replace(/(\s*)(\/?)>$/, (match, whitespace, slash) =>
						`${whitespace || " "}inkscape:label="${label}"${slash}>`
					);
				}
			});
		}
	}

	// Output the resulting XML
	return targetSVG;
}

console.log(await applyLabels("images/modern/tools-dark.svg", "images/modern/tools.svg"));