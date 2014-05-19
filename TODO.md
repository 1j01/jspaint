
# Todo

* shut up about saving saved files (with Ctrl+N)
* warn about losing unsaved files
* scrollbar size
* minor color differences (0x808080 != 0x7b7b7b)

* Menus!

* Tips and Tricks from [this tutorial](http://www.albinoblacksheep.com/tutorial/mspaint)
	* Brush Scaling
	* Custom Brushes ✓
		* The 'Stamp' Tool (Draw the selection on click, not just drag)
	* Image Scaling (Ctrl+Plus and Ctrl+Minus on the Numpad to scale the selection by factors of 2)
	* Color Replacement (see [Tools](#Tools))
	* The Grid (Ctrl+G + zoom6x+)
	* Quick Undo ✓ (I also made it redoable, in case you do it by accident)
	* Scroll Wheel draws line down and to the right (let's maybe not implement this hm?)

### Extended editting

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
	* make these all as f(canvas)->new canvas?
		* rotated(canvas, degrees)?
		* flipped(canvas, vertical)?
		* skewed(canvas, skewX, skewY)?
		* inverted(canvas)?
		* cleared(canvas)???
* Undo/Redo History to Frames

### Tools
* OPTIONS
	* shapes all have their own settings for [fill | stroke | stroke_fill]
	* shapes, lines and curves use one setting for stroke width / line width
	* selection + free-form selection + text use one setting for [opaque/transparent]
	* secret 10x zoom by clicking the area just underneath the 8x zoom

* fill bucket and airbrush cursors are supposed to be inverty :\

* Shapes respond to Ctrl, by... It's complicated.
* Use stroke width

* Color Eraser: right click with the eraser to selectively replace color1 with color2
* Fill Bucket: get into those corners!
* Text tool: Save text and record transformations so it can be saved as html with invisible selectable elements

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
* ghosts should have no pointer-events


### BSOD
* press `/~ to blue-screen

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
