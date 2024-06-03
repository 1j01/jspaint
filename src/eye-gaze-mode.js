// @ts-check
// eslint-disable-next-line no-unused-vars
/* global pointers:writable */
/* global $Window, average_points, main_canvas, pointer_active, selected_tool, TrackyMouse */
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

const eye_gaze_mode_config = {
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
};

// Tracky Mouse provides head tracking. https://trackymouse.js.org/
// To enable Tracky Mouse, you must currently:
// - toggle `enable_tracky_mouse` to true
// - uncomment tracky-mouse.js and tracky-mouse.css in index.html
// - add `'unsafe-eval' blob:` to the `script-src` directive of the Content-Security-Policy in index.html,
//   as clmtrackr uses eval().
// TODO: update Tracky Mouse; I actually created a tool to remove the need for eval in clmtrackr,
// so the next version shouldn't need 'unsafe-eval'.
// I also brought the dwell clicking code into Tracky Mouse, and it looks like I still need to update jspaint to use the library version.
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
var enable_tracky_mouse = false;
var tracky_mouse_deps_promise;

async function init_eye_gaze_mode() {
	await new Promise((resolve) => $(resolve)); // wait for document ready so app UI is appended before eye gaze mode UI
	if (enable_tracky_mouse) {
		if (!tracky_mouse_deps_promise) {
			TrackyMouse.dependenciesRoot = "lib/tracky-mouse";
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

	const circle_radius_max = 50; // dwell indicator size in pixels
	const hover_timespan = 500; // how long between the dwell indicator appearing and triggering a click
	const averaging_window_timespan = 500;
	const inactive_at_startup_timespan = 1500; // (should be at least averaging_window_timespan, but more importantly enough to make it not awkward when enabling eye gaze mode)
	const inactive_after_release_timespan = 1000; // after click or drag release (from dwell or otherwise)
	const inactive_after_hovered_timespan = 1000; // after dwell click indicator appears; does not control the time to finish that dwell click, only to click on something else after this is canceled (but it doesn't control that directly)
	const inactive_after_invalid_timespan = 1000; // after a dwell click is canceled due to an element popping up in front, or existing in front at the center of the other element
	const inactive_after_focused_timespan = 1000; // after page becomes focused after being unfocused
	let recent_points = [];
	let inactive_until_time = Date.now();
	let paused = false;
	let hover_candidate;
	let gaze_dragging = null;

	const deactivate_for_at_least = (timespan) => {
		inactive_until_time = Math.max(inactive_until_time, Date.now() + timespan);
	};
	deactivate_for_at_least(inactive_at_startup_timespan);

	const halo = document.createElement("div");
	halo.className = "hover-halo";
	halo.style.display = "none";
	document.body.appendChild(halo);
	const dwell_indicator = document.createElement("div");
	dwell_indicator.className = "dwell-indicator";
	dwell_indicator.style.width = `${circle_radius_max}px`;
	dwell_indicator.style.height = `${circle_radius_max}px`;
	dwell_indicator.style.display = "none";
	document.body.appendChild(dwell_indicator);

	const on_pointer_move = (e) => {
		recent_points.push({ x: e.clientX, y: e.clientY, time: Date.now() });
	};
	const on_pointer_up_or_cancel = () => {
		deactivate_for_at_least(inactive_after_release_timespan);
		gaze_dragging = null;
	};

	let page_focused = document.visibilityState === "visible"; // guess/assumption
	let mouse_inside_page = true; // assumption
	const on_focus = () => {
		page_focused = true;
		deactivate_for_at_least(inactive_after_focused_timespan);
	};
	const on_blur = () => {
		page_focused = false;
	};
	const on_mouse_leave_page = () => {
		mouse_inside_page = false;
	};
	const on_mouse_enter_page = () => {
		mouse_inside_page = true;
	};

	window.addEventListener("pointermove", on_pointer_move);
	window.addEventListener("pointerup", on_pointer_up_or_cancel);
	window.addEventListener("pointercancel", on_pointer_up_or_cancel);
	window.addEventListener("focus", on_focus);
	window.addEventListener("blur", on_blur);
	document.addEventListener("mouseleave", on_mouse_leave_page);
	document.addEventListener("mouseenter", on_mouse_enter_page);

	const get_hover_candidate = (clientX, clientY) => {

		if (!page_focused || !mouse_inside_page) return null;

		let target = document.elementFromPoint(clientX, clientY);
		if (!target) {
			return null;
		}

		let hover_candidate = {
			x: clientX,
			y: clientY,
			time: Date.now(),
		};

		let retargeted = false;
		for (const { from, to, withinMargin = Infinity } of eye_gaze_mode_config.retarget) {
			if (
				from instanceof Element ? from === target :
					typeof from === "function" ? from(target) :
						target.matches(from)
			) {
				const to_element =
					(to instanceof Element || to === null) ? to :
						typeof to === "function" ? to(target) :
							(target.closest(to) || target.querySelector(to));
				if (to_element === null) {
					return null;
				} else if (to_element) {
					const to_rect = to_element.getBoundingClientRect();
					if (
						hover_candidate.x > to_rect.left - withinMargin &&
						hover_candidate.y > to_rect.top - withinMargin &&
						hover_candidate.x < to_rect.right + withinMargin &&
						hover_candidate.y < to_rect.bottom + withinMargin
					) {
						target = to_element;
						hover_candidate.x = Math.min(
							to_rect.right - 1,
							Math.max(
								to_rect.left,
								hover_candidate.x,
							),
						);
						hover_candidate.y = Math.min(
							to_rect.bottom - 1,
							Math.max(
								to_rect.top,
								hover_candidate.y,
							),
						);
						retargeted = true;
					}
				}
			}
		}

		if (!retargeted) {
			target = target.closest(eye_gaze_mode_config.targets);

			if (!target) {
				return null;
			}
		}

		if (!eye_gaze_mode_config.noCenter(target)) {
			// Nudge hover previews to the center of buttons and things
			const rect = target.getBoundingClientRect();
			hover_candidate.x = rect.left + rect.width / 2;
			hover_candidate.y = rect.top + rect.height / 2;
		}
		hover_candidate.target = target;
		return hover_candidate;
	};

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

	const update = () => {
		const time = Date.now();
		recent_points = recent_points.filter((point_record) => time < point_record.time + averaging_window_timespan);
		if (recent_points.length) {
			const latest_point = recent_points[recent_points.length - 1];
			recent_points.push({ x: latest_point.x, y: latest_point.y, time });
			const average_point = average_points(recent_points);
			// debug
			// const canvas_point = to_canvas_coords({clientX: average_point.x, clientY: average_point.y});
			// ctx.fillStyle = "red";
			// ctx.fillRect(canvas_point.x, canvas_point.y, 10, 10);
			const recent_movement_amount = Math.hypot(latest_point.x - average_point.x, latest_point.y - average_point.y);

			// Invalidate in case an element pops up in front of the element you're hovering over, e.g. a submenu
			// (that use case doesn't actually work because the menu pops up before the hover_candidate exists)
			// (TODO: disable hovering to open submenus in eye gaze mode)
			// or an element occludes the center of an element you're hovering over, in which case it
			// could be confusing if it showed a dwell click indicator over a different element than it would click
			// (but TODO: just move the indicator off center in that case)
			if (hover_candidate && !gaze_dragging) {
				const apparent_hover_candidate = get_hover_candidate(hover_candidate.x, hover_candidate.y);
				const show_occluder_indicator = (occluder) => {
					const occluder_indicator = document.createElement("div");
					const occluder_rect = occluder.getBoundingClientRect();
					const outline_width = 4;
					occluder_indicator.style.pointerEvents = "none";
					occluder_indicator.style.zIndex = "1000001";
					occluder_indicator.style.display = "block";
					occluder_indicator.style.position = "fixed";
					occluder_indicator.style.left = `${occluder_rect.left + outline_width}px`;
					occluder_indicator.style.top = `${occluder_rect.top + outline_width}px`;
					occluder_indicator.style.width = `${occluder_rect.width - outline_width * 2}px`;
					occluder_indicator.style.height = `${occluder_rect.height - outline_width * 2}px`;
					occluder_indicator.style.outline = `${outline_width}px dashed red`;
					occluder_indicator.style.boxShadow = `0 0 ${outline_width}px ${outline_width}px maroon`;
					document.body.appendChild(occluder_indicator);
					setTimeout(() => {
						occluder_indicator.remove();
					}, inactive_after_invalid_timespan * 0.5);
				};
				if (apparent_hover_candidate) {
					if (
						apparent_hover_candidate.target !== hover_candidate.target &&
						// !retargeted &&
						!eye_gaze_mode_config.isEquivalentTarget(
							apparent_hover_candidate.target, hover_candidate.target
						)
					) {
						hover_candidate = null;
						deactivate_for_at_least(inactive_after_invalid_timespan);
						show_occluder_indicator(apparent_hover_candidate.target);
					}
				} else {
					let occluder = document.elementFromPoint(hover_candidate.x, hover_candidate.y);
					hover_candidate = null;
					deactivate_for_at_least(inactive_after_invalid_timespan);
					show_occluder_indicator(occluder || document.body);
				}
			}

			let circle_position = latest_point;
			let circle_opacity = 0;
			let circle_radius = 0;
			if (hover_candidate) {
				circle_position = hover_candidate;
				circle_opacity = 0.4;
				circle_radius =
					circle_radius_max *
					(hover_candidate.time - time + hover_timespan) / hover_timespan;
				if (time > hover_candidate.time + hover_timespan) {
					if (pointer_active || gaze_dragging) {
						window.untrusted_gesture = true;
						hover_candidate.target.dispatchEvent(new PointerEvent("pointerup",
							Object.assign(get_event_options(hover_candidate), {
								button: 0,
								buttons: 0,
							})
						));
						window.untrusted_gesture = false;
					} else {
						pointers = []; // prevent multi-touch panning
						window.untrusted_gesture = true;
						hover_candidate.target.dispatchEvent(new PointerEvent("pointerdown",
							Object.assign(get_event_options(hover_candidate), {
								button: 0,
								buttons: 1,
							})
						));
						window.untrusted_gesture = false;
						if (eye_gaze_mode_config.shouldDrag(hover_candidate.target)) {
							gaze_dragging = hover_candidate.target;
						} else {
							window.untrusted_gesture = true;
							hover_candidate.target.dispatchEvent(new PointerEvent("pointerup",
								Object.assign(get_event_options(hover_candidate), {
									button: 0,
									buttons: 0,
								})
							));
							eye_gaze_mode_config.click(hover_candidate);
							window.untrusted_gesture = false;
						}
					}
					hover_candidate = null;
					deactivate_for_at_least(inactive_after_hovered_timespan);
				}
			}

			if (gaze_dragging) {
				dwell_indicator.classList.add("for-release");
			} else {
				dwell_indicator.classList.remove("for-release");
			}
			dwell_indicator.style.display = "";
			dwell_indicator.style.opacity = circle_opacity.toFixed(3);
			dwell_indicator.style.transform = `scale(${circle_radius / circle_radius_max})`;
			dwell_indicator.style.left = `${circle_position.x - circle_radius_max / 2}px`;
			dwell_indicator.style.top = `${circle_position.y - circle_radius_max / 2}px`;

			let halo_target =
				gaze_dragging ||
				(hover_candidate || get_hover_candidate(latest_point.x, latest_point.y) || {}).target;

			if (halo_target && (!paused || eye_gaze_mode_config.dwellClickEvenIfPaused(halo_target))) {
				let rect = halo_target.getBoundingClientRect();
				const computed_style = getComputedStyle(halo_target);
				let ancestor = halo_target;
				let border_radius_scale = 1; // for border radius mimicry, given parents with transform: scale()
				while (ancestor instanceof HTMLElement) {
					const ancestor_computed_style = getComputedStyle(ancestor);
					if (ancestor_computed_style.transform) {
						// Collect scale transforms
						const match = ancestor_computed_style.transform.match(/(?:scale|matrix)\((\d+(?:\.\d+)?)/);
						if (match) {
							border_radius_scale *= Number(match[1]);
						}
					}
					if (ancestor_computed_style.overflow !== "visible") {
						// Clamp to visible region if in scrollable area
						// This lets you see the hover halo when scrolled to the middle of a large canvas
						const scroll_area_rect = ancestor.getBoundingClientRect();
						rect = {
							left: Math.max(rect.left, scroll_area_rect.left),
							top: Math.max(rect.top, scroll_area_rect.top),
							right: Math.min(rect.right, scroll_area_rect.right),
							bottom: Math.min(rect.bottom, scroll_area_rect.bottom),
						};
						rect.width = rect.right - rect.left;
						rect.height = rect.bottom - rect.top;
					}
					ancestor = ancestor.parentNode;
				}
				halo.style.display = "block";
				halo.style.position = "fixed";
				halo.style.left = `${rect.left}px`;
				halo.style.top = `${rect.top}px`;
				halo.style.width = `${rect.width}px`;
				halo.style.height = `${rect.height}px`;
				// shorthand properties might not work in all browsers (not tested)
				// this is so overkill...
				halo.style.borderTopRightRadius = `${parseFloat(computed_style.borderTopRightRadius) * border_radius_scale}px`;
				halo.style.borderTopLeftRadius = `${parseFloat(computed_style.borderTopLeftRadius) * border_radius_scale}px`;
				halo.style.borderBottomRightRadius = `${parseFloat(computed_style.borderBottomRightRadius) * border_radius_scale}px`;
				halo.style.borderBottomLeftRadius = `${parseFloat(computed_style.borderBottomLeftRadius) * border_radius_scale}px`;
			} else {
				halo.style.display = "none";
			}

			if (time < inactive_until_time) {
				return;
			}
			if (recent_movement_amount < 5) {
				if (!hover_candidate) {
					hover_candidate = {
						x: average_point.x,
						y: average_point.y,
						time: Date.now(),
						target: gaze_dragging || null,
					};
					if (!gaze_dragging) {
						hover_candidate = get_hover_candidate(hover_candidate.x, hover_candidate.y);
					}
					if (hover_candidate && (paused && !eye_gaze_mode_config.dwellClickEvenIfPaused(hover_candidate.target))) {
						hover_candidate = null;
					}
				}
			}
			if (recent_movement_amount > 100) {
				if (gaze_dragging) {
					window.untrusted_gesture = true;
					window.dispatchEvent(new PointerEvent("pointerup",
						Object.assign(get_event_options(average_point), {
							button: 0,
							buttons: 0,
						})
					));
					window.untrusted_gesture = false;
					pointers = []; // prevent multi-touch panning
				}
			}
			if (recent_movement_amount > 60) {
				hover_candidate = null;
			}
		}
	};
	let raf_id;
	const animate = () => {
		raf_id = requestAnimationFrame(animate);
		update();
	};
	raf_id = requestAnimationFrame(animate);

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
			paused = !paused;
			$("body").toggleClass("eye-gaze-mode-paused", paused);
			$pause_button.attr("title", paused ? resume_button_text : pause_button_text);
		})
		.appendTo($floating_buttons)
		.append(
			$("<div class='button-icon'>")
		);

	clean_up_eye_gaze_mode = () => {
		console.log("Cleaning up / disabling eye gaze mode");
		cancelAnimationFrame(raf_id);
		halo.remove();
		dwell_indicator.remove();
		$floating_buttons.remove();
		window.removeEventListener("pointermove", on_pointer_move);
		window.removeEventListener("pointerup", on_pointer_up_or_cancel);
		window.removeEventListener("pointercancel", on_pointer_up_or_cancel);
		window.removeEventListener("focus", on_focus);
		window.removeEventListener("blur", on_blur);
		document.removeEventListener("mouseleave", on_mouse_leave_page);
		document.removeEventListener("mouseenter", on_mouse_enter_page);
		clean_up_eye_gaze_mode = () => { };
	};
}
