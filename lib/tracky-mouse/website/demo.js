/* global TrackyMouse */

TrackyMouse.dependenciesRoot = "./core";

await TrackyMouse.loadDependencies();

// Note: init currently extends the passed element,
// rather than replacing it or adding a child to it.
// That is technically the most flexible, I suppose,
// but may violate the principle of least surprise.
// I could accept an options object with mutually exclusive options
// to `extend`, `replace`, or `appendTo`.
TrackyMouse.init(document.getElementById("tracky-mouse-demo"));

// This example is based off of how JS Paint uses the Tracky Mouse API.
// It's simplified a bit, but includes various settings.
const config = {
	// The elements to click. Anything else is ignored.
	// TODO: maybe allow clicking on everything, but first
	// make sure to enable dwell clicking only when the head tracker is enabled.
	targets: ".archery-target",
	// targets: `
	// 	button:not([disabled]),
	// 	input,
	// 	textarea,
	// 	label,
	// 	a,
	// 	details summary,
	// 	.radio-or-checkbox-wrapper,
	// 	.drawing-canvas,
	// 	.window:not(.maximized) .window-titlebar
	// `,
	// Filter for elements to drag. They must be included in the targets first.
	// shouldDrag: (target) => (
	// 	target.matches(".window-titlebar") ||
	// 	(target.matches(".drawing-canvas") && current_tool.supports_drag)
	// ),
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
};
TrackyMouse.initDwellClicking(config);

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

// Archery mini-game
const archery_game = document.getElementById("archery-demo");
const archery_scoreboard = document.getElementById("archery-scoreboard");
const archery_targets = document.querySelectorAll(".archery-target");
let round;
const best_times = {
	with_head_tracker: Infinity,
	with_dwell_clicker: Infinity,
	with_dwell_clicker_touch: Infinity, // unlikely, since touch doesn't have hovering (except on a few phones, as a gimmick; dunno if they trigger events with pointerType "touch" for hovering)
	with_dwell_clicker_pen: Infinity,
	with_mouse: Infinity,
	with_touch: Infinity,
	with_pen: Infinity,
	with_keyboard: Infinity,
	with_unknown_input: Infinity,
};
function initRound() {
	round = {
		used_manual_movement: false, // non-head-tracker mouse movement
		used_manual_movement_touch: false, // non-head-tracker mouse movement
		used_manual_movement_pen: false, // non-head-tracker mouse movement
		used_manual_click: false, // non-dwell clicking
		used_manual_click_touch: false, // non-dwell clicking
		used_manual_click_pen: false, // non-dwell clicking
		used_keyboard: false, // not much of a game, but may be an interesting comparison
		used_unknown_input: false, // click event despite preventing via keydown/pointerdown
		start_time: undefined, // set when the first target is hit
	};
	for (const archery_target of archery_targets) {
		archery_target.classList.remove("hit");
	}
}
initRound();
let last_pointerdown_time = -Infinity;
archery_game.addEventListener("pointerdown", (event) => {
	if (event.pointerId !== 1234567890) {
		// TODO: maybe only set if target was hit; could use a callback (or return value but that would be a little confusing since handleTargetHit looks like an event handler)
		round.used_manual_click = true;
		if (event.pointerType === "pen") {
			round.used_manual_click_pen = true;
		} else if (event.pointerType === "touch") {
			round.used_manual_click_touch = true;
		}
	}
	// Don't call `event.preventDefault()` because click will be triggered regardless, but it will prevent text deselection, which is very irritating.
	handleTargetHit(event);
	last_pointerdown_time = performance.now();
});
archery_game.addEventListener("keydown", (event) => {
	if (event.key === " " || event.key === "Enter") {
		event.preventDefault();
		round.used_keyboard = true;
		handleTargetHit(event);
	}
});
archery_game.addEventListener("click", (event) => {
	if (performance.now() - last_pointerdown_time < 100) {
		return;
	}
	round.used_unknown_input = true;
	handleTargetHit(event);
});
archery_game.addEventListener("pointerenter", (event) => {
	if (event.pointerId === 1234567890) {
		return;
	}
	round.used_manual_movement = true;
	if (event.pointerType === "pen") {
		round.used_manual_movement_pen = true;
	} else if (event.pointerType === "touch") {
		round.used_manual_movement_touch = true;
	}
});

/**
 * @returns {keyof typeof best_times} scoreboard_slot - the slot in the scoreboard for the current input method (the most powerful, if it's ambiguous)
 * 
 * If you for example use the head tracker for one target and then mash Tab+Enter for the rest, that should count as using the keyboard.
 * 
 * Note that pointerType may be "mouse" when using a pen, under some circumstances.
 * It seems I need to enable "Windows Ink" in the Wacom settings (and re-open the tab, not just reload) to get "pen" as the pointerType.
 */
