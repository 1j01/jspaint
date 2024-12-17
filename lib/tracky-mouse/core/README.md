# Tracky Mouse API

## Introduction

Tracky Mouse is a simple, open-source API for head tracking and dwell clicking that you can add to any web application.

It includes a full user interface with a webcam view and settings, and the API lets you specify which elements to click, which to drag, which to treat as equivalent (e.g. form labels and the controls they label), and which to ignore.

The dwell clicker can also work independently of the head tracking, for use with external pointing devices, including eye trackers (which require similar UI concerns), and the Tracky Mouse desktop app, which can control your computer's mouse.
With the desktop app (also open source), users will be able to seamlessly upgrade to full computer control, without learning a new UI.

[✨👉 **Demo and more information on the Tracky Mouse website** 👈✨](https://trackymouse.js.org/)

## Installation

```bash
npm install tracky-mouse
```

## Usage

The library is currently script tag-based, so you'll need to add it to your HTML file.

```html
<script src="path/to/tracky-mouse/tracky-mouse.js"></script>
```

Then you have to tell it where it can load related files from.
Make sure not to include a trailing slash.

```javascript
TrackyMouse.dependenciesRoot = "path/to/tracky-mouse";
```

You also need to include the stylesheet, which is in the same directory as the script.

```html
<link rel="stylesheet" href="path/to/tracky-mouse/tracky-mouse.css">
```

## Head Tracking

Tracky Mouse makes it easy to set up head tracking,
but what you do with the movement data is a bit more complicated.

Generally, you'll want to simulate mouse/pointer events on the page,
and in the future the library should help you with this, but for now you'll have to do it yourself, by defining a callback `TrackyMouse.onPointerMove(x, y)`.

You can copy this code to get started:

```javascript
TrackyMouse.loadDependencies().then(function() {
	TrackyMouse.init();

	// Pointer event simulation logic should be built into tracky-mouse in the future.
	// These simulated events connect the Tracky Mouse head tracker to the Tracky Mouse dwell clicker,
	// as well as any other pointermove/pointerenter/pointerleave handlers on the page.
	const getEventOptions = ({ x, y }) => {
		return {
			view: window, // needed so the browser can calculate offsetX/Y from the clientX/Y
			clientX: x,
			clientY: y,
			pointerId: 1234567890, // a special value so other code can detect these simulated events
			pointerType: "mouse",
			isPrimary: true,
		};
	};
	let last_el_over = null;
	TrackyMouse.onPointerMove = (x, y) => {
		const target = document.elementFromPoint(x, y) || document.body;
		if (target !== last_el_over) {
			if (last_el_over) {
				const event = new PointerEvent("pointerleave", Object.assign(getEventOptions({ x, y }), {
					button: 0,
					buttons: 1,
					bubbles: false,
					cancelable: false,
				}));
				last_el_over.dispatchEvent(event);
			}
			const event = new PointerEvent("pointerenter", Object.assign(getEventOptions({ x, y }), {
				button: 0,
				buttons: 1,
				bubbles: false,
				cancelable: false,
			}));
			target.dispatchEvent(event);
			last_el_over = target;
		}
		const event = new PointerEvent("pointermove", Object.assign(getEventOptions({ x, y }), {
			button: 0,
			buttons: 1,
			bubbles: true,
			cancelable: true,
		}));
		target.dispatchEvent(event);
	};
});
```

### `TrackyMouse.dependenciesRoot`

Set this to the path to the folder where you installed tracky-mouse, without a trailing slash.

### `TrackyMouse.loadDependencies([options])`

This loads dependencies needed *for head tracking*. (It is not needed for dwell clicking.)

If you pass an options object, it can have the following properties:
- `statsJs` (optional): a boolean, whether to load stats.js for performance monitoring. Default is `false`.

Returns a promise that resolves when the dependencies are loaded.

### `TrackyMouse.init([element, options])`

`TrackyMouse.init` initializes the library *for head tracking*. (It is not needed for dwell clicking.)

It creates the UI, either creating a new `<div class="tracky-mouse-ui">` element and appending it to the `<body>`,
or using, and modifying, and existing element.

If you pass an element, it should be an empty `<div>` element.
It will add `class="tracky-mouse-ui"` directly to the element if it doesn't already have it.

If you pass an options object, it can have the following properties:
- `statsJs` (optional): a boolean, whether to include the stats.js performance monitor. Default is `false`.

Returns an object with a `dispose` method that you can call to remove the UI and clean up the web worker and camera stream.

*(Search keywords: disposal, destroy, teardown, cleanup, clean-up, clean up, deinitialize, de-initialize, remove, stop, end)* - see return value

### `TrackyMouse.useCamera()`

This requests permission to use the camera, and starts the camera stream.

This is optional, and you can instead let the user click the big "Allow Camera Access" button.

### `TrackyMouse.onPointerMove(x, y)`

This is the callback that you need to define to simulate pointer movement.

`x` and `y` are the current mouse position, in pixels.

## Dwell Clicking

### `TrackyMouse.initDwellClicking(config)`

This starts up the dwell clicker.

Arguments:
- `config.targets` (required): a CSS selector for the elements to click. Anything else will be ignored.
- `config.shouldDrag(el)` (optional): a function that returns true if the element should be dragged rather than simply clicked.
- `config.noCenter(el)` (optional): a function that returns true if the element should be clicked anywhere on the element, rather than always at the center.
- `config.retarget` (optional): an array of `{ from, to, withinMargin }` objects, which define rules for dynamically changing what is hovered/clicked when the mouse is over a different element.
	- `from` (required): the element to retarget from. Can be a CSS selector, an element, or a function taking the element under the mouse and returning whether it should be retargeted.
	- `to` (required): the element to retarget to. Can be a CSS selector for an element which is an ancestor or descendant of the `from` element, or an element, or a function taking the element under the mouse and returning an element to retarget to, or null to ignore the element.
	- `withinMargin` (optional): a number of pixels within which to consider the mouse over the `to` element. Default to infinity.
- `config.isEquivalentTarget(el1, el2)` (optional): a function that returns true if two elements should be considered part of the same control, i.e. if clicking either should do the same thing. Elements that are equal are always considered equivalent even if you return false. This option is used for preventing the system from detecting occluding elements as separate controls, and rejecting the click. (When an occlusion is detected, it flashes a red box.)
- `config.dwellClickEvenIfPaused(el)` (optional): a function that returns true if the element should be clicked even while dwell clicking is otherwise paused. Use this for a dwell clicking toggle button, so it's possible to resume dwell clicking. With dwell clicking it's important to let users take a break, since otherwise you have to constantly move the cursor in order to not click on things!
- `config.click({x, y, target})` (required): a function to trigger a click on the given target element.
- `config.beforeDispatch()` (optional): a function to call before a pointer event is dispatched. For detecting un-trusted user gestures, outside of an event handler.
- `config.afterDispatch()` (optional): a function to call after a pointer event is dispatched. For detecting un-trusted user gestures, outside of an event handler.
- `config.beforePointerDownDispatch()` (optional): a function to call before a `pointerdown` event is dispatched. Likely to be merged with `config.beforeDispatch()` in the future.
- `config.afterReleaseDrag()` (optional): a function to call after a drag is released. May be merged with `config.afterDispatch()` in the future.

Returns an object with the following properties:
- `paused`: a getter/setter for whether dwell clicking is paused. Use this to implement a pause/resume button, in conjunction with `config.dwellClickEvenIfPaused`.
- `dispose`: a method to clean up the dwell clicker.  
  *(Search keywords: disposal, destroy, teardown, cleanup, clean-up, clean up, deinitialize, de-initialize, remove, stop, end)*

Example:
```javascript
// This example is based off of how JS Paint uses the Tracky Mouse API.
// It's simplified a bit, but includes various settings.
const config = {
	// The elements to click. Anything else is ignored.
	targets: `
		button:not([disabled]),
		input,
		textarea,
		label,
		a,
		details summary,
		.radio-or-checkbox-wrapper,
		.drawing-canvas,
		.window:not(.maximized) .window-titlebar
	`,
	// Filter for elements to drag. They must be included in the targets first.
	shouldDrag: (target) => (
		target.matches(".window-titlebar") ||
		(target.matches(".drawing-canvas") && current_tool.supports_drag)
	),
	// Instead of clicking in the center of these elements, click at any point within the element.
	// This is useful for drag offsets, like for a window titlebar,
	// and position-based inputs like sliders or color pickers, or a drawing canvas.
	noCenter: (target) => (
		target.matches(`
			input[type="range"],
			.drawing-canvas,
			.window-titlebar
		`)
	),
	// Nudge hovers near the edges of an element onto the element itself,
	// to make it easier to click on the element.
	// More specifically it makes it easier to click on the edge of an element,
	// useful for a drawing canvas.
	retarget: [
		{ from: ".canvas-container", to: ".drawing-canvas", withinMargin: 50 },
	],
	// Elements that are equivalent are considered the same control.
	// This is useful for forms if you want the label of a radio button or checkbox
	// to be highlighted together with the radio button or checkbox.
	isEquivalentTarget: (apparent_hover_target, hover_target) => (
		apparent_hover_target.closest("label") === hover_target ||
		apparent_hover_target.closest(".radio-or-checkbox-wrapper") === hover_target
	),
	// Allow dwell clicking on a "Resume Dwell Clicking" button, while paused.
	dwellClickEvenIfPaused: (target) => (
		target.matches(".toggle-dwell-clicking-button")
	),
	// Define how to click on an element.
	click: ({ target, x, y }) => {
		if (target.matches("input[type='range']")) {
			// Special handling for sliders
			const rect = target.getBoundingClientRect();
			const vertical =
				target.getAttribute("orient") === "vertical" ||
				(getCurrentRotation(target) !== 0) ||
				rect.height > rect.width;
			const min = Number(target.min);
			const max = Number(target.max);
			target.value = (
				vertical ?
					(y - rect.top) / rect.height :
					(x - rect.left) / rect.width
			) * (max - min) + min;
			target.dispatchEvent(new Event("input", { bubbles: true }));
			target.dispatchEvent(new Event("change", { bubbles: true }));
		} else {
			// Normal click
			target.click();
			if (target.matches("input, textarea")) {
				target.focus();
			}
		}
	},
	// Handle untrusted gestures specially in external code.
	// Somewhere else, for example, you might do something like:
	// if (window.untrusted_gesture) {
	// 	// show download window
	// } else {
	// 	// show save file dialog with FS Access API
	// }
	// Recommended: use `event.isTrusted` instead, where possible.
	beforeDispatch: () => { window.untrusted_gesture = true; },
	afterDispatch: () => { window.untrusted_gesture = false; },
	// Some extra hooks for JS Paint, likely to be generalized in the future,
	// especially `beforePointerDownDispatch` which could be supplanted by passing an `Event` to `beforeDispatch`.
	beforePointerDownDispatch: () => { window.pointers = []; },
	afterReleaseDrag: () => { window.pointers = []; },
};
const dwellClicker = TrackyMouse.initDwellClicking(config);
// dwellClicker.paused = !dwellClicker.paused; // toggle
// dwellClicker.dispose(); // clean up

// Source: https://stackoverflow.com/a/54492696/2624876
function getCurrentRotation(el) {
	const st = window.getComputedStyle(el, null);
	const tm = st.getPropertyValue("-webkit-transform") ||
		st.getPropertyValue("-moz-transform") ||
		st.getPropertyValue("-ms-transform") ||
		st.getPropertyValue("-o-transform") ||
		st.getPropertyValue("transform") ||
		"none";
	if (tm !== "none") {
		const [a, b] = tm.split('(')[1].split(')')[0].split(',');
		return Math.round(Math.atan2(a, b) * (180 / Math.PI));
	}
	return 0;
}
```

### `TrackyMouse.cleanupDwellClicking()`

**Deprecated**: instead call `dispose()` on the object returned from `initDwellClicking()`.

This stops the dwell clicker.

## Changelog

For release notes, see [CHANGELOG.md](https://github.com/1j01/tracky-mouse/blob/main/CHANGELOG.md)

## License

[MIT License](https://github.com/1j01/tracky-mouse/blob/main/LICENSE.txt)

## Development

See [Development Setup](https://github.com/1j01/tracky-mouse#development-setup) in the main README.
