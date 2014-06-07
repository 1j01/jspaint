
# Todo

* Improve README
	* Introduce and explain the project ✓ ...better?
	* Is a link in the header visible enough?
	* Publish jspaint to the webstore and link to that
	* I feel like the tone is sort of weird or something
	* Make it pretty with images

* Menus!
	* Pixel Perfection
	* Keyboard Navigation
	* Mouse navigation
	* Use keyboard shortcuts defined in the `menus` data structure (which isn't currently saved to a variable) to declaratively setup hotkeys
		* on key press, loop through the menus
			* if shortcut matches
				* "call to action"
				* break


* Don't warn about saving saved files (Ctrl+S and then Ctrl+N)
* Do warn about losing unsaved files (close button, etc.)

* BUG: sometimes editing ability is suddenly lost (this may be fixed)
	`var mouse_was_pressed = false;`
* BUG: save (new) file and then >New and then save saves over old file irreversibly
	`window.file_entry = null;`
* BUG: status text gets cut off
	Also, it should gracefully push the dimension displays off the edge instead of covering up the text with usually blank space

* Handle some edge cases
	* Undoing/redoing should stop brush drawing
	* Undoing/redoing should destroy the selection
	* Switching frames in the future should also do the above.
	* `this_one_is_a_frame_changer_guys();`
	* `invert` is also a frame-changer
	* `file_new` (`reset`) is a frame-changer
	* The window can be smaller than the minimum window area of mspaint
	* Subwindows should go away at some point. There should only be one of most of them.

* Set up minification?


* Use win98 default scrollbar size @easy
* Minor color differences (0x808080 != 0x7b7b7b)

* Tips and Tricks from [this tutorial](http://www.albinoblacksheep.com/tutorial/mspaint)
	* Brush Scaling ✓
	* Custom Brushes ✓
	* The 'Stamp' Tool (Draw the selection on click, not just drag) @easy
	* Image Scaling (Ctrl+Plus and Ctrl+Minus on the Numpad to scale the selection by factors of 2)
	* Color Replacement (see [Tools](#tools))
	* The Grid (Ctrl+G + zoom6x+)
	* Quick Undo ✓ (I also made it redoable, in case you do it by accident)
	* Scroll Wheel draws line down and to the right (let's maybe not implement this hm?)

### Extended editing

* Transparent PNGs
* Animated GIFs
* Multisize Icons

### Mobile support

* Multitouch (use pointer events polyfill)

### Actions

* Canvas Manipulations
	* Rotate
	* Flip
	* Skew
	* Invert
	* Clear
* Undo/Redo History to Frames

### Tools

* OPTIONS
	* shapes all have their own settings for [fill | stroke | stroke_fill]
	* shapes, lines and curves all use one setting for stroke width
	* selection + free-form selection + text use one setting for [opaque/transparent]
	* secret 10x zoom by clicking the area just underneath the 8x zoom
	* visual area is different from selection highlight area is different from clickable area

* fill bucket and airbrush cursors are supposed to be inverty :\

* Shapes respond to Ctrl, by...
	* It's complicated.

* Use stroke width

* Color Eraser
	* right click with the eraser to selectively replace color1 with color2

* Fill Bucket
	* get into those corners!
	* handle transparency also
	* man, this fill algorithm is pretty bad
	* *find a better fill algorithm*

* Text tool
	* Make it
	* Save text and record transformations so it can be saved as an SVG with invisible selectable elements

* Strokes
	* Rectangle: The stroke is within the rectangle.
	* Rounded Rectangle / Ellipse: If the width/height is less than the stroke width, it draws the fillstroke.


### Colors
This isn't in mspaint, but maybe use should be able to click (double-click?) one of the selected colors to change it directly?

### Components / Windows
* Drag components into a window
* Drag windows
* Double-click a component window's titlebar to dock the component to its most recent location.


### BSOD

Press `/~ to bluescreen

Prankily wait for next user input before fullscreening and bluescreening


### Chrome App

* Use the chrome.wallpaper API to change the ChromeOS wallpaper.
	* Code:

			chrome.wallpaper.setWallpaper({
				url: canvas.toDataURL(),
				layout: 'CENTER_CROPPED',
				name: file_name
			}, function(){});
	
	* I'd need to test this on Chrome OS

* Themed window border
	* Minimum window size might need updating

* Publish to webstore!?!?!?