function get_scoreboard_slot() {
	if (round.used_keyboard) {
		// keyboard is the most like cheating, so it goes first
		return "with_keyboard";
	} else if (round.used_manual_click_touch) {
		// next easiest is clicking with touch (it's an absolute input method, and you can see exactly where you're clicking; you could even line up multiple fingers with targets... actually that might even make it more powerful than the keyboard...)
		return "with_touch";
	} else if (round.used_manual_click_pen) {
		// next easiest is clicking with a pen (it's an absolute input method, but you have to look at the cursor to see where you're clicking)
		return "with_pen";
	} else if (round.used_manual_click) {
		// next easiest is clicking with a mouse (it's relative, but precise and familiar)
		return "with_mouse";
	} else if (round.used_manual_movement_touch) {
		// next easiest is moving the mouse but using the dwell clicker (it's precise but slower)
		// not sure about touch vs pen/mouse in this case, as I don't have a touch screen supporting hover
		return "with_dwell_clicker_touch";
	} else if (round.used_manual_movement_pen) {
		// (see previous comment)
		return "with_dwell_clicker_pen";
	} else if (round.used_manual_movement) {
		// (see previous comment)
		return "with_dwell_clicker";
	} else if (round.used_unknown_input) {
		// this last one is a wild card; it's hard to say whether this condition should be last or first
		// I imagine some other accessibility feature might trigger this
		// Can simulate with:
		// for (const archeryTarget of document.querySelectorAll(".archery-target")) {
		// 	archeryTarget.dispatchEvent(new PointerEvent("click", { bubbles: true }));
		// }
		// Of course, that example is completely cheating, which makes it feel like it should be first,
		// but I suspect if this occurs outside of a test, it won't be due to cheating.
		// Of course, the ranking by "easiness" is only in case you mix input methods in a single round.
		// It might not be the best way to detect a different (unknown) input method.
		// That is to say, there's a different argument for giving this priority.
		return "with_unknown_input";
	} else {
		return "with_head_tracker";
	}
}

const slot_labels = {
	with_head_tracker: "With Head Tracking",
	with_dwell_clicker: "With Dwell Clicking", // may be pen, undetectable in some cases
	with_dwell_clicker_touch: "With Dwell Clicking (Touch)",
	with_dwell_clicker_pen: "With Dwell Clicking (Pen)",
	with_mouse: "With Manual Clicking", // may be pen, undetectable in some cases, hence "manual" instead of "mouse"
	with_touch: "With Touch",
	with_pen: "With Pen",
	with_keyboard: "With Keyboard",
	with_unknown_input: "With Unknown Input",
};

/**
 * @param {PointerEvent | KeyboardEvent} event 
 */
function handleTargetHit(event) {
	if (!event.target.matches(".archery-target")) {
		return;
	}
	if (archery_game.classList.contains("round-over")) {
		return;
	}
	const archery_target = event.target;
	if (!round.start_time) {
		initRound(); // reset input detection to ignore spurious hovering before the round starts
		round.start_time = performance.now();
		archery_scoreboard.hidden = true;
	}
	// after initRound since initRound removes the .hit class
	archery_target.classList.add("hit");
	animateTargetHit(archery_target).then(() => {
		// archery_target.classList.remove("hit");
	});
	if (document.querySelectorAll(".archery-target:not(.hit)").length === 0) {
		const time = (performance.now() - round.start_time) / 1000;
		archery_scoreboard.hidden = false;
		archery_scoreboard.textContent = `Time: ${time.toFixed(2)}s`;
		const slot = get_scoreboard_slot();
		const new_best = time < best_times[slot];
		if (new_best) {
			best_times[slot] = time;
		}
		const slot_indicator = document.createElement("p");
		slot_indicator.textContent = slot_labels[slot];
		slot_indicator.classList.add("slot-indicator");
		archery_scoreboard.append(slot_indicator);
		const best_times_label = document.createElement("p");
		best_times_label.textContent = `Best times:`;
		best_times_label.classList.add("best-times-label");
		archery_scoreboard.append(best_times_label);
		const ul = document.createElement("ul");
		archery_scoreboard.append(ul);
		for (const [id, time] of Object.entries(best_times)) {
			if (time === Infinity) {
				continue;
			}
			const label = slot_labels[id];
			const li = document.createElement("li");
			li.textContent = `${label}: ${time.toFixed(2)}s`;
			if (slot === id && new_best) {
				li.classList.add("new-best-time");
				const new_best = document.createElement("span");
				new_best.textContent = " New Best!";
				li.append(new_best);
			}
			ul.append(li);
		}
		archery_game.classList.add("round-over");
		setTimeout(() => {
			for (const archery_target of archery_targets) {
				for (const animation of archery_target.getAnimations()) {
					animation.cancel();
				}
			}
			setTimeout(() => {
				archery_game.classList.remove("round-over");
				initRound();
			}, 100);
		}, 2000);
	}
}

/**
 * @param {HTMLButtonElement} archery_target 
 */
async function animateTargetHit(archery_target) {
	// archery_target.style.animation = "archery-target-hit 0.5s ease-in-out";
	// archery_target.addEventListener("animationend", () => {
	// 	archery_target.style.animation = "";
	// }, { once: true });
	const frames = [];
	let angle = 0;
	let angularVelocity = 2 + Math.random() * 0.2;
	for (let t = 0; t < 100; t++) {
		angularVelocity *= 0.92;
		angle += angularVelocity;
		angularVelocity += (Math.sin(angle)) * 0.1;
		frames.push({
			transform: `translate(-50%, -50%) rotateX(${angle}rad)`,
			opacity: Math.min(1, Math.max(0.2, 1 - t / 100 * 4.123456) - Math.cos(angle) * 0.1),
		});
	}
	try {
		await archery_target.animate(frames, {
			duration: 10000,
			easing: "linear",
			fill: "both",
		}).finished;
	} catch (_error) {
		// ignore cancelation
	}
}
