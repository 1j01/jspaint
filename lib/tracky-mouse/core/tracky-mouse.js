/* global jsfeat, Stats, clm */
const TrackyMouse = {
	dependenciesRoot: "./tracky-mouse",
};

TrackyMouse.loadDependencies = function ({ statsJs = false } = {}) {
	TrackyMouse.dependenciesRoot = TrackyMouse.dependenciesRoot.replace(/\/+$/, "");
	const loadScript = src => {
		return new Promise((resolve, reject) => {
			// This wouldn't wait for them to load
			// for (const script of document.scripts) {
			// 	if (script.src.includes(src)) {
			// 		resolve();
			// 		return;
			// 	}
			// }
			const script = document.createElement('script');
			script.type = 'text/javascript';
			script.onload = resolve;
			script.onerror = reject;
			script.src = src;
			document.head.append(script);
		});
	};
	const scriptFiles = [
		`${TrackyMouse.dependenciesRoot}/lib/no-eval.js`, // generated with eval-is-evil.html, this instruments clmtrackr.js so I don't need unsafe-eval in the CSP
		`${TrackyMouse.dependenciesRoot}/lib/clmtrackr.js`,
	];
	if (statsJs) {
		scriptFiles.push(`${TrackyMouse.dependenciesRoot}/lib/stats.js`);
	}
	// TODO: figure out how to preload worker-context dependencies that use `importScripts`.
	// `<link rel="preload">` can be injected at runtime,
	// which wouldn't make sense for the main thread's dependencies, since we're injecting all the scripts at once anyway,
	// but it could make sense for the worker's dependencies, since the worker is loaded lazily.
	// However... with `<link rel="preload" as="script">`, it seems to load things twice, making performance worse!
	// It seems like the worker isn't using the same cache as the main thread. I'm not sure.
	// Maybe this will be easier if I use module versions of the libraries, with `<link rel="modulepreload">`?
	// Maybe it would use a shared cache in that case? That's a big if, though.
	// `${TrackyMouse.dependenciesRoot}/lib/tf.js`
	// `${TrackyMouse.dependenciesRoot}/lib/facemesh/facemesh.js`
	return Promise.all(scriptFiles.map(loadScript));
};

const is_selector_valid = ((dummy_element) =>
	(selector) => {
		try { dummy_element.querySelector(selector); } catch { return false; }
		return true;
	})(document.createDocumentFragment());


const dwell_clickers = [];

