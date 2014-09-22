
# ![](images/icons/32.png) [JS Paint](http://1j01.github.io/jspaint/)

A nice web-based MS Paint remake and more... [Try it out!](http://1j01.github.io/jspaint/)

The goal is to remake paint (including its [little-known features](#did-you-know)), improve on it, and to extend the types of images it can edit.

Current improvements include:

* Unlimited undos/redos (as opposed to a measly three in Windows XP, or a somewhat less measly 50 in Windows 7)
* Create an animated GIF from the current undo history with <kbd>Ctrl+Shift+G</kbd> (pretty nifty, you should try it out)
* Cross-platform, I guess
* You can shoot at it [Asteroids style](http://kickassapp.com/)
* When you do Edit > Paste From... you can select an animated and/or transparent image. You can then smear it across the canvas while it animates! (Hold <kbd>Shift</kbd> while dragging the selection to smear it.)
* It can open SVG files (by accident)

Possible improvements include:

* [Extended Editing](#extended-editing)
* Mobile support
* Proportionally resize selection by holding Shift
* After adding text, be able to save as SVG or HTML with selectable text
* <kbd>Alt</kbd> as a shortcut for the eyedropper
* Loading palettes (I've started a [project](https://github.com/1j01/palette.js/) for this)

A lot of stuff isn't done yet:

* Magnification
* Free-Form Selection
* Color Replacement with the "Eraser/Color Eraser" tool
* Lots of menu items
* Copying the selection to the clipboard (You can paste, though!)

There's [a lot to do.](TODO.md)


## Staying True to the Original

Ah yes, good old paint. Not the one with the [ribbons](https://www.google.com/search?tbm=isch&q=ms+paint+windows+7+ribbons&gs_l=img.3...7238.8547.0.8696.8.8.0.0.0.0.121.634.6j2.8.0....0...1c.1.45.img..7.1.84.3kcQ3AxAcpM#facrc=_&imgdii=_&imgrc=9QWxEa18YDeIXM%253A%3BTCC8aIEVP4RP2M%3Bhttp%253A%252F%252Fwinsupersite.com%252Fcontent%252Fcontent%252F126917%252Ffaq%252Fwin7_faq_paint.jpg%3Bhttp%253A%252F%252Fwinsupersite.com%252Farticle%252Ffaqtip%252Fwindows-7-faq%3B720%3B320)
or the [new one](https://www.google.com/search?q=freshpaint&tbm=isch)
with the interface that can take up nearly half the screen.

Windows 95, 98, and XP were the golden years of paint.
You had a tool box and a color box, a foreground color and a background color,
and that was all you needed.

Things were simple.

But now we want transparency.
And we want to undo more than three actions.
We can't just keep using the old paint.

So that's why I'm making jspaint. I want to bring good old paint into the modern era.
Also, it's totally retro. There might be themes later, though.
What was this section titled? Oh, um yeah I'm doing that too.


## Extended Editing

I want to make jspaint to be able to edit...

* Transparent PNGs (the main thing that's lacking in old ms paint)
* Animated GIFs (yes, that entails a fully featured (but simple) animation editor)
* Animated Transparent APNGs
* Multi-size Icons (ICO for windows and ICNS for mac)
* Scalable Vector Graphics (kidding, but actually it could always open SVG files in browsers that can handle SVGs, and I've now made it try not to save over the original SVG. That's pretty decent SVG support, for a 100% raster image editor.)
* Text Files (just kidding*)


## Did you know?

* These Tips and Tricks from [This tutorial for MS Paint](http://www.albinoblacksheep.com/tutorial/mspaint) also work in jspaint if they have a checkmark:

	* [x] Brush Scaling (<kbd>+</kbd> & <kbd>-</kbd> on the Numpad to adjust brush size)
	* [x] "Custom Brushes" (hold <kbd>Shift</kbd> and drag the selection to smear it)
	* [x] The 'Stamp' "Tool" (hold <kbd>Shift</kbd> and click the selection to stamp it)
	* [x] Image Scaling (<kbd>+</kbd> & <kbd>-</kbd> on the Numpad to scale the selection by factors of 2)
	* [ ] Color Replacement (right mouse button in Eraser selectively replaces the foreground color with the background color)
	* [ ] The Grid (<kbd>Ctrl+G</kbd> & Zoom to 6x+)
	* [x] Quick Undo (Pressing a second mouse button cancels the action you were performing. I also made it redoable, in case you do it by accident!)
	* [ ] Scroll Wheel bug (hmm, let's maybe not recreate this? ah who am I kidding I'll make it an option)
