
# [![](images/icons/32.png) JS Paint](http://1j01.github.io/jspaint/)

A nice web-based MS Paint remake and more...
[Try it out!](http://1j01.github.io/jspaint/)

The goal is to remake MS Paint
(including its [little-known features](#did-you-know)),
improve on it, and to [extend](#extended-editing) the types of images it can edit.
So far, it does this pretty well.

You can also install it as a Chrome app.

![Screenshot](http://isaiahodhner.ml/images/projects/jspaint.png)


#### Current improvements include:

* Unlimited undos/redos (as opposed to a measly 3 in Windows XP,
  or a somewhat less measly but still annoying 50 in Windows 7)
* Automatically saves if local storage is allowed
  (Try refreshing the page to make sure, and to check it out)
* Edit transparent images! To create a transparent image,
  go to Image > Attributes... and select Transparent,
  then Okay, and then Image > Clear Image
* Create an animated GIF from the current document history with
  <kbd>Ctrl+Shift+G</kbd> (pretty nifty, you should try it out (after editing *a fairly small image*))
* Cross-platform, I suppose
* You can shoot at it [Asteroids style](http://kickassapp.com/)
* When you do Edit > Paste From... you can select transparent images and animated GIFs.
  ~~You can even paste a transparent animated GIF and then
  hold <kbd>Shift</kbd> while dragging the selection to
  smear it across the canvas *while it animates*!~~
  Update: This was due to not-to-spec behavior in Chrome.
  [See this blog post.](http://christianheilmann.com/2014/04/16/browser-inconsistencies-animated-gif-and-drawimage/)
  I may reimplement this in the future as I really liked this feature.
* It can open SVG files (by accident)
* You can crop the image by making a selection while holding <kbd>Ctrl</kbd>
* Keyboard shortcuts for rotation: <kbd>Ctrl+.</kbd> and <kbd>Ctrl+,</kbd> (<kbd><</kbd>/<kbd>></kbd>)
* Rotate image by arbitrary angle! Available in Image > Flip/Rotate
* Rudimentary **multiplayer** support:
  Start up a session at
  [jspaint.ml/#session:multiplayer-test](http://1j01.github.io/jspaint/#session:multiplayer-test)
  and send the link to your friends!
  It isn't perfectly seamless, and you may lose your drawing or be interrupted.


#### Possible improvements include:

* [Extended Editing](#extended-editing)
* Mobile support
* Proportionally resize the selection or canvas by holding <kbd>Shift</kbd>
* After adding text, save as SVG or HTML with selectable text
* <kbd>Alt</kbd> as a shortcut for the eyedropper, as long as it doesn't conflict with keyboard navigation of menus
* Loading palettes (I've started a [project](https://github.com/1j01/palette.js/) for this)
* Alternate themes (You can already style it with browser extensions like Stylebot or Stylish though!)
* Noncontiguous fill (Probably by holding <kbd>Shift</kbd> when using the fill tool)
* Optionally treat almost-equal colors as equal


#### A lot of stuff isn't done yet:

* The Magnifier's viewport preview
* Shape styles on most of the shape tools
* The polygon tool needs some work
* Keyboard support in the menus and dialogues
* [This entire document full of things to do](TODO.md)

Clipboard support is somewhat limited.
You can copy with <kbd>Ctrl+C</kbd>, cut with <kbd>Ctrl+X</kbd>, and paste with <kbd>Ctrl+V</kbd>,
but data copied from JS Paint can only be pasted into other instances of JS Paint.
There's apparently no way for web apps to properly copy image data to the clipboard.
To use the clipboard menu items, you need to install the Chrome app.
(It would be a huge security issue if browsers let web pages access the clipboard at will.)


## Staying True to the Original

Ah yes, good old paint. Not the one with the
[ribbons](https://www.google.com/search?tbm=isch&q=ms+paint+windows+7+ribbons)
or the [new one](https://www.google.com/search?q=freshpaint&tbm=isch)
with the interface that can take up nearly half the screen.

Windows 95, 98, and XP were the golden years of paint.
You had a tool box and a color box, a foreground color and a background color,
and that was all you needed.

Things were simple.

But now we want transparency.
And we want to undo more than three actions.
We can't just keep using the old paint.

So that's why I'm making JS Paint. I want to bring good old paint into the modern era.
Also, it's totally retro. There might be themes later, though.
What was this section titled? Oh, um yeah I'm doing that too, I guess.


## Extended Editing

I want to make JS Paint to be able to edit...

* Transparent [PNGs][PNG] - Done!
  Images that are partially transparent will automatically open in Transparent mode.
  Otherwise they will open in Opaque mode.
  Enable transparency for an image by going to Image > Attributes or pressing <kbd>Ctrl+E</kbd>
  and selecting Transparent. (Hit Okay.)
  Then you'll want to remove some of the background.
  You can use the Eraser tool a bit, then use the Color Picker to
  pick up where you erased and then use the Fill tool to remove bigger areas.
* Animated [GIFs][GIF]
  (yes, that entails a fully featured (but simple) animation editor) -
  Currently you can only make GIFs of the document history with <kbd>Ctrl+Shift+G</kbd>
* Animated Transparent [APNGs][APNG]
  (better than GIFs, but with less support)
* Multi-size Icons ([ICO][ICO] for windows and [ICNS][ICNS] for mac)
* [Scalable Vector Graphics][SVG] (kidding) -
  Actually, it could always open SVG files in browsers that can handle SVGs,
  and I've made it try not to save over the original SVG.
  That's pretty decent SVG support, for a 100% raster image editor.
* [Text Files][TXT] (definitely just kidding maybe)

[PNG]: http://en.wikipedia.org/wiki/Portable_Network_Graphics "Microsoft Icon Image format"
[GIF]: http://en.wikipedia.org/wiki/Graphics_Interchange_Format "Graphics Interchange Format"
[APNG]: http://en.wikipedia.org/wiki/APNG "Animated Portable Network Graphics"
[ICO]: http://en.wikipedia.org/wiki/ICO_(file_format) "Microsoft Icon Image format"
[ICNS]: http://en.wikipedia.org/wiki/Apple_Icon_Image_format "Apple Icon Image format"
[SVG]: http://en.wikipedia.org/wiki/Scalable_Vector_Graphics "Scalable Vector Graphics"
[TXT]: http://en.wikipedia.org/wiki/Text_file "Text file"


## Did you know?

* You can drag the color box and tool box around if you grab them by the right place.
  You can even drag them out into little windows.
  You can dock the windows back to the side by double-clicking on their titlebars.

* In addition to the left-click foreground color and the right-click background color,
  there's also a third color you can access by holding <kbd>Ctrl</kbd> while you draw.
  It starts out with no color so you'll need to hold <kbd>Ctrl</kbd> and select a color first.
  The slightly fancy thing about this color is you can
  press and release <kbd>Ctrl</kbd> to switch colors while drawing.

* You can apply image transformations like Flip/Rotate, Stretch/Skew or Invert (in the Image menu) either to the whole image or to a selection. If you make a selection with the Select or Free-Form Select tool, the transformations apply to the selection.

* These Tips and Tricks from [a tutorial for MS Paint](http://www.albinoblacksheep.com/tutorial/mspaint)
  also work in JS Paint if they have a checkmark:

	* [x] Brush Scaling (<kbd>+</kbd> & <kbd>-</kbd> on the Numpad to adjust brush size)
	* [x] "Custom Brushes" (hold <kbd>Shift</kbd> and drag the selection to smear it)
	* [x] The 'Stamp' "Tool" (hold <kbd>Shift</kbd> and click the selection to stamp it)
	* [x] Image Scaling (<kbd>+</kbd> & <kbd>-</kbd> on the Numpad to scale the selection by factors of 2)
	* [x] Color Replacement (right mouse button in Eraser selectively replaces the foreground color with the background color)
	* [ ] The Grid (<kbd>Ctrl+G</kbd> & Zoom to 6x+)
	* [x] Quick Undo (Pressing a second mouse button cancels the action you were performing. I also made it redoable, in case you do it by accident!)
	* [ ] Scroll Wheel Bug (Hmm, let's maybe not recreate this?)

