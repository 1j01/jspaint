
# ![](images/icons/32.png) JS Paint Todo

* Visual
	* Some window layouts are bad
	* Some dialogue buttons are seriously messed up
	* The window close button uses text; font rendering is not consistent
	* The progress bar (Rendering GIF) is left native
	* Use win98 default scrollbar size
	* Minor color differences (0x808080 != 0x7b7b7b)
	* I want to give most things a revisit later on for Pixel Perfection
	* Dynamic cursors
		* Inverty fill bucket and airbrush cursors
		* Previewy brush and eraser cursors


* Keep track of what's saved
	* Don't warn about saving saved files (Ctrl+S and then Ctrl+N)
	* Do warn about losing unsaved files (close button, etc.)


* Hide the canvas handles when there is a selection. (This used to work!)


* Gracefully hide things as the window gets smaller (With media queries!)


* Tips and Tricks from [this tutorial](http://www.albinoblacksheep.com/tutorial/mspaint)
	* The Grid (Ctrl+G & zoom6x+)
	* Scroll Wheel Bug (um...)


* Issues
	* Colors > Edit Colors... doesn't work when the $colorbox is hidden
	* Component windows are gone forever once closed (can't be shown from View menu)
	* Status text gets cut off
		* Also, it should gracefully push the dimension displays off the edge instead of covering up the text with usually blank space
	* Firefox
		* It lags unusably when using tools
			* For some tools it only happens while dragging the mouse on the canvas
		* Tool options that have images flicker... *and lag*
		* Airbrush options aren't inverted when selected because `filter: invert()` doesn't work yet in Firefox
			* Invert the image with canvas
				* Make class $UpscaledCanvas or something that I can also use to make lots of things crisp and pixely when zoomed in and on higher resolution displays
	* Global event handlers interfering with stuff
		* In Image > Attributes and other places
			* You can't copy, paste, cut or drag&drop in the inputs
			* You can't click on the radio option labels when text is selected!
		* In Help > About Paint and other places
			* You can't select text
			* You can't drag links
		

* Handling actions that interfere with each other
	* I currently have a function `this_ones_a_frame_changer();` that finalizes the selection among other things at various times (undo, redo, reset, file_open, ... switching between frames of an animation)
	* MS Paint disables actions while you're drawing. Maybe I should do that? It does allow actions when you have a selection and finalizes it as I am doing.


### Menus

* Mouse navigation ✓
* Keyboard Navigation
* Descriptions of menu items in the status bar
* Use keyboard shortcuts defined in the menu data structure to declaratively setup hotkeys
	* ```
	On key press, loop through the menus
		If the key event matches the menu item's shortcut
			Perform menu item's action
			Break loop
	```
* Enable items (Repeat, Clear Selection, Copy To...) when they are applicable
* Disable Image > Clear Image when there is a selection like mspaint does?
* Sliding animation / transition effects


* Menu Items
	* File
		* Print Preview
		* Page Setup (what should these do? call `print`?)
	* Edit
		* Cut, Copy, Paste: Possibly impossible
	* View
		* Show/Hide FontBox
		* Zoom should have an actual submenu
	* Image
		* Stretch / Skew (functionality)


### Components / Windows

* Drag window and component together seamlessly


* Double-click a component window's titlebar to dock the component to its most recent location.


* Keyboard interaction with dialogues
	* Close dialogues with Escape
	* Navigating form windows
	* Left/Right, Enter/Space


### Extended editing

* Transparency ✓
	* Detect transparency when opening an image ✓
	* Option in Image > Attributes... ✓
	* Color opacity slider
	* Toggle between blend and copy modes
	* Checkered background pattern representing transparency
	* Maybe equivalise any rgba(X, X, X, 0) in fill algorithm


* Images with multiple sub-images
	* Component to switch between sub-images
	* Deal with undo/redo for sub-images
	* Animated GIFs
		* Transparency ([jnordberg/gif.js issue #5](https://github.com/jnordberg/gif.js/issues/5))
	* Animated Transparent APNGs
		* APNG Library ([this kickstarter wants $15,000 to make this](https://www.kickstarter.com/projects/374397522/apngasm-foss-animated-png-tools-and-apng-standardi))
	* Multi-size Icons
		* Windows ICO ([jBinary can read](http://jdataview.github.io/jBinary.Repo/demo/#ico) and presumably write ICO files)
		* Mac ICNS

* Multiplayer
	* See [multiplayer.js](multiplayer.js)


### Mobile support

* Use pointer events polyfill
	* Multi-touch devices
		* Second touch cancels current action just like a second button does on the desktop
		* Two-finger drag to pan
	* Single-touch devices
		* Pan tool


* You can't use the Eraser/Color Eraser tool as a "Color Eraser" without a secondary mouse button
* Make sure anything that uses hovering is paralleled on mobile (tooltips, :hover effects)


* Panel for things that would normally require a keyboard (with a numpad)
	* Numpad +/-: Increase/Decrease brush size, Double/Half selection size, ...
	* Shift (toggle): Proportional, Smear / Trail Selection, "Snap to 8 directions" / "Octosnap"?
	* Ctrl+Shift+G: "Render GIF"


* Add Pan and Color Eraser tools to the toolbox
	* What about multitouch devices that don't need a pan tool? Maybe add some other random tool?


### Colors

For mobile, tap (or click) the selected colors area to swap background/foreground colors.

The ability to change the current color without changing the palette

Load palettes with [palette.js](https://github.com/1j01/palette.js/)


### Tools

* Free-Form Select (!)


* Select
	* Handles
	* Transparency with selected background color
	* Selection appears blurry
	* Proportionally resize selection while holding Shift
	* Creates an undoable state even if you do nothing


* Eraser/Color Eraser ✓


* Fill With Color
	* Find a better fill algorithm!
		* Get into those corners
		* Handle transparency correctly (✓)
		* (Keep speed)


* Pick Color ✓


* Magnifier (!)
	* Everything


* Pencil
	* Adjust size


* Brush ✓


* Airbrush ✓


* Text
	* Handles
	* Wrapping!
	* Underline
	* Expanding to new lines
	* Minimum size of 3em x 1em
	* Detect fonts
	* Store position of FontBox
	* Keep an old TextBox while drawing a new one (this somewhat complicates the "singleton" pattern I'm using)
	* Save text and record transformations so the image can be saved as SVG (or HTML?) with invisible selectable transformed text elements


* Line
	* Stroke size (when aliased)


* Curve
	* Aliasing


* Rectangle
	* The stroke should go within the rectangle
	* Pixel-sharp at all stroke sizes (it's currently blurry)


* Polygon
	* Aliasing
	* The canvas API handles self-intersecting shapes differently than mspaint
	* The above two items mean I would have to re-implement drawing polygons
	* Issue with extra undoables
	* Close the polygon when switching to a different tool


* Ellipse
	* See below


* Rounded Rectangle
	* See below


* **Options**
	* Secret 10x zoom by clicking the area just underneath the 8x zoom
	* In mspaint, visual area =/= selection highlight area =/= clickable area


* **Shape Styles and Strokes**
	* Shapes: respond to Ctrl (It's complicated)
	* Lots of things: Use stroke size
	* Rounded Rectangle & Ellipse:
		* If the width/height is less than the stroke size, it should draw a shape with no stroke filled with the color that would normally be used for the stroke.
		* Support shape styles!


### BSOD

Press ~ to bluescreen (or maybe something on the numpad?)

Prankily wait for next user input before fullscreening and bluescreening


### Chrome App

* Set up build process
	* ~~Concatenate & Minify~~ (Why?)
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

* Anything marked `@TODO` or `@FIXME` in the source code


* Improve README
	* Introduce and explain the project ...better?
	* Make it pretty with (moar) images (screenshots plz)


* Stop improving TODO
	* It's just a TODO
	* You're wasting your time
	* Why did I even make this a markdown document?
	* Work on the project


* CSS
	* Buttons shouldn't need a class `.jspaint-button`
	* Color cells probably shouldn't be buttons
	* There also shouldn't be classes `.jspaint-window-button` (`.jspaint-window-titlebar button`) or `.jspaint-dialogue-button` (`.jspaint-window-content button`) at all
	* DRY, especially for the buttons
	* Move into folder (called what? styles? stylesheets? css?)


* JS
	* Refactor old code
	* Selection.js and TextBox.js contain a lot of duplicated code.
	* Outdated names like sel.$ghost = div.jspaint-selection
	* Everything is in random files! functions.js, REALLY? menus.js contains way too much non-menu stuff.
	* $Window has a $Button facility; $FormWindow overrides it with essentially a better one


* Images
	* Optimize
	* Use a sprite sheet


* Help
	* Actual Help Topics
	* Interactive tutorial(s)?


* Search Engine Optimization
	* Load the About Paint content from an element on the page that gets hidden by code

