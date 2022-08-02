# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
