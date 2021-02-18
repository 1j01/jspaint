# Contributing

## Pull Requests

Let me know before you work on something by opening an issue or commenting on an existing one.

Someone may be already working on it, or I may have specific plans or requirements.
I don't want your effort to be wasted!

## Issues

[Bugs and feature requests are tracked on GitHub.](https://github.com/1j01/jspaint/issues)

Before opening an issue for a bug or feature request, search to see if it's already been reported.

You can also [email me](mailto:isaiahodhner@gmail.com) if you prefer.

## Windows 98

Note: JS Paint's GUI is primarily based on Paint from Windows 98.
There's a nice [online emulator](https://copy.sh/v86/?profile=windows98)
that you can play around with and use as a reference.

## Dev Setup

See [**Development Setup**](./README.md#Development-Setup) on the readme.

### Project Structure

- `index.html` and `app.js` are the main entry points for the app.
- `functions.js` has functions that shouldn't own any global state, altho they very much modify global state, and there may be a few stateful global variables defined in there.
- The project uses [jQuery](https://jquery.com/), and a convention of prefixing variables that hold jQuery objects with `$`
	- There are also some weird pseudo-classes like `$ColorBox` which extend and return jQuery objects. I don't recommend this pattern for new code.
- Menu code and some windowing code is in `lib/os-gui/` and should be kept in sync with the [os-gui](https://github.com/1j01/os-gui) project.
	- Some other windowing code is in $ToolWindow.js, for windows that don't have maximize/minimize buttons; eventually this should be provided by os-gui.
- `image-manipulation.js` should contain just rendering related code, and ideally no dialogs except maybe some error messages.
	- Some image manipulation code is also in `tools.js` and `functions.js`
- CSS is in `styles/`
	- Layout-important CSS is kept separate from theme CSS
- Localization data is in `localization/`
	- As of writing there's no good way to contribute translations, but [get in touch!](https://github.com/1j01/jspaint/issues/80)

Any good IDE or code editor has a project-wide search (often with <kbd>Ctrl+Shift+F</kbd>). I use this all the time.  
I also use the "Intellisense" feature of [VS Code](https://code.visualstudio.com/) to jump to function definitions (an extra convenience over searching for function names).