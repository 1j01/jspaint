
# ![](images/icons/32.png) JS Paint Todo

* Improve README
	* Introduce and explain the project ...better?
	* Publish jspaint to the webstore (and link to that)
	* Make it pretty with images


* Pixel Perfection
	* Use win98 default scrollbar size
	* Minor color differences (0x808080 != 0x7b7b7b)
	* Some window layouts are bad
	* I want to give most things a revisit later on


* Menus
	* Keyboard Navigation
	* Mouse navigation ✓
	* Descriptions of menu items in the status bar
	* Use keyboard shortcuts defined in the menu data structure to declaratively setup hotkeys
		* `On key press, loop through the menus`
			* `If the key event matches the menu item's shortcut`
				* `Perform menu item's action`
				* `Break loop`
	* MAKE THINGS DO THINGS
		* File
			* Print Preview
			* Page Setup
		* Edit
			* Cut, Copy, Paste: Possibly impossible
		* View
			* Show/Hide $FontBox
			* Zoom should have an actual submenu
		* Image
			* Stretch / Skew (functionality)
			* Draw Opaque
		* Help
			* Help Topics ✓ um...
			* About paint ✓ um......
	* Enable items (Repeat, Clear Selection, Copy To...) when they are applicable
	* Sliding animation / transition effects


* Colors > Edit Colors... doesn't work when the $colorbox is hidden


* Close dialogues with Esc (and also Enter)


* `filter: invert()` doesn't work yet in Firefox
	* Invert the image with canvas
		* Make class $UpscaledCanvas or something that I can use to make lots of things crisp and pixely when zoomed in or on higher resolution displays


* Keep track of what's saved
	* Don't warn about saving saved files (Ctrl+S and then Ctrl+N)
	* Do warn about losing unsaved files (close button, etc.)


* Issue: status text gets cut off
	* Also, it should gracefully push the dimension displays off the edge instead of covering up the text with usually blank space


* It's not supposed to show the canvas handles when there is a selection. It used to hide them it no longer does.


* Visual glitch where button borders go above windows due to z-index


* Handle some edge cases
	* `this_ones_a_frame_changer();` (undo, redo, reset, file_open, ... switching between frames of an animation)
	* That's not how mspaint handles these edge cases. It disables actions while you're drawing. Maybe I should do that. (It does allow actions when you have a selection, and handles this like I tried to)
	
	* The window can be smaller than the minimum window area of mspaint
	* Dialogue windows should go away at some point. Also, there should only be one of most of them at a time.


* Tips and Tricks from [this tutorial](http://www.albinoblacksheep.com/tutorial/mspaint)
	* Color Replacement (see [Tools](#tools))
	* The Grid (Ctrl+G & zoom6x+)
	* Scroll Wheel draws line down and to the right (um, this is a bug, though)



* CSS
	* Buttons shouldn't need a class `.jspaint-button`
	* Color cells probably shouldn't be buttons
	* There also shouldn't be classes `.jspaint-window-button` (`.jspaint-window-titlebar button`) or `.jspaint-dialogue-button` (`.jspaint-window-content button`) at all
	* DRY, especially for the buttons


* JS
	* Chill down on the global event handlers; they're interfering with inputs
	* Selection.js and TextBox.js contain a lot of duplicated code.
	* Outdated names like sel.$ghost = div.jspaint-selection
	* Everything is in random files! functions.js, REALLY? menus.js contains way too much non-menu stuff.


### Extended editing

* Transparent PNGs
	* Detect transparency when opening an image
		* Optimization: Don't forget to assume JPEGs are opaque. (Some other file types too)
		* Raster file formats that support transparency include GIF, PNG, BMP and TIFF
	* Option in Image > Attributes... ✓
* Animated GIFs
	* Use ternary color as transparent color?
* Animated Transparent APNGs
* Multi-size Icons


### Mobile support

* Use pointer events polyfill
* Multi-touch devices
	* Two-finger drag to pan
* Single-touch devices
	* Pan tool
* Tap/click current colors area to swap bg/fg colors
* Panel for things that would normally require a keyboard?
	* Numpad +/- (Note: laptops often also lack numpads)
	* Shift = "Proportional", "Smear", "Snap to 8 directions" / "Octosnap"?
	* Ctrl+Shift+G = "Render GIF"
	* Pan tool for single-touch devices
	* Hidden by default?
	* You can't use the Eraser/Color Eraser tool as a "Color Eraser"
	* Also, you probably can't see tooltips on mobile


### Tools

* Curve
	* Aliasing


* Rounded Rectangle
	* Support shape styles!


* Ellipse
	* Support shape styles!


* Polygon
	* Issue with extra undoables
	* Ending the operation when switching tools
	* The canvas API handles self-intersecting shapes differently than mspaint
	* Aliasing
	* The above two items mean I would have to re-implement drawing polygons
	* Close the polygon when switching tools


* Eraser/Color Eraser
	* Right click with the eraser to selectively replace color1 with color2


* Fill With Color
	* Move fill function out of tools.js
	* Find a better fill algorithm!
		* Get into those corners
		* Handle transparency correctly
		* Keep speed


* Text
	* Handles
	* Wrapping!
	* Underline
	* Expanding to new lines
	* Minimum size of 3em x 1em (that is, the width of 3 'm's by the height of one line)
	* Detect fonts
	* Store position of FontBox
	* Keep an old textbox while drawing a new one (this somewhat complicates the "singleton" pattern I'm using)
	* Save text and record transformations so the image can be saved as SVG (or HTML?) with invisible selectable transformed text elements


* Select
	* Handles
	* Image appears blurry in the selection
	* Proportionally resize selection by holding Shift
	* Creates undoable even if you do nothing


* OPTIONS
	* secret 10x zoom by clicking the area just underneath the 8x zoom
	* in mspaint, visual area =/= selection highlight area =/= clickable area


* Strokes
	* Shapes respond to Ctrl, by...
		* It's complicated.
	* Use stroke size
	* Rectangle: The stroke is within the rectangle.
	* Rounded Rectangle / Ellipse: If the width/height is less than the stroke size, it fills a similar shape with the stroke color.


* Inverty fill bucket and airbrush cursors


* In Firefox while drawing an ellipse, it lags *a lot* but only while the mouse is on the canvas


### Colors

This isn't in mspaint, but maybe you should be able to click (double-click?) one of the selected colors to change it directly?

Or, for mobile, tap/click selected colors area to switch colors. Yeah, that seems more useful.

Load palettes with [palette.js](https://github.com/1j01/palette.js/)


### Components / Windows

* Drag window and component together seamlessly
* Double-click a component window's titlebar to dock the component to its most recent location.


### BSOD

Press ~ to bluescreen (or maybe something on the numpad?)

Prankily wait for next user input before fullscreening and bluescreening


### Chrome App

* Set up build process
	* Concatenate + Minify? Why?
	* Increment version?
	* Compress into zip file
	* Upload? Notify of new bug reports, stats? haha I'm thinking of things I might put in multiism/multi-platform once people were using it


* Use the chrome.wallpaper API to change the ChromeOS wallpaper.
	* Theoretical support ✓
	* Test this on Chrome OS


* Custom window frame
	* (Note: Minimum window size might need updating)


* Publish to webstore!?!?!?


### Also

Anything marked `@TODO` in the source code
