
var $menus = $(E("div")).addClass("jspaint-menus").prependTo($V);
var selecting_menus = false;
var ____________________________ = "A HORIZONTAL RULE / DIVIDER";
$.each({
	"&File": [
		{
			item: "&New",
			shortcut: "Ctrl+N",
			action: file_new
		},
		{
			item: "&Open",
			shortcut: "Ctrl+O",
			action: file_open
		},
		{
			item: "&Save",
			shortcut: "Ctrl+S",
			action: file_save
		},
		{
			item: "Save &As",
			shortcut: "Ctrl+Shift+S",
			action: file_save_as
		},
		____________________________,
		{
			item: "Print Pre&view"
		},
		{
			item: "Page Se&tup"
		},
		{
			item: "&Print",
			shortcut: "Ctrl+P",
			action: function(){print();}
		},
		____________________________,
		{
			item: "Set As &Wallpaper (Tiled)",
			action: function(){
				var wp = document.createElement("canvas");
				wp.width = screen.width;
				wp.height = screen.height;
				var wpctx = wp.getContext("2d");
				for(var x=0; x<wp.width; x+=canvas.width){
					for(var y=0; y<wp.height; y+=canvas.height){
						wpctx.drawImage(canvas, x, y);
					}
				}
				if(window.chrome && chrome.wallpaper){
					chrome.wallpaper.setWallpaper({
						url: wp.toDataURL(),
						layout: 'CENTER_CROPPED',
						name: file_name,
					}, function(){});
				}else{
					window.open(wp.toDataURL());
				}
			}
		},
		{
			item: "Set As Wa&llpaper (Centered)",
			action: function(){
				chrome.wallpaper.setWallpaper({
					url: canvas.toDataURL(),
					layout: 'CENTER_CROPPED',
					name: file_name,
				}, function(){});
			}
		},
		____________________________,
		{
			item: "Recent File",
			disabled: true
		},
		____________________________,
		{
			item: "E&xit",
			shortcut: "Alt+F4",
			action: function(){
				window.close();
			}
		}
	],
	"&Edit": [
		{
			item: "&Undo",
			shortcut: "Ctrl+Z",
			action: undo
		},
		{
			item: "&Repeat",
			shortcut: "F4",
			action: redo,
			disabled: true
		},
		____________________________,
		{
			item: "Cu&t",
			shortcut: "Ctrl+X",
			disabled: true
		},
		{
			item: "&Copy",
			shortcut: "Ctrl+C",
			disabled: true
		},
		{
			item: "&Paste",
			shortcut: "Ctrl+V",
			disabled: true
		},
		{
			item: "C&lear Selection",
			shortcut: "Del",
			action: delete_selection,
			disabled: true
		},
		{
			item: "Select &All",
			shortcut: "Ctrl+A",
			action: select_all
		},
		____________________________,
		{
			item: "C&opy To...",
			disabled: true
		},
		{
			item: "Paste &From...",
			action: paste_from
		}
	],
	"&View": [
		{
			item: "&Tool Box",
			shortcut: "Ctrl+T",
			checkbox: {}
		},
		{
			item: "&Color Box",
			shortcut: "Ctrl+L",
			checkbox: {}
		},
		{
			item: "&Status Bar",
			checkbox: {}
		},
		{
			item: "T&ext Toolbar",
			disabled: true,
			checkbox: {}
		},
		____________________________,
		{
			item: "&Zoom",
			submenu: []
		},
		{
			item: "&View Bitmap",
			shortcut: "Ctrl+F",
			action: view_bitmap
		}
	],
	"&Image": [
		{
			item: "&Flip/Rotate",
			shortcut: "Ctrl+R"
		},
		{
			item: "&Stretch/Skew",
			shortcut: "Ctrl+W"
		},
		{
			item: "&Invert Colors",
			shortcut: "Ctrl+I",
			action: invert
		},
		{
			item: "&Attributes...",
			shortcut: "Ctrl+E"
		},
		{
			item: "&Clear Image",
			shortcut: "Ctrl+Shift+N",
			action: clear
		},
		{
			item: "&Draw Opaque",
			checkbox: {}
		}
	],
	"&Colors": [
		{
			item: "&Edit Colors...",
			action: function(){}
		}
	],
	"&Help": [
		{
			item: "&Help Topics",
			action: function(){}
		},
		____________________________,
		{
			item: "&About Paint",
			action: function(){}
		}
	],
}, function(menu_key, menu_items){
	var _html = function(menu_key){
		return menu_key.replace(/&(.)/, function(m){
			return "<span class='jspaint-menu-hotkey'>" + m[1] + "</span>";
		});
	};
	var _hotkey = function(menu_key){
		return menu_key[menu_key.indexOf("&")+1].toUpperCase();
	};
	var this_click_opened_the_menu = false;
	var $menu_container = $(E("div")).addClass("jspaint-menu-container").appendTo($menus);
	var $menu_button = $(E("div")).addClass("jspaint-menu-button").appendTo($menu_container);
	var $menu_popup = $(E("div")).addClass("jspaint-menu-popup").appendTo($menu_container);
	var $menu_popup_table = $(E("table")).addClass("jspaint-menu-popup-table").appendTo($menu_popup);
	$menu_popup.hide();
	$menu_button.html(_html(menu_key));
	$menu_button.on("mousedown mousemove", function(e){
		if(e.type === "mousemove" && !selecting_menus){
			return;
		}
		if(e.type === "mousedown"){
			if(!$menu_button.hasClass("active")){
				this_click_opened_the_menu = true;
			}
		}
		
		$menus.find(".jspaint-menu-button").trigger("release");
		
		$menu_button.addClass("active");
		$menu_popup.show();
		
		selecting_menus = true;
	});
	$menu_button.on("mouseup", function(e){
		if(this_click_opened_the_menu){
			this_click_opened_the_menu = false;
			return;
		}
		if($menu_button.hasClass("active")){
			$menus.find(".jspaint-menu-button").trigger("release");
		}
	});
	$menu_button.on("release", function(e){
		selecting_menus = false;
		
		$menu_button.removeClass("active");
		$menu_popup.hide();
	});
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
			$item.attr("disabled", item.disabled);
			if(item.checkbox){
				$checkbox_area.text("✓");
			}
			
			$item.on("click", function(){
				$menus.find(".jspaint-menu-button").trigger("release");
				item.action && item.action();
			});
		}
	});
});
$(window).on("keypress", function(e){
	$menus.find(".jspaint-menu-button").trigger("release");
});
$(window).on("mousedown mouseup", function(e){
	if(!$.contains($menus.get(0), e.target)){
		$menus.find(".jspaint-menu-button").trigger("release");
	}
});
