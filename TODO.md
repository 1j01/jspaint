
# ![](images/icons/32x32.png) JS Paint Todo

### Help

* Link-esque things
	* Popups (I'd probably make the text within the popups selectable)
	* Related topics (I'd probably make this a heading with links instead of the weird context menu thing)
* Add topics
	* In "Tips and Tricks" (which is just a lame section)
	* Transparency
	* Multi-user / collaboration / "To share the document On-Line" or whatever
* Index
* Search
* Keyboard support

* Interactive tutorials?
	* Possibly hosted by Clippy, with [ClippyJS](https://www.smore.com/clippy-js)
	* Links the cat has a good "GetArtsy" animation, which would be good to use especially if talking about stamping and smearing selections
	* Highlight elements on the page
	* Be sure to cover undo/redo, and file saving

### Visual

* Fill bucket and airbrush cursors are supposed to invert the background in parts
* Custom cursors in Edge; apparently they require `.cur` files? ugh

### Extended editing

* Optional fill tolerance (slider that you enable from a settings menu?)

* Transparency
	* Color opacity slider
	* Toggle between blend and copy (overwrite) modes
	* Maybe equivalize any rgba(X, X, X, 0) in fill algorithm?
	There'd still be the possibility of 1/255th opacity pixels,
	but if you're creating colors from the combination of a color picker and an opacity slider,
	you might naturally introduce differing zero-opacity color values a lot.

* Documents with multiple sub-images
	* Component to switch between sub-images
	* Deal with undo/redo for sub-images
	* Animated GIFs
		* Transparency ([jnordberg/gif.js issue #5](https://github.com/jnordberg/gif.js/issues/5))
	* Animated Transparent APNGs
		* APNG Library: [UPNG.js](https://github.com/photopea/UPNG.js/)
	* Multi-size Icons
		* Windows ICO ([jBinary can read](https://jdataview.github.io/jBinary.Repo/demo/#ico) and presumably write ICO files)
		* Mac ICNS
	* Layered images?
		* Photoshop PSD ([via psd.js](https://github.com/trevorlinton/psd.js))
		* OpenRaster ORA ([via ora.js](https://github.com/zsgalusz/ora.js/tree/master))
	* Paged Images?
		* PDF (via [pdf.js](https://github.com/mozilla/pdf.js)) (single page already supported)
		* DjVu (via [djvu.js](https://djvu.js.org/))
		* TIFF (via [utif.js](https://github.com/photopea/UTIF.js/)) (single page/frame already supported)

* Online (multi-user) and local (single-user) sessions
	* See [sessions.js](src/sessions.js)
	* Issues
		* There's no conflict resolution; user edits revert other user edits
		* It's not eventually consistent
		* Cursors from other users that go outside the parent can cause the page to be scrollable

* Symmetry, tesselation, painting texture on 3D models, and even an infinite canvas, all could be done with a shared system 
	* For symmetry and tesselation, [geometry can be generated](), and then it can work the same as painting on a 3D model
	* An infinite canvas engine would generate simple square geometry, but would require support for multiple editable textures (also useful for 3D models)
		* And of course layers and animations and multi-size icons need a similar system (multiple sub-images)
	* For 3D model painting, it's important to note there's a few different possible approaches.
		1. UV-dynamic, like [Chameleon](https://www-ui.is.s.u-tokyo.ac.jp/~takeo/chameleon/chameleon.htm) & [Chameleon.js](https://tomtung.github.io/chameleon.js/) (can adapt texture resolution as you paint)
		2. UV-static
			1. Ray tracing the pointer to find texture coordinates (gives texture coordinate space scaled result by default)
			2. Screen-space drawing (gives screen space scaled result by default); I saw a good medium post or two about this
	* Also, some approaches might not extend to tesselation and symmetry. ["Very important, this means that we assume our uv has no overlapping triangles. So no \[tileable\] textures."](https://shahriyarshahrabi.medium.com/mesh-texture-painting-in-unity-using-shaders-8eb7fc31221c)
	* Existing 3D texturing systems:
		* Closed source project: https://discourse.threejs.org/t/a-fully-fledged-texture-painter-for-the-web/15678/16
		* Open source project with adaptive UVs: https://tomtung.github.io/chameleon.js/
		* Open source project with adaptive and static UV modes, for both painting and sculpting: https://github.com/stephomi/sculptgl (check Dynamic Topology > Activated)

* Save text and record transformations so the image can be saved as
SVG (or HTML?) with invisible selectable transformed text elements?
	* Every time you move a selection, duplicate the text and create a clip-path for both parts?
		* Make only one of them audible for screen-readers


### Device support

* Prevent text selection in buttons and history entries
* Enlarge menus on touch devices
* Enlarge window titlebar close buttons on touch devices
* Magnifier: on touchscreens, wait until pointerup to zoom
	* To detect touchscreen usage, could keep track of whether the last pointermove had any buttons pressed... or use `pointerType`, right?
* Alternative way to access "Color Eraser" feature without a secondary mouse button?
* Alternative access to functionality that would normally require a keyboard (with a numpad!)
	* Numpad +/-: Increase/Decrease brush size, Double/Halve selection size, ...
	* Shift (toggles; rename contextually?):
		* Proportional Resize
		* Smear / Trail Selection
		* Snap to 8 directions
			* An isometric mode would also be good
	* Ctrl+Select: Crop tool or "Crop to selection" option
* Don't drag toolbars out into windows with touch
	* Unless with two fingers perhaps
		* I might want to use multitouch on the tool buttons for MultiTools tho...

### Tools

* Select and Free-Form Select
	* Passive: create no undoables until you do something like move or invert the selection
		* You should be able to make a selection, then change the secondary color, then drag the selection cutting it out with the color you selected
		* Select and deselect with no actions in between should create no undoables
	* Proportionally resize selection while holding Shift
		* (or maybe by default? I feel like it should be the default, tbh.)


* Text
	* If it would go over the edge of the canvas, reject the input (at least, that's what mspaint does)
	* Add padding left to text area when font has glyphs that extend left, like italic 'f' in Times New Roman
		* mspaint has access to font metrics
		* jspaint could render text to see when it would overflow
			* To do it efficiently,
				* Take all glyphs in the text
					* (And maybe a set of common letters like the alphabet)
					* Split with a library to handle Unicode (emojis etc.)
				* Uniquify
				* Place them *all on top of each other*, positioned absolutely, leaving room to the left of them to detect pixels
				* Scan the pixels at the left to find the maximum extent left
				* Could store, per font, what glyphs have been tested and what's the maximum extent detected, in order to not have to rerender these
					* "What glyphs have been tested" should be specific to font size and attributes, since an italic 'f' may extend more than a normal 'f' for instance
	* Store position of FontBox


* Shape Styles
	* Shapes: respond to Ctrl (It's complicated)
	* Patterns (black and white mode, winter theme)
		* Check to make sure patterns are aligned properly for all the tools
		* There's supposed to be a mapping between color values and pattern fills, used by the text tool and for the palette when switching between modes (colors should be kept between going to black and white mode and back)


### Desktop App (Electron)

* Create a landing page / home page for the desktop app (similar to https://desktop.webamp.org/ or https://desktop.github.com/) - (perhaps https://desktop.jspaint.app/) - and/or for JS Paint in general (perhaps https://jspaint.app/about/)

Electron boilerplate stuff:

* Remember window position/state
* Set up autoupdating
* Keep window hidden until loaded (`show: false`, [`ready-to-show`](https://electronjs.org/docs/api/browser-window#event-ready-to-show))

Security:

* context isolation
* disable multiplayer???????????? should be fine

Functionality:

* Subwindows as separate windows
* Document recovery without having to know about File > Manage Storage - pop up contextually with a dialog when you need it
* Show link URLs when you hover over them, in the status bar (because we have a status bar! haha) (there's this API: [event: update-target-url](https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-update-target-url), which gave me the idea, or it could be implemented with mouse events)
* Recent files (could also be implemented for 98.js.org in the future)
* macOS:
	* `open-file` event
	* `win.setSheetOffset` with the menu bar height
	* test `setRepresentedFilename`, `setDocumentEdited`
* Windows: maybe handle `session-end` event and ask to save?
* Detect if file changes on disk, ask if you want to reload it?

### Also

* Anything marked `@TODO` or `@FIXME` in the source code


* See [Issues on GitHub](https://github.com/1j01/jspaint/issues)


* CSS
	* DRY, especially button styles, with [os-gui](https://github.com/1j01/os-gui)
	* Clearer `z-index` handling, maybe with CSS variables?


* JS
	* Organize things into files better; "functions.js" is like ONE step above saying "code.js"
	* `$ToolWindow` has a `$Button` facility; `$DialogWindow` overrides it with essentially a better one; now there's `showMessageBox` too! and `$ToolWindow` is a wrapper for OS-GUI's `$Window`, and should be removed at some point; btw, should `show_error_message` functionality be folded into `showMessageBox`?
	* Make code clearer / improve code quality
		* https://codeclimate.com/github/1j01/jspaint


* Images
	* Use a shared sprite sheet per theme (and optimize it I guess)
