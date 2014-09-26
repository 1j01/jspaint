
var $menus = $(E("div")).addClass("jspaint-menus").prependTo($V);
var selecting_menus = false;
var ____________________________ = "A HORIZONTAL RULE / DIVIDER";

function $FormWindow(title){
	var $w = new $Window();
	
	$w.title(title);
	$w.$form = $form = $(E("form")).appendTo($w.$content);
	$w.$form_left = $(E("div")).appendTo($w.$form);
	$w.$form_right = $(E("div")).appendTo($w.$form).addClass("jspaint-button-group");
	$w.$form.addClass("jspaint-horizontal").css({display: "flex"});
	
	$w.$Button = function(label, action){
		var $b = $(E("button")).appendTo($w.$form_right).text(label);
		$b.on("click", function(e){
			// prevent the form from submitting
			e.preventDefault();
			
			action();
		});
		
		// this should really not be needed @TODO
		$b.addClass("jspaint-button jspaint-dialogue-button");
		
		return $b;
	};
	
	return $w;
};

function apply_image_transformation(fn){
	// Apply an image transformation function to either the selection or the entire canvas
	var new_canvas = E("canvas");
	var original_canvas =
		selection? selection.
		canvas: canvas;
	
	var new_ctx = new_canvas.getContext("2d");
	var original_ctx = original_canvas.getContext("2d");
	
	new_canvas.width = original_canvas.width;
	new_canvas.height = original_canvas.height;
	
	fn(original_canvas, original_ctx, new_canvas, new_ctx);
	
	if(selection){
		selection.replace_canvas(new_canvas);
	}else{
		undoable(0, function(){
			this_ones_a_frame_changer();
			
			canvas.width = new_canvas.width;
			canvas.height = new_canvas.height;
			
			ctx.drawImage(new_canvas, 0, 0);
			
			$canvas.trigger("update"); // update handles
		});
	}
}

