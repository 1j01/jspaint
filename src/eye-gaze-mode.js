// @ts-check
// eslint-disable-next-line no-unused-vars
/* global pointers:writable */
/* global $Window, main_canvas, pointer_active, selected_tool, TrackyMouse */
import { change_url_param, undo } from "./functions.js";
import { $G, load_image_simple } from "./helpers.js";
import { TOOL_CURVE, TOOL_FILL, TOOL_MAGNIFIER, TOOL_PICK_COLOR, TOOL_POLYGON } from "./tools.js";

// Tracky Mouse provides dwell clicking and head tracking features.
// https://trackymouse.js.org/


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

		$tracky_mouse_window.on("closed", () => {
			change_url_param("head-tracker", false);
		});

		// Use a minimize target so that the window doesn't minimize to the bottom left corner of the screen, overlapping the floating buttons.
		// Adding it to the menu bar ensures visibility and no overlap because it will wrap to the next row if necessary.
		// However, this is volatile because if I decided to destroy and recreate the menu bar, this extra button would be lost.
		// The OS-GUI.js menu bar API doesn't support changing menus on the fly yet, so I'm likely to want to do that (for Recent Files, for example).
		// I could make an event for menu modifications and listen for it here and re-add the minimize target if necessary.
		// Of course if OS-GUI.js does support changing menus in the future, I could make this minimize target an actual menu item,
		// which would be a little different but probably good. (I would need to support non-menu-opening top level buttons too - a real Windows feature, btw.)
		const minimize_target = document.createElement("button");
		minimize_target.classList.add("minimize-target");
		minimize_target.title = "Restore window";
		minimize_target.addEventListener("click", () => {
			if ($tracky_mouse_window.is(":visible")) {
				$tracky_mouse_window.minimize();
			} else {
				$tracky_mouse_window.unminimize();
			}
		});
		minimize_target.textContent = "Tracky Mouse";
		const icon = document.createElement("img");
		icon.src = "images/tracky-mouse-16x16.png";
		icon.width = 16;
		icon.height = 16;
		minimize_target.prepend(icon);
		$(".menus").append(minimize_target);
		$tracky_mouse_window.setMinimizeTarget(minimize_target);

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
			minimize_target.remove();
			clean_up_tracky_mouse_ui = () => { };
		};
	}
}
// TODO: move this to a separate file (note dependency on `dwell_clicker`)
let $floating_buttons = null;
let clean_up_floating_buttons = null;
async function update_floating_buttons() {
	await new Promise((resolve) => $(resolve)); // wait for document ready so app UI is appended before floating buttons

	clean_up_floating_buttons?.();

	if (!$("body").is(".easy-undo-mode, .dwell-clicker-mode")) {
		return;
	}

	$floating_buttons =
		$("<div class='floating-buttons'/>")
			.appendTo("body");

	if ($("body").hasClass("easy-undo-mode")) {
		$("<button title='Undo' class='floating-undo-button'/>")
			.on("click", undo)
			.appendTo($floating_buttons)
			.append(
				$("<div class='button-icon'>")
			);
	}

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
	} else if ($("body").hasClass("easy-undo-mode")) {
		// TODO: redo button (needs an icon)
		// $("<button title='Redo' class='floating-redo-button'/>")
		// 	.on("click", redo)
		// 	.appendTo($floating_buttons)
		// 	.append(
		// 		$("<div class='button-icon'>")
		// 	);
	}

	const update_width = () => {
		// It's transformed so needs getBoundingClientRect() instead of width()
		$("body").css("--floating-buttons-width", $floating_buttons[0].getBoundingClientRect().width + "px");
	};
	update_width();

	// Update when Enlarge UI mode is toggled, which currently triggers this event, piggybacking off of existing handlers for it, making it a misnomer
	// (but also when the theme is changed; either could alter the layout)
	$G.on("theme-load", update_width);

	clean_up_floating_buttons = () => {
		$("body").css("--floating-buttons-width", "0px");
		$G.off("theme-load", update_width);
		$floating_buttons.remove();
		$floating_buttons = null;
		clean_up_floating_buttons = null;
	};
}

$G.on("easy-undo-mode-toggled", update_floating_buttons);

// Enlarge UI mode: menu scaling
// other scaling code is in specific files like $Component.js and $ToolWindow.js
// but MenuBar isn't owned by this repo
// TODO: separate file too?

