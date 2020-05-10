(()=> {

const looksLikeChrome = !!(window.chrome && (chrome.loadTimes || chrome.csi));
// NOTE: Microsoft Edge includes window.chrome.app
// (also this browser detection logic could likely use some more nuance)

window.menus = {
	"&File": [
		{
			item: "&New",
			shortcut: "Ctrl+Alt+N", // Ctrl+N opens a new browser window
			action: ()=> { file_new(); },
			description: "Creates a new document.",
		},
		{
			item: "&Open",
			shortcut: "Ctrl+O",
			action: ()=> { file_open(); },
			description: "Opens an existing document.",
		},
		{
			item: "&Save",
			shortcut: "Ctrl+S",
			action: ()=> { file_save(); },
			description: "Saves the active document.",
		},
		{
			item: "Save &As",
			shortcut: "Ctrl+Shift+S",
			// in mspaint, no shortcut is listed; it supports F12 (but in a browser that opens the dev tools)
			// it doesn't support Ctrl+Shift+S but that's a good & common modern shortcut
			action: ()=> { file_save_as(); },
			description: "Saves the active document with a new name.",
		},
		MENU_DIVIDER,
		{
			item: "&Load From URL",
			// shortcut: "Ctrl+L",
			action: ()=> { file_load_from_url(); },
			description: "Opens an image from the web.",
		},
		{
			item: "&Upload To Imgur",
			action: ()=> {
				// include the selection in the saved image
				deselect();

				canvas.toBlob((blob)=> {
					sanity_check_blob(blob, ()=> {
						show_imgur_uploader(blob);
					});
				});
			},
			description: "Uploads the active document to Imgur",
		},
		MENU_DIVIDER,
		{
			item: "Manage Storage",
			action: ()=> { manage_storage(); },
			description: "Manages storage of previously created or opened pictures.",
		},
		MENU_DIVIDER,
		{
			item: "Print Pre&view",
			action: ()=> {
				print();
			},
			description: "Prints the active document and sets printing options.",
			//description: "Displays full pages.",
		},
		{
			item: "Page Se&tup",
			action: ()=> {
				print();
			},
			description: "Prints the active document and sets printing options.",
			//description: "Changes the page layout.",
		},
		{
			item: "&Print",
			shortcut: "Ctrl+P",
			action: ()=> {
				print();
			},
			description: "Prints the active document and sets printing options.",
		},
		MENU_DIVIDER,
		{
			item: "Set As &Wallpaper (Tiled)",
			action: ()=> { set_as_wallpaper_tiled(); },
			description: "Tiles this bitmap as the desktop background.",
		},
		{
			item: "Set As Wallpaper (&Centered)", // in mspaint it's Wa&llpaper
			action: ()=> { set_as_wallpaper_centered(); },
			description: "Centers this bitmap as the desktop background.",
		},
		MENU_DIVIDER,
		{
			item: "Recent File",
			enabled: false, // @TODO for desktop app
			description: "",
		},
		MENU_DIVIDER,
		{
			item: "E&xit",
			// shortcut: "Alt+F4", // closes browser window
			action: ()=> {
				close();
			},
			description: "Quits Paint.",
		}
	],
	"&Edit": [
		{
			item: "&Undo",
			shortcut: "Ctrl+Z",
			enabled: () => undos.length >= 1,
			action: ()=> { undo(); },
			description: "Undoes the last action.",
		},
		{
			item: "&Repeat",
			shortcut: "F4",
			enabled: () => redos.length >= 1,
			action: ()=> { redo(); },
			description: "Redoes the previously undone action.",
		},
		{
			item: "&History",
			shortcut: "Ctrl+Shift+Y",
			action: ()=> { show_document_history(); },
			description: "Shows the document history and lets you navigate to states not accessible with Undo or Repeat.",
		},
		MENU_DIVIDER,
		{
			item: "Cu&t",
			shortcut: "Ctrl+X",
			enabled: () =>
				// @TODO: support cutting text with this menu item as well (e.g. for the text tool)
				!!selection,
			action: ()=> {
				edit_cut(true);
			},
			description: "Cuts the selection and puts it on the Clipboard.",
		},
		{
			item: "&Copy",
			shortcut: "Ctrl+C",
			enabled: () =>
				// @TODO: support copying text with this menu item as well (e.g. for the text tool)
				!!selection,
			action: ()=> {
				edit_copy(true);
			},
			description: "Copies the selection and puts it on the Clipboard.",
		},
		{
			item: "&Paste",
			shortcut: "Ctrl+V",
			enabled: () =>
				// @TODO: disable if nothing in clipboard or wrong type (if we can access that)
				true,
			action: ()=> {
				edit_paste(true);
			},
			description: "Inserts the contents of the Clipboard.",
		},
		{
			item: "C&lear Selection",
			shortcut: "Del",
			enabled: () => !!selection,
			action: ()=> { delete_selection(); },
			description: "Deletes the selection.",
		},
		{
			item: "Select &All",
			shortcut: "Ctrl+A",
			action: ()=> { select_all(); },
			description: "Selects everything.",
		},
		MENU_DIVIDER,
		{
			item: "C&opy To...",
			enabled: () => !!selection,
			action: ()=> { save_selection_to_file(); },
			description: "Copies the selection to a file.",
		},
		{
			item: "Paste &From...",
			action: ()=> { paste_from_file_select_dialog(); },
			description: "Pastes a file into the selection.",
		}
	],
	"&View": [
		{
			item: "&Tool Box",
			// shortcut: "Ctrl+T", // opens a new browser tab
			checkbox: {
				toggle: ()=> {
					$toolbox.toggle();
				},
				check: () => $toolbox.is(":visible"),
			},
			description: "Shows or hides the tool box.",
		},
		{
			item: "&Color Box",
			// shortcut: "Ctrl+L", // focuses browser address bar
			checkbox: {
				toggle: ()=> {
					$colorbox.toggle();
				},
				check: () => $colorbox.is(":visible"),
			},
			description: "Shows or hides the color box.",
		},
		{
			item: "&Status Bar",
			checkbox: {
				toggle: ()=> {
					$status_area.toggle();
				},
				check: () => $status_area.is(":visible"),
			},
			description: "Shows or hides the status bar.",
		},
		{
			item: "T&ext Toolbar",
			enabled: false, // @TODO: toggle fonts box
			checkbox: {},
			description: "Shows or hides the text toolbar.",
		},
		MENU_DIVIDER,
		{
			item: "&Zoom",
			submenu: [
				{
					item: "&Normal Size",
					// shortcut: "Ctrl+PgUp", // cycles thru browser tabs
					description: "Zooms the picture to 100%.",
					enabled: () => magnification !== 1,
					action: ()=> {
						set_magnification(1);
					},
				},
				{
					item: "&Large Size",
					// shortcut: "Ctrl+PgDn", // cycles thru browser tabs
					description: "Zooms the picture to 400%.",
					enabled: () => magnification !== 4,
					action: ()=> {
						set_magnification(4);
					},
				},
				{
					item: "C&ustom...",
					description: "Zooms the picture.",
					action: ()=> { show_custom_zoom_window(); },
				},
				MENU_DIVIDER,
				{
					item: "Show &Grid",
					shortcut: "Ctrl+G",
					enabled: () => magnification >= 4,
					checkbox: {
						toggle: toggle_grid,
						check: () => show_grid,
					},
					description: "Shows or hides the grid.",
				},
				{
					item: "Show T&humbnail",
					enabled: false, // @TODO: implement Show Thumbnail
					checkbox: {},
					description: "Shows or hides the thumbnail view of the picture.",
				}
			]
		},
		{
			item: "&View Bitmap",
			shortcut: "Ctrl+F",
			action: ()=> { view_bitmap(); },
			description: "Displays the entire picture.",
		}
	],
	"&Image": [
		{
			item: "&Flip/Rotate",
			// shortcut: "Ctrl+R", // reloads browser tab
			action: ()=> { image_flip_and_rotate(); },
			description: "Flips or rotates the picture or a selection.",
		},
		{
			item: "&Stretch/Skew",
			// shortcut: "Ctrl+W", // closes browser tab
			action: ()=> { image_stretch_and_skew(); },
			description: "Stretches or skews the picture or a selection.",
		},
		{
			item: "&Invert Colors",
			shortcut: "Ctrl+I",
			action: ()=> { image_invert_colors(); },
			description: "Inverts the colors of the picture or a selection.",
		},
		{
			item: "&Attributes...",
			shortcut: "Ctrl+E",
			action: ()=> { image_attributes(); },
			description: "Changes the attributes of the picture.",
		},
		{
			item: "&Clear Image",
			shortcut: looksLikeChrome ? undefined : "Ctrl+Shift+N", // opens incognito window in chrome
			// (mspaint says "Ctrl+Shft+N")
			action: ()=> { !selection && clear(); },
			enabled: ()=> !selection,
			description: "Clears the picture.",
			// action: ()=> {
			// 	if (selection) {
			// 		delete_selection();
			// 	} else {
			// 		clear();
			// 	}
			// },
			// mspaint says "Clears the picture or selection.", but grays out the option when there's a selection
		},
		{
			item: "&Draw Opaque",
			checkbox: {
				toggle: ()=> {
					tool_transparent_mode = !tool_transparent_mode;
					$G.trigger("option-changed");
				},
				check: () => !tool_transparent_mode,
			},
			description: "Makes the current selection either opaque or transparent.",
		}
	],
	"&Colors": [
		{
			item: "&Edit Colors...",
			action: ()=> {
				$colorbox.edit_last_color();
			},
			description: "Creates a new color.",
		},
		{
			item: "&Get Colors",
			action: ()=> {
				get_FileList_from_file_select_dialog((files)=> {
					const file = files[0];
					Palette.load(file, (err, new_palette)=> {
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
			action: ()=> {
				const blob = new Blob([JSON.stringify(palette)], {type: "application/json"});
				sanity_check_blob(blob, ()=> {
					saveAs(blob, "colors.json");
				});
			},
			description: "Saves the current palette of colors to a file.",
		}
	],
	"&Help": [
		{
			item: "&Help Topics",
			action: ()=> { show_help(); },
			description: "Displays Help for the current task or command.",
		},
		MENU_DIVIDER,
		{
			item: "&About Paint",
			action: ()=> { show_about_paint(); },
			description: "Displays information about this application.",
			//description: "Displays program information, version number, and copyright.",
		}
	],
	"E&xtras": [
		{
			item: "&History",
			shortcut: "Ctrl+Shift+Y",
			action: ()=> { show_document_history(); },
			description: "Shows the document history and lets you navigate to states not accessible with Undo or Repeat.",
		},
		{
			item: "&Render History As GIF",
			shortcut: "Ctrl+Shift+G",
			action: ()=> { render_history_as_gif(); },
			description: "Creates an animation from the document history.",
		},
		// {
		// 	item: "Render History as &APNG",
		// 	// shortcut: "Ctrl+Shift+A",
		// 	action: ()=> { render_history_as_apng(); },
		// 	description: "Creates an animation from the document history.",
		// },
		MENU_DIVIDER,
		// {
		// 	item: "Extra T&ool Box",
		// 	checkbox: {
		// 		toggle: ()=> {
		// 			// this doesn't really work well at all to have two toolboxes
		// 			// (this was not the original plan either)
		// 			$toolbox2.toggle();
		// 		},
		// 		check: ()=> {
		// 			return $toolbox2.is(":visible");
		// 		},
		// 	},
		// 	description: "Shows or hides an extra tool box.",
		// },
		// {
		// 	item: "&Preferences",
		// 	action: ()=> {
		// 		// :)
		// 	},
		// 	description: "Configures JS Paint.",
		// }
		/*{
			item: "&Draw Randomly",
			checkbox: {
				toggle: ()=> {
					if (window.simulatingGestures) {
						stopSimulatingGestures();
					} else {
						simulateRandomGesturesPeriodically();
					}
				},
				check: ()=> {
					return window.simulatingGestures;
				},
			},
			description: "Draws randomly with different tools.",
		},*/
		{
			item: "&Multi-User",
			submenu: [
				{
					item: "&New Session From Document",
					action: ()=> {
						let name = prompt("Enter the session name that will be used in the URL for sharing.");
						if(typeof name == "string"){
							name = name.trim();
							if(name == ""){
								show_error_message("The session name cannot be empty.");
							}else if(name.match(/[./[\]#$]/)){
								show_error_message("The session name cannot contain any of ./[]#$");
							}else{
								change_url_param("session", name);
							}
						}
					},
					description: "Starts a new multi-user session from the current document.",
				},
				{
					item: "New &Blank Session",
					action: ()=> {
						// @TODO: load new empty session in the same browser tab
						let name = prompt("Enter the session name that will be used in the URL for sharing.");
						if(typeof name == "string"){
							name = name.trim();
							if(name == ""){
								show_error_message("The session name cannot be empty.");
							}else if(name.match(/[./[\]#$]/)){
								show_error_message("The session name cannot contain any of ./[]#$");
							}else{
								// @TODO: keep settings like vertical-color-box-mode
								window.open(`${location.origin}${location.pathname}#session:${name}`);
							}
						}
					},
					description: "Starts a new multi-user session from an empty document.",
				},
			]
		},
		{
			item: "&Themes",
			submenu: [
				{
					item: "&Classic",
					action: ()=> {
						set_theme("classic.css");
					},
					enabled: () => get_theme() != "classic.css",
					description: "Makes JS Paint look like MS Paint from Windows 98.",
				},
				{
					item: "&Modern",
					action: ()=> {
						set_theme("modern.css");
					},
					enabled: () => get_theme() != "modern.css",
					description: "Makes JS Paint look a bit more modern.",
				},
				{
					item: "&Winter",
					action: ()=> {
						set_theme("winter.css");
					},
					enabled: () => get_theme() != "winter.css",
					description: "Makes JS Paint look festive for the holidays.",
				},
			]
		},
		{
			item: "&Eye Gaze Mode",
			checkbox: {
				toggle: ()=> {
					if (location.hash.match(/eye-gaze-mode/i)) {
						// @TODO: confirmation dialog that you could cancel with dwell clicking!
						// if (confirm("This will disable eye gaze mode.")) {
						change_url_param("eye-gaze-mode", false);
						// }
					} else {
						change_url_param("eye-gaze-mode", true);
					}
				},
				check: ()=> {
					return location.hash.match(/eye-gaze-mode/i);
				},
			},
			description: "Enlarges buttons and provides dwell clicking.",
		},
		{
			item: "&Speech Recognition",
			checkbox: {
				toggle: ()=> {
					if (location.hash.match(/speech-recognition-mode/i)) {
						change_url_param("speech-recognition-mode", false);
					} else {
						change_url_param("speech-recognition-mode", true);
					}
				},
				check: ()=> {
					return window.speech_recognition_active;
				},
			},
			enabled: ()=> window.speech_recognition_available,
			description: "Controls the application with voice commands.",
		},
		{
			item: "&Vertical Color Box",
			checkbox: {
				toggle: ()=> {
					if (location.hash.match(/eye-gaze-mode/i)) {
						// @TODO: confirmation dialog that you could cancel with dwell clicking!
						// if (confirm("This will disable eye gaze mode.")) {
						// change_some_url_params({
						// 	"eye-gaze-mode": false,
						// 	"vertical-color-box-mode": false,
						// });
						// }
					} else if (location.hash.match(/vertical-color-box-mode/i)) {
						change_url_param("vertical-color-box-mode", false);
					} else {
						change_url_param("vertical-color-box-mode", true);
					}
				},
				check: ()=> {
					return location.hash.match(/vertical-color-box-mode|eye-gaze-mode/i);
				},
			},
			enabled: ()=> {
				return !location.hash.match(/eye-gaze-mode/i);
			},
			// description: "Positions the color box on the side.",
			description: "Arranges the color box vertically.",
		},
		MENU_DIVIDER,
		{
			item: "Manage Storage",
			action: ()=> { manage_storage(); },
			description: "Manages storage of previously created or opened pictures.",
		},
		MENU_DIVIDER,
		{
			item: "Project News",
			action: ()=> { show_news(); },
			description: "Shows news about JS Paint.",
		},
		{
			item: "GitHub",
			action: ()=> { window.open("https://github.com/1j01/jspaint"); },
			description: "Shows the project on GitHub.",
		},
		{
			item: "Donate",
			action: ()=> { window.open("https://www.paypal.me/IsaiahOdhner"); },
			description: "Supports the project.",
		},
	],
};

})();
