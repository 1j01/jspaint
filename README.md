
# [![](images/icons/32.png) JS Paint](https://jspaint.app)

A nice web-based MS Paint remake and more... [Try it out!](https://jspaint.app)

<!-- TODO: You can also run it as a [desktop app...](#desktop-app) -->


The goal is to remake MS Paint
(including its [little-known features](#did-you-know)),
improve on it, and to [extend](#extended-editing) the types of images it can edit.
So far, it does this pretty well.

![Screenshot](images/meta/main-screenshot.png)

Ah yes, good old paint. Not the one with the [ribbons][]
or the [new skeuomorphic one][Fresh Paint] with the interface that can take up nearly half the screen.
And sorry, not the even newer [Paint 3D][].

[ribbons]: https://www.google.com/search?tbm=isch&q=MS+Paint+Windows+7+ribbons "Google Search: MS Paint Windows 7 ribbons"
[Fresh Paint]: https://www.google.com/search?tbm=isch&q=MS+Fresh+Paint "Google Search: MS Fresh Paint"
[Paint 3D]: https://www.microsoft.com/en-us/store/p/paint-3d-preview/9nblggh5fv99

Windows 95, 98, and XP were the golden years of paint.
You had a tool box and a color box, a foreground color and a background color,
and that was all you needed.

Things were simple.

But we want to undo more than three actions.
We want to edit transparent images.
We can't just keep using the old paint.

So that's why I'm making JS Paint.
I want to bring good old paint into the modern era.


#### Current improvements include:

* Cross-platform
* Unlimited undos/redos (as opposed to a measly 3 in Windows XP,
  or a measly 50 in Windows 7)
* Autosaves if you allow local storage.
  (Try refreshing the page to make sure this works, and to check it out)
* Edit transparent images! To create a transparent image,
  go to **Image > Attributes...** and select Transparent,
  then Okay, and then **Image > Clear Image** or use the Eraser tool.
  Images with *any* transparent pixels will open in Transparent mode.
* Go to **View > Extras Menu** to enable access to additional features not available in MS Paint
* Switch themes from the Extras menu
* Create an animated GIF from the current document history.
  Accessible from the Extras menu or with <kbd>Ctrl+Shift+G</kbd>.
  It's pretty nifty, you should try it out!
  You might want to limit the size of the image though.
* You can shoot at it [Asteroids style](https://kickassapp.com/)
* When you do **Edit > Paste From...** you can select transparent images and GIFs.
  ~~You can even paste a transparent animated GIF and then
  hold <kbd>Shift</kbd> while dragging the selection to
  smear it across the canvas *while it animates*!~~
  Update: This was [due to not-to-spec behavior in Chrome.](https://christianheilmann.com/2014/04/16/browser-inconsistencies-animated-gif-and-drawimage/)
  I may reimplement this in the future as I really liked this feature.
* You can open SVG files (because browsers support SVG).
  It's still a completely raster image editor though.
* You can crop the image by making a selection while holding <kbd>Ctrl</kbd>
* Keyboard shortcuts for rotation: <kbd>Ctrl+.</kbd> and <kbd>Ctrl+,</kbd> (<kbd><</kbd> and <kbd>></kbd>)
* Rotate by any arbitrary angle in **Image > Flip/Rotate**
* In **Image > Stretch/Skew**, you can stretch more than 500% at once
* Replace a color in the entire image by holding <kbd>Shift</kbd> and using the fill tool (AKA non-contiguous fill)
* Rudimentary **multi-user** support.
  Start up a session at
  [jspaint.app/#session:multi-user-test](https://jspaint.app/#session:multi-user-test)
  and send the link to your friends!
  It isn't seamless; actions by other users interrupt what you're doing, and visa versa.
  Sessions are not private, and you may lose your work at any time.
  If you want better collaboration support, follow the development of [Mopaint](https://github.com/1j01/mopaint).
* Load many different palette formats with **Colors > Get Colors**.
  (I made a [library](https://github.com/1j01/palette.js/) for this.)
* Mobile support
* Click/tap the selected colors area to swap the foreground and background colors

![JS Paint drawing of JS Paint on a phone](images/meta/mobipaint.png)


#### Possible future improvements:

* [Extended Editing](#extended-editing)
* Proportionally resize the selection or canvas by holding <kbd>Shift</kbd>
  (or maybe that should be the default, really!)
* <kbd>Alt</kbd> as a shortcut for the eyedropper, as long as it doesn't conflict with keyboard navigation of menus
* Optional fill tolerance (slider that you enable from a settings menu?)
* Interactive tutorial(s)?


#### Limitations:

A lot of stuff isn't done yet.
See: [the big long todo list.](TODO.md)

Clipboard support is somewhat limited (in the web app).
You can copy with <kbd>Ctrl+C</kbd>, cut with <kbd>Ctrl+X</kbd>, and paste with <kbd>Ctrl+V</kbd>,
but data copied from JS Paint can only be pasted into other instances of JS Paint.
There's no way for web apps to properly copy image data to the clipboard yet.
"[Support programmatical copying of images to clipboard](https://bugs.chromium.org/p/chromium/issues/detail?id=150835)"
is currently the top starred issue of chromium.

For full clipboard support, you need to install the [desktop app](#desktop-app).


## Extended Editing

I want to make JS Paint to be able to edit...

* Transparent [PNG][]s - Done!
  Images that are partially transparent will automatically open in Transparent mode.
  To enable transparency for an image, go to **Image > Attributes...** or press <kbd>Ctrl+E</kbd>,
  select Transparent, and hit Okay.
  Then you'll want to remove some of the background.
  You can use the Eraser tool a bit, then use the Color Picker to
  pick up where you erased and then use the Fill tool to remove bigger areas.
* Animated [GIF][]s
  (yes, that entails a fully featured (but simple) animation editor). -
  Currently you can only make GIFs of the document *history*,
  with <kbd>Ctrl+Shift+G</kbd> or from the Extras menu.
* Animated Transparent [APNG][]s
  (better than GIFs, but with less support)
* Multi-size Icons ([ICO][] for windows and [ICNS][] for mac)
* [Scalable Vector Graphics][SVG] (kidding) -
  Actually, it could always open SVG files in browsers that can handle SVGs,
  and I've made it try not to save over the original SVG.
  That's pretty decent SVG support for a 100% raster image editor.
* [Text files][TXT] (definitely just kidding maybe)
* Tesselating patterns, and textures on 3D models;
  that might be a pipe dream, but [then again...](https://github.com/1j01/pipes) [hm...](https://github.com/1j01/mopaint)


[PNG]: https://en.wikipedia.org/wiki/Portable_Network_Graphics "Portable Network Graphics"
[GIF]: https://en.wikipedia.org/wiki/Graphics_Interchange_Format "Graphics Interchange Format"
[APNG]: https://en.wikipedia.org/wiki/APNG "Animated Portable Network Graphics"
[ICO]: https://en.wikipedia.org/wiki/ICO_(file_format) "Microsoft Icon Image format"
[ICNS]: https://en.wikipedia.org/wiki/Apple_Icon_Image_format "Apple Icon Image format"
[SVG]: https://en.wikipedia.org/wiki/Scalable_Vector_Graphics "Scalable Vector Graphics"
[TXT]: https://en.wikipedia.org/wiki/Text_file "Text file"


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
  press and release <kbd>Ctrl</kbd> to switch colors while drawing.

* You can apply image transformations like Flip/Rotate, Stretch/Skew or Invert (in the Image menu) either to the whole image or to a selection.
  Try scribbling with the Free-Form Select tool and the doing **Image > Invert**

* These Tips and Tricks from [a tutorial for MS Paint](https://www.albinoblacksheep.com/tutorial/mspaint)
  also work in JS Paint if they have a checkmark:

	* [x] Brush Scaling (<kbd>+</kbd> & <kbd>-</kbd> on the Numpad to adjust brush size)
	* [x] "Custom Brushes" (hold <kbd>Shift</kbd> and drag the selection to smear it)
	* [x] The 'Stamp' "Tool" (hold <kbd>Shift</kbd> and click the selection to stamp it)
	* [x] Image Scaling (<kbd>+</kbd> & <kbd>-</kbd> on the Numpad to scale the selection by factors of 2)
	* [x] Color Replacement (right mouse button with Eraser to selectively replace the foreground color with the background color)
	* [ ] The Grid (<kbd>Ctrl+G</kbd> & Zoom to 6x+)
	* [ ] Quick Undo (Pressing a second mouse button cancels the action you were performing.
	      I also made it redoable, in case you do it by accident! But [it broke at some point in Chrome.](https://github.com/1j01/jspaint/issues/9))
	* [ ] Scroll Wheel Bug (Hmm, let's maybe not recreate this?)


## Desktop App

I've started work on a desktop app, built with [Electron][] and [Electron Forge][].

There are no releases yet, but the groundwork has been laid, and several features implemented. 

If you want to help out, see Development Setup below, and comment on [this issue](https://github.com/1j01/jspaint/issues/2) to show your interest.

[Electron]: https://electronjs.org/
[Electron Forge]: https://electronforge.io/


## Development Setup

[Clone the repo.](https://help.github.com/articles/cloning-a-repository/)

Install [Node.js][] if you don't have it, then open up a command prompt / terminal in the project directory.

### Web App (https://jspaint.app)

You just need an HTTP server.

[Live Server][] is great; it auto reloads when you save changes.

You can install it globally with `npm i -g live-server`
and run it with `live-server`

It's also included in `package.json` so if you've already installed dependencies (`npm i`) you can use `npm run dev` to run it.

### Desktop App (Electron)

- Install dependencies with `npm i`
- Start the electron app with `npm start`

[electron-debug][] and [devtron][] are included, so you can use <kbd>Ctrl+R</kbd> to reload and <kbd>F12</kbd>/<kbd>Ctrl+Shift+I</kbd> to open the devtools, and there's a Devtron tab with tools specific to Electron like an IPC message inspector.

You can build for production with `npm run make`

[Live Server]: https://github.com/tapio/live-server
[Node.js]: https://nodejs.org/
[electron-debug]: https://github.com/sindresorhus/electron-debug
[devtron]: https://electronjs.org/devtron
