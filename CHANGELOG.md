# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Embedding API

#### Changed
- `systemHooks.writeBlobToHandle` promise can resolve with `true` to indicate success, in which case **File > Save** will not prompt to save the file again. `false` indicates failure or cancellation, whereas `undefined` can be used if it is unknown whether the file will be saved successfully, as is the case when using the `download` attribute on an anchor element. If saving as a monochrome bitmap, `undefined` will cause the canvas to become monochrome, but it will still prompt to save the file again. This tradeoff is reasonable because the download attribute doesn't support saving over an already saved file anyways
- Marked more parts of the API as optional ([⟜](https://github.com/1j01/jspaint/commit/2fe8c35ca6500cc32584dae30f8c3d4ffe989aa3))

#### Fixed

- Fixed error from looking in the wrong place for menus when embedded ([⟜](https://github.com/1j01/jspaint/commit/421fad7dc25c4d27caa46535a2641b12e49a9b18), [⟜](https://github.com/1j01/jspaint/commit/04804396e187b1bf4af9cc31ca449d18661f97ed))

### App

#### Added
- **AppImage** build for Linux (in addition to the existing .deb and .rpm builds)
- **macOS menu bar integration** (the menu bar in the app is now mirrored to the macOS menu bar)
- (Enabled silly **Extras > Draw Randomly**)
- **Extras > Themes > Bubblegum**
- **Extras > Head Tracker** powered by [Tracky Mouse](https://trackymouse.js.org)
- **View > Text Toolbar** to toggle the Fonts box
- Vertical text editing support (find the option in the Text Toolbar, AKA Fonts box)

#### Changed
- Restructured About window content ([⟜](https://github.com/1j01/jspaint/commit/7bc134226f9994cd68fd69d78fb0343f5c873d53), [⟜](https://github.com/1j01/jspaint/commit/c1b407d9134af75533adb3fd3938a82d3a2d71dd), [⟜](https://github.com/1j01/jspaint/commit/da994966ec2231743867f232d8e1fb334071b512), [⟜](https://github.com/1j01/jspaint/commit/be03638fad35a51cacef5c4f524c81581c2be587))
  - (It's now much more compact while including more information)
- Improved Imgur upload error dialogs ([⟜](https://github.com/1j01/jspaint/commit/cbfc9cad47b3aa3c6a8acc6ce525b2b426608dca))
- Split out "Eye Gaze Mode" into discrete features: "Enlarge UI", "Quick Undo Button", "Dwell Clicker"
  - You can now drag toolbars while the UI is enlarged ([⟜](https://github.com/1j01/jspaint/commit/7094171b1644391f4ea3b3467865952c39427a4e))
  - Limited scale of Tools/Colors boxes in Enlarge UI mode ([⟜](https://github.com/1j01/jspaint/commit/431a53e1607fb797ca82ca0f79a3318e98cec8cf))
- Changed width/height separator to an 'x' in status bar (was a comma) ([⟜](https://github.com/1j01/jspaint/commit/884f9ddaee32e1b0c8756c10ba1643076e8e1231))
- Implemented size status indicator for all tools ([⟜](https://github.com/1j01/jspaint/commit/3500496b0801a52e05d5ae69f6f98bb09e477e86))
- Added offset effect to pressed buttons in font box ([⟜](https://github.com/1j01/jspaint/commit/10a32c77382b58b74d8728d2ca4b0126020b175a))

#### Fixed
- When printing, the canvas border and in-progress polygons/curves are now hidden, and the size of the document is fixed ([⟜](https://github.com/1j01/jspaint/commit/e558cc8a7bea1ec255c72011a9f24dd7c813127e), [⟜](https://github.com/1j01/jspaint/commit/f0d08abaec698f72ac2c00f833a4c54c366092b3), [⟜](https://github.com/1j01/jspaint/commit/dbee6258d351ef455eae3b3d01391c3a8b9eef47))
- Fixed drawing position misalignment with cursor ([⟜](https://github.com/1j01/jspaint/commit/e34b257ec1726ad52b68705fca8920afd4730c1c))
- Fixed Help Topics window iframe being blocked by CSP (not sure if this was actually broken in the last release) ([⟜](https://github.com/1j01/jspaint/commit/79481feee403d1737642fd40b72111223c0b210e))
- Fixed prompt to save changes when clicking **File > Exit** ([⟜](https://github.com/1j01/jspaint/commit/e1bf0d73b59bb6a5a8a4404e2a2c4528d4b72566))
- Fixed Shift+Insert, Ctrl+Insert, and Ctrl+Delete shortcuts ([⟜](https://github.com/1j01/jspaint/commit/e3ef424d61e0621e36adeeaa37070d07cf7f5d29))
- Fixed error handling for clipboard access ([⟜](https://github.com/1j01/jspaint/commit/193404199b384532a945f382a56fa2deca679950))
- Fixed format selection when saving a palette in the Electron app ([⟜](https://github.com/1j01/jspaint/commit/2f8f4e7c51a0c1b2d2d26828855d888e8ed641f9))
- Fixed default file name when saving selection with **Edit > Copy To** or **File > Set As Wallpaper** ([⟜](https://github.com/1j01/jspaint/commit/fc59a369fd306bedc31611e6729f4fc2ae9e2cc0), [⟜](https://github.com/1j01/jspaint/commit/8f89d874a77cc8cf00e4731e3979ceaac070aad7))
- Fixed tiled checkboxes (a visual bug) in the Electron app in Enlarge UI mode ([⟜](https://github.com/1j01/jspaint/commit/f367ce043a81c7fdea2c506fcf5aee1ac18b56e3))
- Menus are now scaled down as needed in Enlarge UI mode to fit all items 
- An image dropped on news window will no longer open the image in the app ([⟜](https://github.com/1j01/jspaint/commit/77d341378f9a8d84f0f922ab6545e4cab5fca038))
- Added handling for smooth scrolling for zooming with mousewheel/trackpad ([⟜](https://github.com/1j01/jspaint/commit/170fc0531a772ad47f30e87b337eb6d1b1af836c))
- Updated electron to 20.3.12 ([⟜](https://github.com/1j01/jspaint/commit/1d4bfd0b3aec3746e37c45249b163e784d1dfd17))
  - This brings in Chrome 104 which supports the Local Font Access API,
allowing the Fonts box to list all installed fonts when using the Text tool.
- Fixed fonts dropdown closing immediately when clicked in Chrome ([⟜](https://github.com/1j01/jspaint/commit/bc07ca1bce9209cc0dbbccb667fa98cd7f7a52f8))
- Fixed About window centering on small screens ([⟜](https://github.com/1j01/jspaint/commit/2aa2e66b8ba5927ee833b68480342f1d62477940))

### Internal

- Converted project almost entirely to ES Modules
- Split up several huge files
- Set up ESLint and improved code consistency
- Added typechecking all across the codebase
- Updated os-gui.js and tracky-mouse.js
- Automated the desktop app release process with GitHub Actions and scripts developed for the Tracky Mouse project ([⟜](https://github.com/1j01/jspaint/commit/745852fa9c4af6fb7986e7515987da77c518707f))

### External
- Added a [Privacy Policy](https://jspaint.app/privacy.html)
- There's a friendly [Discord server](https://discord.gg/jxQBK3k8tx) you can join to share your art

## [1.0.0] - 2022-08-02

### Embedding API
#### Added
- `systemHooks` API for overriding file dialogs, file saving/loading, and Set as Wallpaper commands
	- `systemHooks.showSaveFileDialog = async ({ formats, defaultFileName, defaultPath, defaultFileFormatID, getBlob, savedCallbackUnreliable, dialogTitle }) => { ... };`
	- `systemHooks.showOpenFileDialog = async ({ formats }) => { ... };`
	- `systemHooks.writeBlobToHandle = async (save_file_handle, blob) => { ... };`
	- `systemHooks.readBlobFromHandle = async (file_handle) => { ... };`
	- `systemHooks.setWallpaperTiled = (canvas) => { ... };`
	- `systemHooks.setWallpaperCentered = (canvas) => { ... };`
- function `undoable({ name, icon }, actionFunction)` to make an action undoable, as far is it modifies the canvas
- function `show_error_message(message, [error])` to show an error message dialog box, optionally with expandable error details
- function `open_from_file(blob, source_file_handle)` to load a file from a blob and file handle pair (kinda quirky API)
- function `set_theme(theme_file_name)` to switch themes
- function `set_language(language_code)` to switch languages, prompting the user to reload the application
- You can use `.main-canvas` selector to access the canvas element.
- URL parameter `#load:<URL>` to load a file from a URL

### App
#### Added
- Most features of MS Paint
- Lots more features

[Unreleased]: https://github.com/1j01/jspaint/compare/v1.0.0...HEAD
[1.1.0]: https://github.com/1j01/jspaint/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/1j01/jspaint/releases/tag/v1.0.0
