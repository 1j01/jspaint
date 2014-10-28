
# ![](images/icons/32.png) JS Paint Todo

* Visual
	* Some window layouts are bad
	* The window close button uses text; font rendering is not consistent
	* The progress bar (Rendering GIF) is left native
	* Use win98 default scrollbar size
	* Minor color differences (0x808080 != 0x7b7b7b)
	* I want to give most things a revisit later on for Pixel Perfection
	* Dynamic cursors
		* Inverty fill bucket and airbrush cursors
		* Previewy brush and eraser cursors
	* Pixelate graphics when zoomed in


* Keep track of what's saved
	* Don't warn about saving saved files (Ctrl+S and then Ctrl+N)
	* Do warn about losing unsaved files (close button, etc.)


* Gracefully hide things as the window gets smaller (With media queries!)


* Tips and Tricks from [this tutorial](http://www.albinoblacksheep.com/tutorial/mspaint)
	* The Grid (Ctrl+G & zoom6x+) (prerequisite: zooming)
	* Scroll Wheel Bug (um... it's not really a feature)


* Issues
	* Components
		* Colors > Edit Colors... doesn't work when the $colorbox is hidden
		* Component windows are gone forever once closed (can't be shown from the View menu)
		* Components in windows hidden from the View menu don't hide their windows
	* Status text gets cut off
		* Also, it should gracefully push the dimension displays off the edge
		  instead of covering up the text with usually blank space
	* Firefox
		* It lags unusably when using tools
			* For some tools it only happens while dragging the mouse on the canvas
		* Tool options flicker... *and lag*, when they're redrawn in quick succession
	* Global event handlers interfering with stuff
		* In Image > Attributes and other places
			* You can't copy, paste, cut or drag&drop in the inputs
			* You can't click on the radio option labels when text is selected!
		* In Help > About Paint and other places
			* You can't select text
			* You can't drag links
	* Fonts become serif in the menubar and/or statusbar
	  (To temporarily reproduce, you can
	  drag the canvas handles twice,
	  but sometimes it happens and stays)


* Handling actions that interfere with each other
	* I currently have a function `this_ones_a_frame_changer();`
	  that finalizes the selection among other things at various times
	  (undo, redo, reset, file_open, ... switching between frames of an animation)
	* MS Paint disables actions while you're drawing. Maybe I should do that?


### Menus

* Mouse navigation ✓
* Keyboard Navigation


* Enable items (Repeat, Clear Selection, Copy To...) when they are applicable
* Disable Image > Clear Image when there is a selection like MS Paint does?


* Menu Items
	* View
		* Show/Hide FontBox
		* Zoom should have an actual submenu (prerequisite: zooming)
	* Image
		* Stretch / Skew (functionality)


* Sliding animation / transition effects


* Use keyboard shortcuts defined in the menu data structure to declaratively setup hotkeys
	* ```
	On key press, loop through the menus
		If the key event matches the menu item's shortcut
			Perform menu item's action
			Break loop
	```


### Components / Windows

* Drag window and component together seamlessly


* Keyboard interaction with dialogues
	* Close dialogues with Escape
	* Navigating form windows
	* Left/Right, Enter/Space


* Handle windows going off the screen


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
	* Deal with undo/redo for sessions


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
	* Ctrl (toggle??): Uh, crop tool instead of selection tool (this should really be an additional tool)
	* Ctrl+Shift+G: "Render GIF"


* Add Pan and Color Eraser tools to the toolbox
	* What about multitouch devices that don't need a pan tool? Maybe add some other random tool?


### Colors

For mobile, tap (or click) the selected colors area to swap background/foreground colors.

The ability to change the current color without changing the palette

Load palettes with [palette.js](https://github.com/1j01/palette.js/)


### Tools

* Free-Form Select
	* Passive: create no undoables until you do something
	* See [On-Canvas Objects](#on-canvas-objects) for Selection


* Select
	* Passive: create no undoables until you do something
	* See [On-Canvas Objects](#on-canvas-objects) for Selection


* Eraser/Color Eraser ✓


* Fill With Color
	* Find a better fill algorithm!
		* Get into those corners
		* Handle transparency correctly (✓)
		* (Keep speed)


* Pick Color ✓


* Magnifier (!)
	* Make it, even if it's blurry (better than zooming in the entire page blurrily)


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
	* See [On-Canvas Objects](#on-canvas-objects)


* Line
	* Stroke size when aliased


* Curve
	* Aliasing


* Rectangle
	* The stroke should go within the rectangle
	* Pixel-sharp at all stroke sizes (it's currently blurry)


* Polygon
	* Aliasing
	* The canvas API handles self-intersecting shapes differently than MS Paint
	* Issue with extra undoables
	* Close and finalize the polygon when switching to a different tool
	* Double-click to close the shape


* Ellipse
	* See below


* Rounded Rectangle
	* See below


* **Options**
	* Secret 10x zoom by clicking the area just underneath the 8x zoom
	* In MS Paint, visual area =/= selection highlight area =/= clickable area


* **Shape Styles and Strokes**
	* Shapes: respond to Ctrl (It's complicated)
	* Lots of things: Use stroke size
	* Rounded Rectangle & Ellipse:
		* If the width/height is less than the stroke size, it should draw a shape with no stroke filled with the color that would normally be used for the stroke.
		* Support shape styles!


### On-Canvas Objects

* Selection
	* Handles
		* Hide the canvas handles when there is a selection. (This used to work!)
		* I have a git stash where I'm trying to improve selections. Canvas hiding is fixed there, but other stuff is broken
	* Transparency with selected background color
	* Proportionally resize selection while holding Shift
	* Don't cut until you drag or do something else (In MS Paint, you can make a selection, change the background color and drag it, leaving the new background color behind.)
	* Classic transparency where the selected background color is considered transparent


* TextBox
	* See Text tool


* Selection and TextBox should inherit from a base class


### BSOD

Press ~ to bluescreen (or maybe something on the numpad?)

Prankily wait for next user input before fullscreening and bluescreening


### Chrome App

* Set up build process
	* ~~Concatenate & Minify~~ (Why?)
	* Increment version?
	* Compress into zip file
	* Upload new version to the Chrome Web Store?


* Use the chrome.wallpaper API to change the ChromeOS wallpaper.
	* Theoretical support ✓
	* Test this on Chrome OS


* Custom window frame
	* (Note: Minimum window size might need updating)


* Publish to the Chrome Web Store


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
	* Seriously, the buttons
	* Move into folder (called what? styles? stylesheets? css?)


* JS
	* Refactor old code
	* Selection and TextBox contain a lot of duplicated code
	* Remove either `selection.x/y/w/h` or `._x/_y/_w/_h`; and use `x/y/width/height`
	* Outdated names like sel.$ghost = div.jspaint-selection (not exactly a ghost)
	* Everything is in random files! "functions.js", REALLY?
	* $Window has a $Button facility; $FormWindow overrides it with essentially a better one
	* Image inversion code is duplicated in ChooserCanvas in tool-options.js
	* render_brush shouldn't be in tool-options.js


* Images
	* Optimize
	* Use a sprite sheet


* Help
	* Actual Help Topics
	* Interactive tutorial(s)?


* Search Engine Optimization
	* Load the About Paint content from an element on the page that gets hidden by code

