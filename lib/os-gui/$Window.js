((exports) => {

// TODO: E\("([a-z]+)"\) -> "<$1>" or get rid of jQuery as a dependency
function E(t) {
	return document.createElement(t);
}

var $G = $(window);


$Window.Z_INDEX = 5;

function $Window(options) {
	options = options || {};

	var $w = $(E("div")).addClass("window os-window").appendTo("body");
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
	if (options.toolWindow) {
		$w.addClass("tool-window");
	}
	if (options.parentWindow) {
		options.parentWindow.addChildWindow($w);
	}

	var $component = options.$component;
	if (options.icon) {
		$w.icon_name = options.icon;
		$w.$icon = $Icon(options.icon, TITLEBAR_ICON_SIZE).prependTo($w.$titlebar);
	}
	if ($component) {
		$w.addClass("component-window");
	}

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

	let child$Windows = [];
	let $focusShowers = $w;
	$w.addChildWindow = ($childWindow) => {
		child$Windows.push($childWindow);
		$focusShowers = $focusShowers.add($childWindow);
	};
	$w.focus = () => {
		if (options.parentWindow) {
			// TODO: remove flicker of unfocused state (for both child and parent windows)
			setTimeout((() => { // wait til after blur handler of parent window
				options.parentWindow.focus();
			}), 0);
			return;
		}
		if (window.focusedWindow === $w) {
			return;
		}
		window.focusedWindow && focusedWindow.blur();
		$w.bringToFront();
		$focusShowers.addClass("focused");
		window.focusedWindow = $w;
		$event_target.triggerHandler("focus");
	};
	$w.blur = () => {
		if (window.focusedWindow !== $w) {
			return;
		}
		$focusShowers.removeClass("focused");
		// TODO: document.activeElement && document.activeElement.blur()?
		$event_target.triggerHandler("blur");

		window.focusedWindow = null;
	};

	$w.on("focusin pointerdown", (e) => {
		$w.focus();
	});
	$G.on("pointerdown", (e) => {
		if (
			e.target.closest(".os-window") !== $w[0] &&
			!e.target.closest(".taskbar")
		) {
			$w.blur();
		}
	});

	$w.css("touch-action", "none");

	$w.$x?.on("click", () => {
		$w.close();
	});

	$w.minimize = () => {
		if ($w.is(":visible")) {
			const $task = $w.task.$task;
			const before_rect = $w.$titlebar[0].getBoundingClientRect();
			const after_rect = $task[0].getBoundingClientRect();
			$w.animateTitlebar(before_rect, after_rect, () => {
				$w.hide();
				$w.blur();
			});
		}
	};
	$w.unminimize = () => {
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
	$w.$title_area.on("mousedown selectstart", ".window-button", (e) => {
		e.preventDefault();
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
		for (const $childWindow of child$Windows) {
			$childWindow.bringToFront();
		}
	};
	// var focused = false;
	var last_focused_control;
	$w.on("pointerdown refocus-window", (event) => {
		$w.bringToFront();
		// Test cases where it should refocus the last focused control in the window:
		// - Click in the blank space of the window
		// - Click on the window title bar
		// - Close a second window, focusing the first window
		// - Clicking on a control in the window should focus it, by way of updating last_focused_control
		// - Simulated clicks
		// It should NOT refocus when:
		// - Clicking on a control in a different window
		// - Trying to select text

		// Wait for other pointerdown handlers and default behavior, and focusin events.
		// Set focus to the last focused control, which should be updated if a click just occurred.
		requestAnimationFrame(() => {
			// focused = true;
			// But if the element is selectable, wait until the click is done and see if anything was selected first.
			// This is a bit of a weird compromise, for now.
			const target_style = getComputedStyle(event.target);
			if (target_style.userSelect !== "none") {
				$w.one("pointerup pointercancel", () => {
					requestAnimationFrame(() => { // this seems to make it more reliable in regards to double clicking
						if (last_focused_control && !getSelection().toString().trim()) {
							last_focused_control.focus();
						}
					});
				});
				return;
			}
			if (last_focused_control) {
				last_focused_control.focus();
			}
		});
	});
	// Assumption: no control exists in the window before, this "focusin" handler is set up,
	// so any element.focus() will be after and trigger this handler.
	$w.on("focusin", () => {
		// focused = true;
		if (document.activeElement && $.contains($w[0], document.activeElement)) {
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
		if (e.ctrlKey || e.altKey || e.metaKey) {
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
				// @#: focusables
				let $controls = $w.$content.find("input, textarea, select, button, object, a[href], [tabIndex='0'], details summary").filter(":enabled, summary, a").filter(":visible");
				// const $controls = $w.$content.find(":tabbable"); // https://api.jqueryui.com/tabbable-selector/
				// Radio buttons should be treated as a group with one tabstop.
				// If there's no selected ("checked") radio, it should still visit the group,
				// but it should skip all unselected radios in that group if there is a selected radio in that group.
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
				$controls = $controls.not(to_skip);
				// debug viz:
				// $controls.css({boxShadow: "0 0 2px 2px green"});
				// $(toSkip).css({boxShadow: "0 0 2px 2px gray"})
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
		$w.css({
			left: Math.max(0, Math.min(document.body.scrollWidth - $w.width(), $w.position().left)),
			top: Math.max(0, Math.min(document.body.scrollHeight - $w.height(), $w.position().top)),
		});
	};

	$w.bringTitleBarInBounds = () => {
		// Try to make the titlebar always accessible
		const min_horizontal_pixels_on_screen = 40; // enough for space past a close button
		$w.css({
			left: Math.max(
				min_horizontal_pixels_on_screen - $w.outerWidth(),
				Math.min(
					document.body.scrollWidth - min_horizontal_pixels_on_screen,
					$w.position().left
				)
			),
			top: Math.max(0, Math.min(
				document.body.scrollHeight - $w.$titlebar.outerHeight() - 5,
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
	$w.$titlebar.on("mousedown selectstart", (e) => {
		e.preventDefault();
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

			// Note: innerWidth() is less "inner" than width(), because it includes padding!
			// Here's a little diagram of sorts:
			// outerWidth(true): margin, [ outerWidth(): border, [ innerWidth(): padding, [ width(): content ] ] ]
			const handle_thickness = ($w.outerWidth() - $w.width()) / 2; // padding + border
			const border_width = ($w.outerWidth() - $w.innerWidth()) / 2; // border; need to outset the handles by this amount so they overlap the border + padding, and not the content
			const window_frame_height = $w.outerHeight() - $w.$content.outerHeight(); // includes titlebar and borders
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
				new_rect.width = Math.max(new_rect.width, options.minWidth ?? 100);
				new_rect.height = Math.max(new_rect.height, options.minHeight ?? window_frame_height);
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
