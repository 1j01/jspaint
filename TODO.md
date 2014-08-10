
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

* BUG: status text gets cut off
	Also, it should gracefully push the dimension displays off the edge instead of covering up the text with usually blank space
* BUG: cropping doesn't update the canvas handles

* It's not supposed to show the canvas handles when there is a selection. It used to hide them but now it doesn't.

* Handle some edge cases
	* `this_ones_a_frame_changer();` (undo, redo, reset, file_open, ... switching between frames of an animation)
	* That's not how mspaint handles these edge cases. It disables actions while you're drawing. Maybe I should do that. (It does allow actions when you have a selection, and handles this like I tried to)
	
	* The window can be smaller than the minimum window area of mspaint
	* Subwindows should go away at some point. Also, there should only be one of most of them at a time.

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
	* Detect transparency when opening an image
		* Don't forget to assume jpegs are opaque. Because they are.
	* Option in Image > Attributes...
* Animated GIFs
	* Use ternary color as transparent color?
* Animated Transparent (A)PNGs
* Multisize Icons

### Mobile support

* Multitouch (use pointer events polyfill)

### Actions

* Canvas Manipulations
	* Rotate
	* Flip
	* Skew
	* Invert ✓
	* Clear
* Undo/Redo History to Frames

### Tools

* Curve tool

* Polygon tool
	* Issue with extra undoables
	* Ending the operation when switching tools
	* Self-intersecting shapes are handled differently by mspaint than with the Canvas API
	* Aliasing

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
* Drag windows by the contained component seamlessly
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
