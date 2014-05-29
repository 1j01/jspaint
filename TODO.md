
# Todo

* Improve README
	* Make it more than 4 words
		* (If you exclude "words" that have acronyms in them, there is only one two-letter word: "in")
	* Make it better than the TODO list at introducing the project
		* Explain the project
			* Current state
			* [Goals](#extended-editing)
		* Link to the hosted version
		* Show how to install it as a chrome app
		* Make it pretty with images


* Menus!
	* Pixel Perfection
	* Keyboard Navigation
	* Mouse navigation
	* Use keyboard shortcuts defined in the `menus` data structure (which isn't currently saved to a variable) to declaratively setup hotkeys
		* To do this, do this:
		* on key press, loop through the menus
			* if shortcut matches
				* "call to action"
				* break


* Don't warn about saving saved files (Ctrl+S and then Ctrl+N)
* Do warn about losing unsaved files (close button, etc.)


* Use win98 default scrollbar size
* Minor color differences (0x808080 != 0x7b7b7b)

* Tips and Tricks from [this tutorial](http://www.albinoblacksheep.com/tutorial/mspaint)
	* Brush Scaling ✓
	* Custom Brushes ✓
	* The 'Stamp' Tool (Draw the selection on click, not just drag)
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
	* Make these all as (canvas)-> new Canvas?
		* rotated(canvas, degrees)?
		* flipped(canvas, vertical)?
		* skewed(canvas, skewX, skewY)?
		* inverted(canvas)?
		* cleared(canvas)???
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
	* right click with the eraser to selectively replace color1 with color2 (background)

* Fill Bucket
	* get into those corners!
	* handle transparency also
	* man, this fill algorithm is pretty bad
	* *find a better fill algorithm*

* Text tool
	* Save text and record transformations so it can be saved as an SVG with invisible selectable elements

* Strokes
	* Rectangle: The stroke is within the rectangle.
	* Rounded Rectangle / Ellipse: If the width/height is less than the stroke width, it draws the fillstroke.


### Colors
* Double-left-click a color to choose primary color. ✓
* Double-right-click to choose the secondary color. ✓
* Double-ctrl-click to choose the ternary color. ✓
* (not in mspaint) Double?-Click one of the selected colors to change it directly?

### Components / Windows
* Drag components into a window
* Drag windows
* Double-click a component window's titlebar to dock the component to its most recent location.


### BSOD

Press `/~ to bluescreen

As a prank, wait for next user input before fullscreening and bluescreening


### Chrome App

* Use the chrome.wallpaper API to change the ChromeOS wallpaper.
	* Code:

			chrome.wallpaper.setWallpaper({
				url: canvas.toDataURL(),
				layout: 'CENTER_CROPPED',
				name: file_name
			}, function(){});
	
	* I'd need to test this on Chrome OS

* Handle files: ✓
	* [Manifest - File Handlers](http://developer.chrome.com/apps/manifest/file_handlers)
	* [chrome.fileSystem](http://developer.chrome.com/apps/fileSystem)

* Minimum Window Size ✓

* Themed window border

* Publish to webstore!?!?!?