const apply_scale = (menu_popup) => {
	const enabled = $("body").hasClass("enlarge-ui");

	const $menu_popup = $(menu_popup);
	const is_submenu = $menu_popup.is("[data-semantic-parent^='menu-popup']");

	const get_current_scale_css = () => {
		return {
			transform: $menu_popup.css("transform"),
			transformOrigin: $menu_popup.css("transformOrigin"),
			marginLeft: $menu_popup.css("marginLeft"),
			marginTop: $menu_popup.css("marginTop"),
		};
	};

	const reset_scale_css = () => {
		$menu_popup.css({
			transform: "",
			transformOrigin: "",
			marginLeft: "",
			marginTop: "",
		});
	};

	if (!enabled) {
		menu_popup.getBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
		reset_scale_css();
		return;
	}

	let own_call = true;
	// Override getBoundingClientRect to ignore the transform,
	// and potentially schedule updating the scale, for a resize event.
	// It's used in here but also in MenuBar.js for positioning (see update_position_from_containing_bounds)
	menu_popup.getBoundingClientRect = () => {
		const before = get_current_scale_css();
		reset_scale_css();
		const bounds = HTMLElement.prototype.getBoundingClientRect.call(menu_popup);
		if (own_call) {
			$menu_popup.css(before); // or Object.assign(menu_popup.style, before); // or... maybe not necessarily since all the styles are being set anyway
		} else {
			requestAnimationFrame(() => {
				apply_scale(menu_popup);
			});
		}
		return bounds;
	};

	// Measure the untransformed size
	const base_bounds = menu_popup.getBoundingClientRect();
	own_call = false;

	// Define CSS properties for scaling
	const scale = Math.min(1,
		Math.min(
			innerWidth / base_bounds.width,
			(is_submenu ? innerHeight : innerHeight - base_bounds.top) / base_bounds.height,
		)
	);
	const scaled_height = base_bounds.height * scale;
	const new_top = is_submenu ? Math.min(base_bounds.top, window.innerHeight - scaled_height) : base_bounds.top;

	$menu_popup.css({
		transform: `scale(${scale})`,
		transformOrigin: "100% 0%",

		// Don't need to reserve space for other elements since menu popups are floating
		// marginRight: base_bounds.width * (scale - 1),
		// marginBottom: base_bounds.height * (scale - 1),

		// Move the menu up/left to fit all on the screen
		// Not using left/top so that the effect can be reset; they're already used for positioning.
		// That may not be an important concern considering the menus would need repositioning when toggling the setting, and should really be closed when toggling the setting.
		// Left works differently due to the transform origin, which I chose due to the existing menu fitting-on-screen behavior.
		// May be able to do it more similarly, but this is what I was able to get working.
		marginLeft: Math.min(0, window.innerWidth - base_bounds.right),
		marginTop: new_top - base_bounds.top,
	});
};

let observer;
const update_auto_scaling = () => {
	if (observer) {
		observer.disconnect();
		observer = null;
	}
	if ($("body").hasClass("enlarge-ui")) {
		// - `.menu-popup` elements can exist in the DOM before the menu is opened, hidden with `style.display = "none";`
		// - `.menu-popup` elements may not exist yet when this code runs
		// - We want to avoid running the scaling code any time other than a menu being opened
		//   - It MUST not cause recursion when modifying the styles for scaling in the `MutationObserver` callback
		// - This code should work regardless of whether `.menu-popup` elements are be shown with `style.display = "block";` or `style.display = "";`
		observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (!(mutation.target instanceof HTMLElement)) {
					continue; // type narrowing, to avoid type checker errors
				}
				if (
					mutation.attributeName === "style" &&
					mutation.target.style.display !== "none" &&
					mutation.oldValue?.includes("display: none") &&
					mutation.target.matches(".menu-popup")
				) {
					// setTimeout(() => {
					apply_scale(mutation.target);
					// }, 1000);
				}
			}
		});
		observer.observe(document.body, {
			attributes: true,
			attributeOldValue: true,
			attributeFilter: ["style"],
			subtree: true,
		});
	}
	// Apply scaling to existing menus
	setTimeout(() => {
		// Trigger update_position_from_containing_bounds in MenuBar.js, which uses getBoundingClientRect overridden above
		if (!$("body").hasClass("enlarge-ui")) {
			$(".menu-popup").each((i, el) => { el.dispatchEvent(new CustomEvent("update", {})); });
		}
		$(".menu-popup").each((i, el) => { apply_scale(el); });
	}, 0);
};
$G.on("enlarge-ui-toggled", update_auto_scaling);
update_auto_scaling();

