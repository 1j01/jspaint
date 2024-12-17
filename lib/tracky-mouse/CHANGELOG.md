# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No changes here yet.

## [1.2.0] - 2024-12-17

### Deprecated
- `TrackyMouse.cleanupDwellClicking()` is deprecated in favor of calling `dispose()` on the object returned by `TrackyMouse.initDwellClicking()`.

### Changed
- The Tracky Mouse UI no longer includes a stats.js performance monitor by default. You can still enable it by passing `{statsJs: true}` to `TrackyMouse.init()` and, if needed, also to `TrackyMouse.loadDependencies()`.

### Added
- `TrackyMouse.init()` now returns an object with a `dispose()` method, which you can call to stop head tracking and remove the UI.
- The object returned by `TrackyMouse.initDwellClicking()` now has a `dispose()` method as well, which you can use instead of `TrackyMouse.cleanupDwellClicking()`.

### Fixed
- `TrackyMouse.cleanupDwellClicking()` now handles multiple dwell clickers, not that I know of any use case for that.

## [1.1.0] - 2024-10-20

### Added
- Start/stop button. This toggles head tracking, and, in the desktop app, dwell clicking as well. In the web library, dwell clicking is set up separately, and is not currently controlled by this button (or the keyboard shortcut F9).
- Desktop app now supports dwell clicking. This means you can use Tracky Mouse with lots of software not designed with head tracking in mind. I just played a game of Mahjongg, and it worked well.
- Settings are now persisted, both in the desktop app and in the browser.
- Desktop app includes menu items for exporting and importing settings.
- Desktop app now remembers the window size and position.
- Desktop app lets you regain manual control by simply moving the mouse, pausing temporarily, and resuming when you stop moving the mouse.
- Friendly error handling for different camera access failure scenarios.
- Command line interface to control the desktop app, supporting `--start` and `--stop` to toggle head tracking.
- API documentation.
- Website at [TrackyMouse.js.org](https://trackymouse.js.org/).
- Parameter validation.
- `tracky-mouse.js` includes a CommonJS export, untested. I'm only testing script tag usage. I hope to switch to ES modules soon.
- `beforeDispatch()`/`afterDispatch()` callbacks for detecting untrusted gestures, outside of an event where you could use `event.isTrusted`.
- `beforePointerDownDispatch()`/`afterReleaseDrag()` callbacks for JS Paint to replace accessing global `pointers` array.
- `initDwellClicking` returns an object `{paused}` which lets you pause and resume dwell clicking.

### Fixed
- Function `average_points` was missing. It existed in JS Paint, the only place I had tested the library, since I was extracting the code from JS Paint.
- Similarly, styles for the dwell click indicator and hover halo were missing or not applying. (Since they were provided by CSS in JS Paint, I didn't notice, in my rushed testing.)
- The JS assumed the existence of a global `pointer_active` from JS Paint. This has been replaced with `config.isHeld()`.
- Missing `facemesh.worker.js` file.
- "Mirror" checkbox was too easy to accidentally click due to a large `<label>` (which acts as a hit region).

### Changed
- The software now starts disabled (by default), to avoid clicking on things before you're ready. This is especially important for the desktop app. The installer on Windows actually installs and launches the app without any interaction, so it would be *very surprising* if it started clicking right away.
- The webcam view now shrinks to fit the window.
- Sliders now have labels for their min and max values, and are widened to make it easier to click precisely.
- Controls are themed purple.
- All CSS classes are now prefixed with `tracky-mouse-`.
- `shouldDrag`, `noCenter`, `retarget`, `isEquivalentTarget`, and `dwellClickEvenIfPaused` are now optional for `initDwellClicking`.
- You must include a new script `no-eval.js` if you are including Tracky Mouse's dependencies manually. If you are using `loadDependencies()`, it is included automatically.
- Tracky Mouse no longer requires `unsafe-eval` in the Content Security Policy! This is great, because now I can feel better about usage in Electron, both for the Tracky Mouse desktop app and for JS Paint.
- Globals used by the Electron app (`moveMouse`, `onShortcut`, etc.) are now namespaced under `window.electronAPI`. For `moveMouse`, use `TrackyMouse.onPointerMove` instead.
- Will no longer set global `pointers` to an empty array before dispatching `pointerdown` or after releasing a drag. Replaced with `config.beforePointerDownDispatch()` and `config.afterReleaseDrag()`

## [1.0.0] - 2021-05-20
### Added
- Head tracking based on [Clmtrackr](https://github.com/auduno/clmtrackr), [Facemesh](https://github.com/tensorflow/tfjs-models/tree/master/facemesh#mediapipe-facemesh), and [jsfeat](https://github.com/inspirit/jsfeat).
- Dwell clicker API generalized and extracted from [JS Paint](https://github.com/1j01/jspaint).
- [Electron](https://electronjs.org/) app for desktop (not yet packaged for distribution).


[Unreleased]: https://github.com/1j01/tracky-mouse/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/1j01/tracky-mouse/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/1j01/tracky-mouse/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/1j01/tracky-mouse/releases/tag/v1.0.0
