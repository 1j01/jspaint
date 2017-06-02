
# ![](images/icons/32.png) JS Paint Todo

* Help Topics
	* Resizable panes
	* Resizable window
	* Link-esque things
		* Popups (I'd probably make the text within the popups selectable)
		* Related topics (I'd probably make this a heading with links instead of the weird context menu thing)
	* Note unsupported features
		* "To use black and white instead of color"
		* "To display gridlines"
	* Update topics
		* "To use a picture as the desktop background":
		  add a third step? It's not quite that easy (at least in the browser)
		* "To create custom colors": way too OS-specific
		  (unless I'm gonna emulate the color selection dialogue)
		* "To enlarge the size of the viewing area" (`paint_enlarge_area.htm`):
		  jspaint currently allows you to draw while "Viewing the Bitmap"
		* "To zoom in or out of a picture", "To type and format text":
		  "You can enter text into a picture only in Normal view."
		  — jspaint handles this case (well, as well as it handles the Normal case)
	* Add topics
		* In "Tips and Tricks" (which is just a lame section)
		* Transparency
			* Replace "To use black and white instead of color"?
		* Multiplayer / collaboration / "To share the document On-Line" or whatever
	* Index
	* Search
	* Keyboard support


* Visual
	* Warning sign for "Save changes to X?" dialogue
	* Error symbol for error message dialogues
	* The window close button uses text; font rendering is not consistent
	* The progress bar (Rendering GIF) is left native
	* Menu separator spacing
	* Minor color differences (0x808080 != 0x7b7b7b)
	* I want to give most things a revisit later on for Pixel Perfection
	* Dynamic cursors
		* Inverty fill bucket and airbrush cursors
		* Previewy brush and eraser cursors


* Issues
	* [Stretch/skew and rotate don't update the canvas size](https://github.com/1j01/jspaint/issues/8)
	* ["Quick Undo" stopped working in Chrome](https://github.com/1j01/jspaint/issues/9)
	* If you open an image it resets the zoom but if you're on the magnification tool it doesn't update the options
	* If you zoom in with the magnifier without previously changing the magnification on the toolbar,
	  then switch back to the magnifier, the toolbar doesn't show any magnification highlighted
	* Middle-click scrolling is prevented
	* Firefox
		* It lags unusably when using tools
			* For some tools it only happens while dragging the mouse on the canvas
		* Tool options lag unusably when they're redrawn in quick succession
	* The TextBox contents move down and right when rasterizing
	* Free-form select can leave behind inverty brush in multiplayer
	* Multiplayer cursors that go outside the parent can cause the page to be scrollable
	* Multiplayer interupts you:
		* If you try to make a selection when there's a selection
		* If you try to play with multiple players
	* If you click on a menu item (up/down) and then move over to a menu item and click (up/down) it does nothing (and you can repeat this)


### Menus

* Keyboard navigation of submenus
* <kbd>Alt</kbd> (by itself)?


### Components / Windows

* Use the ghost when dragging on a component window's title bar
* Make the component ghost account for the window's title bar


* Handle windows going off the screen


### Extended editing

* Transparency
	* [x] Detect transparency when opening an image
	* [x] Option in Image > Attributes...
	* [ ] Color opacity slider
	* [ ] Toggle between blend and copy modes
	* [x] Represent transparency with a checkered background pattern
	* [ ] Maybe equivalise any rgba(X, X, X, 0) in fill algorithm


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
	* Layered images?
		* Photoshop PSD ([via psd.js](https://github.com/trevorlinton/psd.js))
		* OpenRaster ORA ([via ora.js](https://github.com/zsgalusz/ora.js/tree/master))


* Multiplayer and local sessions
	* See [sessions.js](src/sessions.js)
	* Deal with undo/redo for sessions
		* Particularly it might be helpful to undo to the state after your last change, not just before that;
		  this could happen automatically if there have been changes since your last change


### Device support

* Multi-touch devices
	* Two-finger drag to pan (the second touch cancels the default action just like normal)
* Single-touch devices
	* Pan tool


* Enlarge GUI elements on touch devices
	* Menus
	* Resize handles


* You can't use the Eraser/Color Eraser tool as a "Color Eraser" without a secondary mouse button
* Make sure anything that uses hovering is paralleled on mobile (tooltips, :hover effects)


* Access to functionality that would normally require a keyboard (with a numpad!)
	* Numpad +/-: Increase/Decrease brush size, Double/Half selection size, ...
	* Shift (toggle): Proportional, Smear / Trail Selection, "Snap to 8 directions" / "Octosnap"?
	* Ctrl+Select: Crop tool
	* Ctrl+Shift+G: "Render GIF"


### Tools

* Free-Form Select
	* Passive: create no undoables until you do something
		* You should be able to make a selection, then change the secondary color, then drag the selection cutting it out with the color you selected
	* See [On-Canvas Objects](#on-canvas-objects) for Selection


* Select
	* Passive: create no undoables until you do something
		* You should be able to make a selection, then change the secondary color, then drag the selection cutting it out with the color you selected
	* See [On-Canvas Objects](#on-canvas-objects) for Selection


* Magnifier
	* Choose and preview viewport with rectangular cursor


* Pencil
	* Adjust size (with numpad)


* Text
	* Underline
	* Expand box to make room for new lines
	* Minimum size of 3em x 1em
	* Store position of FontBox
	* Keep an old TextBox while drawing a new one
	* Save text and record transformations so the image can be saved as
	  SVG (or HTML?) with invisible selectable transformed text elements


* Curve
	* Aliasing


* Rectangle
	* The stroke should go within the rectangle


* Polygon
	* Aliasing
	* Handle self-intersecting shapes like MS Paint, with an `"evenodd"` [winding rule](http://blogs.adobe.com/webplatform/2013/01/30/winding-rules-in-canvas/)
	* Issue with extra undoables
	* Close and finalize the polygon when switching to a different tool


* Ellipse
	* See Shape Styles and Strokes below


* Rounded Rectangle
	* See Shape Styles and Strokes below


* **Options**
	* Secret 10x zoom by clicking the area just underneath the 8x zoom
	* In MS Paint, visual area =/= selection highlight area =/= clickable area


* **Shape Styles and Strokes**
	* Shapes: respond to Ctrl (It's complicated)
	* Rounded Rectangle & Ellipse:
		* Support stroke size and shape styles!
	* Rectangle, Rounded Rectangle & Ellipse:
		* Stroke should be entirely inside the dragged region


### On-Canvas Objects

* Selection
	* Proportionally resize selection while holding Shift
	  (or maybe by default? I feel like that should be the default.)
	* Don't cut until you drag or do something else
	  (In MS Paint, you can make a selection, change the background color
	  and drag it, leaving the new background color behind.)
	* Classic transparency where the selected background color is considered transparent


* TextBox
	* See Text tool


### Chrome App

I started making a packaged, windowed app, but a hosted app would be simpler.

I implemented theoretical support for changing the wallpaper on Chrome OS, but I don't know if it works.


* [Analytics](https://developer.chrome.com/apps/analytics)


* Publish to the Chrome Web Store!


### Native App

* Proper clipboard support; Electron has an API for copying images
* A dialogue when closing
* Subwindows outside the main window
* A different way of handling always-saved documents
  (recovery?)


### Also

* Anything marked `@TODO` or `@FIXME` in the source code


* Improve README
	* More images! Animated GIFs perhaps? :)


* CSS
	* DRY, especially button styles
	* Deal with `z-index` rules?
	* Comment stuff?
	* Use a CSS preprocessor so we can do color-swap themes (maybe even load Windows theme files)
	* Stuff should go in an OS GUI library with themes for Windows 98 and other OSes


* JS
	* Everything is in random files! "`functions.js`", REALLY?
	* `$Window` has a `$Button` facility; `$FormWindow` overrides it with essentially a better one
	* Image inversion code is duplicated in `ChooserCanvas` from tool-options.js but should go in image-manipulation.js
	* Make code clearer / improve code quality: https://codeclimate.com/github/1j01/jspaint


* Images
	* Use a shared sprite sheet per theme, and optimize it


* Search Engine Optimization
	* Load the About Paint content from an element on the page that gets hidden by code

