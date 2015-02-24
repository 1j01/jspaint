
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
		$menus.find(".jspaint-menu-button").trigger("release");
		// Close any rouge floating submenus
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
				
				$label.html(_html(item.item));
				$shortcut.text(item.shortcut);
				
				$menu_popup.on("update", function(){
					$item.attr("disabled", is_disabled(item));
				});
				$item.on("mouseover", function(){
					$item.attr("disabled", is_disabled(item));
				});
				
				if(item.checkbox){
					$checkbox_area.text("✓");
				}
				
				if(item.submenu){
					$submenu_area.text("▶");
					
					var $submenu_popup = $MenuPopup(item.submenu).appendTo("body");
					$submenu_popup.hide();
					
					var open_tid, close_tid;
					$item.add($submenu_popup).on("mouseover", function(e){
						if(open_tid){clearTimeout(open_tid);}
						if(close_tid){clearTimeout(close_tid);}
					});
					$item.on("mouseover", function(e){
						if(open_tid){clearTimeout(open_tid);}
						if(close_tid){clearTimeout(close_tid);}
						open_tid = setTimeout(function(){
							$submenu_popup.show();
							$submenu_popup.triggerHandler("update");
							var rect = $submenu_area[0].getBoundingClientRect();
							$submenu_popup.css({
								position: "absolute",
								left: rect.right,
								top: rect.top,
							});
						}, 200);
					});
					$item.add($submenu_popup).on("mouseout", function(){
						if(open_tid){clearTimeout(open_tid);}
						if(close_tid){clearTimeout(close_tid);}
						close_tid = setTimeout(function(){
							$submenu_popup.hide();
						}, 200);
					});
				}
				
				$item.on("click", function(){
					if(item.checkbox){
						if(item.checkbox.toggle){
							var check = item.checkbox.toggle();
							$checkbox_area.text(check ? "✓" : "");
						}
					}else if(item.action){
						close_menus();
						item.action();
					}
				});
				$item.on("mouseenter", function(){
					if(item.submenu){
						$status_text.text("");
					}else{
						$status_text.text(item.description || "");
					}
				});
				$item.on("mouseleave", function(){
					if($item.is(":visible")){
						$status_text.text("");
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
		$menu_button.on("mousedown mousemove", function(e){
			if(e.type === "mousemove" && !selecting_menus){
				return;
			}
			if(e.type === "mousedown"){
				if(!$menu_button.hasClass("active")){
					this_click_opened_the_menu = true;
				}
			}
			
			close_menus();
			
			$menu_button.addClass("active");
			$menu_popup.show();
			$menu_popup.triggerHandler("update");
			
			selecting_menus = true;
			
			$status_text.text("");
		});
		$menu_button.on("mouseup", function(e){
			if(this_click_opened_the_menu){
				this_click_opened_the_menu = false;
				return;
			}
			if($menu_button.hasClass("active")){
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
	$G.on("keypress blur", function(e){
		close_menus();
	});
	$G.on("mousedown mouseup", function(e){
		if($(e.target).closest(".jspaint-menus, .jspaint-menu-popup").length === 0){
			close_menus();
		}
	});

})();
