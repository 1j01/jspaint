((exports) => {

// TODO: E\("([a-z]+)"\) -> "<$1>" or get rid of jQuery as a dependency
function E(t) {
	return document.createElement(t);
}

function find_tabstops($el) {
	// This function finds focusable controls, but not necessarily all of them;
	// for radio elements, it only gives one: either the checked one, or the first one if none are checked.

	let $controls = $el.find("input, textarea, select, button, object, a[href], [tabIndex='0'], details summary")
		.filter(":enabled, summary, a")
		.filter(":visible");
	// const $controls = $el.find(":tabbable"); // https://api.jqueryui.com/tabbable-selector/

	// Radio buttons should be treated as a group with one tabstop.
	// If there's no selected ("checked") radio, it should still visit the group,
	// but if there is a selected radio in the group, it should skip all unselected radios in the group.
	const radios = {}; // best radio found so far, per group
	const to_skip = [];
	for (const el of $controls) {
		if (el.nodeName.toLowerCase() === "input" && el.type === "radio") {
			if (radios[el.name]) {
				if (el.checked) {
					to_skip.push(radios[el.name]);
					radios[el.name] = el;
				} else {
					to_skip.push(el);
				}
			} else {
				radios[el.name] = el;
			}
		}
	}
	const $tabstops = $controls.not(to_skip);
	// debug viz:
	// $tabstops.css({boxShadow: "0 0 2px 2px green"});
	// $(to_skip).css({boxShadow: "0 0 2px 2px gray"})
	return $tabstops;
}
var $G = $(window);


$Window.Z_INDEX = 5;

var minimize_slots = []; // for if there's no taskbar

function $Window(options) {
	options = options || {};

	var $w = $(E("div")).addClass("window os-window").appendTo("body");
	$w[0].id = `os-window-${Math.random().toString(36).substr(2, 9)}`;
	$w.$titlebar = $(E("div")).addClass("window-titlebar").appendTo($w);
	$w.$title_area = $(E("div")).addClass("window-title-area").appendTo($w.$titlebar);
	$w.$title = $(E("span")).addClass("window-title").appendTo($w.$title_area);
	if (options.toolWindow) {
		options.minimizeButton = false;
		options.maximizeButton = false;
	}
	if (options.minimizeButton !== false) {
		$w.$minimize = $(E("button")).addClass("window-minimize-button window-button").appendTo($w.$titlebar);
	}
	if (options.maximizeButton !== false) {
		$w.$maximize = $(E("button")).addClass("window-maximize-button window-button").appendTo($w.$titlebar);
	}
	if (options.closeButton !== false) {
		$w.$x = $(E("button")).addClass("window-close-button window-button").appendTo($w.$titlebar);
	}
	$w.$content = $(E("div")).addClass("window-content").appendTo($w);
	$w.$content.attr("tabIndex", "-1");
	$w.$content.css("outline", "none");
	if (options.toolWindow) {
		$w.addClass("tool-window");
	}
	if (options.parentWindow) {
		options.parentWindow.addChildWindow($w);
		$w[0].dataset.semanticParent = options.parentWindow[0].id;
	}

	var $component = options.$component;
	if (options.icon) {
		$w.icon_name = options.icon;
		$w.$icon = $Icon(options.icon, TITLEBAR_ICON_SIZE).prependTo($w.$titlebar);
	}
	if ($component) {
		$w.addClass("component-window");
	}

	setTimeout(() => {
		if (get_direction() == "rtl") {
			$w.addClass("rtl"); // for reversing the titlebar gradient
		}
	}, 0);

	// returns writing/layout direction, "ltr" or "rtl"
	function get_direction() {
		return window.get_direction ? window.get_direction() : getComputedStyle($w[0]).direction;
	}

	// This is very silly, using jQuery's event handling to implement simpler event handling.
	// But I'll implement it in a non-silly way at least when I remove jQuery. Maybe sooner.
	const $event_target = $({});
	const make_simple_listenable = (name) => {
		return (callback) => {
			const fn = () => {
				callback();
			};
			$event_target.on(name, fn);
			const dispose = () => {
				$event_target.off(name, fn);
			};
			return dispose;
		};
	};
	$w.onFocus = make_simple_listenable("focus");
	$w.onBlur = make_simple_listenable("blur");
	$w.onClosed = make_simple_listenable("closed");

	$w.setDimensions = ({ innerWidth, innerHeight, outerWidth, outerHeight }) => {
		let width_from_frame, height_from_frame;
		// It's good practice to make all measurements first, then update the DOM.
		// Once you update the DOM, the browser has to recalculate layout, which can be slow.
		if (innerWidth) {
			width_from_frame = $w.outerWidth() - $w.$content.outerWidth();
		}
		if (innerHeight) {
			height_from_frame = $w.outerHeight() - $w.$content.outerHeight();
			const $menu_bar = $w.$content.find(".menus"); // only if inside .content; might move to a slot outside .content later
			if ($menu_bar.length) {
				// maybe this isn't technically part of the frame, per se? but it's part of the non-client area, which is what I technically mean.
				height_from_frame += $menu_bar.outerHeight();
			}
		}
		if (outerWidth) {
			$w.outerWidth(outerWidth);
		}
		if (outerHeight) {
			$w.outerHeight(outerHeight);
		}
		if (innerWidth) {
			$w.outerWidth(innerWidth + width_from_frame);
		}
		if (innerHeight) {
			$w.outerHeight(innerHeight + height_from_frame);
		}
	};
	$w.setDimensions(options);

	let child_$windows = [];
	$w.addChildWindow = ($child_window) => {
		child_$windows.push($child_window);
	};
	const showAsFocused = () => {
		if ($w.hasClass("focused")) {
			return;
		}
		$w.addClass("focused");
		$event_target.triggerHandler("focus");
	};
	const stopShowingAsFocused = () => {
		if (!$w.hasClass("focused")) {
			return;
		}
		$w.removeClass("focused");
		$event_target.triggerHandler("blur");
	};
	$w.focus = () => {
		// showAsFocused();	
		$w.bringToFront();
		refocus();
	};
	$w.blur = () => {
		stopShowingAsFocused();
		if (document.activeElement && document.activeElement.closest(".window") == $w[0]) {
			document.activeElement.blur();
		}
	};

	if (options.toolWindow) {
		if (options.parentWindow) {
			options.parentWindow.onFocus(showAsFocused);
			options.parentWindow.onBlur(stopShowingAsFocused);
			// TODO: also show as focused if focus is within the window

			// initial state
			// might need a setTimeout, idk...
			if (document.activeElement && document.activeElement.closest(".window") == options.parentWindow[0]) {
				showAsFocused();
			}
		} else {
			// the browser window is the parent window
			// show focus whenever the browser window is focused
			$(window).on("focus", showAsFocused);
			$(window).on("blur", stopShowingAsFocused);
			// initial state
			if (document.hasFocus()) {
				showAsFocused();
			}
		}
	} else {
		// global focusout is needed, to continue showing as focused while child windows or menus are focused
		// global focusin is needed, to show as focused when a child window becomes focused
		$G.on("focusin focusout", (event) => {
			// For child windows and menu popups, follow "semantic parent" chain.
			// Menu popups and child windows aren't descendants of the window they belong to,
			// but should keep the window shown as focused.

			let newlyFocused = event.type === "focusout" ? event.relatedTarget : event.target;

			if (!newlyFocused) {
				stopShowingAsFocused();
				return;
			}
			do {
				// if (!newlyFocused?.closest) {
				// 	console.warn("what is this?", newlyFocused);
				// 	break;
				// }
				const waypoint = newlyFocused?.closest?.("[data-semantic-parent]");
				if (waypoint) {
					const id = waypoint.dataset.semanticParent;
					newlyFocused = document.getElementById(id);
					if (!newlyFocused) {
						console.warn("semantic parent not found with id", id);
						break;
					}
				} else {
					break;
				}
			} while (true);
			if (newlyFocused && newlyFocused.closest?.(".window") == $w[0]) {
				showAsFocused();
				$w.bringToFront();
				return;
			}
			stopShowingAsFocused();
		});
		// initial state is unfocused
	}

	$w.css("touch-action", "none");

	$w.$x?.on("click", () => {
		$w.close();
	});

	let before_minimize;
	$w.minimize = () => {
		if ($w.is(":visible")) {
			if ($w.task) {
				const $task = $w.task.$task;
				const before_rect = $w.$titlebar[0].getBoundingClientRect();
				const after_rect = $task[0].getBoundingClientRect();
				$w.animateTitlebar(before_rect, after_rect, () => {
					$w.hide();
					$w.blur();
				});
			} else {
				// no taskbar

				// @TODO: make this metrically similar to what Windows 98 does
				// @TODO: DRY! This is copied heavily from maximize()
				// @TODO: should it show a maximize icon instead of an overlap icon if
				// it's minimized and was maximized and thus will maximize when restoring,
				// OR should it not maximize but restore the unmaximized state?

				const to_width = 150;
				const spacing = 10;
				if ($w.hasClass("minimized-without-taskbar")) {
					// unminimizing
					minimize_slots[$w._minimize_slot_index] = null;
				} else {
					// minimizing
					let i = 0;
					while (minimize_slots[i]) {
						i++;
					}
					$w._minimize_slot_index = i;
					minimize_slots[i] = $w;
				}
				const to_x = $w._minimize_slot_index * (to_width + spacing) + 10;
				const titlebar_height = $w.$titlebar.outerHeight();
				const instantly_minimize = () => {
					before_minimize = {
						position: $w.css("position"),
						left: $w.css("left"),
						top: $w.css("top"),
						width: $w.css("width"),
						height: $w.css("height"),
					};

					$w.addClass("minimized-without-taskbar");
					if ($w.hasClass("maximized")) {
						$w.removeClass("maximized");
						$w.addClass("was-maximized");
					}
					$w.css({
						position: "fixed",
						top: `calc(100% - ${titlebar_height + 5}px)`,
						left: to_x,
						width: to_width,
						height: titlebar_height,
					});
				};
				const instantly_unminimize = () => {
					$w.removeClass("minimized-without-taskbar");
					if ($w.hasClass("was-maximized")) {
						$w.removeClass("was-maximized");
						$w.addClass("maximized");
					}
					$w.css({ width: "", height: "" });
					if (before_minimize) {
						$w.css({
							position: before_minimize.position,
							left: before_minimize.left,
							top: before_minimize.top,
							width: before_minimize.width,
							height: before_minimize.height,
						});
					}
				};

				const before_rect = $w.$titlebar[0].getBoundingClientRect();
				let after_rect;
				$w.css("transform", "");
				if ($w.hasClass("minimized-without-taskbar")) {
					instantly_unminimize();
					after_rect = $w.$titlebar[0].getBoundingClientRect();
					instantly_minimize();
				} else {
					instantly_minimize();
					after_rect = $w.$titlebar[0].getBoundingClientRect();
					instantly_unminimize();
				}
				$w.animateTitlebar(before_rect, after_rect, () => {
					if ($w.hasClass("minimized-without-taskbar")) {
						instantly_unminimize();
					} else {
						instantly_minimize();
						$w.blur();
					}
				});
			}
		}
	};
	$w.unminimize = () => {
		if ($w.hasClass("minimized-without-taskbar")) {
			$w.minimize();
			return;
		}
		if ($w.is(":hidden")) {
			const $task = $w.task.$task;
			const before_rect = $task[0].getBoundingClientRect();
			$w.show();
			const after_rect = $w.$titlebar[0].getBoundingClientRect();
			$w.hide();
			$w.animateTitlebar(before_rect, after_rect, () => {
				$w.show();
				$w.bringToFront();
				$w.focus();
			});
		}
	};

	let before_maximize;
	$w.$maximize?.on("click", () => {
		if ($w.hasClass("minimized-without-taskbar")) {
			$w.minimize();
			return;
		}

		const instantly_maximize = () => {
			before_maximize = {
				position: $w.css("position"),
				left: $w.css("left"),
				top: $w.css("top"),
				width: $w.css("width"),
				height: $w.css("height"),
			};

			$w.addClass("maximized");
			const $taskbar = $(".taskbar");
			const scrollbar_width = window.innerWidth - $(window).width();
			const scrollbar_height = window.innerHeight - $(window).height();
			const taskbar_height = $taskbar.length ? $taskbar.height() + 1 : 0;
			$w.css({
				position: "fixed",
				top: 0,
				left: 0,
				width: `calc(100vw - ${scrollbar_width}px)`,
				height: `calc(100vh - ${scrollbar_height}px - ${taskbar_height}px)`,
			});
		};
		const instantly_unmaximize = () => {
			$w.removeClass("maximized");
			$w.css({ width: "", height: "" });
			if (before_maximize) {
				$w.css({
					position: before_maximize.position,
					left: before_maximize.left,
					top: before_maximize.top,
					width: before_maximize.width,
					height: before_maximize.height,
				});
			}
		};

		const before_rect = $w.$titlebar[0].getBoundingClientRect();
		let after_rect;
		$w.css("transform", "");
		if ($w.hasClass("maximized")) {
			instantly_unmaximize();
			after_rect = $w.$titlebar[0].getBoundingClientRect();
			instantly_maximize();
		} else {
			instantly_maximize();
			after_rect = $w.$titlebar[0].getBoundingClientRect();
			instantly_unmaximize();
		}
		$w.animateTitlebar(before_rect, after_rect, () => {
			if ($w.hasClass("maximized")) {
				instantly_unmaximize();
			} else {
				instantly_maximize();
			}
		});
	});
	$w.$minimize?.on("click", () => {
		$w.minimize();
	});
	$w.$title_area.on("dblclick", () => {
		$w.$maximize?.triggerHandler("click");
	});

	$w.css({
		position: "absolute",
		zIndex: $Window.Z_INDEX++
	});
	$w.bringToFront = () => {
		$w.css({
			zIndex: $Window.Z_INDEX++
		});
		for (const $childWindow of child_$windows) {
			$childWindow.bringToFront();
		}
	};
	// var focused = false;
	// @TODO: rename last_focused_control and formerly_focused to be distinct
	// maybe last_focused_in_window and last_focused_anywhere
	var last_focused_control;

	const refocus = () => {
		if (last_focused_control) {
			last_focused_control.focus();
			return;
		}
		const $tabstops = find_tabstops($w.$content);
		const $default = $tabstops.filter(".default");
		if ($default.length) {
			$default.focus();
			return;
		}
		if ($tabstops.length) {
			$tabstops[0].focus();
			return;
		}
		if (options.parentWindow) {
			options.parentWindow.triggerHandler("refocus-window");
			return;
		}
		$w.$content.focus();
	};

	$w.on("refocus-window", () => {
		refocus();
	});

	// redundant events are for handling synthetic events,
	// which may be sent individually, rather than in tandem
	$w.on("pointerdown mousedown", handle_pointer_activation);
	// jQuery can't handle synthetic events, so we have to use addEventListener too
	// https://jsfiddle.net/1j01/ndvwts9y/
	$w[0].addEventListener("pointerdown", handle_pointer_activation);
	$w[0].addEventListener("mousedown", handle_pointer_activation);

	let formerly_focused;
	// Assumption: focusin comes after pointerdown/mousedown
	// This is probably guaranteed, because you can prevent the default of focusing from pointerdown/mousedown
	$G.on("focusin", (e) => {
		// why so many focusin events?...
		// console.log("focusin", e.target);
		formerly_focused = e.target;
	});

	function handle_pointer_activation(event) {
		// console.log("handle_pointer_activation", event.type, event.target);
		$w.bringToFront();
		// Test cases where it should refocus the last focused control in the window:
		// - Click in the blank space of the window
		//   - Click in blank space again now that something's focused
		// - Click on the window title bar
		//   - Click on title bar buttons
		// - Closing a second window should focus the first window
		//   - Open a dialog window from an app window that has a tool window, then close the dialog window
		//     - @TODO: Even if the tool window has controls, it should focus the parent window, I think
		// - Clicking on a control in the window should focus said control
		//   - @Note: because this works by updating last_focused_control,
		//     this doesn't work for controls that are not in the window content
		//     (for example if you accidentally append buttons to the window element itself)
		// - Clicking on a disabled control in the window should focus the window
		//   - Make sure to test this with another window previously focused
		// - Simulated clicks (important for JS Paint's eye gaze and speech recognition modes)
		// - (@TODO: Should clicking a child window focus the parent window?)
		// It should NOT refocus when:
		// - Clicking on a control in a different window
		// - When other event handlers set focus
		//   - Using the keyboard to focus something outside the window, such as a menu popup
		//   - Clicking a control that focuses something outside the window (I don't have an example)
		// - Trying to select text

		// Wait for other pointerdown handlers and default behavior, and focusin events.
		requestAnimationFrame(() => {
			// console.log("did focus change?", { last_focused_control, formerly_focused, activeElement: document.activeElement, win_elem: $w[0]}, document.activeElement !== formerly_focused);

			// If something programmatically got focus, don't refocus.
			if (
				document.activeElement &&
				document.activeElement !== document &&
				document.activeElement !== document.body &&
				document.activeElement !== $w.$content[0] &&
				document.activeElement !== formerly_focused
			) {
				return;
			}
			// If menus got focus, don't refocus.
			if (document.activeElement?.closest?.(".menus")) {
				// console.log("click in menus");
				return;
			}

			// focused = true;

			// If the element is selectable, wait until the click is done and see if anything was selected first.
			// This is a bit of a weird compromise, for now.
			const target_style = getComputedStyle(event.target);
			if (target_style.userSelect !== "none") {
				// Immediately show the window as focused, just don't refocus a specific control.
				$w.$content.focus();

				$w.one("pointerup pointercancel", () => {
					requestAnimationFrame(() => { // this seems to make it more reliable in regards to double clicking
						if (!getSelection().toString().trim()) {
							refocus();
						}
					});
				});
				return;
			}
			// Set focus to the last focused control, which should be updated if a click just occurred.
			refocus();
		});
	}

	// Assumption: no control exists in the window before this "focusin" handler is set up,
	// so any element.focus() will come after and trigger this handler.
	$w.on("focusin", () => {
		// focused = true;
		if (
			document.activeElement &&
			$.contains($w.$content[0], document.activeElement) &&
			!document.activeElement.closest(".menus")
		) {
			last_focused_control = document.activeElement;
		}
	});
	// $w.on("focusout", ()=> {
	// 	requestAnimationFrame(()=> {
	// 		if (!document.activeElement || !$.contains($w[0], document.activeElement)) {
	// 			focused = false;
	// 		}
	// 	});
	// });

	$w.on("keydown", (e) => {
		if (e.isDefaultPrevented()) {
			return;
		}
		if (e.ctrlKey || e.altKey || e.metaKey) {
			return;
		}
		// console.log("keydown", e.key, e.target);
		if (e.target.closest(".menus")) {
			// console.log("keydown in menus");
			return;
		}
		const $buttons = $w.$content.find("button");
		const $focused = $(document.activeElement);
		const focused_index = $buttons.index($focused);
		switch (e.keyCode) {
			case 40: // Down
			case 39: // Right
				if ($focused.is("button") && !e.shiftKey) {
					if (focused_index < $buttons.length - 1) {
						$buttons[focused_index + 1].focus();
						e.preventDefault();
					}
				}
				break;
			case 38: // Up
			case 37: // Left
				if ($focused.is("button") && !e.shiftKey) {
					if (focused_index > 0) {
						$buttons[focused_index - 1].focus();
						e.preventDefault();
					}
				}
				break;
			case 32: // Space
			case 13: // Enter (doesn't actually work in chrome because the button gets clicked immediately)
				if ($focused.is("button") && !e.shiftKey) {
					$focused.addClass("pressed");
					const release = () => {
						$focused.removeClass("pressed");
						$focused.off("focusout", release);
						$(window).off("keyup", keyup);
					};
					const keyup = (e) => {
						if (e.keyCode === 32 || e.keyCode === 13) {
							release();
						}
					};
					$focused.on("focusout", release);
					$(window).on("keyup", keyup);
				}
				break;
			case 9: { // Tab
				// wrap around when tabbing through controls in a window
				const $controls = find_tabstops($w.$content);
				if ($controls.length > 0) {
					const focused_control_index = $controls.index($focused);
					if (e.shiftKey) {
						if (focused_control_index === 0) {
							e.preventDefault();
							$controls[$controls.length - 1].focus();
						}
					} else {
						if (focused_control_index === $controls.length - 1) {
							e.preventDefault();
							$controls[0].focus();
						}
					}
				}
				break;
			}
			case 27: // Esc
				$w.close();
				break;
		}
	});

	$w.applyBounds = () => {
		// TODO: outerWidth vs width? not sure
		const bound_width = Math.max(document.body.scrollWidth, innerWidth);
		const bound_height = Math.max(document.body.scrollHeight, innerHeight);
		$w.css({
			left: Math.max(0, Math.min(bound_width - $w.width(), $w.position().left)),
			top: Math.max(0, Math.min(bound_height - $w.height(), $w.position().top)),
		});
	};

	$w.bringTitleBarInBounds = () => {
		// Try to make the titlebar always accessible
		const bound_width = Math.max(document.body.scrollWidth, innerWidth);
		const bound_height = Math.max(document.body.scrollHeight, innerHeight);
		const min_horizontal_pixels_on_screen = 40; // enough for space past a close button
		$w.css({
			left: Math.max(
				min_horizontal_pixels_on_screen - $w.outerWidth(),
				Math.min(
					bound_width - min_horizontal_pixels_on_screen,
					$w.position().left
				)
			),
			top: Math.max(0, Math.min(
				bound_height - $w.$titlebar.outerHeight() - 5,
				$w.position().top
			)),
		});
	};

	$w.center = () => {
		$w.css({
			left: (innerWidth - $w.width()) / 2 + window.scrollX,
			top: (innerHeight - $w.height()) / 2 + window.scrollY,
		});
		$w.applyBounds();
	};


	$G.on("resize", $w.bringTitleBarInBounds);

	var drag_offset_x, drag_offset_y, drag_pointer_x, drag_pointer_y, drag_pointer_id;
	var update_drag = (e) => {
		if (drag_pointer_id === e.pointerId) {
			drag_pointer_x = e.clientX ?? drag_pointer_x;
			drag_pointer_y = e.clientY ?? drag_pointer_y;
		}
		$w.css({
			left: drag_pointer_x + scrollX - drag_offset_x,
			top: drag_pointer_y + scrollY - drag_offset_y,
		});
	};
	$w.$titlebar.css("touch-action", "none");
	$w.$titlebar.on("selectstart", (e) => { // preventing mousedown would break :active state, I'm not sure if just selectstart is enough...
		e.preventDefault();
	});
	$w.$titlebar.on("mousedown", "button", (e) => {
		// prevent focus ring on titlebar buttons
		setTimeout(() => {
			refocus();
		}, 0);
	});
	$w.$titlebar.on("pointerdown", (e) => {
		if ($(e.target).closest("button").length) {
			return;
		}
		if ($w.hasClass("maximized")) {
			return;
		}
		const customEvent = $.Event("window-drag-start");
		$w.trigger(customEvent);
		if (customEvent.isDefaultPrevented()) {
			return; // allow custom drag behavior of component windows in jspaint (Tools / Colors)
		}
		drag_offset_x = e.clientX + scrollX - $w.position().left;
		drag_offset_y = e.clientY + scrollY - $w.position().top;
		drag_pointer_x = e.clientX;
		drag_pointer_y = e.clientY;
		drag_pointer_id = e.pointerId;
		$G.on("pointermove", update_drag);
		$G.on("scroll", update_drag);
		$("body").addClass("dragging"); // for when mouse goes over an iframe
	});
	$G.on("pointerup pointercancel", (e) => {
		if (e.pointerId !== drag_pointer_id) { return; }
		$G.off("pointermove", update_drag);
		$G.off("scroll", update_drag);
		$("body").removeClass("dragging");
		// $w.applyBounds(); // Windows doesn't really try to keep windows on screen
		// but you also can't really drag off of the desktop, whereas here you can drag to way outside the web page.
		$w.bringTitleBarInBounds();
	});
	$w.$titlebar.on("dblclick", (e) => {
		if ($component) {
			$component.dock();
		}
	});

	if (options.resizable) {

		const HANDLE_MIDDLE = 0;
		const HANDLE_START = -1;
		const HANDLE_END = 1;
		const HANDLE_LEFT = HANDLE_START;
		const HANDLE_RIGHT = HANDLE_END;
		const HANDLE_TOP = HANDLE_START;
		const HANDLE_BOTTOM = HANDLE_END;

		[
			[HANDLE_TOP, HANDLE_RIGHT], // ↗
			[HANDLE_TOP, HANDLE_MIDDLE], // ↑
			[HANDLE_TOP, HANDLE_LEFT], // ↖
			[HANDLE_MIDDLE, HANDLE_LEFT], // ←
			[HANDLE_BOTTOM, HANDLE_LEFT], // ↙
			[HANDLE_BOTTOM, HANDLE_MIDDLE], // ↓
			[HANDLE_BOTTOM, HANDLE_RIGHT], // ↘
			[HANDLE_MIDDLE, HANDLE_RIGHT], // →
		].forEach(([y_axis, x_axis]) => {
			// const resizes_height = y_axis !== HANDLE_MIDDLE;
			// const resizes_width = x_axis !== HANDLE_MIDDLE;
			const $handle = $("<div>").addClass("handle").appendTo($w);

			let cursor = "";
			if (y_axis === HANDLE_TOP) { cursor += "n"; }
			if (y_axis === HANDLE_BOTTOM) { cursor += "s"; }
			if (x_axis === HANDLE_LEFT) { cursor += "w"; }
			if (x_axis === HANDLE_RIGHT) { cursor += "e"; }
			cursor += "-resize";

			// Note: MISNOMER: innerWidth() is less "inner" than width(), because it includes padding!
			// Here's a little diagram of sorts:
			// outerWidth(true): margin, [ outerWidth(): border, [ innerWidth(): padding, [ width(): content ] ] ]
			const handle_thickness = ($w.outerWidth() - $w.width()) / 2; // padding + border
			const border_width = ($w.outerWidth() - $w.innerWidth()) / 2; // border; need to outset the handles by this amount so they overlap the border + padding, and not the content
			const window_frame_height = $w.outerHeight() - $w.$content.outerHeight(); // includes titlebar and borders, padding, but not content
			const window_frame_width = $w.outerWidth() - $w.$content.outerWidth(); // includes borders, padding, but not content
			$handle.css({
				position: "absolute",
				top: y_axis === HANDLE_TOP ? -border_width : y_axis === HANDLE_MIDDLE ? `calc(${handle_thickness}px - ${border_width}px)` : "",
				bottom: y_axis === HANDLE_BOTTOM ? -border_width : "",
				left: x_axis === HANDLE_LEFT ? -border_width : x_axis === HANDLE_MIDDLE ? `calc(${handle_thickness}px - ${border_width}px)` : "",
				right: x_axis === HANDLE_RIGHT ? -border_width : "",
				width: x_axis === HANDLE_MIDDLE ? `calc(100% - ${handle_thickness}px * 2 + ${border_width * 2}px)` : `${handle_thickness}px`,
				height: y_axis === HANDLE_MIDDLE ? `calc(100% - ${handle_thickness}px * 2 + ${border_width * 2}px)` : `${handle_thickness}px`,
				// background: x_axis === HANDLE_MIDDLE || y_axis === HANDLE_MIDDLE ? "rgba(255,0,0,0.4)" : "rgba(0,255,0,0.8)",
				touchAction: "none",
				cursor,
			});

			let rect;
			let resize_offset_x, resize_offset_y, resize_pointer_x, resize_pointer_y, resize_pointer_id;
			$handle.on("pointerdown", (e) => {
				e.preventDefault();

				$G.on("pointermove", handle_pointermove);
				$G.on("scroll", update_resize); // scroll doesn't have clientX/Y, so we have to remember it
				$("body").addClass("dragging"); // for when mouse goes over an iframe
				$G.on("pointerup pointercancel", end_resize);

				rect = {
					x: $w.position().left,
					y: $w.position().top,
					width: $w.outerWidth(),
					height: $w.outerHeight(),
				};

				resize_offset_x = e.clientX + scrollX - rect.x - (x_axis === HANDLE_RIGHT ? rect.width : 0);
				resize_offset_y = e.clientY + scrollY - rect.y - (y_axis === HANDLE_BOTTOM ? rect.height : 0);
				resize_pointer_x = e.clientX;
				resize_pointer_y = e.clientY;
				resize_pointer_id = e.pointerId;

				// handle_pointermove(e); // was useful for checking that the offset is correct (should not do anything, if it's correct!)
			});
			function handle_pointermove(e) {
				if (e.pointerId !== resize_pointer_id) { return; }
				resize_pointer_x = e.clientX;
				resize_pointer_y = e.clientY;
				update_resize();
			}
			function end_resize(e) {
				if (e.pointerId !== resize_pointer_id) { return; }
				$G.off("pointermove", handle_pointermove);
				$G.off("scroll", onscroll);
				$("body").removeClass("dragging");
				$G.off("pointerup pointercancel", end_resize);
				$w.bringTitleBarInBounds();
			}
			function update_resize() {
				const mouse_x = resize_pointer_x + scrollX - resize_offset_x;
				const mouse_y = resize_pointer_y + scrollY - resize_offset_y;
				let delta_x = 0;
				let delta_y = 0;
				let width, height;
				if (x_axis === HANDLE_RIGHT) {
					delta_x = 0;
					width = ~~(mouse_x - rect.x);
				} else if (x_axis === HANDLE_LEFT) {
					delta_x = ~~(mouse_x - rect.x);
					width = ~~(rect.x + rect.width - mouse_x);
				} else {
					width = ~~(rect.width);
				}
				if (y_axis === HANDLE_BOTTOM) {
					delta_y = 0;
					height = ~~(mouse_y - rect.y);
				} else if (y_axis === HANDLE_TOP) {
					delta_y = ~~(mouse_y - rect.y);
					height = ~~(rect.y + rect.height - mouse_y);
				} else {
					height = ~~(rect.height);
				}
				let new_rect = {
					x: rect.x + delta_x,
					y: rect.y + delta_y,
					width,
					height,
				};

				new_rect.width = Math.max(1, new_rect.width);
				new_rect.height = Math.max(1, new_rect.height);

				// Constraints
				if (options.constrainRect) {
					new_rect = options.constrainRect(new_rect, x_axis, y_axis);
				}
				new_rect.width = Math.max(new_rect.width, options.minOuterWidth ?? 100);
				new_rect.height = Math.max(new_rect.height, options.minOuterHeight ?? 0);
				new_rect.width = Math.max(new_rect.width, (options.minInnerWidth ?? 0) + window_frame_width);
				new_rect.height = Math.max(new_rect.height, (options.minInnerHeight ?? 0) + window_frame_height);
				// prevent free movement via resize past minimum size
				if (x_axis === HANDLE_LEFT) {
					new_rect.x = Math.min(new_rect.x, rect.x + rect.width - new_rect.width);
				}
				if (y_axis === HANDLE_TOP) {
					new_rect.y = Math.min(new_rect.y, rect.y + rect.height - new_rect.height);
				}

				$w.css({
					top: new_rect.y,
					left: new_rect.x,
				});
				$w.outerWidth(new_rect.width);
				$w.outerHeight(new_rect.height);
			}
		});
	}

	$w.$Button = (text, handler) => {
		var $b = $(E("button"))
			.appendTo($w.$content)
			.text(text)
			.on("click", () => {
				if (handler) {
					handler();
				}
				$w.close();
			});
		return $b;
	};
	$w.title = title => {
		if (title) {
			$w.$title.text(title);
			if ($w.task) {
				$w.task.updateTitle();
			}
			return $w;
		} else {
			return $w.$title.text();
		}
	};
	$w.getTitle = () => {
		return $w.title();
	};
	$w.getIconName = () => {
		return $w.icon_name;
	};
	$w.setIconByID = (icon_name) => {
		// $w.$icon.attr("src", getIconPath(icon_name));
		var old_$icon = $w.$icon;
		$w.$icon = $Icon(icon_name, TITLEBAR_ICON_SIZE);
		old_$icon.replaceWith($w.$icon);
		$w.icon_name = icon_name;
		$w.task.updateIcon();
		return $w;
	};
	$w.animateTitlebar = (from, to, callback = () => { }) => {
		// flying titlebar animation
		const $eye_leader = $w.$titlebar.clone(true);
		$eye_leader.find("button").remove();
		$eye_leader.appendTo("body");
		const duration_ms = 200; // TODO: how long?
		const duration_str = `${duration_ms}ms`;
		$eye_leader.css({
			transition: `left ${duration_str} linear, top ${duration_str} linear, width ${duration_str} linear, height ${duration_str} linear`,
			position: "fixed",
			zIndex: 10000000,
			pointerEvents: "none",
			left: from.left,
			top: from.top,
			width: from.width,
			height: from.height,
		});
		setTimeout(() => {
			$eye_leader.css({
				left: to.left,
				top: to.top,
				width: to.width,
				height: to.height,
			});
		}, 5);
		const tid = setTimeout(() => {
			$eye_leader.remove();
			callback();
		}, duration_ms * 1.2);
		$eye_leader.on("transitionend animationcancel", () => {
			$eye_leader.remove();
			clearTimeout(tid);
			callback();
		});
	};
	$w.close = (force) => {
		if (!force) {
			var e = $.Event("close");
			$w.trigger(e);
			if (e.isDefaultPrevented()) {
				return;
			}
		}
		if ($component) {
			$component.detach();
		}
		$w.remove();
		$w.closed = true;
		$event_target.triggerHandler("closed");
		$w.trigger("closed");
		// TODO: change usages of "close" to "closed" where appropriate
		// and probably rename the "close" event

		// Focus next-topmost window
		// TODO: store the last focused control OUTSIDE the window, and restore it here,
		// so that it works with not just other windows but also arbitrary controls outside of any window.
		var $next_topmost = $($(".window:visible").toArray().sort((a, b) => b.style.zIndex - a.style.zIndex)[0]);
		$next_topmost.triggerHandler("refocus-window");
	};
	$w.closed = false;

	if (options.title) {
		$w.title(options.title);
	}

	if (!$component) {
		$w.center();
	}

	// mustHaveMethods($w, windowInterfaceMethods);

	return $w;
}

function $FormWindow(title) {
	var $w = new $Window();

	$w.title(title);
	$w.$form = $(E("form")).appendTo($w.$content);
	$w.$main = $(E("div")).appendTo($w.$form);
	$w.$buttons = $(E("div")).appendTo($w.$form).addClass("button-group");

	$w.$Button = (label, action) => {
		var $b = $(E("button")).appendTo($w.$buttons).text(label);
		$b.on("click", (e) => {
			// prevent the form from submitting
			// @TODO: instead, prevent the form's submit event
			e.preventDefault();

			action();
		});

		$b.on("pointerdown", () => {
			$b.focus();
		});

		return $b;
	};

	return $w;
}

exports.$Window = $Window;
exports.$FormWindow = $FormWindow;

})(window);
