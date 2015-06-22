
(function(){
	
	var $menus = $(E("div")).addClass("jspaint-menus").prependTo($V);
	var selecting_menus = false;
	
	var _html = function(menus_key){
		return menus_key.replace(/&(.)/, function(m){
			return "<span class='jspaint-menu-hotkey'>" + m[1] + "</span>";
		});
	};
	var _hotkey = function(menus_key){
		return menus_key[menus_key.indexOf("&")+1].toUpperCase();
	};
	
	var close_menus = function(){
		// console.log("close menus");
		$menus.find(".jspaint-menu-button").trigger("release");
		// Close any rogue floating submenus
		$(".jspaint-menu-popup").hide();
	};
	
	var is_disabled = function(item){
		if(typeof item.enabled === "function"){
			return !item.enabled();
		}else if(typeof item.enabled === "boolean"){
			return !item.enabled;
		}else{
			return false;
		}
	};
	
	function $MenuPopup(menu_items){
		var $menu_popup = $(E("div")).addClass("jspaint-menu-popup");
		var $menu_popup_table = $(E("table")).addClass("jspaint-menu-popup-table").appendTo($menu_popup);
		
		$.map(menu_items, function(item){
			var $row = $(E("tr")).addClass("jspaint-menu-row").appendTo($menu_popup_table)
			if(item === ____________________________){
				var $td = $(E("td")).attr({colspan: 4}).appendTo($row);
				var $hr = $(E("hr")).addClass("jspaint-menu-hr").appendTo($td);
			}else{
				var $item = $row.addClass("jspaint-menu-item");
				var $checkbox_area = $(E("td")).addClass("jspaint-menu-item-checkbox-area");
				var $label = $(E("td")).addClass("jspaint-menu-item-label");
				var $shortcut = $(E("td")).addClass("jspaint-menu-item-shortcut");
				var $submenu_area = $(E("td")).addClass("jspaint-menu-item-submenu-area");
				
				$item.append($checkbox_area, $label, $shortcut, $submenu_area);
				
				$item.attr("tabIndex", -1);
				
				$label.html(_html(item.item));
				$shortcut.text(item.shortcut);
				
				$menu_popup.on("update", function(){
					$item.attr("disabled", is_disabled(item));
					if(item.checkbox && item.checkbox.check){
						$checkbox_area.text(item.checkbox.check() ? "✓" : "");
					}
				});
				$item.on("pointerover", function(){
					$menu_popup.triggerHandler("update");
					$item.focus();
				});
				
				if(item.checkbox){
					$checkbox_area.text("✓");
				}
				
				if(item.submenu){
					$submenu_area.text("▶");
					
					var $submenu_popup = $MenuPopup(item.submenu).appendTo("body");
					$submenu_popup.hide();
					
					var open_submenu = function(){
						$submenu_popup.show();
						$submenu_popup.triggerHandler("update");
						var rect = $submenu_area[0].getBoundingClientRect();
						$submenu_popup.css({
							position: "absolute",
							left: rect.right,
							top: rect.top,
						});
					};
					var open_tid, close_tid;
					$item.add($submenu_popup).on("pointerover", function(e){
						if(open_tid){clearTimeout(open_tid);}
						if(close_tid){clearTimeout(close_tid);}
					});
					$item.on("pointerover", function(e){
						if(open_tid){clearTimeout(open_tid);}
						if(close_tid){clearTimeout(close_tid);}
						open_tid = setTimeout(open_submenu, 200);
					});
					$item.add($submenu_popup).on("pointerout", function(){
						if(open_tid){clearTimeout(open_tid);}
						if(close_tid){clearTimeout(close_tid);}
						close_tid = setTimeout(function(){
							$submenu_popup.hide();
						}, 200);
					});
					$item.on("click pointerdown", open_submenu);
				}
				
				$item.on("pointerup", function(e){
					if(e.pointerType === "mouse" && e.button !== 0){
						return;
					}
					if(item.checkbox){
						if(item.checkbox.toggle){
							item.checkbox.toggle();
						}
						$menu_popup.triggerHandler("update");
					}else if(item.action){
						close_menus();
						item.action();
					}
				});
				$item.on("pointerenter", function(){
					if(item.submenu){
						$status_text.text("");
					}else{
						$status_text.text(item.description || "");
					}
				});
				$item.on("pointerleave", function(){
					if($item.is(":visible")){
						$status_text.text("");
					}
				});
				
				$item.on("keydown", function(e){
					if(e.ctrlKey || e.shiftKey || e.altKey){
						return;
					}
					if(e.keyCode === 13){ // Enter
						e.preventDefault();
						$item.click();
					}
				});
				
				$menu_popup.on("keydown", function(e){
					if(e.ctrlKey || e.shiftKey || e.altKey){
						return;
					}
					if(String.fromCharCode(e.keyCode) === _hotkey(item.item)){
						e.preventDefault();
						$item.click();
					}
				});
			}
		});
		
		return $menu_popup;
	}
	
	$.each(menus, function(menus_key, menu_items){
		var this_click_opened_the_menu = false;
		var $menu_container = $(E("div")).addClass("jspaint-menu-container").appendTo($menus);
		var $menu_button = $(E("div")).addClass("jspaint-menu-button").appendTo($menu_container);
		var $menu_popup = $MenuPopup(menu_items).appendTo($menu_container);
		$menu_popup.hide();
		$menu_button.html(_html(menus_key));
		$menu_button.attr("tabIndex", -1)
		$menu_container.on("keydown", function(e){
			var $focused_item = $menu_popup.find(".jspaint-menu-item:focus");
			switch(e.keyCode){
				case 37: // Left
					$menu_container.prev().find(".jspaint-menu-button").trigger("pointerdown");
					break;
				case 39: // Right
					if($focused_item.find(".jspaint-menu-item-submenu-area:not(:empty)").length){
						$focused_item.click();
						$(".jspaint-menu-popup .jspaint-menu-item").first().focus();
						e.preventDefault();
					}else{
						$menu_container.next().find(".jspaint-menu-button").trigger("pointerdown");
					}
					break;
				case 40: // Down
					if($menu_popup.is(":visible") && $focused_item.length){
						var $next = $focused_item.next();
						while($next.length && !$next.is(".jspaint-menu-item")){
							$next = $next.next();
						}
						$next.focus();
					}else{
						$menu_button.pointerdown();
						$menu_popup.find(".jspaint-menu-item").first().focus();
					}
					break;
				case 38: // Up
					if($menu_popup.is(":visible") && $focused_item.length){
						var $prev = $focused_item.prev();
						while($prev.length && !$prev.is(".jspaint-menu-item")){
							$prev = $prev.prev();
						}
						$prev.focus();
					}else{
						$menu_button.pointerdown(); // or maybe do nothing?
						$menu_popup.find(".jspaint-menu-item").last().focus();
					}
					break;
			}
		});
		$G.on("keydown", function(e){
			if(e.ctrlKey){ // Ctrl+...
				if(e.keyCode !== 17){ // anything but Ctrl
					close_menus();
				}
				return;
			}
			if(e.altKey){
				if(String.fromCharCode(e.keyCode) === _hotkey(menus_key)){
					e.preventDefault();
					$menu_button.pointerdown();
				}
			}
		});
		$menu_button.on("pointerdown pointerenter", function(e){
			if(e.type === "pointerenter" && !selecting_menus){
				return;
			}
			if(!$menu_button.hasClass("active")){
				this_click_opened_the_menu = true;
			}
			
			close_menus();
			// console.log("open menu");
			
			$menu_button.focus();
			$menu_button.addClass("active");
			$menu_popup.show();
			$menu_popup.triggerHandler("update");
			
			selecting_menus = true;
			
			$status_text.text("");
		});
		$menu_button.on("pointerup", function(e){
			if(this_click_opened_the_menu){
				this_click_opened_the_menu = false;
				return;
			}
			if($menu_button.hasClass("active")){
				// console.log(e.type, "occurred and this click didn't open the menu, so...");
				close_menus();
			}
		});
		$menu_button.on("release", function(e){
			selecting_menus = false;
			
			$menu_button.removeClass("active");
			$menu_popup.hide();
			
			$status_text.default();
		});
	});
	$G.on("keypress", function(e){
		if(e.keyCode === 27){ // Esc
			close_menus();
		}
	});
	$G.on("blur", function(e){
		// console.log("blur", e.target, document.activeElement);
		close_menus();
	});
	$G.on("pointerdown pointerup", function(e){
		if($(e.target).closest(".jspaint-menus, .jspaint-menu-popup").length === 0){
			// console.log(e.type, "occurred outside of menus (on ", e.target, ") so...");
			close_menus();
		}
	});

})();
