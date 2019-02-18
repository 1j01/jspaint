
var is_electron = navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;

var menus = {
	"&File": [
		{
			item: "&New",
			shortcut: "Ctrl+N",
			action: file_new,
			description: "Creates a new document.",
		},
		{
			item: "&Open",
			shortcut: "Ctrl+O",
			action: file_open,
			description: "Opens an existing document.",
		},
		{
			item: "&Save",
			shortcut: "Ctrl+S",
			action: file_save,
			description: "Saves the active document.",
		},
		{
			item: "Save &As",
			shortcut: "Ctrl+Shift+S",
			// in mspaint, no shortcut is listed, but it supports F12; it doesn't support Ctrl+Shift+S
			action: file_save_as,
			description: "Saves the active document with a new name.",
		},
		$MenuBar.DIVIDER,
		{
			item: "&Load From URL",
			// shortcut: "Ctrl+L",
			action: file_load_from_url,
			description: "Opens an image from the web.",
		},
		{
			item: "&Upload To Imgur",
			action: function(){
				// include the selection in the saved image
				deselect();

				canvas.toBlob(function(blob){
					sanity_check_blob(blob, function(){
						show_imgur_uploader(blob);
					});
				});
			},
			description: "Uploads the active document to Imgur",
		},
		$MenuBar.DIVIDER,
		{
			item: "Manage Storage",
			action: manage_storage,
			description: "Manages storage of previously created or opened pictures.",
		},
		$MenuBar.DIVIDER,
		{
			item: "Print Pre&view",
			action: function(){
				print();
			},
			description: "Prints the active document and sets printing options.",
			//description: "Displays full pages.",
		},
		{
			item: "Page Se&tup",
			action: function(){
				print();
			},
			description: "Prints the active document and sets printing options.",
			//description: "Changes the page layout.",
		},
		{
			item: "&Print",
			shortcut: "Ctrl+P",
			action: function(){
				print();
			},
			description: "Prints the active document and sets printing options.",
		},
		$MenuBar.DIVIDER,
		{
			item: "Set As &Wallpaper (Tiled)",
			action: set_as_wallpaper_tiled,
			description: "Tiles this bitmap as the desktop background.",
		},
		{
			item: "Set As Wallpaper (&Centered)", // in mspaint it's Wa&llpaper
			action: set_as_wallpaper_centered,
			description: "Centers this bitmap as the desktop background.",
		},
		$MenuBar.DIVIDER,
		{
			item: "Recent File",
			enabled: false, // @TODO for desktop app
			description: "",
		},
		$MenuBar.DIVIDER,
		{
			item: "E&xit",
			shortcut: "Alt+F4",
			action: function(){
				close();
			},
			description: "Quits Paint.",
		}
	],
	"&Edit": [
		{
			item: "&Undo",
			shortcut: "Ctrl+Z",
			enabled: function(){
				return undos.length >= 1;
			},
			action: undo,
			description: "Undoes the last action.",
		},
		{
			item: "&Repeat",
			shortcut: "F4",
			enabled: function(){
				return redos.length >= 1;
			},
			action: redo,
			description: "Redoes the previously undone action.",
		},
		$MenuBar.DIVIDER,
		{
			item: "Cu&t",
			shortcut: "Ctrl+X",
			enabled: function(){
				// @TODO disable if no selection (image or text)
				return is_electron;
			},
			action: function(){
				document.execCommand("cut");
			},
			description: "Cuts the selection and puts it on the Clipboard.",
		},
		{
			item: "&Copy",
			shortcut: "Ctrl+C",
			enabled: function(){
				// @TODO disable if no selection (image or text)
				return is_electron;
			},
			action: function(){
				document.execCommand("copy");
			},
			description: "Copies the selection and puts it on the Clipboard.",
		},
		{
			item: "&Paste",
			shortcut: "Ctrl+V",
			enabled: function(){
				return is_electron;
			},
			action: function(){
				document.execCommand("paste");
			},
			description: "Inserts the contents of the Clipboard.",
		},
		{
			item: "C&lear Selection",
			shortcut: "Del",
			enabled: function(){ return !!selection; },
			action: delete_selection,
			description: "Deletes the selection.",
		},
		{
			item: "Select &All",
			shortcut: "Ctrl+A",
			action: select_all,
			description: "Selects everything.",
		},
		$MenuBar.DIVIDER,
		{
			item: "C&opy To...",
			enabled: function(){ return !!selection; },
			action: save_selection_to_file,
			description: "Copies the selection to a file.",
		},
		{
			item: "Paste &From...",
			action: paste_from_file_select_dialog,
			description: "Pastes a file into the selection.",
		}
	],
	"&View": [
		{
			item: "&Tool Box",
			shortcut: "Ctrl+T",
			checkbox: {
				toggle: function(){
					$toolbox.toggle();
				},
				check: function(){
					return $toolbox.is(":visible");
				},
			},
			description: "Shows or hides the tool box.",
		},
		{
			item: "&Color Box",
			shortcut: "Ctrl+L",
			checkbox: {
				toggle: function(){
					$colorbox.toggle();
				},
				check: function(){
					return $colorbox.is(":visible");
				},
			},
			description: "Shows or hides the color box.",
		},
		{
			item: "&Status Bar",
			checkbox: {
				toggle: function(){
					$status_area.toggle();
				},
				check: function(){
					return $status_area.is(":visible");
				},
			},
			description: "Shows or hides the status bar.",
		},
		{
			item: "T&ext Toolbar",
			enabled: false, // @TODO
			checkbox: {},
			description: "Shows or hides the text toolbar.",
		},
		$MenuBar.DIVIDER,
		{
			item: "E&xtras Menu",
			checkbox: {
				toggle: function(){
					$extras_menu_button.toggle();
					try{
						localStorage["jspaint extras menu visible"] = this.check();
					}catch(e){}
				},
				check: function(){
					return $extras_menu_button.is(":visible");
				}
			},
			description: "Shows or hides the Extras menu.",
		},
		$MenuBar.DIVIDER,
		{
			item: "&Zoom",
			submenu: [
				{
					item: "&Normal Size",
					shorcut: "Ctrl+PgUp",
					description: "Zooms the picture to 100%.",
					enabled: function(){
						return magnification !== 1;
					},
					action: function(){
						set_magnification(1);
					},
				},
				{
					item: "&Large Size",
					shorcut: "Ctrl+PgDn",
					description: "Zooms the picture to 400%.",
					enabled: function(){
						return magnification !== 4;
					},
					action: function(){
						set_magnification(4);
					},
				},
				{
					item: "C&ustom...",
					enabled: false, // @TODO
					description: "Zooms the picture.",
				},
				$MenuBar.DIVIDER,
				{
					item: "Show &Grid",
					shorcut: "Ctrl+G",
					enabled: false, // @TODO
					checkbox: {},
					description: "Shows or hides the grid.",
				},
				{
					item: "Show T&humbnail",
					enabled: false, // @TODO
					checkbox: {},
					description: "Shows or hides the thumbnail view of the picture.",
				}
			]
		},
		{
			item: "&View Bitmap",
			shortcut: "Ctrl+F",
			action: view_bitmap,
			description: "Displays the entire picture.",
		}
	],
	"&Image": [
		{
			item: "&Flip/Rotate",
			shortcut: "Ctrl+R",
			action: image_flip_and_rotate,
			description: "Flips or rotates the picture or a selection.",
		},
		{
			item: "&Stretch/Skew",
			shortcut: "Ctrl+W",
			action: image_stretch_and_skew,
			description: "Stretches or skews the picture or a selection.",
		},
		{
			item: "&Invert Colors",
			shortcut: "Ctrl+I",
			action: image_invert,
			description: "Inverts the colors of the picture or a selection.",
		},
		{
			item: "&Attributes...",
			shortcut: "Ctrl+E",
			action: image_attributes,
			description: "Changes the attributes of the picture.",
		},
		{
			item: "&Clear Image",
			shortcut: "Ctrl+Shift+N",
			//shortcut: "Ctrl+Shft+N", [sic]
			action: clear,
			description: "Clears the picture or selection.",
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
				},
				check: function(){
					return transparent_opaque === "opaque";
				},
			},
			description: "Makes the current selection either opaque or transparent.",
		}
	],
	"&Colors": [
		{
			item: "&Edit Colors...",
			action: function(){
				$colorbox.edit_last_color();
			},
			description: "Creates a new color.",
		},
		{
			item: "&Get Colors",
			action: function(){
				get_FileList_from_file_select_dialog(function(files){
					var file = files[0];
					Palette.load(file, function(err, new_palette){
						if(err){
							show_error_message("This file is not in a format that paint recognizes, or no colors were found.");
						}else{
							palette = new_palette;
							$colorbox.rebuild_palette();
						}
					});
				});
			},
			description: "Uses a previously saved palette of colors.",
		},
		{
			item: "&Save Colors",
			action: function(){
				var blob = new Blob([JSON.stringify(palette)], {type: "application/json"});
				sanity_check_blob(blob, function(){
					saveAs(blob, "colors.json");
				});
			},
			description: "Saves the current palette of colors to a file.",
		}
	],
	"&Help": [
		{
			item: "&Help Topics",
			action: show_help,
			description: "Displays Help for the current task or command.",
		},
		$MenuBar.DIVIDER,
		{
			item: "&About Paint",
			action: show_about_paint,
			description: "Displays information about this application.",
			//description: "Displays program information, version number, and copyright.",
		}
	],
	"E&xtras": [
		{
			item: "&Render History As GIF",
			// shortcut: "Ctrl+Shift+G",
			action: render_history_as_gif,
			description: "Creates an animation from the document history.",
		},
		// {
		// 	item: "Render History as &APNG",
		// 	// shortcut: "Ctrl+Shift+A",
		// 	action: render_history_as_apng,
		// 	description: "Creates an animation from the document history.",
		// },
		// {
		// 	item: "Extra T&ool Box",
		// 	checkbox: {
		// 		toggle: function(){
		// 			// this doesn't really work well at all to have two toolboxes
		// 			// (this was not the original plan either)
		// 			$toolbox2.toggle();
		// 		},
		// 		check: function(){
		// 			return $toolbox2.is(":visible");
		// 		},
		// 	},
		// 	description: "Shows or hides an extra tool box.",
		// },
		// {
		// 	item: "&Preferences",
		// 	action: function(){
		// 		// :)
		// 	},
		// 	description: "Configures JS Paint.",
		// }
		{
			item: "&Multi-User",
			submenu: [
				{
					item: "&New Session From Document",
					action: function(){
						var name = prompt("Enter the session name that will be used in the URL for sharing.");
						if(typeof name == "string"){
							name = name.trim();
							if(name == ""){
								show_error_message("The session name cannot be empty.");
							}else if(name.match(/[.\/\[\]#$]/)){
								show_error_message("The session name cannot contain any of ./[]#$");
							}else{
								location.hash = "session:" + name;
							}
						}
					},
					description: "Starts a new multi-user session from the current document.",
				},
				{
					item: "New &Blank Session",
					action: function(){
						show_error_message("Not supported yet");
					},
					enabled: false,
					description: "Starts a new multi-user session from an empty document.",
				},
			]
		},
		{
			item: "&Themes",
			submenu: [
				{
					item: "&Classic",
					action: function(){
						set_theme("classic.css");
					},
					enabled: function(){
						return get_theme() != "classic.css"
					},
					description: "Makes JS Paint look like MS Paint from Windows 98.",
				},
				{
					item: "&Modern (WIP)",
					action: function(){
						set_theme("modern.css");
					},
					enabled: function(){
						return get_theme() != "modern.css"
					},
					description: "Makes JS Paint look a bit more modern.",
				},
			]
		},
	],
};

var go_outside_frame = false;
if(frameElement){
	try{
		if(parent.$MenuBar){
			$MenuBar = parent.$MenuBar;
			go_outside_frame = true;
		}
	}catch(e){}
}
var $menu_bar = $MenuBar(menus);
if(go_outside_frame){
	$menu_bar.insertBefore(frameElement);
}else{
	$menu_bar.prependTo($V);
}

$menu_bar.on("info", function(e, info){
	$status_text.text(info);
});
$menu_bar.on("default-info", function(e){
	$status_text.default();
});

var $extras_menu_button = $menu_bar.get(0).ownerDocument.defaultView.$(".extras-menu-button");
try{
	// TODO: refactor shared key string
	if(localStorage["jspaint extras menu visible"] != "true"){
		$extras_menu_button.hide();
	}
}catch(e){}
