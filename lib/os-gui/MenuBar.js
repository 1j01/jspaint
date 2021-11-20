((exports) => {

function E(nodeName, attrs) {
	const el = document.createElement(nodeName);
	if (attrs) {
		for (const key in attrs) {
			if (key === "class") {
				el.className = attrs[key];
			} else {
				el.setAttribute(key, attrs[key]);
			}
		}
	}
	return el;
}

// straight from jQuery; @TODO: do something simpler
function visible(elem) {
	return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
}

// @TODO: DRY hotkey helpers with jspaint (export them?)

// & defines accelerators (hotkeys) in menus and buttons and things, which get underlined in the UI.
// & can be escaped by doubling it, e.g. "&Taskbar && Start Menu"
function index_of_hotkey(text) {
	// Returns the index of the ampersand that defines a hotkey, or -1 if not present.

	// return english_text.search(/(?<!&)&(?!&|\s)/); // not enough browser support for negative lookbehind assertions

	// The space here handles beginning-of-string matching and counteracts the offset for the [^&] so it acts like a negative lookbehind
	return ` ${text}`.search(/[^&]&[^&\s]/);
}
// function has_hotkey(text) {
// 	return index_of_hotkey(text) !== -1;
// }
// function remove_hotkey(text) {
// 	return text.replace(/\s?\(&.\)/, "").replace(/([^&]|^)&([^&\s])/, "$1$2");
// }
function display_hotkey(text) {
	// TODO: use a more general term like .hotkey or .accelerator?
	return text.replace(/([^&]|^)&([^&\s])/, "$1<span class='menu-hotkey'>$2</span>").replace(/&&/g, "&");
}
function get_hotkey(text) {
	return text[index_of_hotkey(text) + 1].toUpperCase();
}

// TODO: support copy/pasting text in the text tool textarea from the menus
// probably by recording document.activeElement on pointer down,
// and restoring focus before executing menu item actions.

const MENU_DIVIDER = "MENU_DIVIDER";

const MAX_MENU_NESTING = 1000;

const internal_z_counter = 1;
function get_new_menu_z_index() {
	// integrate with the OS window z-indexes, if applicable
	// but don't depend on $Window existing, the modules should be independent
	if (typeof $Window !== "undefined") {
		return ($Window.Z_INDEX++) + MAX_MENU_NESTING; // MAX_MENU_NESTING is needed because the window gets brought to the top
	}
	return (++internal_z_counter) + MAX_MENU_NESTING;
}

function MenuBar(menus) {
	if (!(this instanceof MenuBar)) {
		return new MenuBar(menus);
	}

	const menus_el = E("div", { class: "menus", "touch-action": "none" });

	// returns writing/layout direction, "ltr" or "rtl"
	function get_direction() {
		return window.get_direction ? window.get_direction() : getComputedStyle(menus_el).direction;
	}

	let selecting_menus = false; // state where you can glide between menus without clicking

	let active_menu_index = -1; // index of the top level menu that's most recently open

	// There can be multiple menu bars instantiated from the same menu definitions,
	// so this can't be a map of menu item to submenu, it has to be of menu item ELEMENTS to submenu.
	// (or you know, it could work totally differently, this is just one way obviously)
	// This is for entering submenus.
	const submenu_popups_by_menu_item_el = new Map();

	// This is for exiting submenus.
	const parent_item_el_by_popup_el = new Map();

	// @TODO: specific to this menu bar (note that popups are not descendants of the menu bar)
	const any_open_menus = () => [...document.querySelectorAll(".menu-popup")].some(popup_el => visible(popup_el));

	const close_menus = () => {
		for (const { menu_button_el } of top_level_menus) {
			menu_button_el.dispatchEvent(new CustomEvent("release"), {});
		}
		// Close any rogue floating submenus
		const popup_els = document.querySelectorAll(".menu-popup");
		for (const popup_el of popup_els) {
			if (!window.debugKeepMenusOpen) {
				popup_el.style.display = "none";
			}
		}
	};

	const is_disabled = item => {
		if (typeof item.enabled === "function") {
			return !item.enabled();
		} else if (typeof item.enabled === "boolean") {
			return !item.enabled;
		} else {
			return false;
		}
	};

	function send_info_event(item) {
		// @TODO: in a future version, give the whole menu item definition (or null)
		const description = item?.description || "";
		if (window.jQuery) {
			// old API (using jQuery's "extraParameters"), made forwards compatible with new API (event.detail)
			const event = new window.jQuery.Event("info", { detail: { description } });
			const extraParam = {
				toString() {
					console.warn("jQuery extra parameter for info event is deprecated, use event.detail instead");
					return description;
				},
			};
			window.jQuery(menus_el).trigger(event, extraParam);
		} else {
			menus_el.dispatchEvent(new CustomEvent("info", { detail: { description } }));
		}
	}

	const top_level_menus = [];

	// attached to menu bar and floating popups (which are not descendants of the menu bar)
	function handleKeyDown(e) {
		if (e.defaultPrevented) {
			return;
		}
		const active_menu_popup_el = e.target.closest(".menu-popup");
		const top_level_menu = top_level_menus[active_menu_index];
		const { menu_button_el, open_top_level_menu } = top_level_menu;
		// console.log("keydown", e.key, { target: e.target, active_menu_popup_el, top_level_menu });
		const menu_popup_el = active_menu_popup_el || top_level_menu.menu_popup_el;
		const parent_item_el = parent_item_el_by_popup_el.get(active_menu_popup_el);
		const focused_item_el = menu_popup_el.querySelector(".menu-item:focus");

		switch (e.keyCode) {
			case 37: // Left
			case 39: // Right
				const right = e.keyCode === 39;
				if (
					focused_item_el?.classList.contains("has-submenu") &&
					(get_direction() === "ltr") === right
				) {
					// enter submenu
					focused_item_el.dispatchEvent(new Event("click"));
					// focus first item in submenu
					const submenu_popup = submenu_popups_by_menu_item_el.get(focused_item_el);
					submenu_popup.element.querySelector(".menu-item").focus();
					e.preventDefault();
				} else if (
					parent_item_el &&
					!parent_item_el.classList.contains("menu-button") && // left/right doesn't make sense to close the top level menu
					(get_direction() === "ltr") !== right
				) {
					// exit submenu
					parent_item_el.focus();
					active_menu_popup_el.style.display = "none";
					e.preventDefault();
				} else {
					// go to next/previous top level menu, wrapping around
					// and open a new menu only if a menu was already open
					const menu_was_open = visible(menu_popup_el);
					const cycle_dir = ((get_direction() === "ltr") === right) ? 1 : -1;
					const new_index = (active_menu_index + cycle_dir + top_level_menus.length) % top_level_menus.length;
					const new_top_level_menu = top_level_menus[new_index];
					const target_button_el = new_top_level_menu.menu_button_el;
					if (menu_was_open) {
						new_top_level_menu.open_top_level_menu("keydown");
					} else {
						menu_button_el.dispatchEvent(new CustomEvent("release"), {});
						target_button_el.focus();
					}
					e.preventDefault();
				}
				break;
			case 40: // Down
			case 38: // Up
				const down = e.keyCode === 40;
				if (menu_popup_el && visible(menu_popup_el) && focused_item_el) {
					const cycle_dir = down ? 1 : -1;
					const item_els = [...menu_popup_el.querySelectorAll(".menu-item")];
					const from_index = item_els.indexOf(focused_item_el);
					const to_index = (from_index + cycle_dir + item_els.length) % item_els.length;
					const to_item_el = item_els[to_index];
					to_item_el.focus();
				} else {
					open_top_level_menu("keydown");
				}
				e.preventDefault();
				break;
			case 27: // Escape
				if (any_open_menus()) {
					// (@TODO: doesn't parent_item_el always exist?)
					if (parent_item_el && parent_item_el !== menu_button_el) {
						parent_item_el.focus();
						active_menu_popup_el.style.display = "none";
					} else {
						// close_menus takes care of releasing the pressed state of the button as well
						close_menus();
						menu_button_el.focus();
					}
					e.preventDefault();
				} else {
					const window_el = menus_el.closest(".window");
					if (window_el) {
						// refocus last focused control in window
						// refocus-window should never focus the menu bar
						// it stores the last focused control in the window and specifically not in the menus
						window_el.dispatchEvent(new CustomEvent("refocus-window"));
						e.preventDefault();
					}
				}
				break;
			case 18: // Alt
				// close all menus and refocus the last focused control in the window
				close_menus();
				const window_el = menus_el.closest(".window");
				if (window_el) {
					window_el.dispatchEvent(new CustomEvent("refocus-window"));
				}
				e.preventDefault();
				break;
			case 32: // Space
				// opens system menu in Windows 98
				// (at top level)
				break;
			case 13: // Enter
				// Enter is handled elsewhere, except for top level buttons
				if (menu_button_el === document.activeElement) {
					open_top_level_menu("keydown");
					e.preventDefault();
				}
				break;
			default:
				// handle accelerators and first-letter navigation
				const key = String.fromCharCode(e.keyCode).toLowerCase();
				const item_els = [...menu_popup_el.querySelectorAll(".menu-item")];
				const item_els_by_accelerator = {};
				for (const item_el of item_els) {
					const accelerator = item_el.querySelector(".menu-hotkey");
					const accelerator_key = (accelerator ? accelerator.textContent : item_el.querySelector(".menu-item-label").textContent[0]).toLowerCase();
					item_els_by_accelerator[accelerator_key] = item_els_by_accelerator[accelerator_key] || [];
					item_els_by_accelerator[accelerator_key].push(item_el);
				}
				const matching_item_els = item_els_by_accelerator[key] || [];
				if (matching_item_els.length) {
					if (matching_item_els.length === 1) {
						// it's unambiguous, go ahead and activate it
						const menu_item_el = matching_item_els[0];
						menu_item_el.dispatchEvent(new Event("pointerenter"));
						menu_item_el.dispatchEvent(new Event("pointerdown"));
						menu_item_el.dispatchEvent(new Event("click"));
						menu_item_el.dispatchEvent(new Event("pointerup"));
						e.preventDefault();
					} else {
						// cycle the menu items that match the key
						let index = matching_item_els.indexOf(focused_item_el);
						if (index === -1) {
							index = 0;
						} else {
							index = (index + 1) % matching_item_els.length;
						}
						const menu_item_el = matching_item_els[index];
						menu_item_el.focus();
						e.preventDefault();
					}
				}
				break;
		}
	}

	menus_el.addEventListener("keydown", handleKeyDown);

	// TODO: API for context menus (i.e. floating menu popups)
	function MenuPopup(menu_items) {
		const menu_popup_el = E("div", { class: "menu-popup", id: `menu-popup-${Math.random().toString(36).substr(2, 9)}` });
		const menu_popup_table_el = E("table", { class: "menu-popup-table" });
		menu_popup_el.appendChild(menu_popup_table_el);

		menu_popup_el.addEventListener("keydown", handleKeyDown);

		let submenus = [];

		menu_items.forEach(item => {
			const row_el = E("tr", { class: "menu-row" });
			menu_popup_table_el.appendChild(row_el);
			if (item === MENU_DIVIDER) {
				const td_el = E("td", { colspan: 4 });
				const hr_el = E("hr", { class: "menu-hr" });
				td_el.appendChild(hr_el);
				row_el.appendChild(td_el);
			} else {
				const item_el = row_el;
				item_el.classList.add("menu-item");
				item_el.setAttribute("tabIndex", -1);
				const checkbox_area_el = E("td", { class: "menu-item-checkbox-area" });
				const label_el = E("td", { class: "menu-item-label" });
				const shortcut_el = E("td", { class: "menu-item-shortcut" });
				const submenu_area_el = E("td", { class: "menu-item-submenu-area" });

				item_el.appendChild(checkbox_area_el);
				item_el.appendChild(label_el);
				item_el.appendChild(shortcut_el);
				item_el.appendChild(submenu_area_el);

				label_el.innerHTML = display_hotkey(item.item);
				shortcut_el.textContent = item.shortcut;

				item_el._menu_item = item;

				menu_popup_el.addEventListener("update", () => {
					// item_el.disabled = is_disabled(item); // doesn't work, probably because it's a <tr>
					if (is_disabled(item)) {
						item_el.setAttribute("disabled", "");
					} else {
						item_el.removeAttribute("disabled");
					}
					if (item.checkbox && item.checkbox.check) {
						checkbox_area_el.textContent = item.checkbox.check() ? "✓" : "";
					}
				});
				item_el.addEventListener("pointerenter", () => {
					menu_popup_el.dispatchEvent(new CustomEvent("update"), {}); // @TODO: why?
					item_el.focus();
				});

				if (item.checkbox) {
					checkbox_area_el.textContent = "✓";
				}

				let open_submenu, submenu_popup_el;
				if (item.submenu) {
					item_el.classList.add("has-submenu");
					submenu_area_el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 10 11" style="fill:currentColor;display:inline-block;vertical-align:middle"><path d="M7.5 4.33L0 8.66L0 0z"/></svg>';
					menu_popup_el.addEventListener("update", () => {
						submenu_area_el.querySelector("svg").style.transform = get_direction() === "rtl" ? "scaleX(-1)" : "";
					});

					const submenu_popup = MenuPopup(item.submenu);
					submenu_popup_el = submenu_popup.element;
					document.body.appendChild(submenu_popup_el);
					submenu_popup_el.style.display = "none";

					submenu_popups_by_menu_item_el.set(item_el, submenu_popup);
					parent_item_el_by_popup_el.set(submenu_popup_el, item_el);
					submenu_popup_el.dataset.semanticParent = menu_popup_el.id; // for $Window to understand the popup belongs to its window

					open_submenu = () => {
						if (submenu_popup_el.style.display !== "none") {
							return;
						}
						close_submenus_at_this_level();

						submenu_popup_el.style.display = "";
						submenu_popup_el.style.zIndex = get_new_menu_z_index();
						submenu_popup_el.setAttribute("dir", get_direction());

						// console.log("open_submenu — submenu_popup_el.style.zIndex", submenu_popup_el.style.zIndex, "$Window.Z_INDEX", $Window.Z_INDEX, "menus_el.closest('.window').style.zIndex", menus_el.closest(".window").style.zIndex);
						// setTimeout(() => { console.log("after timeout, menus_el.closest('.window').style.zIndex", menus_el.closest(".window").style.zIndex); }, 0);
						submenu_popup_el.dispatchEvent(new CustomEvent("update"), {});
						const rect = item_el.getBoundingClientRect();
						let submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
						submenu_popup_el.style.position = "absolute";
						submenu_popup_el.style.left = `${(get_direction() === "rtl" ? rect.left - submenu_popup_rect.width : rect.right) + window.scrollX}px`;
						submenu_popup_el.style.top = `${rect.top + window.scrollY}px`;

						submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
						// This is surely not the cleanest way of doing this,
						// and the logic is not very robust in the first place,
						// but I want to get RTL support done and so I'm mirroring this in the simplest way possible.
						if (get_direction() === "rtl") {
							if (submenu_popup_rect.left < 0) {
								submenu_popup_el.style.left = `${rect.right}px`;
								submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
								if (submenu_popup_rect.right > innerWidth) {
									submenu_popup_el.style.left = `${innerWidth - submenu_popup_rect.width}px`;
								}
							}
						} else {
							if (submenu_popup_rect.right > innerWidth) {
								submenu_popup_el.style.left = `${rect.left - submenu_popup_rect.width}px`;
								submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
								if (submenu_popup_rect.left < 0) {
									submenu_popup_el.style.left = "0";
								}
							}
						}
					};

					function close_submenu() {
						submenu_popup_el.style.display = "none";
						item_el.setAttribute("aria-expanded", "false");
						if (submenu_popup_el._submenus) {
							for (const submenu of submenu_popup_el._submenus) {
								submenu.close_submenu();
							}
						}
					}

					submenus.push({
						item_el,
						submenu_popup_el,
						open_submenu,
						close_submenu,
					});
					menu_popup_el._submenus = submenus;
					menu_popup_el._close_submenus = close_submenus_at_this_level;

					function close_submenus_at_this_level() {
						for (const submenu of submenus) {
							submenu.close_submenu();
						}
					}

					// It should close when hovering a different higher level menu
					// after a delay, unless the mouse returns to the submenu.
					// If you return the mouse from a submenu into its parent
					// *directly onto the parent menu item*, it stays open, but if you cross other menu items
					// in the parent menu, (@TODO:) it'll close after the delay even if you land on the parent menu item.
					// @TODO: Highlight the submenu-containing item while the submenu is open,
					// unless hovering a different item at that level (one highlight per level max).
					// @TODO: once a submenu opens (completing its animation if it has one),
					// - up/down should navigate the submenu (although it should not show as focused right away)
					//   - the rule is probably: up/down navigate the bottom-most submenu always (as long as it's not animating)
					// - the submenu cancels its closing timeout (if you've moved outside all menus, say)
					// @TODO: make this more robust in general! Make some automated tests.

					let open_tid, close_tid;
					submenu_popup_el.addEventListener("pointerenter", () => {
						if (open_tid) { clearTimeout(open_tid); open_tid = null; }
						if (close_tid) { clearTimeout(close_tid); close_tid = null; }
					});
					item_el.addEventListener("pointerenter", () => {
						// @TODO: don't cancel close timer? in Windows 98 it'll close after a delay even if you hover the parent menu item
						if (open_tid) { clearTimeout(open_tid); open_tid = null; }
						if (close_tid) { clearTimeout(close_tid); close_tid = null; }
						open_tid = setTimeout(open_submenu, 501); // @HACK: slightly longer than close timer
					});
					item_el.addEventListener("pointerleave", () => {
						if (open_tid) { clearTimeout(open_tid); open_tid = null; }
					});
					menu_popup_el.addEventListener("pointerenter", (event) => {
						// console.log(event.target.closest(".menu-item"));
						if (event.target.closest(".menu-item") === item_el) {
							return;
						}
						if (!close_tid) {
							// This is a little confusing, with timers per-item...
							// @TODO: try doing this with just one or two timers.
							// if (submenus.some(submenu => submenu.submenu_popup_el.style.display !== "none")) {
							if (submenu_popup_el.style.display !== "none") {
								close_tid = setTimeout(() => {
									if (!window.debugKeepMenusOpen) {
										// close_submenu();
										close_submenus_at_this_level();
									}
								}, 500);
							}
						}
					});
					// keep submenu open while mouse is outside any parent menus
					menu_popup_el.addEventListener("pointerleave", () => {
						if (close_tid) { clearTimeout(close_tid); close_tid = null; }
					});

					item_el.addEventListener("click", open_submenu);
					item_el.addEventListener("pointerdown", open_submenu);
				}

				const item_action = () => {
					if (item.checkbox) {
						if (item.checkbox.toggle) {
							item.checkbox.toggle();
						}
						menu_popup_el.dispatchEvent(new CustomEvent("update"), {});
					} else if (item.action) {
						close_menus();
						item.action();
					}
				};
				item_el.addEventListener("pointerup", e => {
					if (e.pointerType === "mouse" && e.button !== 0) {
						return;
					}
					item_action();
				});
				item_el.addEventListener("pointerenter", () => {
					send_info_event(item);
				});
				item_el.addEventListener("pointerleave", () => {
					if (visible(item_el)) {
						send_info_event();
						parent_item_el_by_popup_el.get(menu_popup_el)?.focus();
					}
				});

				item_el.addEventListener("keydown", e => {
					if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
						return;
					}
					if (e.keyCode === 13) { // Enter
						e.preventDefault();
						if (item.submenu) {
							// this isn't part of item_action because it shouldn't happen on click
							open_submenu();
							// focus first item in submenu
							submenu_popup_el.querySelector(".menu-item").focus();
						} else {
							item_action();
						}
					}
				});
			}
		});

		return { element: menu_popup_el };
	}

	let this_click_opened_the_menu = false;
	const make_menu_button = (menus_key, menu_items) => {
		const menu_button_el = E("div", { class: "menu-button", "aria-expanded": "false" });

		menus_el.appendChild(menu_button_el);

		const menu_popup = MenuPopup(menu_items);
		const menu_popup_el = menu_popup.element;
		document.body.appendChild(menu_popup_el);
		submenu_popups_by_menu_item_el.set(menu_button_el, menu_popup);
		parent_item_el_by_popup_el.set(menu_popup_el, menu_button_el);
		menu_button_el.id = `menu-button-${menus_key}-${Math.random().toString(36).substr(2, 9)}`;
		menu_popup_el.dataset.semanticParent = menu_button_el.id; // for $Window to understand the popup belongs to its window

		const update_position_from_containing_bounds = () => {
			const rect = menu_button_el.getBoundingClientRect();
			let popup_rect = menu_popup_el.getBoundingClientRect();
			menu_popup_el.style.position = "absolute";
			menu_popup_el.style.left = `${(get_direction() === "rtl" ? rect.right - popup_rect.width : rect.left) + window.scrollX}px`;
			menu_popup_el.style.top = `${rect.bottom + window.scrollY}px`;

			const uncorrected_rect = menu_popup_el.getBoundingClientRect();
			// rounding down is needed for RTL layout for the rightmost menu, to prevent a scrollbar
			if (Math.floor(uncorrected_rect.right) > innerWidth) {
				menu_popup_el.style.left = `${innerWidth - uncorrected_rect.width}px`;
			}
			if (Math.ceil(uncorrected_rect.left) < 0) {
				menu_popup_el.style.left = "0px";
			}
		};
		window.addEventListener("resize", update_position_from_containing_bounds);
		menu_popup_el.addEventListener("update", update_position_from_containing_bounds);
		// update_position_from_containing_bounds(); // will be called when the menu is opened

		const menu_id = menus_key.replace("&", "").replace(/ /g, "-").toLowerCase();
		menu_button_el.classList.add(`${menu_id}-menu-button`);
		// menu_popup_el.id = `${menu_id}-menu-popup-${Math.random().toString(36).substr(2, 9)}`; // id is created by MenuPopup and changing it breaks the data-semantic-parent relationship
		menu_popup_el.style.display = "none";
		menu_button_el.innerHTML = display_hotkey(menus_key);
		menu_button_el.tabIndex = -1;

		menu_button_el.setAttribute("aria-haspopup", "true");
		menu_button_el.setAttribute("aria-controls", menu_popup_el.id);

		// @TODO: allow setting scope for alt shortcuts, like menuBar.setHotkeyScope(windowElement||window)
		// and add a helper to $Window to set up a menu bar, like $window.setMenuBar(menuBar||null)
		window.addEventListener("keydown", e => {
			if (e.ctrlKey || e.metaKey) { // Ctrl or Command held
				if (e.keyCode !== 17 && e.keyCode !== 91 && e.keyCode !== 93 && e.keyCode !== 224) { // anything but Ctrl or Command pressed
					close_menus();
				}
				return;
			}
			if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) { // Alt held
				if (String.fromCharCode(e.keyCode) === get_hotkey(menus_key)) {
					e.preventDefault();
					open_top_level_menu("keydown");
				}
			}
		});
		menu_button_el.addEventListener("focus", () => {
			active_menu_index = Object.keys(menus).indexOf(menus_key);
		});
		menu_button_el.addEventListener("pointerdown", e => {
			open_top_level_menu(e.type);
		});
		menu_button_el.addEventListener("pointerenter", e => {
			if (selecting_menus) {
				open_top_level_menu(e.type);
			}
		});
		function open_top_level_menu(type = "other") {
			if (type !== "pointerenter") {
				if (!menu_button_el.classList.contains("active")) {
					this_click_opened_the_menu = true;
				}
			}

			close_menus();

			menu_button_el.focus();
			menu_button_el.classList.add("active");
			menu_button_el.setAttribute("aria-expanded", "true");
			menu_popup_el.style.display = "";
			menu_popup_el.style.zIndex = get_new_menu_z_index();
			menu_popup_el.setAttribute("dir", get_direction());
			// console.log("pointerdown (possibly simulated) — menu_popup_el.style.zIndex", menu_popup_el.style.zIndex, "$Window.Z_INDEX", $Window.Z_INDEX, "menus_el.closest('.window').style.zIndex", menus_el.closest(".window").style.zIndex);
			// setTimeout(() => { console.log("after timeout, menus_el.closest('.window').style.zIndex", menus_el.closest(".window").style.zIndex); }, 0);
			active_menu_index = Object.keys(menus).indexOf(menus_key);
			menu_popup_el.dispatchEvent(new CustomEvent("update"), {});

			selecting_menus = true;

			send_info_event();

			if (type === "keydown") {
				menu_popup_el.querySelector(".menu-item")?.focus();
			}
		};
		menu_button_el.addEventListener("pointerup", () => {
			if (this_click_opened_the_menu) {
				this_click_opened_the_menu = false;
				return;
			}
			if (menu_button_el.classList.contains("active")) {
				close_menus();
			}
		});
		menu_button_el.addEventListener("release", () => {
			selecting_menus = false;

			menu_button_el.classList.remove("active");
			if (!window.debugKeepMenusOpen) {
				menu_popup_el.style.display = "none";
			}
			menu_button_el.setAttribute("aria-expanded", "false");

			menus_el.dispatchEvent(new CustomEvent("default-info", {}));
		});
		top_level_menus.push({
			menu_button_el,
			menu_popup_el,
			menus_key,
			open_top_level_menu,
		});
	};
	for (const menu_key in menus) {
		make_menu_button(menu_key, menus[menu_key]);
	}

	window.addEventListener("keydown", e => {
		// close any errant menus
		// taking care not to interfere with regular Escape key behavior
		// @TODO: listen for menus_el removed from DOM, and close menus there
		if (
			!document.activeElement ||
			!document.activeElement.closest || // window or document
			!document.activeElement.closest(".menus, .menu-popup")
		) {
			if (e.keyCode === 27) { // Escape
				if (any_open_menus()) {
					close_menus();
					e.preventDefault();
				}
			}
		}
	});
	window.addEventListener("blur", close_menus);
	function close_menus_on_click_outside(event) {
		if (!event.target.closest(".menus, .menu-popup")) {
			// window.console && console.log(event.type, "occurred outside of menus (on ", event.target, ") so...");
			close_menus();
		}
	}
	window.addEventListener("pointerdown", close_menus_on_click_outside);
	window.addEventListener("pointerup", close_menus_on_click_outside);

	this.element = menus_el;
}

exports.MenuBar = MenuBar;
exports.MENU_DIVIDER = MENU_DIVIDER;

})(window);
