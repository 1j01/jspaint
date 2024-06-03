// @ts-check
/* global $Window */

import { $G, E } from "./helpers.js";

/**
 * @param {OSGUIWindowOptions} options
 * @returns {OSGUI$Window}
 */
function make_window_supporting_scale(options) {
	const $w = $Window(options);

	const scale_for_eye_gaze_mode_and_center = () => {
		if (!$w.is(".edit-colors-window, .storage-manager, .attributes-window, .flip-and-rotate, .stretch-and-skew")) {
			return;
		}
		const c = $w.$content[0];
		const t = $w.$titlebar[0];
		let scale = 1;
		$w.$content.css({
			transform: `scale(${scale})`,
			transformOrigin: "0 0",
			marginRight: "",
			marginBottom: "",
		});
		if (document.body.classList.contains("eye-gaze-mode")) {
			scale = Math.min(
				(innerWidth) / c.offsetWidth,
				(innerHeight - t.offsetHeight) / c.offsetHeight
			);
			$w.$content.css({
				transform: `scale(${scale})`,
				transformOrigin: "0 0",
				marginRight: c.scrollWidth * (scale - 1),
			});
			// This is separate to prevent content going off the bottom of the window
			// in case the layout changes due to text wrapping.
			$w.$content.css({
				marginBottom: c.scrollHeight * (scale - 1),
			});
			$w.center();
		}
		// for testing (WARNING: can cause rapid flashing, which can cause seizures):
		// requestAnimationFrame(scale_for_eye_gaze_mode_and_center);
	};

	if (!options.$component) {
		$w.center();

		const scale_for_eye_gaze_mode_and_center_next_frame = () => {
			requestAnimationFrame(scale_for_eye_gaze_mode_and_center);
		};
		const on_close = () => {
			$w.off("close", on_close);
			$G.off("eye-gaze-mode-toggled resize", scale_for_eye_gaze_mode_and_center_next_frame);
		};
		$w.on("close", on_close);
		$G.on("eye-gaze-mode-toggled resize", scale_for_eye_gaze_mode_and_center_next_frame);

		scale_for_eye_gaze_mode_and_center_next_frame();
	}

	if (options.$component) {
		$w.$content.css({
			contain: "none",
		});
	}

	return $w;
}

/**
 * @param {JQuery<HTMLDivElement> & I$Component} [$component]
 * @returns {OSGUI$Window & I$ToolWindow}
 */
function $ToolWindow($component) {
	return make_window_supporting_scale({
		$component,
		toolWindow: true,
	});
}

/**
 * @param {string} [title]
 * @returns {OSGUI$Window & I$DialogWindow}
 */
function $DialogWindow(title) {
	const $w = /** @type {OSGUI$Window & I$DialogWindow} */ (make_window_supporting_scale({
		title,
		resizable: false,
		maximizeButton: false,
		minimizeButton: false,
		// helpButton: @TODO
	}));
	$w.addClass("dialog-window");

	// I don't know why type inference isn't working here. It seems to infer HTMLDivElement but not HTMLFormElement.
	// Both are in HTMLElementTagNameMap...
	$w.$form = /** @type {JQuery<HTMLFormElement>} */($(E("form"))).appendTo($w.$content);
	$w.$main = $(E("div")).appendTo($w.$form);
	$w.$buttons = $(E("div")).appendTo($w.$form).addClass("button-group");

	/**
	 * @param {string | Node} label
	 * @param {()=> void} action
	 * @param {object} [options]
	 * @param {string} [options.type]
	 * @returns {JQuery<HTMLButtonElement>}
	 */
	$w.$Button = (label, action, options = { type: "button" }) => {
		const $b = $(E("button")).appendTo($w.$buttons);

		// jQuery's append() is unsafe (text interpreted as HTML); native append() is safe,
		// and accepts text, DOM nodes, or DocumentFragments.
		$b[0].append(label);

		$b.on("click", () => {
			action();
		});

		$b.on("pointerdown", () => {
			$b.focus();
		});

		$b.attr({ type: options.type });

		return $b;
	};
	// Note: the "submit" event on the form element may not fire if the window is closed,
	// as the form element is removed from the DOM. You can test this by preventing the "close" event on $w.
	// But in case it does submit, prevent the default action of reloading the page.
	// In the future, this could be cleaner by using the <dialog> element.
	$w.$form.on("submit", (e) => {
		e.preventDefault();
	});

	// Highlight button that will be activated if you press Enter, if any.
	// - If there's any focused control that will handle Enter (highlight it if it's a button)
	// - Otherwise the default submit button according to HTML form semantics (highlight it if there is one)
	function updateDefaultHighlight() {
		$w.find("button, input").removeClass("default");
		let $default = $(document.activeElement).closest("button, input[type='submit'], input[type='button'], textarea, select");
		if ($default.length === 0) {
			// Buttons in forms default to type="submit" implicitly.
			$default = $w.$form.find('button[type="submit"], input[type="submit"], button:not([type])').first();
		}
		if ($default.is("button, input[type='submit'], input[type='button']")) {
			$default.addClass("default");
		}
	}
	$w.on("focusin", updateDefaultHighlight);
	$w.on("focusout", () => {
		$w.find("button, input").removeClass("default");
	});
	setTimeout(() => {
		updateDefaultHighlight();
	}, 0);

	return $w;
}

export { $DialogWindow, $ToolWindow, make_window_supporting_scale };