var image_attributes = function(){
	if(image_attributes.$window){
		image_attributes.$window.close();
	}
	var $w = image_attributes.$window = new $FormWindow("Attributes");
	
	var $form_left = $w.$form_left;
	var $form_right = $w.$form_right;
	
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
	
	$w.$Button("Okay", function(){
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
	
	$w.$Button("Cancel", function(){
		image_attributes.$window.close();
	});
	
	$w.$Button("Default", function(){
		width_in_px = default_canvas_width;
		height_in_px = default_canvas_height;
		$width.val(width_in_px / unit_sizes_in_px[current_unit]);
		$height.val(height_in_px / unit_sizes_in_px[current_unit]);
	});
	
	// Reposition the window
	
	image_attributes.$window.center();
};

var flip_and_rotate = function(){
	var $w = new $FormWindow("Flip and Rotate");
	
	var $fieldset = $(E("fieldset")).appendTo($w.$form_left);
	$fieldset.append("<legend>Flip or rotate</legend>");
	$fieldset.append("<label><input type='radio' name='flip-or-rotate' value='flip-horizontal' checked/>Flip horizontal</label>");
	$fieldset.append("<label><input type='radio' name='flip-or-rotate' value='flip-vertical'/>Flip vertical</label>");
	$fieldset.append("<label><input type='radio' name='flip-or-rotate' value='rotate-by-angle'/>Rotate by angle<div></div></label>");
	
	var $rotate_by_angle = $fieldset.find("div")
	$rotate_by_angle.css({paddingLeft: "30px"});
	$rotate_by_angle.append("<label><input type='radio' name='rotate-by-angle' value='90' checked/>90°</label>");
	$rotate_by_angle.append("<label><input type='radio' name='rotate-by-angle' value='180'/>180°</label>");
	$rotate_by_angle.append("<label><input type='radio' name='rotate-by-angle' value='270'/>270°</label>");
	$rotate_by_angle.find("input").attr({disabled: true});
	
	$fieldset.find("input").on("change", function(){
		var flip_or_rotate = $fieldset.find("input[name='flip-or-rotate']:checked").val();
		$rotate_by_angle.find("input").attr({
			disabled: flip_or_rotate !== 'rotate-by-angle'
		});
	});
	
	$fieldset.find("label").css({display: "block"});
	
	$w.$Button("Okay", function(){
		apply_image_transformation(function(original_canvas, original_ctx, new_canvas, new_ctx){
			var flip_or_rotate = $fieldset.find("input[name='flip-or-rotate']:checked").val();
			var rotate_by_angle = $fieldset.find("input[name='rotate-by-angle']:checked").val();
			
			switch(flip_or_rotate){
				case "flip-horizontal":
					new_ctx.translate(new_canvas.width, 0);
					new_ctx.scale(-1, 1);
					break;
				case "flip-vertical":
					new_ctx.translate(0, new_canvas.height);
					new_ctx.scale(1, -1);
					break;
				case "rotate-by-angle":
					switch(rotate_by_angle){
						case "90":
							new_canvas.width = original_canvas.height;
							new_canvas.height = original_canvas.width;
							new_ctx.translate(new_canvas.width, 0);
							new_ctx.rotate(TAU / 4);
							break;
						case "180":
							new_ctx.translate(new_canvas.width, new_canvas.height);
							new_ctx.rotate(TAU / 2);
							break;
						case "270":
							new_canvas.width = original_canvas.height;
							new_canvas.height = original_canvas.width;
							new_ctx.translate(0, new_canvas.height);
							new_ctx.rotate(TAU / -4);
							break;
					}
					break;
			}
			new_ctx.drawImage(original_canvas, 0, 0);
		});
		$w.close();
	});
	$w.$Button("Cancel", function(){
		$w.close();
	});
	
	$w.center();
};

var stretch_and_skew = function(){
	var $w = new $FormWindow("Stretch and Skew");
	
	var $fieldset_stretch = $(E("fieldset")).appendTo($w.$form_left);
	$fieldset_stretch.append("<legend>Stretch</legend><table></table>");
	var $fieldset_skew = $(E("fieldset")).appendTo($w.$form_left);
	$fieldset_skew.append("<legend>Skew</legend><table></table>");
	
	var $RowInput = function($table, img_src, label_text, default_value, label_unit){
		var $tr = $(E("tr")).appendTo($table);
		var $img = $(E("img")).attr({
			src: "images/transforms/" + img_src + ".png"
		}).css({
			marginRight: "20px"
		});
		var $input = $(E("input")).attr({
			value: default_value
		}).css({
			width: "40px"
		});
		$(E("td")).appendTo($tr).append($img);
		$(E("td")).appendTo($tr).text(label_text);
		$(E("td")).appendTo($tr).append($input);
		$(E("td")).appendTo($tr).text(label_unit);
		
		return $input;
	};
	
	var stretch_x = $RowInput($fieldset_stretch.find("table"), "stretch-x", "Horizontal:", 100, "%");
	var stretch_y = $RowInput($fieldset_stretch.find("table"), "stretch-y", "Vertical:", 100, "%");
	var skew_x = $RowInput($fieldset_skew.find("table"), "skew-x", "Horizontal:", 0, "Degrees");
	var skew_y = $RowInput($fieldset_skew.find("table"), "skew-y", "Horizontal:", 0, "Degrees");
	
	$w.$Button("Okay", function(){
		$w.close();
	}).on("mouseover", function(){
		$(this).text("NOT OKAY");
	});
	$w.$Button("Cancel", function(){
		$w.close();
	});
	
	$w.center();
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

var menus = {
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
			checkbox: {
				toggle: function(){
					return $toolbox.toggle().is(":visible");
				}
			}
		},
		{
			item: "&Color Box",
			shortcut: "Ctrl+L",
			checkbox: {
				toggle: function(){
					return $colorbox.toggle().is(":visible");
				}
			}
		},
		{
			item: "&Status Bar",
			checkbox: {
				toggle: function(){
					return $status_area.toggle().is(":visible");
				}
			}
		},
		{
			item: "T&ext Toolbar",
			disabled: true,
			checkbox: {}
		},
		____________________________,
		{
			item: "&Zoom",
			submenu: [
				{
					item: "&Normal Size",
					shorcut: "Ctrl+PgUp"
				},
				{
					item: "&Large Size",
					shorcut: "Ctrl+PgDn",
					disabled: true
				},
				{
					item: "C&ustom...",
					disabled: true
				},
				____________________________,
				{
					item: "Show &Grid",
					shorcut: "Ctrl+G",
					checkbox: {},
					disabled: true
				},
				{
					item: "Show T&humbnail",
					checkbox: {},
					disabled: true
				}
			]
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
			shortcut: "Ctrl+R",
			action: flip_and_rotate
		},
		{
			item: "&Stretch/Skew",
			shortcut: "Ctrl+W",
			action: stretch_and_skew
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
			checkbox: {
				toggle: function(){
					transparent_opaque = {
						"opaque": "transparent",
						"transparent": "opaque",
					}[transparent_opaque];
					
					$G.trigger("option-changed");
					
					return transparent_opaque === "opaque";
				}
			}
		}
	],
	"&Colors": [
		{
			item: "&Edit Colors...",
			action: function(){
				// Edit the last color cell that's been selected as the foreground color.
				var $b = $colorbox.get_last_foreground_color_$button();
				$b.trigger({type: "mousedown", ctrlKey: false, button: 0});
				$b.find("input").trigger("click", "synthetic");
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
				).css({padding: "15px"});
				$msgbox.center();
			}
		}
	],
};

$.each(menus, function(menu_key, menu_items){
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
			
			if(item.submenu){
				$submenu_area.text("▶");
				var open_tid, close_tid;
				$item.on("mouseover", function(){
					if(open_tid){clearTimeout(open_tid);}
					if(close_tid){clearTimeout(close_tid);}
					open_tid = setTimeout(function(){
						$submenu_area.text("▽");
					}, 200);
				});
				$item.on("mouseout", function(){
					if(open_tid){clearTimeout(open_tid);}
					if(close_tid){clearTimeout(close_tid);}
					open_tid = setTimeout(function(){
						$submenu_area.text("▶");
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
