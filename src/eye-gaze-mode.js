// @ts-check
// eslint-disable-next-line no-unused-vars
/* global pointers:writable */
/* global $Window, main_canvas, pointer_active, selected_tool, TrackyMouse */
import { change_url_param, undo } from "./functions.js";
import { $G, load_image_simple } from "./helpers.js";
import { TOOL_CURVE, TOOL_FILL, TOOL_MAGNIFIER, TOOL_PICK_COLOR, TOOL_POLYGON } from "./tools.js";

// Tracky Mouse provides dwell clicking and head tracking features.
// https://trackymouse.js.org/

// TODO: for introducing head tracking as a feature (with the Tracky Mouse UI):
// - Fix the minimized window overlapping the floating buttons.
//   - Probably best to put it in the top right corner. Although, on phones, it may cover the Extras menu...
//   - Should I make a minimize target (AKA taskbar button) for it? Probably; it would be easier, since I have an API for that whereas the taskbar-less minimization behavior is hardcoded.
// - Sliders are kinda broken:
//   - visually (min/max labels overlap slider)
//   - functionally (can't click the slider except on the sliver of it that's literally visually part of it; dwell clicker may retarget from control label to slider, but not in a way that sets the value)


let dwell_clicker = { paused: false, dispose: () => { } };

let clean_up_dwell_clicker = () => { };
$G.on("dwell-clicker-toggled", () => {
	if ($("body").hasClass("dwell-clicker-mode")) {
		init_dwell_clicker();
	} else {
		clean_up_dwell_clicker();
	}
});
if ($("body").hasClass("dwell-clicker-mode")) {
	// #region Initialization (continued; marking stuff that ideally should be at the end of the file)
	init_dwell_clicker();
	// #endregion
}

let clean_up_tracky_mouse_ui = () => { };
$G.on("head-tracker-toggled", () => {
	if ($("body").hasClass("head-tracker-mode")) {
		init_tracky_mouse_ui();
	} else {
		clean_up_tracky_mouse_ui();
	}
});
if ($("body").hasClass("head-tracker-mode")) {
	// #region Initialization (continued; marking stuff that ideally should be at the end of the file)
	init_tracky_mouse_ui();
	// #endregion
}

