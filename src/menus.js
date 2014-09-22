
var $menus = $(E("div")).addClass("jspaint-menus").prependTo($V);
var selecting_menus = false;
var ____________________________ = "A HORIZONTAL RULE / DIVIDER";

var image_attributes = function(){
	if(image_attributes.$window){
		image_attributes.$window.close();
	}
	image_attributes.$window = new $Window();
	image_attributes.$window.title("Attributes");
	
	var $form = $(E("form")).appendTo(image_attributes.$window.$content);
	var $form_left = $(E("div")).appendTo($form);
	var $form_right = $(E("div")).appendTo($form);
	$form.addClass("jspaint-horizontal").css({display: "flex"});
	
	// Information
	
	var table = {
		"File last saved": "Not available",
		"Size on disk": "Not available",
		"Resolution": "72 x 72 dots per inch",
	};
	var $table = $(E("table")).appendTo($form_left);
	for(var k in table){
		var $tr = $(E("tr")).appendTo($table);
		var $key = $(E("td")).appendTo($tr).text(k + ":");
		var $value = $(E("td")).appendTo($tr).text(table[k]);
	}
	
	// Dimensions
	
	var unit_sizes_in_px = {px: 1, in: 72, cm: 28.3465};
	var current_unit = image_attributes.unit = image_attributes.unit || "px";
	var width_in_px = canvas.width;
	var height_in_px = canvas.height;
	
	var $width_label = $(E("label")).appendTo($form_left).text("Width:");
	var $height_label = $(E("label")).appendTo($form_left).text("Height:");
	var $width = $(E("input")).appendTo($width_label);
	var $height = $(E("input")).appendTo($height_label);
	$([$width[0], $height[0]])
		.css({width: "40px"})
		.on("change keyup keydown keypress mousedown mousemove paste drop", function(){
			if($(this).is($width)){
				width_in_px = $width.val() * unit_sizes_in_px[current_unit];
			}
			if($(this).is($height)){
				height_in_px = $height.val() * unit_sizes_in_px[current_unit];
			}
		});
	
	// Fieldsets
	
	var $units = $(E("fieldset")).appendTo($form_left).append('<legend>Transparency</legend>');
	$units.append('<label><input type="radio" name="units" value="in">Inches</label>');
	$units.append('<label><input type="radio" name="units" value="cm">Cm</label>');
	$units.append('<label><input type="radio" name="units" value="px">Pixels</label>');
	$units.find("[value=" + current_unit + "]").attr({checked: true});
	$units.on("change", function(){
		var new_unit = $units.find(":checked").val();
		$width.val(width_in_px / unit_sizes_in_px[new_unit]);
		$height.val(height_in_px / unit_sizes_in_px[new_unit]);
		current_unit = new_unit;
	}).triggerHandler("change");
	
	var $transparency = $(E("fieldset")).appendTo($form_left).append('<legend>Transparency</legend>');
	$transparency.append('<label><input type="radio" name="transparency" value="transparent">Transparent</label>');
	$transparency.append('<label><input type="radio" name="transparency" value="opaque">Opaque</label>');
	$transparency.find("[value=" + (transparency ? "transparent" : "opaque") + "]").attr({checked: true});
	
	// Buttons on the right
	
	var $okay = $(E("button")).appendTo($form_right).text("Okay");
	var $cancel = $(E("button")).appendTo($form_right).text("Cancel");
	var $default = $(E("button")).appendTo($form_right).text("Default");
	
	$form_right
		.css({width: 85})
		.find("button")
		.css({padding: "3px 5px", width: "95%"})
		//this should really not be needed @TODO
		.addClass("jspaint-button jspaint-window-button");
	
	$okay.click(function(e){
		e.preventDefault();
		
		var to = $transparency.find(":checked").val();
		var unit = $units.find(":checked").val();
		
		image_attributes.unit = unit;
		transparency = (to == "transparent");
		
		var unit_to_px = unit_sizes_in_px[unit];
		var width = $width.val() * unit_to_px;
		var height = $height.val() * unit_to_px;
		$canvas.trigger("user-resized", [0, 0, ~~width, ~~height]);
		
		image_attributes.$window.close();
	});
	$cancel.click(function(e){
		e.preventDefault();
		image_attributes.$window.close();
	});
	$default.click(function(e){
		e.preventDefault();
		width_in_px = default_canvas_width;
		height_in_px = default_canvas_height;
		$width.val(width_in_px / unit_sizes_in_px[current_unit]);
		$height.val(height_in_px / unit_sizes_in_px[current_unit]);
	});
	
	// Reposition the window
	
	image_attributes.$window.center();
};