const init_dwell_clicking = (config) => {
	/*
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
	*/
	if (typeof config !== "object") {
		throw new Error("configuration object required for initDwellClicking");
	}
	if (config.targets === undefined) {
		throw new Error("config.targets is required (must be a CSS selector)");
	}
	if (typeof config.targets !== "string") {
		throw new Error("config.targets must be a string (a CSS selector)");
	}
	if (!is_selector_valid(config.targets)) {
		throw new Error("config.targets is not a valid CSS selector");
	}
	if (config.click === undefined) {
		throw new Error("config.click is required");
	}
	if (typeof config.click !== "function") {
		throw new Error("config.click must be a function");
	}
	if (config.shouldDrag !== undefined && typeof config.shouldDrag !== "function") {
		throw new Error("config.shouldDrag must be a function");
	}
	if (config.noCenter !== undefined && typeof config.noCenter !== "function") {
		throw new Error("config.noCenter must be a function");
	}
	if (config.isEquivalentTarget !== undefined && typeof config.isEquivalentTarget !== "function") {
		throw new Error("config.isEquivalentTarget must be a function");
	}
	if (config.dwellClickEvenIfPaused !== undefined && typeof config.dwellClickEvenIfPaused !== "function") {
		throw new Error("config.dwellClickEvenIfPaused must be a function");
	}
	if (config.beforeDispatch !== undefined && typeof config.beforeDispatch !== "function") {
		throw new Error("config.beforeDispatch must be a function");
	}
	if (config.afterDispatch !== undefined && typeof config.afterDispatch !== "function") {
		throw new Error("config.afterDispatch must be a function");
	}
	if (config.beforePointerDownDispatch !== undefined && typeof config.beforePointerDownDispatch !== "function") {
		throw new Error("config.beforePointerDownDispatch must be a function");
	}
	if (config.isHeld !== undefined && typeof config.isHeld !== "function") {
		throw new Error("config.isHeld must be a function");
	}
	if (config.retarget !== undefined) {
		if (!Array.isArray(config.retarget)) {
			throw new Error("config.retarget must be an array of objects");
		}
		for (let i = 0; i < config.retarget.length; i++) {
			const rule = config.retarget[i];
			if (typeof rule !== "object") {
				throw new Error("config.retarget must be an array of objects");
			}
			if (rule.from === undefined) {
				throw new Error(`config.retarget[${i}].from is required`);
			}
			if (rule.to === undefined) {
				throw new Error(`config.retarget[${i}].to is required (although can be null to ignore the element)`);
			}
			if (rule.withinMargin !== undefined && typeof rule.withinMargin !== "number") {
				throw new Error(`config.retarget[${i}].withinMargin must be a number`);
			}
			if (typeof rule.from !== "string" && typeof rule.from !== "function" && !(rule.from instanceof Element)) {
				throw new Error(`config.retarget[${i}].from must be a CSS selector string, an Element, or a function`);
			}
			if (typeof rule.to !== "string" && typeof rule.to !== "function" && !(rule.to instanceof Element) && rule.to !== null) {
				throw new Error(`config.retarget[${i}].to must be a CSS selector string, an Element, a function, or null`);
			}
			if (typeof rule.from === "string" && !is_selector_valid(rule.from)) {
				throw new Error(`config.retarget[${i}].from is not a valid CSS selector`);
			}
			if (typeof rule.to === "string" && !is_selector_valid(rule.to)) {
				throw new Error(`config.retarget[${i}].to is not a valid CSS selector`);
			}
		}
	}

	// tracky_mouse_container.querySelector(".tracky-mouse-canvas").classList.add("inset-deep");

	const circle_radius_max = 50; // dwell indicator size in pixels
	const hover_timespan = 500; // how long between the dwell indicator appearing and triggering a click
	const averaging_window_timespan = 500;
	const inactive_at_startup_timespan = 1500; // (should be at least averaging_window_timespan, but more importantly enough to make it not awkward when enabling dwell clicking)
	const inactive_after_release_timespan = 1000; // after click or drag release (from dwell or otherwise)
	const inactive_after_hovered_timespan = 1000; // after dwell click indicator appears; does not control the time to finish that dwell click, only to click on something else after this is canceled (but it doesn't control that directly)
	const inactive_after_invalid_timespan = 1000; // after a dwell click is canceled due to an element popping up in front, or existing in front at the center of the other element
	const inactive_after_focused_timespan = 1000; // after page becomes focused after being unfocused
	let recent_points = [];
	let inactive_until_time = performance.now();
	let paused = false;
	let hover_candidate;
	let dwell_dragging = null;

	const deactivate_for_at_least = (timespan) => {
		inactive_until_time = Math.max(inactive_until_time, performance.now() + timespan);
	};
	deactivate_for_at_least(inactive_at_startup_timespan);

	const halo = document.createElement("div");
	halo.className = "tracky-mouse-hover-halo";
	halo.style.display = "none";
	document.body.appendChild(halo);
	const dwell_indicator = document.createElement("div");
	dwell_indicator.className = "tracky-mouse-dwell-indicator";
	dwell_indicator.style.width = `${circle_radius_max}px`;
	dwell_indicator.style.height = `${circle_radius_max}px`;
	dwell_indicator.style.display = "none";
	document.body.appendChild(dwell_indicator);

	const on_pointer_move = (e) => {
		recent_points.push({ x: e.clientX, y: e.clientY, time: performance.now() });
	};
	const on_pointer_up_or_cancel = (_e) => {
		deactivate_for_at_least(inactive_after_release_timespan);
		dwell_dragging = null;
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
			time: performance.now(),
		};

		let retargeted = false;
		for (const { from, to, withinMargin = Infinity } of (config.retarget ?? [])) {
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
			target = target.closest(config.targets);

			if (!target) {
				return null;
			}
		}

		if (!config.noCenter?.(target)) {
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

	const average_points = (points) => {
		const average = { x: 0, y: 0 };
		for (const pointer of points) {
			average.x += pointer.x;
			average.y += pointer.y;
		}
		average.x /= points.length;
		average.y /= points.length;
		return average;
	};

	const update = () => {
		const time = performance.now();
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
			// (that use case doesn't actually work in jspaint because the menu pops up before the hover_candidate exists)
			// (TODO: disable hovering to open submenus in facial mouse mode in jspaint)
			// or an element occludes the center of an element you're hovering over, in which case it
			// could be confusing if it showed a dwell click indicator over a different element than it would click
			// (but TODO: just move the indicator off center in that case)
			if (hover_candidate && !dwell_dragging) {
				const apparent_hover_candidate = get_hover_candidate(hover_candidate.x, hover_candidate.y);
				const show_occluder_indicator = (occluder) => {
					const occluder_indicator = document.createElement("div");
					const occluder_rect = occluder.getBoundingClientRect();
					const outline_width = 4;
					occluder_indicator.style.pointerEvents = "none";
					occluder_indicator.style.zIndex = 1000001;
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
						!config.isEquivalentTarget?.(
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
					(hover_candidate.time - time + hover_timespan) / hover_timespan
					* circle_radius_max;
				if (time > hover_candidate.time + hover_timespan) {
					if (config.isHeld?.() || dwell_dragging) {
						config.beforeDispatch?.();
						hover_candidate.target.dispatchEvent(new PointerEvent("pointerup",
							Object.assign(get_event_options(hover_candidate), {
								button: 0,
								buttons: 0,
							})
						));
						config.afterDispatch?.();
					} else {
						config.beforePointerDownDispatch?.();
						config.beforeDispatch?.();
						hover_candidate.target.dispatchEvent(new PointerEvent("pointerdown",
							Object.assign(get_event_options(hover_candidate), {
								button: 0,
								buttons: 1,
							})
						));
						config.afterDispatch?.();
						if (config.shouldDrag?.(hover_candidate.target)) {
							dwell_dragging = hover_candidate.target;
						} else {
							config.beforeDispatch?.();
							hover_candidate.target.dispatchEvent(new PointerEvent("pointerup",
								Object.assign(get_event_options(hover_candidate), {
									button: 0,
									buttons: 0,
								})
							));
							config.click(hover_candidate);
							config.afterDispatch?.();
						}
					}
					hover_candidate = null;
					deactivate_for_at_least(inactive_after_hovered_timespan);
				}
			}

			if (dwell_dragging) {
				dwell_indicator.classList.add("tracky-mouse-for-release");
			} else {
				dwell_indicator.classList.remove("tracky-mouse-for-release");
			}
			dwell_indicator.style.display = "";
			dwell_indicator.style.opacity = circle_opacity;
			dwell_indicator.style.transform = `scale(${circle_radius / circle_radius_max})`;
			dwell_indicator.style.left = `${circle_position.x - circle_radius_max / 2}px`;
			dwell_indicator.style.top = `${circle_position.y - circle_radius_max / 2}px`;

			let halo_target =
				dwell_dragging ||
				(hover_candidate || get_hover_candidate(latest_point.x, latest_point.y) || {}).target;

			if (halo_target && (!paused || config.dwellClickEvenIfPaused?.(halo_target))) {
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
				// Maybe instead of collecting scale transforms and applying them to the border radii specifically,
				// just collect transforms in general and apply them to the halo element?
				// But of course getBoundingClientRect() includes transforms...
				for (const prop of [
					"borderTopRightRadius",
					"borderTopLeftRadius",
					"borderBottomRightRadius",
					"borderBottomLeftRadius",
				]) {
					// Unfortunately, getComputedStyle can return percentages, probably other units, probably also "auto"
					if (computed_style[prop].endsWith("px")) {
						halo.style[prop] = `${parseFloat(computed_style[prop]) * border_radius_scale}px`;
					} else {
						halo.style[prop] = computed_style[prop];
					}
				}
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
						time: performance.now(),
						target: dwell_dragging || null,
					};
					if (!dwell_dragging) {
						hover_candidate = get_hover_candidate(hover_candidate.x, hover_candidate.y);
					}
					if (hover_candidate && (paused && !config.dwellClickEvenIfPaused?.(hover_candidate.target))) {
						hover_candidate = null;
					}
				}
			}
			if (recent_movement_amount > 100) {
				if (dwell_dragging) {
					config.beforeDispatch?.();
					window.dispatchEvent(new PointerEvent("pointerup",
						Object.assign(get_event_options(average_point), {
							button: 0,
							buttons: 0,
						})
					));
					config.afterDispatch?.();
					config.afterReleaseDrag?.();
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

	const dispose = () => {
		cancelAnimationFrame(raf_id);
		halo.remove();
		dwell_indicator.remove();
		window.removeEventListener("pointermove", on_pointer_move);
		window.removeEventListener("pointerup", on_pointer_up_or_cancel);
		window.removeEventListener("pointercancel", on_pointer_up_or_cancel);
		window.removeEventListener("focus", on_focus);
		window.removeEventListener("blur", on_blur);
		document.removeEventListener("mouseleave", on_mouse_leave_page);
		document.removeEventListener("mouseenter", on_mouse_enter_page);
	};

	const dwellClicker = {
		get paused() {
			return paused;
		},
		set paused(value) {
			paused = value;
		},
		dispose,
	};
	dwell_clickers.push(dwellClicker);
	return dwellClicker;
};

TrackyMouse.initDwellClicking = function (config) {
	return init_dwell_clicking(config);
};
TrackyMouse.cleanupDwellClicking = function () {
	for (const dwell_clicker of dwell_clickers) {
		dwell_clicker.dispose();
	}
};

TrackyMouse.init = function (div, { statsJs = false } = {}) {

	var uiContainer = div || document.createElement("div");
	uiContainer.classList.add("tracky-mouse-ui");
	uiContainer.innerHTML = `
		<div class="tracky-mouse-controls">
			<button class="tracky-mouse-start-stop-button" aria-pressed="false" aria-keyshortcuts="F9">Start</button>
			<br>
			<br>
			<label class="tracky-mouse-control-row">
				<span class="tracky-mouse-label-text">Horizontal Sensitivity</span>
				<span class="tracky-mouse-labeled-slider">
					<input type="range" min="0" max="100" value="25" class="tracky-mouse-sensitivity-x">
					<span class="tracky-mouse-min-label">Slow</span>
					<span class="tracky-mouse-max-label">Fast</span>
				</span>
			</label>
			<label class="tracky-mouse-control-row">
				<span class="tracky-mouse-label-text">Vertical Sensitivity</span>
				<span class="tracky-mouse-labeled-slider">
					<input type="range" min="0" max="100" value="50" class="tracky-mouse-sensitivity-y">
					<span class="tracky-mouse-min-label">Slow</span>
					<span class="tracky-mouse-max-label">Fast</span>
				</span>
			</label>
			<!-- <label class="tracky-mouse-control-row">
				<span class="tracky-mouse-label-text">Smoothing</span>
				<span class="tracky-mouse-labeled-slider">
					<input type="range" min="0" max="100" value="50" class="tracky-mouse-smoothing">
					<span class="tracky-mouse-min-label"></span>
					<span class="tracky-mouse-max-label"></span>
				</span>
			</label> -->
			<label class="tracky-mouse-control-row">
				<span class="tracky-mouse-label-text">Acceleration</span>
				<span class="tracky-mouse-labeled-slider">
					<input type="range" min="0" max="100" value="50" class="tracky-mouse-acceleration">
					<!-- TODO: "Linear" could be described as "Fast", and the other "Fast" labels are on the other side. Should it be swapped? What does other software with acceleration control look like? In Windows it's just a checkbox apparently, but it could go as far as a custom curve editor. -->
					<span class="tracky-mouse-min-label">Linear</span>
					<span class="tracky-mouse-max-label">Smooth</span>
				</span>
			</label>
			<!-- <label class="tracky-mouse-control-row">
				<span class="tracky-mouse-label-text">Easy Stop (min distance to move)</span>
				<span class="tracky-mouse-labeled-slider">
					<input type="range" min="0" max="100" value="50" class="tracky-mouse-min-distance">
					<span class="tracky-mouse-min-label">Jittery</span>
					<span class="tracky-mouse-max-label">Steady</span>
				</span>
			</label> -->
			<br>
			<!-- special interest: jspaint wants label not to use parent-child relationship so that os-gui's 98.css checkbox styles can work -->
			<!-- though this option might not be wanted in jspaint; might be good to hide it in the embedded case, or make it optional -->
			<!-- also TODO: add description of what this is for: on Windows, currently, when buttons are swapped at the system level, it affects serenade-driver's click() -->
			<!-- also this may be seen as a weirdly named/designed option for right-clicking -->
			<!-- btw: label is selected based on 'for' attribute -->
			<div class="tracky-mouse-control-row">
				<input type="checkbox" id="tracky-mouse-swap-mouse-buttons"/>
				<label for="tracky-mouse-swap-mouse-buttons"><span class="tracky-mouse-label-text">Swap mouse buttons</span></label>
			</div>
			<br>
			<!-- special interest: jspaint wants label not to use parent-child relationship so that os-gui's 98.css checkbox styles can work -->
			<!-- opposite, "Start paused", might be clearer, especially if I add a "pause" button -->
			<div class="tracky-mouse-control-row">
				<input type="checkbox" id="tracky-mouse-start-enabled"/>
				<label for="tracky-mouse-start-enabled"><span class="tracky-mouse-label-text">Start enabled</span></label>
			</div>
			<br>
			<!-- special interest: jspaint wants label not to use parent-child relationship so that os-gui's 98.css checkbox styles can work -->
			<div class="tracky-mouse-control-row">
				<input type="checkbox" id="tracky-mouse-run-at-login"/>
				<label for="tracky-mouse-run-at-login"><span class="tracky-mouse-label-text">Run at login</span></label>
			</div>
			<br>
			<!-- special interest: jspaint wants label not to use parent-child relationship so that os-gui's 98.css checkbox styles can work -->
			<!-- TODO: try moving this to the corner of the camera view, so it's clearer it applies only to the camera view -->
			<div class="tracky-mouse-control-row">
				<input type="checkbox" checked id="tracky-mouse-mirror"/>
				<label for="tracky-mouse-mirror"><span class="tracky-mouse-label-text">Mirror</span></label>
			</div>
			<br>
		</div>
		<div class="tracky-mouse-canvas-container-container">
			<div class="tracky-mouse-canvas-container">
				<div class="tracky-mouse-canvas-overlay">
					<button class="tracky-mouse-use-camera-button">Allow Camera Access</button>
					<!--<button class="tracky-mouse-use-camera-button">Use my camera</button>-->
					<button class="tracky-mouse-use-demo-footage-button" hidden>Use demo footage</button>
					<div class="tracky-mouse-error-message" role="alert" hidden></div>
				</div>
				<canvas class="tracky-mouse-canvas"></canvas>
			</div>
		</div>
		<p class="tracky-mouse-desktop-app-download-message">
			You can control your entire computer with the <a href="https://trackymouse.js.org/">TrackyMouse</a> desktop app.
		</p>
	`;
	if (!div) {
		document.body.appendChild(uiContainer);
	}
	var startStopButton = uiContainer.querySelector(".tracky-mouse-start-stop-button");
	var mirrorCheckbox = uiContainer.querySelector("#tracky-mouse-mirror");
	var swapMouseButtonsCheckbox = uiContainer.querySelector("#tracky-mouse-swap-mouse-buttons");
	var startEnabledCheckbox = uiContainer.querySelector("#tracky-mouse-start-enabled");
	var runAtLoginCheckbox = uiContainer.querySelector("#tracky-mouse-run-at-login");
	var swapMouseButtonsLabel = uiContainer.querySelector("label[for='tracky-mouse-swap-mouse-buttons']");
	var sensitivityXSlider = uiContainer.querySelector(".tracky-mouse-sensitivity-x");
	var sensitivityYSlider = uiContainer.querySelector(".tracky-mouse-sensitivity-y");
	var accelerationSlider = uiContainer.querySelector(".tracky-mouse-acceleration");
	var useCameraButton = uiContainer.querySelector(".tracky-mouse-use-camera-button");
	var useDemoFootageButton = uiContainer.querySelector(".tracky-mouse-use-demo-footage-button");
	var errorMessage = uiContainer.querySelector(".tracky-mouse-error-message");
	var canvasContainer = uiContainer.querySelector('.tracky-mouse-canvas-container');
	var desktopAppDownloadMessage = uiContainer.querySelector('.tracky-mouse-desktop-app-download-message');

	if (window.electronAPI) {
		// Hide the desktop app download message if we're in the desktop app
		// Might be good to also hide it, or change it, when on a mobile device
		desktopAppDownloadMessage.hidden = true;

		// Disable the "run at login" option if the app isn't packaged,
		// as it's not set up to work in development mode.
		window.electronAPI.getIsPackaged().then((isPackaged) => {
			runAtLoginCheckbox.disabled = !isPackaged;
		});
	} else {
		// Hide the mouse button swapping option if we're not in the desktop app,
		// since the system-level mouse button setting doesn't apply,
		// and the feature isn't implemented for the web version.
		// It could be implemented for the web version, but if you're designing an app for facial mouse users,
		// you might want to avoid right-clicking altogether.
		swapMouseButtonsCheckbox.parentElement.hidden = true;

		// Hide the "run at login" option if we're not in the desktop app.
		runAtLoginCheckbox.parentElement.hidden = true;
	}

	var canvas = uiContainer.querySelector(".tracky-mouse-canvas");
	var ctx = canvas.getContext('2d');

	var pointerEl = document.createElement('div');
	pointerEl.className = "tracky-mouse-pointer";
	pointerEl.style.display = "none";
	document.body.appendChild(pointerEl);

	var cameraVideo = document.createElement('video');
	// required to work in iOS 11 & up:
	cameraVideo.setAttribute('playsinline', '');

	if (statsJs) {
		var stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.right = '0px';
		stats.domElement.style.left = '';
		document.body.appendChild(stats.domElement);
	}

	var defaultWidth = 640;
	var defaultHeight = 480;
	var maxPoints = 1000;
	var mouseX = 0;
	var mouseY = 0;
	var prevMovementX = 0;
	var prevMovementY = 0;
	var enableTimeTravel = false;
	// var movementXSinceFacemeshUpdate = 0;
	// var movementYSinceFacemeshUpdate = 0;
	var cameraFramesSinceFacemeshUpdate = [];
	var sensitivityX;
	var sensitivityY;
	var acceleration;
	var face;
	var faceScore = 0;
	var faceScoreThreshold = 0.5;
	var faceConvergence = 0;
	// var faceConvergenceThreshold = 50;
	var pointsBasedOnFaceScore = 0;
	var paused = true;
	var mouseNeedsInitPos = true;
	var debugTimeTravel = false;
	var debugAcceleration = false;
	var showDebugText = false;
	var mirror;
	var startEnabled;
	var runAtLogin;
	var swapMouseButtons;

	var useClmTracking = true;
	var showClmTracking = useClmTracking;
	var useFacemesh = true;
	var facemeshOptions = {
		maxContinuousChecks: 5,
		detectionConfidence: 0.9,
		maxFaces: 1,
		iouThreshold: 0.3,
		scoreThreshold: 0.75
	};
	var fallbackTimeoutID;

	var facemeshLoaded = false;
	var facemeshFirstEstimation = true;
	var facemeshEstimating = false;
	var facemeshRejectNext = 0;
	var facemeshPrediction;
	var facemeshEstimateFaces;
	var faceInViewConfidenceThreshold = 0.7;
	var pointsBasedOnFaceInViewConfidence = 0;

	// scale of size of frames that are passed to worker and then computed several at once when backtracking for latency compensation
	// reducing this makes it much more likely to drop points and thus not work
	// THIS IS DISABLED and using a performance optimization of currentCameraImageData instead of getCameraImageData;
	// (the currentCameraImageData is also scaled differently, to the fixed canvas size instead of using the native camera image size)
	// const frameScaleForWorker = 1;

	var mainOops;
	var workerSyncedOops;

	// const frameCanvas = document.createElement("canvas");
	// const frameCtx = frameCanvas.getContext("2d");
	// const getCameraImageData = () => {
	// 	if (cameraVideo.videoWidth * frameScaleForWorker * cameraVideo.videoHeight * frameScaleForWorker < 1) {
	// 		return;
	// 	}
	// 	frameCanvas.width = cameraVideo.videoWidth * frameScaleForWorker;
	// 	frameCanvas.height = cameraVideo.videoHeight * frameScaleForWorker;
	// 	frameCtx.drawImage(cameraVideo, 0, 0, frameCanvas.width, frameCanvas.height);
	// 	return frameCtx.getImageData(0, 0, frameCanvas.width, frameCanvas.height);
	// };

	let currentCameraImageData;
	let facemeshWorker;
	const initFacemeshWorker = () => {
		if (facemeshWorker) {
			facemeshWorker.terminate();
		}
		facemeshEstimating = false;
		facemeshFirstEstimation = true;
		facemeshLoaded = false;
		facemeshWorker = new Worker(`${TrackyMouse.dependenciesRoot}/facemesh.worker.js`);
		facemeshWorker.addEventListener("message", (e) => {
			// console.log('Message received from worker', e.data);
			if (e.data.type === "LOADED") {
				facemeshLoaded = true;
				facemeshEstimateFaces = () => {
					const imageData = currentCameraImageData;//getCameraImageData();
					if (!imageData) {
						return;
					}
					facemeshWorker.postMessage({ type: "ESTIMATE_FACES", imageData });
					return new Promise((resolve, _reject) => {
						facemeshWorker.addEventListener("message", (e) => {
							if (e.data.type === "ESTIMATED_FACES") {
								resolve(e.data.predictions);
							}
						}, { once: true });
					});
				};
			}
		}, { once: true });
		facemeshWorker.postMessage({ type: "LOAD", options: facemeshOptions });
	};

	if (useFacemesh) {
		initFacemeshWorker();
	}

	function deserializeSettings(settings, initialLoad = false) {
		// TODO: DRY with deserializeSettings in electron-main.js
		if ("globalSettings" in settings) {
			// Don't use `in` here. Must ignore `undefined` values for the settings to default to the HTML template's defaults in the Electron app.
			if (settings.globalSettings.swapMouseButtons !== undefined) {
				swapMouseButtons = settings.globalSettings.swapMouseButtons;
				swapMouseButtonsCheckbox.checked = swapMouseButtons;
			}
			if (settings.globalSettings.mirrorCameraView !== undefined) {
				mirror = settings.globalSettings.mirrorCameraView;
				mirrorCheckbox.checked = mirror;
			}
			if (settings.globalSettings.headTrackingSensitivityX !== undefined) {
				sensitivityX = settings.globalSettings.headTrackingSensitivityX;
				sensitivityXSlider.value = sensitivityX * 1000;
			}
			if (settings.globalSettings.headTrackingSensitivityY !== undefined) {
				sensitivityY = settings.globalSettings.headTrackingSensitivityY;
				sensitivityYSlider.value = sensitivityY * 1000;
			}
			if (settings.globalSettings.headTrackingAcceleration !== undefined) {
				acceleration = settings.globalSettings.headTrackingAcceleration;
				accelerationSlider.value = acceleration * 100;
			}
			if (settings.globalSettings.startEnabled !== undefined) {
				startEnabled = settings.globalSettings.startEnabled;
				startEnabledCheckbox.checked = startEnabled;
				if (initialLoad) {
					paused = !startEnabled;
				}
			}
			if (settings.globalSettings.runAtLogin !== undefined) {
				runAtLogin = settings.globalSettings.runAtLogin;
				runAtLoginCheckbox.checked = runAtLogin;
			}
		}
	}
	const formatVersion = 1;
	const formatName = "tracky-mouse-settings";
	function serializeSettings() {
		// TODO: DRY with serializeSettings in electron-main.js
		return {
			formatVersion,
			formatName,
			globalSettings: {
				startEnabled,
				runAtLogin,
				swapMouseButtons,
				mirrorCameraView: mirror,
				headTrackingSensitivityX: sensitivityX,
				headTrackingSensitivityY: sensitivityY,
				headTrackingAcceleration: acceleration,
				// TODO:
				// eyeTrackingSensitivityX,
				// eyeTrackingSensitivityY,
				// eyeTrackingAcceleration,
			},
			// profiles: [],
		};
	};
	const setOptions = (options) => {
		if (window.electronAPI) {
			window.electronAPI.setOptions(options);
		} else {
			try {
				localStorage.setItem("tracky-mouse-settings", JSON.stringify(serializeSettings(), null, "\t"));
			} catch (e) {
				console.error(e);
			}
		}
	};
	const loadOptions = async (initialLoad = false) => {
		if (window.electronAPI) {
			deserializeSettings(await window.electronAPI.getOptions(), initialLoad);
		} else {
			try {
				if (localStorage.getItem("tracky-mouse-settings")) {
					deserializeSettings(JSON.parse(localStorage.getItem("tracky-mouse-settings")), initialLoad);
				}
			} catch (e) {
				console.error(e);
			}
		}
	};

	sensitivityXSlider.onchange = (event) => {
		sensitivityX = sensitivityXSlider.value / 1000;
		// HACK: using event argument as a flag to indicate when it's not the initial setup,
		// to avoid saving the default settings before the actual preferences are loaded.
		if (event) {
			setOptions({ globalSettings: { headTrackingSensitivityX: sensitivityX } });
		}
	};
	sensitivityYSlider.onchange = (event) => {
		sensitivityY = sensitivityYSlider.value / 1000;
		// HACK: using event argument as a flag to indicate when it's not the initial setup,
		// to avoid saving the default settings before the actual preferences are loaded.
		if (event) {
			setOptions({ globalSettings: { headTrackingSensitivityY: sensitivityY } });
		}
	};
	accelerationSlider.onchange = (event) => {
		acceleration = accelerationSlider.value / 100;
		// HACK: using event argument as a flag to indicate when it's not the initial setup,
		// to avoid saving the default settings before the actual preferences are loaded.
		if (event) {
			setOptions({ globalSettings: { headTrackingAcceleration: acceleration } });
		}
	};
	mirrorCheckbox.onchange = (event) => {
		mirror = mirrorCheckbox.checked;
		// HACK: using event argument as a flag to indicate when it's not the initial setup,
		// to avoid saving the default settings before the actual preferences are loaded.
		if (event) {
			setOptions({ globalSettings: { mirrorCameraView: mirror } });
		}
	};
	swapMouseButtonsCheckbox.onchange = (event) => {
		swapMouseButtons = swapMouseButtonsCheckbox.checked;
		// HACK: using event argument as a flag to indicate when it's not the initial setup,
		// to avoid saving the default settings before the actual preferences are loaded.
		if (event) {
			setOptions({ globalSettings: { swapMouseButtons } });
		}
	};
	startEnabledCheckbox.onchange = (event) => {
		startEnabled = startEnabledCheckbox.checked;
		// HACK: using event argument as a flag to indicate when it's not the initial setup,
		// to avoid saving the default settings before the actual preferences are loaded.
		if (event) {
			setOptions({ globalSettings: { startEnabled } });
		}
	};
	runAtLoginCheckbox.onchange = (event) => {
		runAtLogin = runAtLoginCheckbox.checked;
		// HACK: using event argument as a flag to indicate when it's not the initial setup,
		// to avoid saving the default settings before the actual preferences are loaded.
		if (event) {
			setOptions({ globalSettings: { runAtLogin } });
		}
	};

	// Load defaults from HTML
	mirrorCheckbox.onchange();
	swapMouseButtonsCheckbox.onchange();
	startEnabledCheckbox.onchange();
	runAtLoginCheckbox.onchange();
	sensitivityXSlider.onchange();
	sensitivityYSlider.onchange();
	accelerationSlider.onchange();
	paused = !startEnabled;

	// Handle right click on "swap mouse buttons", so it doesn't leave users stranded right-clicking.
	// Note that if you click outside the application window, hiding it behind another window, or minimize it,
	// you can still be left in a tricky situation.
	// A more general safety net would be a "revert changes?" timer (https://github.com/1j01/tracky-mouse/issues/43)
	// But this is good to have in any case, since you don't want to have to wait for a timeout if you don't have to.
	for (const el of [swapMouseButtonsLabel, swapMouseButtonsCheckbox]) {
		el.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			swapMouseButtonsCheckbox.checked = !swapMouseButtonsCheckbox.checked;
			swapMouseButtonsCheckbox.onchange(e);
		});
	}

	const settingsLoadedPromise = loadOptions(true);

	// Don't use WebGL because clmTracker is our fallback! It's also not much slower than with WebGL.
	var clmTracker = new clm.tracker({ useWebGL: false });
	clmTracker.init();
	var clmTrackingStarted = false;

	const reset = () => {
		clmTrackingStarted = false;
		cameraFramesSinceFacemeshUpdate.length = 0;
		if (facemeshPrediction) {
			// facemesh has a setting maxContinuousChecks that determines "How many frames to go without running
			// the bounding box detector. Only relevant if maxFaces > 1. Defaults to 5."
			facemeshRejectNext = facemeshOptions.maxContinuousChecks;
		}
		facemeshPrediction = null;
		useClmTracking = true;
		showClmTracking = true;
		pointsBasedOnFaceScore = 0;
		faceScore = 0;
		faceConvergence = 0;

		startStopButton.textContent = "Start";
		startStopButton.setAttribute("aria-pressed", "false");
	};

	useCameraButton.onclick = TrackyMouse.useCamera = () => {
		navigator.mediaDevices.getUserMedia({
			audio: false,
			video: {
				width: defaultWidth,
				height: defaultHeight,
				facingMode: "user",
			}
		}).then((stream) => {
			reset();
			try {
				if ('srcObject' in cameraVideo) {
					cameraVideo.srcObject = stream;
				} else {
					cameraVideo.src = window.URL.createObjectURL(stream);
				}
			} catch (_err) {
				cameraVideo.src = stream;
			}
			useCameraButton.hidden = true;
			errorMessage.hidden = true;
			if (!paused) {
				startStopButton.textContent = "Stop";
				startStopButton.setAttribute("aria-pressed", "true");
			}
		}, (error) => {
			console.log(error);
			if (error.name == "NotFoundError" || error.name == "DevicesNotFoundError") {
				// required track is missing
				errorMessage.textContent = "No camera found. Please make sure you have a camera connected and enabled.";
			} else if (error.name == "NotReadableError" || error.name == "TrackStartError") {
				// webcam is already in use
				errorMessage.textContent = "Webcam is already in use. Please make sure you have no other programs using the camera.";
			} else if (error.name == "OverconstrainedError" || error.name == "ConstraintNotSatisfiedError") {
				// constraints can not be satisfied by avb. devices
				errorMessage.textContent = "Webcam does not support the required resolution. Please change your settings.";
			} else if (error.name == "NotAllowedError" || error.name == "PermissionDeniedError") {
				// permission denied in browser
				errorMessage.textContent = "Permission denied. Please enable access to the camera.";
			} else if (error.name == "TypeError") {
				// empty constraints object
				errorMessage.textContent = `Something went wrong accessing the camera. (${error.name}: ${error.message})`;
			} else {
				// other errors
				errorMessage.textContent = `Something went wrong accessing the camera. Please try again. (${error.name}: ${error.message})`;
			}
			errorMessage.textContent = `⚠️ ${errorMessage.textContent}`;
			errorMessage.hidden = false;
		});
	};
	useDemoFootageButton.onclick = TrackyMouse.useDemoFootage = () => {
		reset();
		cameraVideo.srcObject = null;
		cameraVideo.src = `${TrackyMouse.dependenciesRoot}/private/demo-input-footage.webm`;
		cameraVideo.loop = true;
	};

	startStopButton.onclick = () => {
		if (!useCameraButton.hidden) {
			TrackyMouse.useCamera();
			if (!paused) {
				return;
			}
		}
		handleShortcut("toggle-tracking");
	};

	if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
		console.log('getUserMedia not supported in this browser');
	}

	canvasContainer.style.aspectRatio = `${defaultWidth} / ${defaultHeight}`;
	canvasContainer.style.setProperty('--aspect-ratio', defaultWidth / defaultHeight);

	cameraVideo.addEventListener('loadedmetadata', () => {
		cameraVideo.play();
		cameraVideo.width = cameraVideo.videoWidth;
		cameraVideo.height = cameraVideo.videoHeight;
		canvas.width = cameraVideo.videoWidth;
		canvas.height = cameraVideo.videoHeight;
		debugFramesCanvas.width = cameraVideo.videoWidth;
		debugFramesCanvas.height = cameraVideo.videoHeight;
		debugPointsCanvas.width = cameraVideo.videoWidth;
		debugPointsCanvas.height = cameraVideo.videoHeight;

		// .tracky-mouse-canvas-container needs aspect-ratio CSS property
		// so that the video can be scaled to fit the container.
		canvasContainer.style.aspectRatio = `${cameraVideo.videoWidth} / ${cameraVideo.videoHeight}`;
		canvasContainer.style.setProperty('--aspect-ratio', cameraVideo.videoWidth / cameraVideo.videoHeight);

		mainOops = new OOPS();
		if (useFacemesh) {
			workerSyncedOops = new OOPS();
		}
	});
	cameraVideo.addEventListener('play', () => {
		clmTracker.reset();
		clmTracker.initFaceDetector(cameraVideo);
		clmTrackingStarted = true;
	});
	cameraVideo.addEventListener('ended', () => {
		useCameraButton.hidden = false;
		if (!paused) {
			handleShortcut("toggle-tracking");
		}
	});
	cameraVideo.addEventListener('error', () => {
		useCameraButton.hidden = false;
		if (!paused) {
			handleShortcut("toggle-tracking");
		}
	});

	canvas.width = defaultWidth;
	canvas.height = defaultHeight;
	cameraVideo.width = defaultWidth;
	cameraVideo.height = defaultHeight;

	const debugFramesCanvas = document.createElement("canvas");
	debugFramesCanvas.width = canvas.width;
	debugFramesCanvas.height = canvas.height;
	const debugFramesCtx = debugFramesCanvas.getContext("2d");

	const debugPointsCanvas = document.createElement("canvas");
	debugPointsCanvas.width = canvas.width;
	debugPointsCanvas.height = canvas.height;
	const debugPointsCtx = debugPointsCanvas.getContext("2d");

	// function getPyramidData(pyramid) {
	// 	const array = new Float32Array(pyramid.data.reduce((sum, matrix)=> sum + matrix.buffer.f32.length, 0));
	// 	let offset = 0;
	// 	for (const matrix of pyramid.data) {
	// 		copy matrix.buffer.f32 into array starting at offset;
	// 		offset += matrix.buffer.f32.length;
	// 	}
	// 	return array;
	// }
	// function setPyramidData(pyramid, array) {
	// 	let offset = 0;
	// 	for (const matrix of pyramid.data) {
	// 		copy portion of array starting at offset into matrix.buffer.f32
	// 		offset += matrix.buffer.f32.length;
	// 	}
	// }

	// maybe should be based on size of head in view?
	const pruningGridSize = 5;
	const minDistanceToAddPoint = pruningGridSize * 1.5;

	// Object Oriented Programming Sucks
	// or Optical flOw Points System
	class OOPS {
		constructor() {
			this.curPyramid = new jsfeat.pyramid_t(3);
			this.prevPyramid = new jsfeat.pyramid_t(3);
			this.curPyramid.allocate(cameraVideo.videoWidth, cameraVideo.videoHeight, jsfeat.U8C1_t);
			this.prevPyramid.allocate(cameraVideo.videoWidth, cameraVideo.videoHeight, jsfeat.U8C1_t);

			this.pointCount = 0;
			this.pointStatus = new Uint8Array(maxPoints);
			this.prevXY = new Float32Array(maxPoints * 2);
			this.curXY = new Float32Array(maxPoints * 2);
		}
		addPoint(x, y) {
			if (this.pointCount < maxPoints) {
				var pointIndex = this.pointCount * 2;
				this.curXY[pointIndex] = x;
				this.curXY[pointIndex + 1] = y;
				this.prevXY[pointIndex] = x;
				this.prevXY[pointIndex + 1] = y;
				this.pointCount++;
			}
		}
		filterPoints(condition) {
			var outputPointIndex = 0;
			for (var inputPointIndex = 0; inputPointIndex < this.pointCount; inputPointIndex++) {
				if (condition(inputPointIndex)) {
					if (outputPointIndex < inputPointIndex) {
						const inputOffset = inputPointIndex * 2;
						const outputOffset = outputPointIndex * 2;
						this.curXY[outputOffset] = this.curXY[inputOffset];
						this.curXY[outputOffset + 1] = this.curXY[inputOffset + 1];
						this.prevXY[outputOffset] = this.prevXY[inputOffset];
						this.prevXY[outputOffset + 1] = this.prevXY[inputOffset + 1];
					}
					outputPointIndex++;
				} else {
					debugPointsCtx.fillStyle = "red";
					const inputOffset = inputPointIndex * 2;
					circle(debugPointsCtx, this.curXY[inputOffset], this.curXY[inputOffset + 1], 5);
					debugPointsCtx.fillText(condition.toString(), 5 + this.curXY[inputOffset], this.curXY[inputOffset + 1]);
					// console.log(this.curXY[inputOffset], this.curXY[inputOffset + 1]);
					ctx.strokeStyle = ctx.fillStyle;
					ctx.beginPath();
					ctx.moveTo(this.prevXY[inputOffset], this.prevXY[inputOffset + 1]);
					ctx.lineTo(this.curXY[inputOffset], this.curXY[inputOffset + 1]);
					ctx.stroke();
				}
			}
			this.pointCount = outputPointIndex;
		}
		prunePoints() {
			// pointStatus is only valid (indices line up) before filtering occurs, so must come first (could be combined though)
			this.filterPoints((pointIndex) => this.pointStatus[pointIndex] == 1);

			// De-duplicate points that are too close together
			// - Points that have collapsed together are completely useless.
			// - Points that are too close together are not necessarily helpful,
			//   and may adversely affect the tracking due to uneven weighting across your face.
			// - Reducing the number of points improves FPS.
			const grid = {};
			for (let pointIndex = 0; pointIndex < this.pointCount; pointIndex++) {
				const pointOffset = pointIndex * 2;
				grid[`${~~(this.curXY[pointOffset] / pruningGridSize)},${~~(this.curXY[pointOffset + 1] / pruningGridSize)}`] = pointIndex;
			}
			const indexesToKeep = Object.values(grid);
			this.filterPoints((pointIndex) => indexesToKeep.includes(pointIndex));
		}
		update(imageData) {
			[this.prevXY, this.curXY] = [this.curXY, this.prevXY];
			[this.prevPyramid, this.curPyramid] = [this.curPyramid, this.prevPyramid];

			// these are options worth breaking out and exploring
			var winSize = 20;
			var maxIterations = 30;
			var epsilon = 0.01;
			var minEigen = 0.001;

			jsfeat.imgproc.grayscale(imageData.data, imageData.width, imageData.height, this.curPyramid.data[0]);
			this.curPyramid.build(this.curPyramid.data[0], true);
			jsfeat.optical_flow_lk.track(
				this.prevPyramid, this.curPyramid,
				this.prevXY, this.curXY,
				this.pointCount,
				winSize, maxIterations,
				this.pointStatus,
				epsilon, minEigen);
			this.prunePoints();
		}
		draw(ctx) {
			for (var i = 0; i < this.pointCount; i++) {
				var pointOffset = i * 2;
				// var distMoved = Math.hypot(
				// 	this.prevXY[pointOffset] - this.curXY[pointOffset],
				// 	this.prevXY[pointOffset + 1] - this.curXY[pointOffset + 1]
				// );
				// if (distMoved >= 1) {
				// 	ctx.fillStyle = "lime";
				// } else {
				// 	ctx.fillStyle = "gray";
				// }
				circle(ctx, this.curXY[pointOffset], this.curXY[pointOffset + 1], 3);
				ctx.strokeStyle = ctx.fillStyle;
				ctx.beginPath();
				ctx.moveTo(this.prevXY[pointOffset], this.prevXY[pointOffset + 1]);
				ctx.lineTo(this.curXY[pointOffset], this.curXY[pointOffset + 1]);
				ctx.stroke();
			}
		}
		getMovement() {
			var movementX = 0;
			var movementY = 0;
			var numMovements = 0;
			for (var i = 0; i < this.pointCount; i++) {
				var pointOffset = i * 2;
				movementX += this.curXY[pointOffset] - this.prevXY[pointOffset];
				movementY += this.curXY[pointOffset + 1] - this.prevXY[pointOffset + 1];
				numMovements += 1;
			}
			if (numMovements > 0) {
				movementX /= numMovements;
				movementY /= numMovements;
			}
			return [movementX, movementY];
		}
	}

	canvas.addEventListener('click', (event) => {
		if (!mainOops) {
			return;
		}
		const rect = canvas.getBoundingClientRect();
		if (mirror) {
			mainOops.addPoint(
				(rect.right - event.clientX) / rect.width * canvas.width,
				(event.clientY - rect.top) / rect.height * canvas.height,
			);
		} else {
			mainOops.addPoint(
				(event.clientX - rect.left) / rect.width * canvas.width,
				(event.clientY - rect.top) / rect.height * canvas.height,
			);
		}
	});

	function maybeAddPoint(oops, x, y) {
		// In order to prefer points that already exist, since they're already tracking,
		// in order to keep a smooth overall tracking calculation,
		// don't add points if they're close to an existing point.
		// Otherwise, it would not just be redundant, but often remove the older points, in the pruning.
		for (var pointIndex = 0; pointIndex < oops.pointCount; pointIndex++) {
			var pointOffset = pointIndex * 2;
			// var distance = Math.hypot(
			// 	x - oops.curXY[pointOffset],
			// 	y - oops.curXY[pointOffset + 1]
			// );
			// if (distance < 8) {
			// 	return;
			// }
			// It might be good to base this on the size of the face...
			// Also, since we're pruning points based on a grid,
			// there's not much point in using Euclidean distance here,
			// we can just look at x and y distances.
			if (
				Math.abs(x - oops.curXY[pointOffset]) <= minDistanceToAddPoint ||
				Math.abs(y - oops.curXY[pointOffset + 1]) <= minDistanceToAddPoint
			) {
				return;
			}
		}
		oops.addPoint(x, y);
	}

	function draw(update = true) {
		ctx.resetTransform(); // in case there is an error, don't flip constantly back and forth due to mirroring
		ctx.clearRect(0, 0, canvas.width, canvas.height); // in case there's no footage
		ctx.save();
		ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		currentCameraImageData = imageData;

		if (mirror) {
			ctx.translate(canvas.width, 0);
			ctx.scale(-1, 1);
			ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
		}

		if (!mainOops) {
			return;
		}

		if (update) {
			if (clmTrackingStarted) {
				if (useClmTracking || showClmTracking) {
					try {
						clmTracker.track(cameraVideo);
					} catch (error) {
						console.warn("Error in clmTracker.track()", error);
						if (clmTracker.getCurrentParameters().includes(NaN)) {
							console.warn("NaNs crept in.");
						}
					}
					face = clmTracker.getCurrentPosition();
					faceScore = clmTracker.getScore();
					faceConvergence = Math.pow(clmTracker.getConvergence(), 0.5);
				}
				if (facemeshLoaded && !facemeshEstimating) {
					facemeshEstimating = true;
					// movementXSinceFacemeshUpdate = 0;
					// movementYSinceFacemeshUpdate = 0;
					cameraFramesSinceFacemeshUpdate = [];
					// If I switch virtual console desktop sessions in Ubuntu with Ctrl+Alt+F1 (and back with Ctrl+Alt+F2),
					// WebGL context is lost, which breaks facemesh (and clmTracker if useWebGL is not false)
					// Error: Size(8192) must match the product of shape 0, 0, 0
					//     at inferFromImplicitShape (tf.js:14142)
					//     at Object.reshape$3 [as kernelFunc] (tf.js:110368)
					//     at kernelFunc (tf.js:17241)
					//     at tf.js:17334
					//     at Engine.scopedRun (tf.js:17094)
					//     at Engine.runKernelFunc (tf.js:17328)
					//     at Engine.runKernel (tf.js:17171)
					//     at reshape_ (tf.js:25875)
					//     at reshape__op (tf.js:18348)
					//     at executeOp (tf.js:85396)
					// WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost

					// Note that the first estimation from facemesh often takes a while,
					// and we don't want to continuously terminate the worker as it's working on those first results.
					// And also, for the first estimate it hasn't actually disabled clmtrackr yet, so it's fine if it's a long timeout.
					clearTimeout(fallbackTimeoutID);
					fallbackTimeoutID = setTimeout(() => {
						if (!useClmTracking) {
							reset();
							clmTracker.init();
							clmTracker.reset();
							clmTracker.initFaceDetector(cameraVideo);
							clmTrackingStarted = true;
							console.warn("Falling back to clmtrackr");
						}
						// If you've switched desktop sessions, it will presumably fail to get a new webgl context until you've switched back
						// Is this setInterval useful, vs just starting the worker?
						// It probably has a faster cycle, with the code as it is now, but maybe not inherently.
						// TODO: do the extra getContext() calls add to a GPU process crash limit
						// that makes it only able to recover a couple times (outside the electron app)?
						// For electron, I set chromium flag --disable-gpu-process-crash-limit so it can recover unlimited times.
						// TODO: there's still the case of WebGL backend failing to initialize NOT due to the process crash limit,
						// where it'd be good to have it try again (maybe with exponential falloff?)
						// (I think I can move my fallbackTimeout code into/around `initFacemeshWorker` and `facemeshEstimateFaces`)

						// Note: clearTimeout/clearInterval work interchangeably
						fallbackTimeoutID = setInterval(() => {
							try {
								// Once we can create a webgl2 canvas...
								document.createElement("canvas").getContext("webgl2");
								clearInterval(fallbackTimeoutID);
								// It's worth trying to re-initialize...
								setTimeout(() => {
									console.warn("Re-initializing facemesh worker");
									initFacemeshWorker();
									facemeshRejectNext = 1; // or more?
								}, 1000);
							} catch (error) {
								if (error.name !== "InvalidStateError") {
									throw error;
								} else {
									console.warn("Trying to recover; can't create webgl2 canvas yet...");
								}
							}
						}, 500);
					}, facemeshFirstEstimation ? 20000 : 2000);
					facemeshEstimateFaces().then((predictions) => {
						facemeshEstimating = false;
						facemeshFirstEstimation = false;

						facemeshRejectNext -= 1;
						if (facemeshRejectNext > 0) {
							return;
						}

						facemeshPrediction = predictions[0]; // undefined if no faces found

						useClmTracking = false;
						showClmTracking = false;
						clearTimeout(fallbackTimeoutID);

						if (!facemeshPrediction) {
							return;
						}
						// this applies to facemeshPrediction.annotations as well, which references the same points
						// facemeshPrediction.scaledMesh.forEach((point) => {
						// 	point[0] /= frameScaleForWorker;
						// 	point[1] /= frameScaleForWorker;
						// });

						// time travel latency compensation
						// keep a history of camera frames since the prediction was requested,
						// and analyze optical flow of new points over that history

						// mainOops.filterPoints(() => false); // for DEBUG, empty points (could probably also just set pointCount = 0;

						workerSyncedOops.filterPoints(() => false); // empty points (could probably also just set pointCount = 0;

						const { annotations } = facemeshPrediction;
						// nostrils
						workerSyncedOops.addPoint(annotations.noseLeftCorner[0][0], annotations.noseLeftCorner[0][1]);
						workerSyncedOops.addPoint(annotations.noseRightCorner[0][0], annotations.noseRightCorner[0][1]);
						// midway between eyes
						workerSyncedOops.addPoint(annotations.midwayBetweenEyes[0][0], annotations.midwayBetweenEyes[0][1]);
						// inner eye corners
						// workerSyncedOops.addPoint(annotations.leftEyeLower0[8][0], annotations.leftEyeLower0[8][1]);
						// workerSyncedOops.addPoint(annotations.rightEyeLower0[8][0], annotations.rightEyeLower0[8][1]);

						// console.log(workerSyncedOops.pointCount, cameraFramesSinceFacemeshUpdate.length, workerSyncedOops.curXY);
						if (enableTimeTravel) {
							debugFramesCtx.clearRect(0, 0, debugFramesCanvas.width, debugFramesCanvas.height);
							setTimeout(() => {
								debugPointsCtx.clearRect(0, 0, debugPointsCanvas.width, debugPointsCanvas.height);
							}, 900);
							cameraFramesSinceFacemeshUpdate.forEach((imageData, _index) => {
								/*
								if (debugTimeTravel) {
									debugFramesCtx.save();
									debugFramesCtx.globalAlpha = 0.1;
									// debugFramesCtx.globalCompositeOperation = index % 2 === 0 ? "xor" : "xor";
									frameCtx.putImageData(imageData, 0, 0);
									// debugFramesCtx.putImageData(imageData, 0, 0);
									debugFramesCtx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
									debugFramesCtx.restore();
									debugPointsCtx.fillStyle = "aqua";
									workerSyncedOops.draw(debugPointsCtx);
								}
								*/
								workerSyncedOops.update(imageData);
							});
						}

						// Bring points from workerSyncedOops to realtime mainOops
						for (var pointIndex = 0; pointIndex < workerSyncedOops.pointCount; pointIndex++) {
							const pointOffset = pointIndex * 2;
							maybeAddPoint(mainOops, workerSyncedOops.curXY[pointOffset], workerSyncedOops.curXY[pointOffset + 1]);
						}
						// Don't do this! It's not how this is supposed to work.
						// mainOops.pointCount = workerSyncedOops.pointCount;
						// for (var pointIndex = 0; pointIndex < workerSyncedOops.pointCount; pointIndex++) {
						// 	const pointOffset = pointIndex * 2;
						// 	mainOops.curXY[pointOffset] = workerSyncedOops.curXY[pointOffset];
						// 	mainOops.curXY[pointOffset+1] = workerSyncedOops.curXY[pointOffset+1];
						// 	mainOops.prevXY[pointOffset] = workerSyncedOops.prevXY[pointOffset];
						// 	mainOops.prevXY[pointOffset+1] = workerSyncedOops.prevXY[pointOffset+1];
						// }

						// naive latency compensation
						// Note: this applies to facemeshPrediction.annotations as well which references the same point objects
						// Note: This latency compensation only really works if it's already tracking well
						// if (prevFaceInViewConfidence > 0.99) {
						// 	facemeshPrediction.scaledMesh.forEach((point) => {
						// 		point[0] += movementXSinceFacemeshUpdate;
						// 		point[1] += movementYSinceFacemeshUpdate;
						// 	});
						// }

						pointsBasedOnFaceInViewConfidence = facemeshPrediction.faceInViewConfidence;

						// TODO: separate confidence threshold for removing vs adding points?

						// cull points to those within useful facial region
						// TODO: use time travel for this too, probably! with a history of the points
						// a complexity would be that points can be removed over time and we need to keep them identified
						mainOops.filterPoints((pointIndex) => {
							var pointOffset = pointIndex * 2;
							// distance from tip of nose (stretched so make an ellipse taller than wide)
							var distance = Math.hypot(
								(annotations.noseTip[0][0] - mainOops.curXY[pointOffset]) * 1.4,
								annotations.noseTip[0][1] - mainOops.curXY[pointOffset + 1]
							);
							var headSize = Math.hypot(
								annotations.leftCheek[0][0] - annotations.rightCheek[0][0],
								annotations.leftCheek[0][1] - annotations.rightCheek[0][1]
							);
							if (distance > headSize) {
								return false;
							}
							// Avoid blinking eyes affecting pointer position.
							// distance to outer corners of eyes
							distance = Math.min(
								Math.hypot(
									annotations.leftEyeLower0[0][0] - mainOops.curXY[pointOffset],
									annotations.leftEyeLower0[0][1] - mainOops.curXY[pointOffset + 1]
								),
								Math.hypot(
									annotations.rightEyeLower0[0][0] - mainOops.curXY[pointOffset],
									annotations.rightEyeLower0[0][1] - mainOops.curXY[pointOffset + 1]
								),
							);
							if (distance < headSize * 0.42) {
								return false;
							}
							return true;
						});
					}, () => {
						facemeshEstimating = false;
						facemeshFirstEstimation = false;
					});
				}
			}
			mainOops.update(imageData);
		}

		if (window.electronAPI) {
			window.electronAPI.notifyCameraFeedDiagnostics({ headNotFound: !face && !facemeshPrediction });
		}

		if (facemeshPrediction) {
			ctx.fillStyle = "red";

			const bad = facemeshPrediction.faceInViewConfidence < faceInViewConfidenceThreshold;
			ctx.fillStyle = bad ? 'rgb(255,255,0)' : 'rgb(130,255,50)';
			if (!bad || mainOops.pointCount < 3 || facemeshPrediction.faceInViewConfidence > pointsBasedOnFaceInViewConfidence + 0.05) {
				if (bad) {
					ctx.fillStyle = 'rgba(255,0,255)';
				}
				if (update && useFacemesh) {
					// this should just be visual, since we only add/remove points based on the facemesh data when receiving it
					facemeshPrediction.scaledMesh.forEach((point) => {
						point[0] += prevMovementX;
						point[1] += prevMovementY;
					});
				}
				facemeshPrediction.scaledMesh.forEach(([x, y, _z]) => {
					ctx.fillRect(x, y, 1, 1);
				});
			} else {
				if (update && useFacemesh) {
					pointsBasedOnFaceInViewConfidence -= 0.001;
				}
			}
		}

		if (face) {
			const bad = faceScore < faceScoreThreshold;
			ctx.strokeStyle = bad ? 'rgb(255,255,0)' : 'rgb(130,255,50)';
			if (!bad || mainOops.pointCount < 2 || faceScore > pointsBasedOnFaceScore + 0.05) {
				if (bad) {
					ctx.strokeStyle = 'rgba(255,0,255)';
				}
				if (update && useClmTracking) {
					pointsBasedOnFaceScore = faceScore;

					// nostrils
					maybeAddPoint(mainOops, face[42][0], face[42][1]);
					maybeAddPoint(mainOops, face[43][0], face[43][1]);
					// inner eye corners
					// maybeAddPoint(mainOops, face[25][0], face[25][1]);
					// maybeAddPoint(mainOops, face[30][0], face[30][1]);

					// TODO: separate confidence threshold for removing vs adding points?

					// cull points to those within useful facial region
					mainOops.filterPoints((pointIndex) => {
						var pointOffset = pointIndex * 2;
						// distance from tip of nose (stretched so make an ellipse taller than wide)
						var distance = Math.hypot(
							(face[62][0] - mainOops.curXY[pointOffset]) * 1.4,
							face[62][1] - mainOops.curXY[pointOffset + 1]
						);
						// distance based on outer eye corners
						var headSize = Math.hypot(
							face[23][0] - face[28][0],
							face[23][1] - face[28][1]
						);
						if (distance > headSize) {
							return false;
						}
						return true;
					});
				}
			} else {
				if (update && useClmTracking) {
					pointsBasedOnFaceScore -= 0.001;
				}
			}
			if (showClmTracking) {
				clmTracker.draw(canvas, undefined, undefined, true);
			}
		}
		if (debugTimeTravel) {
			ctx.save();
			ctx.globalAlpha = 0.8;
			ctx.drawImage(debugFramesCanvas, 0, 0);
			ctx.restore();
			ctx.drawImage(debugPointsCanvas, 0, 0);
		}
		ctx.fillStyle = "lime";
		mainOops.draw(ctx);
		debugPointsCtx.fillStyle = "green";
		mainOops.draw(debugPointsCtx);

		if (update) {
			var [movementX, movementY] = mainOops.getMovement();

			// Acceleration curves add a lot of stability,
			// letting you focus on a specific point without jitter, but still move quickly.

			// var accelerate = (delta, distance) => (delta / 10) * (distance ** 0.8);
			// var accelerate = (delta, distance) => (delta / 1) * (Math.abs(delta) ** 0.8);
			var accelerate = (delta, _distance) => (delta / 1) * (Math.abs(delta * 5) ** acceleration);

			var distance = Math.hypot(movementX, movementY);
			var deltaX = accelerate(movementX * sensitivityX, distance);
			var deltaY = accelerate(movementY * sensitivityY, distance);

			if (debugAcceleration) {
				const graphWidth = 200;
				const graphHeight = 150;
				const graphMaxInput = 0.2;
				const graphMaxOutput = 0.4;
				const highlightInputRange = 0.01;
				ctx.save();
				ctx.fillStyle = "black";
				ctx.fillRect(0, 0, graphWidth, graphHeight);
				const highlightInput = movementX * sensitivityX;
				for (let x = 0; x < graphWidth; x++) {
					const input = x / graphWidth * graphMaxInput;
					const output = accelerate(input, input);
					const y = output / graphMaxOutput * graphHeight;
					// ctx.fillStyle = Math.abs(y - deltaX) < 1 ? "yellow" : "lime";
					const highlight = Math.abs(Math.abs(input) - Math.abs(highlightInput)) < highlightInputRange;
					if (highlight) {
						ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
						ctx.fillRect(x, 0, 1, graphHeight);
					}
					ctx.fillStyle = highlight ? "yellow" : "lime";
					ctx.fillRect(x, graphHeight - y, 1, y);
				}
				ctx.restore();
			}

			// This should never happen
			if (!isFinite(deltaX) || !isFinite(deltaY)) {
				return;
			}

			if (!paused) {
				const screenWidth = window.electronAPI ? screen.width : innerWidth;
				const screenHeight = window.electronAPI ? screen.height : innerHeight;

				mouseX -= deltaX * screenWidth;
				mouseY += deltaY * screenHeight;

				mouseX = Math.min(Math.max(0, mouseX), screenWidth);
				mouseY = Math.min(Math.max(0, mouseY), screenHeight);

				if (mouseNeedsInitPos) {
					// TODO: option to get preexisting mouse position instead of set it to center of screen
					mouseX = screenWidth / 2;
					mouseY = screenHeight / 2;
					mouseNeedsInitPos = false;
				}
				if (window.electronAPI) {
					window.electronAPI.moveMouse(~~mouseX, ~~mouseY);
					pointerEl.style.display = "none";
				} else {
					pointerEl.style.display = "";
					pointerEl.style.left = `${mouseX}px`;
					pointerEl.style.top = `${mouseY}px`;
				}
				if (TrackyMouse.onPointerMove) {
					TrackyMouse.onPointerMove(mouseX, mouseY);
				}
			}
			prevMovementX = movementX;
			prevMovementY = movementY;
			// movementXSinceFacemeshUpdate += movementX;
			// movementYSinceFacemeshUpdate += movementY;
			/*
			if (enableTimeTravel) {
				if (facemeshEstimating) {
					const imageData = getCameraImageData();
					if (imageData) {
						cameraFramesSinceFacemeshUpdate.push(imageData);
					}
					// limit this buffer size in case something goes wrong
					if (cameraFramesSinceFacemeshUpdate.length > 500) {
						// maybe just clear it entirely, because a partial buffer might not be useful
						cameraFramesSinceFacemeshUpdate.length = 0;
					}
				}
			}
			*/
		}
		ctx.restore();

		if (showDebugText) {
			ctx.save();
			ctx.fillStyle = "#fff";
			ctx.strokeStyle = "#000";
			ctx.lineWidth = 3;
			ctx.font = "20px sans-serif";
			ctx.beginPath();
			const text3 = "Face convergence score: " + ((useFacemesh && facemeshPrediction) ? "N/A" : faceConvergence.toFixed(4));
			const text1 = "Face tracking score: " + ((useFacemesh && facemeshPrediction) ? facemeshPrediction.faceInViewConfidence : faceScore).toFixed(4);
			const text2 = "Points based on score: " + ((useFacemesh && facemeshPrediction) ? pointsBasedOnFaceInViewConfidence : pointsBasedOnFaceScore).toFixed(4);
			ctx.strokeText(text1, 50, 50);
			ctx.fillText(text1, 50, 50);
			ctx.strokeText(text2, 50, 70);
			ctx.fillText(text2, 50, 70);
			ctx.strokeText(text3, 50, 170);
			ctx.fillText(text3, 50, 170);
			ctx.fillStyle = "lime";
			ctx.fillRect(0, 150, faceConvergence, 5);
			ctx.fillRect(0, 0, faceScore * canvas.width, 5);
			ctx.restore();
		}
		stats?.update();
	}

	function circle(ctx, x, y, r) {
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
	}

	// Can't use requestAnimationFrame, doesn't work with webPreferences.backgroundThrottling: false (at least in some version of Electron (v12 I think, when I tested it), on Ubuntu, with XFCE)
	setInterval(function animationLoop() {
		draw(!paused || document.visibilityState === "visible");
	}, 15);

	let autoDemo = false;
	try {
		autoDemo = localStorage.trackyMouseAutoDemo === "true";
	} catch (_error) {
		// ignore; this is just for development
	}
	if (autoDemo) {
		TrackyMouse.useDemoFootage();
	} else if (window.electronAPI) {
		TrackyMouse.useCamera();
	}

	const updatePaused = () => {
		mouseNeedsInitPos = true;
		if (paused) {
			pointerEl.style.display = "none";
		}
		if (paused) {
			startStopButton.textContent = "Start";
			startStopButton.setAttribute("aria-pressed", "false");
		} else {
			startStopButton.textContent = "Stop";
			startStopButton.setAttribute("aria-pressed", "true");
		}
		if (window.electronAPI) {
			window.electronAPI.notifyToggleState(!paused);
		}
	};
	const handleShortcut = (shortcutType) => {
		if (shortcutType === "toggle-tracking") {
			paused = !paused;
			updatePaused();
		}
	};
	settingsLoadedPromise.then(updatePaused);

	// Try to handle both the global and local shortcuts
	// If the global shortcut successfully registered, keydown shouldn't occur for the shortcut, right?
	// I hope there's no cross-platform issue with this.
	if (window.electronAPI) {
		window.electronAPI.onShortcut(handleShortcut);
	}
	const handleKeydown = (event) => {
		// Same shortcut as the global shortcut in the electron app
		if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && event.key === "F9") {
			handleShortcut("toggle-tracking");
		}
	};
	addEventListener("keydown", handleKeydown);

	return {
		dispose() {
			// TODO: re-structure so that cleanup can succeed even if initialization fails
			// OOP would help with this, by storing references in an object, but it doesn't necessarily
			// need to be converted to a class, it could just be an object, with a try-finally used for returning the API with a `dispose` method.
			// Wouldn't need to change the API that way.
			// (Would also be easy to maintain backwards compatibility while switching to using a class,
			// returning an instance of the class from `TrackyMouse.init` but deprecating it in favor of constructing the class.)

			// clean up camera stream
			if (cameraVideo.srcObject) {
				for (const track of cameraVideo.srcObject.getTracks()) {
					track.stop();
				}
			}
			cameraVideo.srcObject = null; // probably pointless

			// not sure this helps
			reset();
			// just in case there's any async code looking at whether it's paused
			paused = true;

			if (facemeshWorker) {
				facemeshWorker.terminate();
			}
			if (clmTracker) {
				// not sure this helps clean up any resources
				clmTracker.reset();
			}

			pointerEl.remove();

			stats?.domElement.remove(); // there is no dispose method but this may be all that it would need to do https://github.com/mrdoob/stats.js/pull/96

			removeEventListener("keydown", handleKeydown);

			// This is a little awkward, reversing the initialization based on a possibly-preexisting element
			// Could save and restore innerHTML but that won't restore event listeners, references, etc.
			// and may not even be desired if the HTML was placeholder text mentioning it not yet being initialized for example.
			uiContainer.classList.remove("tracky-mouse-ui");
			uiContainer.innerHTML = "";
			if (!div) {
				uiContainer.remove();
			}
		},
	};
};

// CommonJS export is untested. Script tag usage recommended.
// Just including this in case it is somehow useful.
// eslint-disable-next-line no-undef
if (typeof module !== "undefined" && module.exports) {
	// eslint-disable-next-line no-undef
	module.exports = TrackyMouse;
}
