
# ![](images/icons/32.png) JS Paint Todo

### Help

* Resizable panes
* Resizable window
* Link-esque things
	* Popups (I'd probably make the text within the popups selectable)
	* Related topics (I'd probably make this a heading with links instead of the weird context menu thing)
* Note unsupported features (or just implement these)
	* "To use black and white instead of color" (partially implemented)
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
	* Multi-user / collaboration / "To share the document On-Line" or whatever
* Index
* Search
* Keyboard support


### Visual

* Warning sign for "Save changes to X?" dialogue
* Error symbol for error message dialogues
* 3D inset border for inputs - SVG `image-border`?
* The window close button uses text; font rendering is not consistent
* The progress bar (Rendering GIF) is left native
* Menu separator spacing
* Minor color differences (0x808080 != 0x7b7b7b)
* I want to give most things a revisit later on for Pixel Perfection
* Dynamic cursors
	* Inverty fill bucket and airbrush cursors
	* Previewy brush and eraser cursors
* Custom cursors in Edge; apparently they require `.cur` files? ugh
* The canvas-area's border is different in Firefox and Edge from Chrome


### Issues

* ["Quick Undo" stopped working in Chrome](https://github.com/1j01/jspaint/issues/9)
* [Resizing the canvas or selection is broken when magnified](https://github.com/1j01/jspaint/issues/13)
* If you open an image it resets the zoom but if you're on the magnification tool it doesn't update the options
* If you zoom in with the magnifier without previously changing the magnification on the toolbar,
then switch back to the magnifier, the toolbar doesn't show any magnification highlighted
* The TextBox contents move down and right when rasterizing
* If you click on a menu item (up/down) and then move over to a menu item and click (up/down) it does nothing (and you can repeat this)
* Can't glide thru tool options in Firefox, mobile Chrome;
might be a pointer events spec interpretation issue, and it could easily be that the more technically correct browsers are where it's not working
(Note: not a thing allowed by MS Paint)


### Menus

* Keyboard navigation of submenus
* <kbd>Alt</kbd> (by itself)?


### Components / Windows

* Use the ghost when dragging on a component window's title bar
* Make the component ghost account for the window's title bar


* Handle windows going off the screen


### Extended editing

* Transparency
	* Color opacity slider
	* Toggle between blend and copy modes
	* Maybe equivalise any rgba(X, X, X, 0) in fill algorithm?
	There'd still be the possibility of 1/255th opacity pixels,
	but if you're creating colors from the combination of a color picker and an opacity slider,
	you might naturally introduce differing zero-opacity color values a lot.

* Images with multiple sub-images
	* Component to switch between sub-images
	* Deal with undo/redo for sub-images
	* Animated GIFs
		* Transparency ([jnordberg/gif.js issue #5](https://github.com/jnordberg/gif.js/issues/5))
	* Animated Transparent APNGs
		* APNG Library ([this kickstarter wanted $15,000 to make this](https://www.kickstarter.com/projects/374397522/apngasm-foss-animated-png-tools-and-apng-standardi);
		I was able to compile their [C++ implementation](https://github.com/apngasm/apngasm) to JS with [emscripten](https://github.com/kripken/emscripten) though;
		I'll publish that at some point)
	* Multi-size Icons
		* Windows ICO ([jBinary can read](http://jdataview.github.io/jBinary.Repo/demo/#ico) and presumably write ICO files)
		* Mac ICNS
	* Layered images?
		* Photoshop PSD ([via psd.js](https://github.com/trevorlinton/psd.js))
		* OpenRaster ORA ([via ora.js](https://github.com/zsgalusz/ora.js/tree/master))


* Online (multi-user) and local (single-user) sessions
	* See [sessions.js](src/sessions.js)
	* Deal with undo/redo for sessions
		* Particularly it might be helpful to undo *to* your last change, not just to right before it (by undoing it);
		this could automatically be the behavior of undo if there have been changes since your last change
	* Issues
		* You get interrupted if you try to make a selection when there's a selection
		* You get interrupted if you try to draw at the same time as another person (you basically have to take turns - lame!)
		* Free-form select can leave behind inverty brush
		(this should be fixed by improving how the selection tools work;
		the inverty-ness shouldn't be drawn to the main canvas in the first place)
		* Cursors from other users that go outside the parent can cause the page to be scrollable


### Device support

* Multi-touch devices
	* Two-finger drag to pan (the second touch cancels the default action just like normal)
* Single-touch devices
	* Pan tool


* Enlarge GUI elements on touch devices
	* Menus
	* Resize handles (at least functionally; in Win7 Paint, the hitbox size is much larger than the visible size, like maybe 32px)


* You can't use the Eraser/Color Eraser tool as a "Color Eraser" without a secondary mouse button
* Make sure anything that uses hovering is paralleled on mobile (tooltips, `:hover` effects)


* Access to functionality that would normally require a keyboard (with a numpad!)
	* Numpad +/-: Increase/Decrease brush size, Double/Half selection size, ...
	* Shift (toggle): Proportional, Smear / Trail Selection, "Snap to 8 directions" / "Octosnap"?
	* Ctrl+Select: Crop tool or "Crop to selection" option


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
	SVG (or HTML?) with invisible selectable transformed text elements?


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
	(or maybe by default? I feel like it should be the default, tbh.)
	* Don't cut until you drag or do something else
	(In MS Paint, you can make a selection, change the background color
	and drag it, leaving the new background color behind.)


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


* See [Issues on GitHub](https://github.com/1j01/jspaint/issues)


* Improve README
	* More images! Animated GIFs perhaps? :)


* CSS
	* DRY, especially button styles - SVG `border-image`?
	* Comment stuff?
	* Use a CSS preprocessor
		* DRY
		* Clearer `z-index` handling?
		* Color-swap themes (maybe even load Windows theme files)
	* Stuff should go in an OS GUI library with themes for Windows 98 and other OSes


* JS
	* Everything is in random files! "`functions.js`", REALLY?
	* `$Window` has a `$Button` facility; `$FormWindow` overrides it with essentially a better one
	* Image inversion code is duplicated in `ChooserCanvas` from tool-options.js but should go in image-manipulation.js
	* Make code clearer / improve code quality: https://codeclimate.com/github/1j01/jspaint


* Images
	* Use a shared sprite sheet per theme (and optimize it I guess)


* Load the About Paint content from an element on the page that gets hidden by code
in order to hopefully show up nicer in search engines.
Currently shows up in Google with some text from the menus as the description.

