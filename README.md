
# [![](images/icons/32x32.png) JS Paint](https://jspaint.app)

A pixel-perfect web-based MS Paint remake and more... [Try it out!](https://jspaint.app)

JS Paint recreates every tool and menu of MS Paint, and even [little-known features](#did-you-know), to a high degree of fidelity.

It supports themes, additional file types, and accessibility features like Eye Gaze Mode and Speech Recognition.

![Screenshot](images/meta/main-screenshot.png)

Ah yes, good old Paint. Not the one with the [ribbons][]
or the [new skeuomorphic one][Fresh Paint] with the interface that can take up nearly half the screen.
(And not the even newer [Paint 3D][].)

[ribbons]: https://www.google.com/search?tbm=isch&q=MS+Paint+Windows+7+ribbons "Google Search: MS Paint Windows 7 ribbons"
[Fresh Paint]: https://www.google.com/search?tbm=isch&q=MS+Fresh+Paint "Google Search: MS Fresh Paint"
[Paint 3D]: https://www.microsoft.com/en-us/store/p/paint-3d-preview/9nblggh5fv99

Windows 95, 98, and XP were the golden years of Paint.
You had a tool box and a color box, a foreground color and a background color,
and that was all you needed.

Things were simple.

But we want to undo more than three actions.
We want to edit transparent images.
We can't just keep using the old Paint.

So that's why I'm making JS Paint.
I want to bring good old Paint into the modern era.


#### Current improvements include:

* Open source ([MIT licensed](LICENSE.txt))
* Cross-platform
* Mobile friendly
  * Touch support: use two fingers to pan the view, and pinch to zoom
  * Click/tap the selected colors area to swap the foreground and background colors
  * **View > Fullscreen** to toggle fullscreen mode, nice for small screens
* Web features
  * **File > Load From URL...** to open an image from the Web.
  * **File > Upload to Imgur** to upload the current image to Imgur.
  * **Paste** supports loading from URLs.
  * You can create links that will open an image from the Web in JS Paint. For example, this link will start with an isometric grid as a template: <https://jspaint.app/#load:https://i.imgur.com/zJMrWwb.png>
  * Rudimentary **multi-user** collaboration support.
    Start up a session at
    [jspaint.app/#session:multi-user-test](https://jspaint.app/#session:multi-user-test)
    and send the link to your friends!
    It isn't seamless; actions by other users interrupt what you're doing, and visa versa.
    Sessions are not private, and you may lose your work at any time.
    If you want better collaboration support, follow the development of [Mopaint](https://github.com/1j01/mopaint).
* **Extras > Themes** to change the look of the app. Dark mode included.
* [Eye Gaze Mode](https://jspaint.app/#eye-gaze-mode), for use with an eye tracker, head tracker, or other coarse input device, accessible from **Extras > Eye Gaze Mode**. With just a webcam, you can try it out with [Enable Viacam](https://eviacam.crea-si.com/) (head tracker) or [GazePointer](https://sourceforge.net/projects/gazepointer/) (eye tracker).
* [Speech Recognition Mode](https://jspaint.app/#speech-recognition-mode).
  Using your voice you can select tools and colors, pan the view ("scroll down and to the left", or "go southwest", etc.), explore the menus (but you can activate any menu item without opening the menus first), interact with windows (including scrolling the history view with "scroll up"/"scroll down" etc.), dictate text with the Text tool, and even tell the application to sketch things (for instance, "draw a house")
* Create an animated GIF from the current document history.
  Accessible from the Extras menu or with <kbd>Ctrl+Shift+G</kbd>.
  It's pretty nifty, you should try it out!
  You might want to limit the size of the image though.
* Load and save [many different palette formats](#color-palette-formats) with **Colors > Get Colors** and **Colors > Save Colors**.
  (I made a library for this: <img src="images/anypalette-logo-128x128.png" height="16"> [AnyPalette.js](https://github.com/1j01/anypalette.js).)
  * You can also drag and drop palette files into the app to load.

Editing Features:

* Use Alt+Mousewheel to zoom in and out
* Edit transparent images! To create a transparent image,
  go to **Image > Attributes...** and select Transparent,
  then OK, and then **Image > Clear Image** or use the Eraser tool.
  Images with *any* translucent pixels will open in Transparent mode.
* You can crop the image by making a selection while holding <kbd>Ctrl</kbd>
* Keyboard shortcuts for rotation: <kbd>Ctrl+.</kbd> and <kbd>Ctrl+,</kbd> (<kbd><</kbd> and <kbd>></kbd>)
* Rotate by any arbitrary angle in **Image > Flip/Rotate**
* In **Image > Stretch/Skew**, you can stretch more than 500% at once
* Zoom to an arbitrary scale in **View > Zoom > Custom...**
* Zoom to fit the canvas within the window with **View > Zoom > Zoom To Window**
* Non-contiguous fill: Replace a color in the entire image by holding <kbd>Shift</kbd> when using the fill tool

Miscellaneous Improvements:

* [Vertical Color Box mode](https://jspaint.app/#vertical-color-box-mode), accessible from **Extras > Vertical Color Box**
* You can use the Text tool at any zoom level (and it previews the exact pixels that will end up on the canvas).
* Spellcheck is available in the textbox if your browser supports it.
* Resize handles are easier to grab than in Windows 10's Paint.
* Omits some Thumbnail view bugs, like the selection showing in the wrong place.
* Unlimited undos/redos (as opposed to a measly 3 in Windows XP,
  or a measly 50 in Windows 7)
* Undo history is *nonlinear*, which means if you undo and do something other than redo, the redos aren't discarded. Instead, a new branch is created in the *history tree*. Jump to any point in history with **Edit > History** or <kbd>Ctrl+Shift+Y</kbd>
* Automatically keeps a backup of your image. Only one backup per image tho, which doesn't give you a lot of safety. Remember to save with **File > Save** or <kbd>Ctrl+S</kbd>! Manage backups with **File > Manage Storage**.

<!--
Half-features:

* When you do **Edit > Paste From...** you can select transparent images.
  ~~You can even paste a transparent animated GIF and then
  hold <kbd>Shift</kbd> while dragging the selection to
  smear it across the canvas *while it animates*!~~
  Update: This was [due to not-to-spec behavior in Chrome.](https://christianheilmann.com/2014/04/16/browser-inconsistencies-animated-gif-and-drawimage/)
  I may reimplement this in the future as I really liked this feature.
* You can open SVG files, though only as a bitmap.
  (Note: it may open super large, or tiny. There's no option to choose a size when opening.)
-->

![JS Paint drawing of JS Paint on a phone](images/meta/mobipaint.png)


#### Limitations:

A few things with the tools aren't done yet.
See [TODO.md](TODO.md#Tools)

Full clipboard support in the web app requires a browser supporting the [Async Clipboard API w/ Images](https://developers.google.com/web/updates/2019/07/image-support-for-async-clipboard), namely Chrome 76+ at the time of writing.

In other browsers you can still can copy with <kbd>Ctrl+C</kbd>, cut with <kbd>Ctrl+X</kbd>, and paste with <kbd>Ctrl+V</kbd>,
but data copied from JS Paint can only be pasted into other instances of JS Paint.
External images can be pasted in.


## Supported File Formats

### Image Formats

⚠️ Saving as JPEG will introduce artifacts that cause problems when using the Fill tool or transparent selections.

⚠️ Saving in some formats will reduce the number of colors in the image.

💡 Unlike in MS Paint, you can use **Edit > Undo** to revert color or quality reduction from saving.
This doesn't undo saving the file, but allows you to then save in a different format with higher quality, using **File > Save As**.

💡 Saving as PNG is recommended as it gives small file sizes while retaining full quality.

| File Extension                | Name                          | Read | Write | Read Palette | Write Palette |
|-------------------------------|-------------------------------|:----:|:-----:|:------------:|:-------------:|
| .png                          | [PNG][]                       |  ✅  |  ✅   |      🔜      |               |
| .bmp, .dib                    | [Monochrome Bitmap][BMP]      |  ✅  |  ✅   |      🔜      |      ✅       |
| .bmp, .dib                    | [16 Color Bitmap][BMP]        |  ✅  |  ✅   |      🔜      |      ✅       |
| .bmp, .dib                    | [256 Color Bitmap][BMP]       |  ✅  |  ✅   |      🔜      |      ✅       |
| .bmp, .dib                    | [24-bit Bitmap][BMP]          |  ✅  |  ✅   |      N/A     |      N/A      |
| .tif, .tiff, .dng, .cr2, .nef | [TIFF][] (loads first page)   |  ✅  |  ✅   |              |               |
| .pdf                          | [PDF][] (loads first page)    |  ✅  |       |              |               |
| .webp                         | [WebP][]                      |  🌐  |  🌐   |              |               |
| .gif                          | [GIF][]                       |  🌐  |  🌐   |              |               |
| .jpeg, .jpg                   | [JPEG][]                      |  🌐  |  🌐   |      N/A     |      N/A      |
| .svg                          | [SVG][] (only default size)   |  🌐  |       |              |               |
| .ico                          | [ICO][] (only default size)   |  🌐  |       |              |               |

Capabilities marked with 🌐 are currently left up to the browser to support or not.
If "Write" is marked with 🌐, the format will appear in the file type dropdown but may not work when you try to save.
For opening files, see Wikipedia's [browser image format support table][] for more information.

Capabilities marked with 🔜 are coming soon, and N/A of course means not applicable.

"Read Palette" refers to loading the colors into the Colors box automatically (from an [indexed color][] image),
and "Write Palette" refers to writing an [indexed color][] image.

[PNG]: https://en.wikipedia.org/wiki/Portable_Network_Graphics
[BMP]: https://en.wikipedia.org/wiki/BMP_file_format
[TIFF]: https://en.wikipedia.org/wiki/TIFF
[PDF]: https://en.wikipedia.org/wiki/PDF
[WebP]: https://en.wikipedia.org/wiki/WebP
[GIF]: https://en.wikipedia.org/wiki/GIF
[JPEG]: https://en.wikipedia.org/wiki/JPEG
[SVG]: https://en.wikipedia.org/wiki/Scalable_Vector_Graphics
[ICO]: https://en.wikipedia.org/wiki/ICO_(file_format)
[indexed color]: https://en.wikipedia.org/wiki/Indexed_color
[browser image format support table]: https://en.wikipedia.org/wiki/Comparison_of_web_browsers#Image_format_support


### Color Palette Formats

With **Colors > Save Colors** and **Colors > Get Colors** you can save and load colors
in many different formats, for compatibility with a wide range of programs.

If you want to add extensive palette support to another application, I've made this functionality available as a library:
<img src="images/anypalette-logo-128x128.png" height="16"> [AnyPalette.js](https://github.com/1j01/anypalette.js)

| File Extension    | Name                              | Programs                                                                          |   Read  |  Write  |
|-------------------|-----------------------------------|-----------------------------------------------------------------------------------|:-------:|:-------:|
| .pal              | [RIFF] Palette                    | [MS Paint] for Windows 95 and Windows NT 4.0                                      |   ✅   |   ✅    |
| .gpl              | [GIMP][Gimp] Palette              | [Gimp], [Inkscape], [Krita], [KolourPaint], [Scribus], [CinePaint], [MyPaint]     |   ✅   |   ✅    |
| .aco              | Adobe Color Swatch                | Adobe [Photoshop]                                                                 |   ✅   |   ✅    |
| .ase              | Adobe Swatch Exchange             | Adobe [Photoshop], [InDesign], and [Illustrator]                                  |   ✅   |   ✅    |
| .txt              | [Paint.NET] Palette               | [Paint.NET]                                                                       |   ✅   |   ✅    |
| .act              | Adobe Color Table                 | Adobe [Photoshop] and [Illustrator]                                               |   ✅   |   ✅    |
| .pal, .psppalette | [Paint Shop Pro] Palette          | [Paint Shop Pro] (Jasc Software / Corel)                                          |   ✅   |   ✅    |
| .hpl              | [Homesite] Palette                | Allaire [Homesite] / Macromedia [ColdFusion]                                      |   ✅   |   ✅    |
| .cs               | ColorSchemer                      | ColorSchemer Studio                                                               |   ✅   |         |
| .pal              | [StarCraft] Palette               | [StarCraft]                                                                       |   ✅   |   ✅    |
| .wpe              | [StarCraft] Terrain Palette       | [StarCraft]                                                                       |   ✅   |   ✅    |
| .sketchpalette    | [Sketch] Palette                  | [Sketch]                                                                          |   ✅   |   ✅    |
| .spl              | [Skencil] Palette                 | [Skencil] (formerly called Sketch)                                                |   ✅   |   ✅    |
| .soc              | StarOffice Colors                 | [StarOffice], [OpenOffice], [LibreOffice]                                         |   ✅   |   ✅    |
| .colors           | KolourPaint Color Collection      | [KolourPaint]                                                                     |   ✅   |   ✅    |
| .colors           | Plasma Desktop Color Scheme       | [KDE] Plasma Desktop                                                              |   ✅   |         |
| .theme            | Windows Theme                     | [Windows] Desktop                                                                 |   ✅   |         |
| .themepack        | Windows Theme                     | [Windows] Desktop                                                                 |   ✅   |         |
| .css, .scss, .styl| Cascading StyleSheets             | Web browsers / web pages                                                          |   ✅   |   ✅    |
| .html, .svg, .js  | any text files with CSS colors    | Web browsers / web pages                                                          |   ✅   |         |

[RIFF]: https://en.wikipedia.org/wiki/Resource_Interchange_File_Format
[MS Paint]: https://en.wikipedia.org/wiki/Microsoft_Paint
[Paint.NET]: https://www.getpaint.net/
[Paint Shop Pro]: https://www.paintshoppro.com/en/
[StarCraft]: https://en.wikipedia.org/wiki/StarCraft
[Homesite]: https://en.wikipedia.org/wiki/Macromedia_HomeSite
[ColdFusion]: https://en.wikipedia.org/wiki/Adobe_ColdFusion
[StarOffice]: https://en.wikipedia.org/wiki/StarOffice
[OpenOffice]: https://www.openoffice.org/
[LibreOffice]: https://www.libreoffice.org/
[Sketch]: https://www.sketchapp.com/
[Skencil]: https://skencil.org/
[Photoshop]: https://www.adobe.com/products/photoshop.html
[InDesign]: https://www.adobe.com/products/indesign.html
[Illustrator]: https://www.adobe.com/products/illustrator.html
[Gimp]: https://www.gimp.org/
[Inkscape]: https://inkscape.org/en/
[Krita]: https://www.calligra.org/krita/
[KolourPaint]: http://kolourpaint.org/
[KDE]: https://kde.org/
[Windows]: https://en.wikipedia.org/wiki/Microsoft_Windows
[Scribus]: https://www.scribus.net/
[CinePaint]: http://www.cinepaint.org/
[MyPaint]: http://mypaint.org/


## Did you know?

* There's a black and white mode with *patterns* instead of colors in the palette,
  which you can get to from **Image > Attributes...**

* You can drag the color box and tool box around if you grab them by the right place.
  You can even drag them out into little windows.
  You can dock the windows back to the side by double-clicking on their title bars.

* In addition to the left-click foreground color and the right-click background color,
  there's a third color you can access by holding <kbd>Ctrl</kbd> while you draw.
  It starts out with no color so you'll need to hold <kbd>Ctrl</kbd> and select a color first.
  The fancy thing about this color slot is you can
  press and release <kbd>Ctrl</kbd> to switch colors *while drawing*.

* You can apply image transformations like Flip/Rotate, Stretch/Skew or Invert (in the Image menu) either to the whole image or to a selection.
  Try scribbling with the Free-Form Select tool and then doing **Image > Invert**

* These Tips and Tricks from [a tutorial for MS Paint](https://www.albinoblacksheep.com/tutorial/mspaint)
  also work in JS Paint:

	* [x] Brush Scaling (<kbd>+</kbd> & <kbd>-</kbd> on the number pad to adjust brush size)
	* [x] "Custom Brushes" (hold <kbd>Shift</kbd> and drag the selection to smear it)
	* [x] The 'Stamp' "Tool" (hold <kbd>Shift</kbd> and click the selection to stamp it)
	* [x] Image Scaling (<kbd>+</kbd> & <kbd>-</kbd> on the number pad to scale the selection by factors of 2)
	* [x] Color Replacement (right mouse button with Eraser to selectively replace the foreground color with the background color)
	* [x] The Grid (<kbd>Ctrl+G</kbd> & Zoom to 4x+)
	* [x] Quick Undo (Pressing a second mouse button cancels the action you were performing.
	      I also made it redoable, in case you do it by accident!)
	* [ ] Scroll Wheel Bug (Hmm, let's maybe not recreate this?)


## Desktop App

JS Paint can be installed as a PWA, altho it doesn't work offline.

(Also I built it into a desktop app with [Electron][] and [Electron Forge][], but this will use unnecessary system resources and is not recommended. You can follow [this issue](https://github.com/1j01/jspaint/issues/2) for the first release.)

[Electron]: https://electronjs.org/
[Electron Forge]: https://electronforge.io/


## Development Setup

[Clone the repo.](https://help.github.com/articles/cloning-a-repository/)

Install [Node.js][] if you don't have it, then open up a command prompt / terminal in the project directory.

### Testing

Run `npm run lint` to check for code problems.

Run `npm test` to run browser-based tests with Cypress. (It's slow to start up and run tests, unfortunately.)

Run `npm run accept` to accept any visual changes.
This unfortunately re-runs all the tests, rather than accepting results of the previous test, so you could end up with different results than the previous test.
If you use [GitHub Desktop](https://desktop.github.com/), you can view diffs of images, in four different modes.

To open the Cypress UI, first run `npm run test:start-server`, then concurrently `npm run cy:open`

Tests are also run in continuous integration [with Travis CI](https://travis-ci.org/1j01/jspaint).

### Web App (https://jspaint.app)

After you've installed dependencies with `npm i`,
use `npm run dev` to start a live-reloading server.

Make sure any layout-important styles go in `layout.css`.
When updating `layout.css`, a right-to-left version of the stylesheet is generated, using [RTLCSS](https://rtlcss.com/).  
You should test the RTL layout by changing the language to Arabic or Hebrew.
Go to **Extras > Language > العربية** or **עברית**.  
See [Control Directives](https://rtlcss.com/learn/usage-guide/control-directives/) for how to control the RTL layout.

### Desktop App (Electron)

This is basically ready for release, but as of yet unreleased.

- Install dependencies with `npm i`
- Start the electron app with `npm run electron:start`

[electron-debug][] is included, so you can use <kbd>F5</kbd>/<kbd>Ctrl+R</kbd> to reload and <kbd>F12</kbd>/<kbd>Ctrl+Shift+I</kbd> to open the devtools.

You can build for production with `npm run electron:make`

[Live Server]: https://github.com/1j01/live-server
[Node.js]: https://nodejs.org/
[electron-debug]: https://github.com/sindresorhus/electron-debug

## Deployment

JS Paint can be deployed using a regular web server.

Nothing needs to be compiled.

## Embed in your website

### Simple

Add this to your HTML:

```html
<iframe src="https://jspaint.app" width="100%" height="100%"></iframe>
```

#### Start with an image

You can have it load an image from a URL by adding `#load:<URL>` to the URL.

```html
<iframe src="https://jspaint.app#load:https://jspaint.app/favicon.ico" width="100%" height="100%"></iframe>
```

### Advanced

If you want to control JS Paint, how it saves/loads files, or access the canvas directly,
there is an unstable API.

First you need to [clone the repo](https://help.github.com/articles/cloning-a-repository/),
so you can point an `iframe` to your local copy.

The local copy of JS Paint has to be hosted on the same web server as the containing page, or more specifically, it has to share the [same origin](https://en.wikipedia.org/wiki/Same-origin_policy).

Having a local copy also means things won't break any time the API changes.

If JS Paint is cloned to a folder called `jspaint`, which lives in the same folder as the page you want to embed it in, you can use this:

```html
<iframe src="jspaint/index.html" id="jspaint-iframe" width="100%" height="100%"></iframe>
```

If it lives somewhere else, you may need to add `../` to the start of the path, to go up a level. For example, `src="../../apps/jspaint/index.html"`.
You can also use an absolute URL, like `src="https://example.com/cool-apps/jspaint/index.html"`.

#### Changing how files are saved/loaded

You can override the file saving and opening dialogs
with JS Paint's `systemHooks` API.

```html
<script>
var iframe = document.getElementById('jspaint-iframe');
var jspaint = iframe.contentWindow;
// Wait for systemHooks to exist (the iframe needs to load)
waitUntil(()=> contentWindow.systemHooks, 500, ()=> {
	jspaint.systemHooks.showSaveFileDialog = async ({ formats, defaultFileName, defaultPath, defaultFileFormatID, getBlob, savedCallbackUnreliable, dialogTitle }) => { ... };
	jspaint.systemHooks.showOpenFileDialog = async ({ formats }) => { ... };
	jspaint.systemHooks.writeBlobToHandle = async (save_file_handle, blob) => { ... };
	jspaint.systemHooks.readBlobFromHandle = async (file_handle) => { ... };
});
// General function to wait for a condition to be met, checking at regular intervals
function waitUntil(test, interval, callback) {
	if (test()) {
		callback();
	} else {
		setTimeout(waitUntil, interval, test, interval, callback);
	}
}
</script>
```

A file handle is anything that can identify a file.
You get to own this concept, and define how to identify files.
It could be anything from an index into an array, to a Dropbox file ID, to an IPFS URL, to a file path.
It can be any type, or maybe it needs to be a string, I forget.

Once you have a concept of a file handle, you can implement file pickers using the system hooks, and functions to read and write files.

| Command | Hooks Used |
| ------- | ---------- |
| **File > Save As** | `systemHooks.showSaveFileDialog`, then when a file is picked, `systemHooks.writeBlobToHandle` |
| **File > Open** | `systemHooks.showOpenFileDialog`, then when a file is picked, `systemHooks.readBlobFromHandle` |
| **File > Save** | `systemHooks.writeBlobToHandle` (or same as **File > Save As** if there's no file open yet) |
| **Edit > Copy To** | `systemHooks.showSaveFileDialog`, then when a file is picked, `systemHooks.writeBlobToHandle` |
| **Edit > Paste From** | `systemHooks.showOpenFileDialog`, then when a file is picked, `systemHooks.readBlobFromHandle` |

These system hooks will be documented soon.

#### Loading a file initially

To start the app with a file loaded for editing,
wait for the app to load, then call `systemHooks.readBlobFromHandle` with a file handle, and tell the app to load that file blob.

```js
const file_handle = "initial-file-to-load";
systemHooks.readBlobFromHandle(file_handle).then(file => {
	if (file) {
		contentWindow.open_from_file(file, file_handle);
	}
}, (error) => {
	// Note: in some cases, this handler may not be called, and instead an error message is shown by readBlobFromHandle directly.
	contentWindow.show_error_message(`Failed to open file ${file_handle}`, error);
});
```

This is clumsy, and in the future there may be a query string parameter to load an initial file by its handle.
(Note to self: it will need to wait for your system hooks to be registered, somehow.)

There's already a query string parameter to load from a URL:

```html
<iframe src="https://jspaint.app?load:SOME_URL_HERE"></iframe>
```

But this won't set up the file handle for saving.


#### Integrating Set as Wallpaper

You can define two functions to set the wallpaper, which will be used by **File > Set As Wallpaper (Tiled)** and **File > Set As Wallpaper (Centered)**.

```js
jspaint.systemHooks.setWallpaperTiled = (canvas) => { ... };
jspaint.systemHooks.setWallpaperCentered = (canvas) => { ... };
```

If you define only `setWallpaperCentered`, JS Paint will attempt to guess your screen's dimensions and tile the image, applying it by calling your `setWallpaperCentered` function.

Here's a full example supporting a persistent custom wallpaper as a background on the containing page:

```js
const wallpaper = document.querySelector('body'); // or some other element

jspaint.systemHooks.setWallpaperCentered = (canvas) => {
	canvas.toBlob((blob) => {
		setDesktopWallpaper(blob, "no-repeat", true);
	});
},
jspaint.systemHooks.setWallpaperTiled = (canvas) => {
	canvas.toBlob((blob) => {
		setDesktopWallpaper(blob, "repeat", true);
	});
},

function setDesktopWallpaper(file, repeat, saveToLocalStorage) {
	const blob_url = URL.createObjectURL(file);
	wallpaper.style.backgroundImage = `url(${blob_url})`;
	wallpaper.style.backgroundRepeat = repeat;
	wallpaper.style.backgroundPosition = "center";
	wallpaper.style.backgroundSize = "auto";
	if (saveToLocalStorage) {
		const fr = new FileReader();
		fr.onload = () => {
			localStorage.setItem("wallpaper-data-url", fr.result);
			localStorage.setItem("wallpaper-repeat", repeat);
		};
		fr.onerror = () => {
			console.error("Error reading file (for setting wallpaper)", file);
		};
		fr.readAsDataURL(file);
	}
}
try {
	const wallpaper_data_url = localStorage.getItem("wallpaper-data-url");
	const wallpaper_repeat = localStorage.getItem("wallpaper-repeat");
	if (wallpaper_data_url) {
		fetch(wallpaper_data_url).then(response => response.blob()).then(file => {
			setDesktopWallpaper(file, wallpaper_repeat, false);
		});
	}
} catch (error) {
	console.error(error);
}
```

It's a little bit recursive, sorry; it could probably be done simpler.
Like by just using data URLs. (Actually, I think I wanted to use blob URLs just so that it doesn't bloat the DOM inspector with a super long URL. Which is really a devtools UX bug. Maybe they've improved this?)

#### Specifying the canvas size

You can load a file that has the desired dimensions.
There's no special API for this at the moment.

#### Specifying the theme

You could change the theme programmatically:

```js
var iframe = document.getElementById('jspaint-iframe');
var jspaint = iframe.contentWindow;
jspaint.set_theme("modern.css");
```
but this will break the user preference.

The **Extras > Themes** menu will still work, but the preference won't persist when reloading the page.

In the future there may be a query string parameter to specify the default theme. You could also fork jspaint to change the default theme.

#### Specifying the language

Similar to the theme, you can try to change the language programmatically:

```js
var iframe = document.getElementById('jspaint-iframe');
var jspaint = iframe.contentWindow;
jspaint.set_language("ar");
```
but this will actually **ask the user to reload the application** to change languages.

The **Extras > Language** menu will still work, but the user will be bothered to change the language every time they reload the page.

In the future there may be a query string parameter to specify the default language. You could also fork jspaint to change the default language.

#### Adding custom menus

Not supported yet.
You could fork jspaint and add your own menus.

#### Accessing the canvas directly

With access to the canvas, you can implement a live preview of your drawing, for example updating a texture in a game engine in realtime.

```js
var iframe = document.getElementById('jspaint-iframe');
// contentDocument here refers to the webpage loaded in the iframe, not the image document loaded in jspaint.
// We're just reaching inside the iframe to get the canvas.
var canvas = iframe.contentDocument.querySelector(".main-canvas");
```

It's recommended not to use this for loading a document, as it won't change the document title, or reset undo/redo history, among other things.

#### Performing custom actions

If you want to make buttons or other UI to do things to the document, you should (probably) make it undoable.
It's very easy, just wrap your action in a call to `undoable()`.

```js
var iframe = document.getElementById('jspaint-iframe');
var jspaint = iframe.contentWindow;
var icon = new Image();
icon.src = "some-folder/some-image-15x11-pixels.png";
jspaint.undoable({
	name: "",
	icon: icon, // optional
}, function() {
	// do something to the canvas
});
```

#### Changelog

The API will change a lot, but changes will be documented in the [Changelog](CHANGELOG.md).

Not just a history of changes, but a migration/upgrading guide. <!-- These are some Ctrl+F keywords. -->

For general project news, click **Extras > Project News** in the app.

## License

JS Paint is free and open source software, licensed under the permissive [MIT license](https://opensource.org/licenses/MIT).

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Repo stars](https://img.shields.io/github/stars/1j01/jspaint?label=GitHub%20Stars&style=social)](https://github.com/1j01/jspaint/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/1j01/jspaint?style=social)](https://github.com/1j01/jspaint/network/members)

