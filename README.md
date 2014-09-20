# [![](images/icons/32.png) jspaint](http://1j01.github.io/jspaint/)

A nice web-based MS Paint remake and more...

The goal is to remake paint (including its [little-known features](#did-you-know)), improve on it, and to extend the types of images it can edit.

Current improvements include:

* Unlimited undos/redos (as opposed to a measly three in Windows XP, or a somewhat less measly 50 in Windows 7)
* Create an animated GIF from the current undo history with Ctrl+Shift+G (pretty nifty, you should try it out)
* Cross-platform, I guess
* You can shoot at it [Asteroids style](http://kickassapp.com/)
* Oh yeah, sort of a small thing, but the scrollbars are never disabled.

Possible improvements include:

* [Extended Editing](#extended-editing)
* Mobile support
* Proportionally resize selection by holding Shift
* After adding text, be able to save as SVG or HTML with selectable text

A lot of stuff isn't done yet.

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

* Transparent PNGs (the main thing that's lacking in old mspaint)
* Animated GIFs (yes, that entails a fully featured (but simple) animation editor)
* Animated Transparent APNGs
* Multi-size Icons (ICO for windows and ICNS for mac)
* Scalable Vector Graphics (kidding, but actually it could always open SVG files in browsers that can handle SVGs, and I've now made it try not to save over the original SVG. That's pretty decent SVG support, for a 100% raster image editor.)
* Text Files (just kidding*)

## Did you know?

* Tips and Tricks from [this tutorial for mspaint](http://www.albinoblacksheep.com/tutorial/mspaint) that also work in jspaint if they have a checkmark:

	* [x] Brush Scaling (in jspaint you don't need to hold Ctrl!)
	* [x] "Custom Brushes"
	* [x] The 'Stamp' "Tool"
	* [x] Image Scaling (+/- on the Numpad (no Ctrl needed) to scale the selection by factors of 2)
	* [ ] Color Replacement
	* [ ] The Grid (Ctrl+G + zoom6x+)
	* [x] Quick Undo (I also made it redoable, in case you do it by accident!)
	* [ ] Scroll Wheel draws line down and to the right (hmm, let's maybe not recreate this? ah who am I kidding I'll make it an option)
