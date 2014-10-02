
var ____________________________ = "A HORIZONTAL RULE / DIVIDER";

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
			action: function(){
				print();
			}
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
				close();
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
			action: image_flip_and_rotate
		},
		{
			item: "&Stretch/Skew",
			shortcut: "Ctrl+W",
			action: image_stretch_and_skew
		},
		{
			item: "&Invert Colors",
			shortcut: "Ctrl+I",
			action: image_invert
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
				var a_attr = "href='https://www.google.com/search?q=ms+paint+tutorials' target='_blank'";
				$msgbox.$content.html(
					"<p>There's no help specifically for JS Paint, but you can try <a "+a_attr+">searching for tutorials</a> for MS Paint." +
					"<p>There will be differences, but most of the basics are there.</p>"
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
					"<h1><img src='images/icons/32.png'/> JS Paint<hr/></h1>" +
					"<p>JS Paint is a web-based remake of MS Paint by <a href='http://1j01.github.io/'>Isaiah Odhner</a>.</p>" +
					"<p>You can check out the project <a href='https://github.com/1j01/jspaint'>on github</a>.</p>"
				).css({padding: "15px"});
				$msgbox.center();
			}
		}
	],
};
