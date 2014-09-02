
# Todo

* Improve README
	* Introduce and explain the project ...better?
	* Is a link in the header visible enough?
	* Publish jspaint to the webstore and link to that
	* Make it pretty with images

* Menus!
	* Keyboard Navigation
	* Mouse navigation
	* Use keyboard shortcuts defined in the `menus` data structure (which isn't currently saved to a variable) to declaratively setup hotkeys
		* on key press, loop through the menus
			* if shortcut matches
				* "call to action"
				* break
	* Pixel Perfection
	* MAKE THINGS DO THINGS
		* Image
			* Flip / Rotate
			* Stretch / Skew
			* Invert Colors ✓
			* Attributes...
			* Clear Image ✓
			* Draw Opaque
		* View > Show/Hide stuff
		* Edit > Paste From... ✓
			* Select the selection tool
		* Other stuff
		* About paint
	* Repeat is always grayed out, but is functional
	* Clear Selection is always grayed out, but is functional

* For tools, don't draw for every single pixel the mouse moves, when drawing once would have the same effect but be 10x-300x+ faster!
	* Firefox's canvas is slow which makes the difference very obvious!

* `filter: invert();` doesn't work yet in Firefox
	* Invert the image with canvas
		* Make class $UpscaledCanvas

* Keep track of what's saved
	* Don't warn about saving saved files (Ctrl+S and then Ctrl+N)
	* Do warn about losing unsaved files (close button, etc.)

* Issue: status text gets cut off
	* Also, it should gracefully push the dimension displays off the edge instead of covering up the text with usually blank space

* It's not supposed to show the canvas handles when there is a selection. It used to hide them but now it doesn't.

* Handle some edge cases
	* `this_ones_a_frame_changer();` (undo, redo, reset, file_open, ... switching between frames of an animation)
	* That's not how mspaint handles these edge cases. It disables actions while you're drawing. Maybe I should do that. (It does allow actions when you have a selection, and handles this like I tried to)
	
	* The window can be smaller than the minimum window area of mspaint
	* Dialogue windows should go away at some point. Also, there should only be one of most of them at a time.



* Use win98 default scrollbar size @easy
* Minor color differences (0x808080 != 0x7b7b7b)

* Tips and Tricks from [this tutorial](http://www.albinoblacksheep.com/tutorial/mspaint)
	* Brush Scaling ✓
	* Custom Brushes ✓
	* The 'Stamp' "Tool" ✓
	* Image Scaling ✓
	* Color Replacement (see [Tools](#tools))
	* The Grid (Ctrl+G + zoom6x+)
	* Quick Undo ✓ (I also made it redoable, in case you do it by accident)
	* Scroll Wheel draws line down and to the right (let's maybe not implement this hm?)

### Extended editing

* Transparent PNGs
	* Detect transparency when opening an image
		* Optimization: Don't forget to assume jpegs are opaque. Because they are.
	* Option in Image > Attributes...
* Animated GIFs
	* Use ternary color as transparent color?
* Animated Transparent (A)PNGs
* Multisize Icons

### Mobile support

* Use pointer events polyfill
* Multitouch
	* Two-finger drag to pan
* Unitouch (mobile devices without multitouch support)
	* Awkwardly fit in pan tool?
* Tap (/click?) current colors area to swap
* Panel for things that would normally require a keyboard? (hidden by default?)
	* Numpad plus & minus (...it's not just phones that don't always have numpads...)
	* Shift = "Proportional" / "Smear" / "Snap to 8 directions"?
	* Ctrl+Shift+G = Render GIF?

### Tools

* Curve tool
	* Aliasing

* Polygon tool
	* Issue with extra undoables
	* Ending the operation when switching tools
	* Self-intersecting shapes are handled differently by mspaint than with the Canvas API
	* Aliasing
	* Close the polygon when switching tools

* OPTIONS
	* secret 10x zoom by clicking the area just underneath the 8x zoom
	* visual area is different from selection highlight area is different from clickable area

* fill bucket and airbrush cursors are supposed to be inverty :\

* Color Eraser
	* right click with the eraser to selectively replace color1 with color2

* Fill Bucket
	* Find a better fill algorithm!
		* get into those corners!
		* handle transparency

* Text tool
	* Handles
	* Wrapping!
	* Expanding to new lines
	* Minimum size of 3em x 1em (that is, the width of 3 'm's by the height of one line)
	* Fonts (`FontBox`)
		* Detect fonts
		* Implement underline (Probably after wrapping!)
		* Store position
	* Keep the old textbox while drawing a new one (this somewhat complicates the "singleton" pattern I'm using now)
	* Save text and record transformations so it can be saved as an SVG (or HTML?) with invisible selectable elements

* Select tool
	* Handles
	* Image is blurry in the selection
	* Proportionally resize selection by holding Shift

* Strokes
	* Shapes respond to Ctrl, by...
		* It's complicated.
	* Use stroke size
	* Rectangle: The stroke is within the rectangle.
	* Rounded Rectangle / Ellipse: If the width/height is less than the stroke size, it fills a similar shape with the stroke color.


### Colors

This isn't in mspaint, but maybe use should be able to click (double-click?) one of the selected colors to change it directly?

Or, for mobile, tap/click to switch colors. Yeah, that sounds better.

Load palettes with [palette.js](https://github.com/1j01/palette.js/)

### Components / Windows

* Drag components into a window ✓
* Drag window and component together seamlessly
* Double-click a component window's titlebar to dock the component to its most recent location.


### BSOD

Press `/~ to bluescreen

Prankily wait for next user input before fullscreening and bluescreening


### Chrome App

* Set up build process
	* Concatenate + Minify?
	* Increment version
	* Move things into zip file
	* Upload? Notify of new bug reports, stats? haha I'm thinking of things I might put in multiism/multi-platform once many people were using it

* Use the chrome.wallpaper API to change the ChromeOS wallpaper.
	* Theoretical support ✓
	* Test this on Chrome OS

* Themed window border
	* (Note: Minimum window size might need updating)

* Publish to webstore!?!?!?

### Also

Anything marked `@TODO` in the source code is also to be done.
