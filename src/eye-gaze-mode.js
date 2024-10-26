// @ts-check
// eslint-disable-next-line no-unused-vars
/* global pointers:writable */
/* global $Window, main_canvas, pointer_active, selected_tool, TrackyMouse */
import { undo } from "./functions.js";
import { $G, load_image_simple } from "./helpers.js";
import { TOOL_CURVE, TOOL_FILL, TOOL_MAGNIFIER, TOOL_PICK_COLOR, TOOL_POLYGON } from "./tools.js";

let clean_up_eye_gaze_mode = () => { };
$G.on("eye-gaze-mode-toggled", () => {
	if ($("body").hasClass("eye-gaze-mode")) {
		init_eye_gaze_mode();
	} else {
		clean_up_eye_gaze_mode();
	}
});
if ($("body").hasClass("eye-gaze-mode")) {
	// #region Initialization (continued; marking stuff that ideally should be at the end of the file)
	init_eye_gaze_mode();
	// #endregion
}

const dwell_clicker_config = {
	targets: `
		button:not([disabled]),
		input,
		textarea,
		label,
		a,
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

// Tracky Mouse provides head tracking. https://trackymouse.js.org/
// To enable Tracky Mouse, you must currently:
// - toggle `enable_tracky_mouse_ui` to true
// - add `blob:` to the `script-src` directive of the Content-Security-Policy in index.html,
//   as clmtrackr loads a Worker with a blob URL
// For introducing head tracking as a feature (with the Tracky Mouse UI),
// there's still UI/UX concerns like providing a way to disable it separately from eye gaze mode,
// and the minimized window overlapping the floating buttons.
// Terminologically, I'm not sure what to call the superset of eye gaze mode and head tracking.
// - "Coarse Input Mode"? Sounds rough, and probably unclear.
// - "Hands-Free Mode"? Although that could also refer to voice commands. Which are also supported.
// - "Head Input Mode"/"Head Tracking Mode"? Technically your eyes are part of your head...
// - "Face Mouse Mode"/"Facial Mouse Mode"? Maybe!
// I might want to separate it into "Enlarge Interface", "Dwell Clicking", "Head Tracking", and (already split out) "Vertical Color Box".
// Or "Enlarge UI" and "Tracky Mouse", which would open up a window which would control dwell clicking and head tracking.
// (I can maintain backwards compatibility with the #eye-gaze-mode URL fragment, breaking it up into the new settings.)
var enable_tracky_mouse_ui = false;
var tracky_mouse_deps_promise;

async function init_eye_gaze_mode() {
	await new Promise((resolve) => $(resolve)); // wait for document ready so app UI is appended before eye gaze mode UI
	if (enable_tracky_mouse_ui) {
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

		TrackyMouse.init(tracky_mouse_container);
		TrackyMouse.useCamera();

		$tracky_mouse_window.center();

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

	}

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

	// (TODO: disable hovering to open submenus in eye gaze mode)

	const dwell_clicker = TrackyMouse.initDwellClicking(dwell_clicker_config);

	const $floating_buttons =
		$("<div class='eye-gaze-mode-floating-buttons'/>")
			.appendTo("body");

	$("<button title='Undo' class='eye-gaze-mode-undo-button'/>")
		.on("click", undo)
		.appendTo($floating_buttons)
		.append(
			$("<div class='button-icon'>")
		);

	// These are matched on exactly, for code that provides speech command synonyms
	const pause_button_text = "Pause Dwell Clicking";
	const resume_button_text = "Resume Dwell Clicking";

	const $pause_button = $(`<button class="toggle-dwell-clicking"/>`)
		.attr("title", pause_button_text)
		.on("click", () => {
			dwell_clicker.paused = !dwell_clicker.paused;
			$("body").toggleClass("eye-gaze-mode-paused", dwell_clicker.paused);
			$pause_button.attr("title", dwell_clicker.paused ? resume_button_text : pause_button_text);
		})
		.appendTo($floating_buttons)
		.append(
			$("<div class='button-icon'>")
		);

	clean_up_eye_gaze_mode = () => {
		console.log("Cleaning up / disabling eye gaze mode");
		$floating_buttons.remove();
		TrackyMouse.cleanupDwellClicking();
		clean_up_eye_gaze_mode = () => { };
	};
}
