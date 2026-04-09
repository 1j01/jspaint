# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Embedding API

#### Changed
- `systemHooks.writeBlobToHandle` promise can resolve with `true` to indicate success, in which case **File > Save** will not prompt to save the file again. `false` indicates failure or cancellation, whereas `undefined` can be used if it is unknown whether the file will be saved successfully, as is the case when using the `download` attribute on an anchor element. If saving as a monochrome bitmap, `undefined` will cause the canvas to become monochrome, but it will still prompt to save the file again. This tradeoff is reasonable because the download attribute doesn't support saving over an already saved file anyways
- Marked more parts of the API as optional (2fe8c35ca6500cc32584dae30f8c3d4ffe989aa3)

#### Fixed

- Fix error from looking in the wrong place for menus when embedded (421fad7dc25c4d27caa46535a2641b12e49a9b18)

### App

#### Added
- **macOS menu bar integration** - this mirrors the menu bar in the app to the macOS menu bar
- Enabled silly **Extras > Draw Randomly**
- **Bubblegum theme**

#### Fixed
- Hide canvas border, in-progress polygons/curves, and fix size of document when printing
- Fix drawing position misalignment with cursor (e34b257ec1726ad52b68705fca8920afd4730c1c)
- Fix Help Topics window iframe being blocked by CSP\*
- Prompt to save changes when clicking File > Exit (e1bf0d73b59bb6a5a8a4404e2a2c4528d4b72566)
- Fixed Shift+Insert, Ctrl+Insert, and Ctrl+Delete shortcuts (e3ef424d61e0621e36adeeaa37070d07cf7f5d29)
- Fixed error handling for clipboard access (193404199b384532a945f382a56fa2deca679950)
- Fix format selection when saving a palette in the Electron app (2f8f4e7c51a0c1b2d2d26828855d888e8ed641f9)
- Fix default file name when saving selection with Edit > Copy To (fc59a369fd306bedc31611e6729f4fc2ae9e2cc0)



#### Changed
- Improved Imgur upload error dialogs

### Internal

- Converted project almost entirely to ES Modules
- Split up several huge files
- Added typechecking
- Updated os-gui.js

### External
- Added a Privacy Policy
- There's a Discord server

\*might not have been a problem in last release

## [1.0.0] - 2022-08-02
### Added
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

[Unreleased]: https://github.com/1j01/jspaint/compare/v1.0.0...HEAD
[1.1.0]: https://github.com/1j01/jspaint/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/1j01/jspaint/releases/tag/v1.0.0