var set_as_wallpaper_tiled = function(c){
	c = c || canvas;
	
	var wp = document.createElement("canvas");
	wp.width = screen.width;
	wp.height = screen.height;
	var wpctx = wp.getContext("2d");
	for(var x=0; x<wp.width; x+=c.width){
		for(var y=0; y<wp.height; y+=c.height){
			wpctx.drawImage(c, x, y);
		}
	}
	
	set_as_wallpaper_centered(wp);
};

var set_as_wallpaper_centered = function(c){
	c = c || canvas;
	
	if(window.chrome && chrome.wallpaper){
		chrome.wallpaper.setWallpaper({
			url: c.toDataURL(),
			layout: 'CENTER_CROPPED',
			name: file_name,
		}, function(){});
	}else{
		window.open(c.toDataURL());
	}
};

var save_selection_to_file = function(){
	if(selection && selection.canvas){
		if(window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry){
			chrome.fileSystem.chooseEntry({
				type: 'saveFile',
				suggestedName: 'Selection',
				accepts: [{mimeTypes: ["image/*"]}]
			}, function(entry){
				if(chrome.runtime.lastError){
					return console.error(chrome.runtime.lastError.message);
				}
				entry.createWriter(function(file_writer){
					file_writer.onwriteend = function(e){
						if(this.error){
							console.error(this.error + '\n\n\n@ ' + e);
						}else{
							console.log("Wrote selection to file!");
						}
					};
					selection.canvas.toBlob(function(blob){
						file_writer.write(blob);
					});
				});
			});
		}else{
			window.open(selection.canvas.toDataURL());
		}
	}
};

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
			action: set_as_wallpaper_tiled
		},
		{
			item: "Set As Wa&llpaper (Centered)",
			action: set_as_wallpaper_centered
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
			disabled: true,
			action: save_selection_to_file
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
			shortcut: "Ctrl+E",
			action: image_attributes
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
			action: function(){
				var input;
				
				// Note: MS Paint uses the last color cell selected as the foreground color,
				// where I am instead finding color cells that match the current foreground color.
				// If you select a color with the color picker that isn't in the palette it will fail.
				// This implementation is therefore inferior.
				
				$(".jspaint-color-button input").each(function(){
					var button = this.parentElement;
					var cs = document.querySelector(".jspaint-color-selection");
					if(getComputedStyle(button).backgroundColor === getComputedStyle(cs).backgroundColor){
						input = this;
						return false;//break each loop
					}
				});
				
				$(input).parent().trigger({type: "mousedown", ctrlKey: false, button: 0});
				$(input).trigger("click", "synthetic");
			}
		}
	],
	"&Help": [
		{
			item: "&Help Topics",
			action: function(){
				var $msgbox = new $Window();
				$msgbox.title("Help Topics");
				var url = "";
				$msgbox.$content.html(
					"<p style='padding:0;margin:5px'>Sorry, no help is available at this time.</p>" +
					"<br>You can however try <a href='https://www.google.com/search?q=ms+paint+tutorials' target='_blank'>searching for tutorials</a> for MS Paint." +
					"<br>There will be differences, but the basics are there."
				).css({padding: "15px"});
				$msgbox.center();
			}
		},
		____________________________,
		{
			item: "&About Paint",
			action: function(){
				var $msgbox = new $Window();
				$msgbox.title("About Paint");
				$msgbox.$content.html(
					"This is <a href='https://github.com/1j01/jspaint'>JS Paint</a>." +
					"<br>" +
					"Yeah.<br>"
				).css({padding: "45px"});
				$msgbox.center();
			}
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
				if(item.action){
					$menus.find(".jspaint-menu-button").trigger("release");
					item.action();
				}
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