const dwell_clicker_config = {
	targets: `
		button:not([disabled]),
		input,
		textarea,
		label,
		a,
		details summary,
		.flip-and-rotate .sub-options .radio-wrapper,
		.current-colors,
		.color-button,
		.edit-colors-window .swatch,
		.edit-colors-window .rainbow-canvas,
		.edit-colors-window .luminosity-canvas,
		.tool:not(.selected),
		.chooser-option,
		.menu-button:not(.active),
		.menu-item,
		.main-canvas,
		.selection canvas,
		.handle,
		.grab-region,
		.window:not(.maximized) .window-titlebar,
		.history-entry
	`,
	noCenter: (target) => (
		target.matches(`
			.main-canvas,
			.selection canvas,
			.window-titlebar,
			.rainbow-canvas,
			.luminosity-canvas,
			input[type="range"]
		`)
	),
	retarget: [
		// Nudge hovers near the edges of the canvas onto the canvas
		{ from: ".canvas-area", to: ".main-canvas", withinMargin: 50 },
		// Top level menus are just immediately switched between for now.
		// Prevent awkward hover clicks on top level menu buttons while menus are open.
		{
			from: (target) => (
				(target.closest(".menu-button") || target.matches(".menu-container")) &&
				document.querySelector(".menu-button.active") != null
			),
			to: null,
		},
		// Can we make it easier to click on help topics with short names?
		// { from: ".help-window li", to: (target) => target.querySelector(".item")},
	],
	isEquivalentTarget: (apparent_hover_target, hover_target) => (
		apparent_hover_target.closest("label") === hover_target ||
		apparent_hover_target.closest(".radio-wrapper") === hover_target
	),
	dwellClickEvenIfPaused: (target) => (
		target.matches(".toggle-dwell-clicking")
	),
	shouldDrag: (target) => (
		target.matches(".window-titlebar, .window-titlebar *:not(button)") ||
		target.matches(".selection, .selection *, .handle, .grab-region") ||
		(
			target === main_canvas &&
			selected_tool.id !== TOOL_PICK_COLOR &&
			selected_tool.id !== TOOL_FILL &&
			selected_tool.id !== TOOL_MAGNIFIER &&
			selected_tool.id !== TOOL_POLYGON &&
			selected_tool.id !== TOOL_CURVE
		)
	),
	isHeld: () => pointer_active,
	click: ({ target, x, y }) => {
		if (target.matches("button:not(.toggle)")) {
			target.style.borderImage = "var(--inset-deep-border-image)";
			setTimeout(() => {
				target.style.borderImage = "";
				// delay the button.click() as well, so the pressed state is
				// visible even if the button closes a dialog
				window.untrusted_gesture = true;
				target.click();
				window.untrusted_gesture = false;
			}, 100);
		} else if (target.matches("input[type='range']")) {
			const rect = target.getBoundingClientRect();
			const vertical =
				target.getAttribute("orient") === "vertical" ||
				(getCurrentRotation(target) !== 0) ||
				rect.height > rect.width;
			const min = Number(target.min);
			const max = Number(target.max);
			const v = (
				vertical ?
					(y - rect.top) / rect.height :
					(x - rect.left) / rect.width
			) * (max - min) + min;
			target.value = v;
			window.untrusted_gesture = true;
			target.dispatchEvent(new Event("input", { bubbles: true }));
			target.dispatchEvent(new Event("change", { bubbles: true }));
			window.untrusted_gesture = false;
		} else {
			window.untrusted_gesture = true;
			target.click();
			if (target.matches("input, textarea")) {
				target.focus();
			}
			window.untrusted_gesture = false;
		}
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
				const [a, b] = tm.split("(")[1].split(")")[0].split(",").map(Number);
				return Math.round(Math.atan2(a, b) * (180 / Math.PI));
			}
			return 0;
		}
	},
	beforeDispatch: () => {
		window.untrusted_gesture = true;
	},
	afterDispatch: () => {
		window.untrusted_gesture = false;
	},
	beforePointerDownDispatch() {
		pointers = []; // prevent multi-touch panning
	},
	afterReleaseDrag() {
		pointers = []; // prevent multi-touch panning
	},
};

async function init_dwell_clicker() {
	await new Promise((resolve) => $(resolve)); // wait for document ready so app UI is appended before Dwell Clicker visuals

	// (TODO: disable hovering to open submenus (other than with dwell clicking) while Dwell Clicker is enabled?)

	dwell_clicker = TrackyMouse.initDwellClicking(dwell_clicker_config);

	update_floating_buttons();

	clean_up_dwell_clicker = () => {
		console.log("Cleaning up / disabling Dwell Clicker mode");
		dwell_clicker.dispose();
		update_floating_buttons();
		clean_up_dwell_clicker = () => { };
	};
}

var tracky_mouse_deps_promise;

