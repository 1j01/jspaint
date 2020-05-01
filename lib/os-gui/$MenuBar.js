(function(exports) {

// TODO: E\("([a-z]+)"\) -> "<$1>" or get rid of jQuery as a dependency
function E(t){
	return document.createElement(t);
}

// @TODO: make menus not take focus so we can support copy/pasting text in the text tool textarea from the menus

const MENU_DIVIDER = "MENU_DIVIDER";

function $MenuBar(menus){
	
	const $ = jQuery;
	const $G = $(self);
	
	const $menus = $(E("div")).addClass("menus");
	
	$menus.attr("touch-action", "none");
	let selecting_menus = false;
	
	const _html = menus_key => menus_key.replace(/&(.)/, m => `<span class='menu-hotkey'>${m[1]}</span>`);
	const _hotkey = menus_key => menus_key[menus_key.indexOf("&")+1].toUpperCase();
	
	const close_menus = () => {
		$menus.find(".menu-button").trigger("release");
		// Close any rogue floating submenus
		$(".menu-popup").hide();
	};
	
	const is_disabled = item => {
		if(typeof item.enabled === "function"){
			return !item.enabled();
		}else if(typeof item.enabled === "boolean"){
			return !item.enabled;
		}else{
			return false;
		}
	};
	
	// @TODO: API for context menus (i.e. floating menu popups)
	function $MenuPopup(menu_items){
		const $menu_popup = $(E("div")).addClass("menu-popup");
		const $menu_popup_table = $(E("table")).addClass("menu-popup-table").appendTo($menu_popup);
		
		$.map(menu_items, item => {
			const $row = $(E("tr")).addClass("menu-row").appendTo($menu_popup_table);
			if(item === MENU_DIVIDER){
				const $td = $(E("td")).attr({colspan: 4}).appendTo($row);
				const $hr = $(E("hr")).addClass("menu-hr").appendTo($td);
			}else{
				const $item = $row.addClass("menu-item");
				const $checkbox_area = $(E("td")).addClass("menu-item-checkbox-area");
				const $label = $(E("td")).addClass("menu-item-label");
				const $shortcut = $(E("td")).addClass("menu-item-shortcut");
				const $submenu_area = $(E("td")).addClass("menu-item-submenu-area");
				
				$item.append($checkbox_area, $label, $shortcut, $submenu_area);
				
				$item.attr("tabIndex", -1);
				
				$label.html(_html(item.item));
				$shortcut.text(item.shortcut);
				
				$menu_popup.on("update", () => {
					$item.attr("disabled", is_disabled(item));
					if(item.checkbox && item.checkbox.check){
						$checkbox_area.text(item.checkbox.check() ? "✓" : "");
					}
				});
				$item.on("pointerover", () => {
					$menu_popup.triggerHandler("update");
					$item[0].focus();
				});
				
				if(item.checkbox){
					$checkbox_area.text("✓");
				}
				
				if(item.submenu){
					$submenu_area.html('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 10 11" style="fill:currentColor;display:inline-block;vertical-align:middle"><path d="M7.5 4.33L0 8.66L0 0z"/></svg>');
					
					const $submenu_popup = $MenuPopup(item.submenu).appendTo("body");
					$submenu_popup.hide();
					
					const open_submenu = () => {
						$submenu_popup.show();
						$submenu_popup.triggerHandler("update");
						const rect = $item[0].getBoundingClientRect();
						$submenu_popup.css({
							position: "absolute",
							left: rect.right + window.scrollX,
							top: rect.top + window.scrollY,
						});
						let submenu_popup_rect = $submenu_popup[0].getBoundingClientRect();
						if (submenu_popup_rect.right > innerWidth) {
							$submenu_popup.css({
								left: rect.left - submenu_popup_rect.width,
							});
							submenu_popup_rect = $submenu_popup[0].getBoundingClientRect();
							if (submenu_popup_rect.left < 0) {
								$submenu_popup.css({
									left: 0,
								});
							}
						}
					};
					let open_tid, close_tid;
					$item.add($submenu_popup).on("pointerover", ()=> {
						if(open_tid){clearTimeout(open_tid);}
						if(close_tid){clearTimeout(close_tid);}
					});
					$item.on("pointerover", ()=> {
						if(open_tid){clearTimeout(open_tid);}
						if(close_tid){clearTimeout(close_tid);}
						open_tid = setTimeout(open_submenu, 200);
					});
					$item.add($submenu_popup).on("pointerout", () => {
						$menu_popup.closest(".menu-container").find(".menu-button")[0].focus();
						if(open_tid){clearTimeout(open_tid);}
						if(close_tid){clearTimeout(close_tid);}
						close_tid = setTimeout(() => {
							$submenu_popup.hide();
						}, 200);
					});
					$item.on("click pointerdown", open_submenu);
				}
				
				const item_action = () => {
					if(item.checkbox){
						if(item.checkbox.toggle){
							item.checkbox.toggle();
						}
						$menu_popup.triggerHandler("update");
					}else if(item.action){
						close_menus();
						item.action();
					}
				};
				$item.on("pointerup", e => {
					if(e.pointerType === "mouse" && e.button !== 0){
						return;
					}
					item_action();
				});
				$item.on("pointerover", () => {
					if(item.submenu){
						$menus.triggerHandler("info", "");
					}else{
						$menus.triggerHandler("info", item.description || "");
					}
				});
				$item.on("pointerout", () => {
					if($item.is(":visible")){
						$menus.triggerHandler("info", "");
						// may not exist for submenu popups
						const menu_button = $menu_popup.closest(".menu-container").find(".menu-button")[0];
						if(menu_button){
							menu_button.focus();
						}
					}
				});
				
				$item.on("keydown", e => {
					if(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey){
						return;
					}
					if(e.keyCode === 13){ // Enter
						e.preventDefault();
						item_action();
					}
				});
				
				$menu_popup.on("keydown", e => {
					if(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey){
						return;
					}
					if(String.fromCharCode(e.keyCode) === _hotkey(item.item)){
						e.preventDefault();
						$item.trogger("click");
					}
				});
			}
		});
		
		return $menu_popup;
	}
	
	let this_click_opened_the_menu = false;
	const make_menu = (menus_key, menu_items) => {
		const $menu_container = $(E("div")).addClass("menu-container").appendTo($menus);
		const $menu_button = $(E("div")).addClass("menu-button").appendTo($menu_container);
		const $menu_popup = $MenuPopup(menu_items).appendTo($menu_container);
		
		const update_position_from_containing_bounds = ()=> {
			$menu_popup.css("left", "");
			const uncorrected_rect = $menu_popup[0].getBoundingClientRect();
			if(uncorrected_rect.right > innerWidth) {
				$menu_popup.css("left", innerWidth - uncorrected_rect.width - uncorrected_rect.left);
			}
		};
		$G.on("resize", update_position_from_containing_bounds);
		$menu_popup.on("update", update_position_from_containing_bounds);
		update_position_from_containing_bounds();

		const menu_id = menus_key.replace("&", "").replace(/ /g, "-").toLowerCase();
		$menu_button.addClass(`${menu_id}-menu-button`);
		
		$menu_popup.hide();
		$menu_button.html(_html(menus_key));
		$menu_button.attr("tabIndex", -1)
		$menu_container.on("keydown", e => {
			const $focused_item = $menu_popup.find(".menu-item:focus");
			switch(e.keyCode){
				case 37: // Left
					$menu_container.prev().find(".menu-button").trigger("pointerdown");
					break;
				case 39: // Right
					if($focused_item.find(".menu-item-submenu-area:not(:empty)").length){
						$focused_item.trigger("click");
						$(".menu-popup .menu-item")[0].focus(); // first item
						e.preventDefault();
					}else{
						$menu_container.next().find(".menu-button").trigger("pointerdown");
					}
					break;
				case 40: // Down
					if($menu_popup.is(":visible") && $focused_item.length){
						let $next = $focused_item.next();
						while($next.length && !$next.is(".menu-item")){
							$next = $next.next();
						}
						$next[0].focus();
					}else{
						$menu_button.trigger("pointerdown");
						$menu_popup.find(".menu-item")[0].focus(); // first item
					}
					break;
				case 38: // Up
					if($menu_popup.is(":visible") && $focused_item.length){
						let $prev = $focused_item.prev();
						while($prev.length && !$prev.is(".menu-item")){
							$prev = $prev.prev();
						}
						$prev[0].focus();
					}else{
						$menu_button.trigger("pointerdown"); // or maybe do nothing?
						$menu_popup.find(".menu-item").last()[0].focus();
					}
					break;
			}
		});
		$G.on("keydown", e => {
			if(e.ctrlKey || e.metaKey){ // Ctrl or Command held
				if(e.keyCode !== 17 && e.keyCode !== 91 && e.keyCode !== 93 && e.keyCode !== 224){ // anything but Ctrl or Command pressed
					close_menus();
				}
				return;
			}
			if(e.altKey){
				if(String.fromCharCode(e.keyCode) === _hotkey(menus_key)){
					e.preventDefault();
					$menu_button.trigger("pointerdown");
				}
			}
		});
		$menu_button.on("pointerdown pointerover", e => {
			if(e.type === "pointerover" && !selecting_menus){
				return;
			}
			if(e.type !== "pointerover"){
				if(!$menu_button.hasClass("active")){
					this_click_opened_the_menu = true;
				}
			}
			
			close_menus();
			
			$menu_button[0].focus();
			$menu_button.addClass("active");
			$menu_popup.show();
			$menu_popup.triggerHandler("update");
			
			selecting_menus = true;
			
			$menus.triggerHandler("info", "");
		});
		$menu_button.on("pointerup", ()=> {
			if(this_click_opened_the_menu){
				this_click_opened_the_menu = false;
				return;
			}
			if($menu_button.hasClass("active")){
				close_menus();
			}
		});
		$menu_button.on("release", ()=> {
			selecting_menus = false;
			
			$menu_button.removeClass("active");
			$menu_popup.hide();
			
			$menus.triggerHandler("default-info");
		});
	};
	for (const menu_key in menus) {
		make_menu(menu_key, menus[menu_key]);
	}

	$G.on("keypress", e => {
		if(e.keyCode === 27){ // Esc
			close_menus();
		}
	});
	$G.on("blur", ()=> {
		// window.console && console.log("blur", e.target, document.activeElement);
		close_menus();
	});
	$G.on("pointerdown pointerup", e => {
		if($(e.target).closest(".menus, .menu-popup").length === 0){
			// window.console && console.log(e.type, "occurred outside of menus (on ", e.target, ") so...");
			close_menus();
		}
	});
	
	return $menus;

}

exports.$MenuBar = $MenuBar;
exports.MENU_DIVIDER = MENU_DIVIDER;

})(window);
