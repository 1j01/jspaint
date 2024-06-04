

const svg = document.querySelector("svg");
const defs = svg.querySelector("defs");

let docGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
docGroup.append(...svg.childNodes);
svg.appendChild(docGroup);

var pt = svg.createSVGPoint();
var mouseDown = false;
svg.addEventListener("mousedown", function (_event) {
	mouseDown = true;
});
svg.addEventListener("mouseup", function (_event) {
	mouseDown = false;
});
svg.addEventListener("mousemove", function (event) {
	if (!mouseDown) return;

	pt.x = event.clientX;
	pt.y = event.clientY;
	var svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());

	const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	circle.setAttribute("cx", svgCoords.x);
	circle.setAttribute("cy", svgCoords.y);
	circle.setAttribute("r", 10);
	circle.setAttribute("fill", "red");
	docGroup.appendChild(circle);
});

svg.addEventListener("auxclick", function (event) {

	pt.x = event.clientX;
	pt.y = event.clientY;
	var svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());

	const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	rect.setAttribute("width", 100);
	rect.setAttribute("height", 100);
	rect.setAttribute("x", svgCoords.x);
	rect.setAttribute("y", svgCoords.y);
	// rect.setAttribute("fill", "white"); // why?

	const use = cutOut(rect);
	use.setAttribute("transform", "translate(50, 50)");
});
svg.addEventListener("contextmenu", function (event) {
	event.preventDefault();
});


let idCounter = 0;
/**
 * @param {SVGGeometryElement} clipShape
 * @returns {SVGUseElement}
 */
function cutOut(clipShape) {
	++idCounter;

	// <clipPath> for the selection
	const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
	const clipPathId = `clipPath${idCounter}`;
	clipPath.setAttribute("id", clipPathId);
	defs.appendChild(clipPath);
	clipPath.appendChild(clipShape);

	// <mask> for the remaining document
	const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
	const maskId = `mask${idCounter}`;
	mask.setAttribute("id", maskId);
	defs.appendChild(mask);

	const maskRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	maskRect.setAttribute("width", "100%");
	maskRect.setAttribute("height", "100%");
	maskRect.setAttribute("fill", "white");
	mask.appendChild(maskRect);

	const maskShape = clipShape.cloneNode(true);
	maskShape.setAttribute("fill", "black");
	maskShape.setAttribute("stroke", "none");
	mask.appendChild(maskShape);

	// keep track of the document contents before the operation
	const originalDocGroup = docGroup;
	const originalDocGroupId = `docGroup${idCounter}`;
	originalDocGroup.setAttribute("id", originalDocGroupId); // a little weird to do this here
	// wrap the original document in a masked group
	// (don't apply mask to the original group because we need to reference the unmasked content with <use>)
	const maskedGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
	maskedGroup.setAttribute("mask", "url(#" + maskId + ")");
	maskedGroup.append(originalDocGroup);
	// wrap the masked group in new group for new shapes to be drawn to
	// (so they are unaffected by a previous cut-out operation's mask)
	docGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
	docGroup.append(maskedGroup);
	svg.appendChild(docGroup);

	// <use> to display the cut-out selection
	const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
	use.setAttribute("href", "#" + originalDocGroupId);
	use.setAttribute("clip-path", "url(#" + clipPathId + ")");
	docGroup.appendChild(use);

	return use;
}