async function init_tracky_mouse_ui() {
	await new Promise((resolve) => $(resolve)); // wait for document ready... maybe not needed here?
	// block for indentation to avoid confusing git diff
	{
		if (!tracky_mouse_deps_promise) {
			TrackyMouse.dependenciesRoot = "lib/tracky-mouse/core";
			tracky_mouse_deps_promise = TrackyMouse.loadDependencies();
		}
		await tracky_mouse_deps_promise;

		const $tracky_mouse_window = $Window({
			title: "Tracky Mouse",
			icon: await load_image_simple("images/tracky-mouse-16x16.png"),
		});
		$tracky_mouse_window.addClass("tracky-mouse-window");
		const tracky_mouse_container = $tracky_mouse_window.$content[0];

		const tracky_mouse_ui = TrackyMouse.init(tracky_mouse_container);
		TrackyMouse.useCamera();

		$tracky_mouse_window.center();

		const get_event_options = ({ x, y }) => {
			return {
				view: window, // needed for offsetX/Y calculation
				clientX: x,
				clientY: y,
				pointerId: 1234567890,
				pointerType: "mouse",
				isPrimary: true,
				bubbles: true,
				cancelable: true,
			};
		};

		let last_el_over;
		TrackyMouse.onPointerMove = (x, y) => {
			const target = document.elementFromPoint(x, y) || document.body;
			if (target !== last_el_over) {
				if (last_el_over) {
					window.untrusted_gesture = true;
					const event = new /*PointerEvent*/$.Event("pointerleave", Object.assign(get_event_options({ x, y }), {
						button: 0,
						buttons: 1,
						bubbles: false,
						cancelable: false,
					}));
					// last_el_over.dispatchEvent(event);
					$(last_el_over).trigger(event);
					window.untrusted_gesture = false;
				}
				window.untrusted_gesture = true;
				const event = new /*PointerEvent*/$.Event("pointerenter", Object.assign(get_event_options({ x, y }), {
					button: 0,
					buttons: 1,
					bubbles: false,
					cancelable: false,
				}));
				// target.dispatchEvent(event);
				$(target).trigger(event);
				window.untrusted_gesture = false;
				last_el_over = target;
			}
			window.untrusted_gesture = true;
			const event = new PointerEvent/*$.Event*/("pointermove", Object.assign(get_event_options({ x, y }), {
				button: 0,
				buttons: 1,
			}));
			target.dispatchEvent(event);
			// $(target).trigger(event);
			window.untrusted_gesture = false;
		};

		// tracky_mouse_container.querySelector(".tracky-mouse-canvas").classList.add("inset-deep");

		clean_up_tracky_mouse_ui = () => {
			console.log("Cleaning up / disabling Head Tracker mode");
			tracky_mouse_ui.dispose();
			if (!$tracky_mouse_window.closed) {
				$tracky_mouse_window.close();
			}
			clean_up_tracky_mouse_ui = () => { };
		};

		$tracky_mouse_window.on("closed", () => {
			change_url_param("head-tracker", false);
		});
	}
}
// TODO: move this to a separate file (note dependency on `dwell_clicker`)
let $floating_buttons = null;
async function update_floating_buttons() {
	await new Promise((resolve) => $(resolve)); // wait for document ready so app UI is appended before floating buttons

	$floating_buttons?.remove();
	if (!$("body").hasClass("easy-undo-mode")) {
		return;
	}

	$floating_buttons =
		$("<div class='floating-buttons'/>")
			.appendTo("body");

	$("<button title='Undo' class='floating-undo-button'/>")
		.on("click", undo)
		.appendTo($floating_buttons)
		.append(
			$("<div class='button-icon'>")
		);

	if ($("body").hasClass("dwell-clicker-mode")) {
		// These are matched on exactly, for code that provides speech command synonyms
		const pause_button_text = "Pause Dwell Clicking";
		const resume_button_text = "Resume Dwell Clicking";

		const $pause_button = $(`<button class="toggle-dwell-clicking"/>`)
			.attr("title", pause_button_text)
			.on("click", () => {
				dwell_clicker.paused = !dwell_clicker.paused;
				$("body").toggleClass("dwell-clicker-paused", dwell_clicker.paused);
				$pause_button.attr("title", dwell_clicker.paused ? resume_button_text : pause_button_text);
			})
			.appendTo($floating_buttons)
			.append(
				$("<div class='button-icon'>")
			);
	} else {
		// TODO: redo button (needs an icon)
		// $("<button title='Redo' class='floating-redo-button'/>")
		// 	.on("click", redo)
		// 	.appendTo($floating_buttons)
		// 	.append(
		// 		$("<div class='button-icon'>")
		// 	);
	}
}

$G.on("easy-undo-mode-toggled", update_floating_buttons);
