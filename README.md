# [JSPaint](http://1j01.github.io/jspaint/)

A web-based MSPaint remake and more...

The goal is to completely remake paint (including its [little-known features](#did-you-know)), improve on it, and to extend the types of images it can edit.

Current improvements include:
* Unlimited undos/redos (as opposed to a measly three)
* Create an animated GIF from the current undo history with Ctrl+Shift+G
* Cross-platform, I guess

A lot of stuff isn't done yet.

## Staying True to the Original

Ah yes, good old paint. Not the one with the [ribbons](https://www.google.com/search?tbm=isch&q=ms+paint+windows+7+ribbons&gs_l=img.3...7238.8547.0.8696.8.8.0.0.0.0.121.634.6j2.8.0....0...1c.1.45.img..7.1.84.3kcQ3AxAcpM#facrc=_&imgdii=_&imgrc=9QWxEa18YDeIXM%253A%3BTCC8aIEVP4RP2M%3Bhttp%253A%252F%252Fwinsupersite.com%252Fcontent%252Fcontent%252F126917%252Ffaq%252Fwin7_faq_paint.jpg%3Bhttp%253A%252F%252Fwinsupersite.com%252Farticle%252Ffaqtip%252Fwindows-7-faq%3B720%3B320) or the [new one](https://www.google.com/search?q=freshpaint&tbm=isch) with the interface that can take up nearly half the screen.

Windows 95, 98, and XP were the golden years of paint.
You had a tool box and a color box, a foreground color and a background color,  and that was all you needed. (including _all the tools_, of course :3 )

Things were simple.

But now we need transparency. And we need to undo more than three actions.

So that's why I'm making jspaint. I want to bring good old paint into the modern era
Also, it's totally retro. There might be themes later.

## Extended Editing

I want to make jspaint to be able to edit... (in the future...)
* Transparent PNGs (the main thing that's lacking in mspaint xp)
* Animated GIFs (yes, that entails a fully featured (but simple) animation editor)
* Animated and Transparent APNGs
* Multisize Icons (.ico and .icns)
* Scalable Vector Graphics (just kidding) (actually it can already open SVGs and knows not to save over them)
* Text Files (seriously really just kidding I promise*)

## Did you know?
* Tips and Tricks from [this tutorial](http://www.albinoblacksheep.com/tutorial/mspaint) that work in mspaint, and work in jspaint if they have a ✓
	* Brush Scaling ✓ (in jspaint you don't need to hold Ctrl)
	* "Custom Brushes" ✓
	* "The 'Stamp' Tool"
	* Image Scaling (Ctrl+Plus and Ctrl+Minus on the Numpad to scale the selection by factors of 2)
	* Color Replacement (see [Tools](#tools))
	* The Grid (Ctrl+G + zoom6x+)
	* Quick Undo ✓ (I also made it redoable, in case you do it by accident)
	* Scroll Wheel draws line down and to the right (hmm, let's maybe not recreate this?)

