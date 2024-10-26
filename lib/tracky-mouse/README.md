# ![](./images/tracky-mouse-logo-32.png) Tracky Mouse

> Control your computer by moving your head.

Tracky Mouse is a desktop application *and embeddable web UI* for head tracking and mouse control.
It includes a dwell clicker, and will be expanded with other clicking options in the future.

Tracky Mouse is intended to be a complete UI for head tracking, similar to [eViacam](https://github.com/cmauri/eviacam), but embeddable in web applications (such as [JS Paint, with its Eye Gaze Mode](https://jspaint.app/#eye-gaze-mode), which I might rename Hands-Free Mode or Facial Mouse Mode), as well as downloadable as an application to use to control your entire computer.

I'm also thinking about making a browser extension, which would 1. bridge between the desktop application and web applications, making it so you don't need to disable dwell clicking in the desktop app to use a web app that provides dwell clicking, 2. provide the equivalent of the desktop application for Chrome OS, and 3. automatically enhance webpages to be friendlier toward facial mouse input, by preventing menus from closing based on hover, enlarging elements etc., probably using site-specific enhancements.

So this would be a three-in-one project: desktop app, JavaScript library, and browser extension.
Sharing code between these different facets of the project means a lot of improvements can be made to three different products at once, and the library means that applications can have a fully functional facial mouse UI, and get people interested in head tracking because they can try it out right away.

Options could be exported/imported or even synced between the products.

[✨👉 **Try out the Demo!** 👈✨](https://trackymouse.js.org/)

## Install Desktop App

[⬇️ Download for Windows](https://github.com/1j01/tracky-mouse/releases/download/v1.1.0/Tracky.Mouse.v1.1.0.Setup.exe) and run the installer.

Pre-built binaries are not yet available for macOS or Linux, due to an [Electron Forge issue](https://github.com/electron/forge/issues/3238#issuecomment-2067577947), however you can run the app from source on those platforms.
See [Development Setup](#development-setup).

## Usage Guide

These instructions apply to using the desktop app or the web UI.

### Set up your camera and environment:
- Make sure to have good lighting on your face. Placing a lamp beside your monitor can help a lot!
- Back-lighting can be problematic, especially if your head moves in and out from occluding the light during use.
- Your webcam should be centered in front of your head, with your head fully visible when sitting comfortably.

### Start using Tracky Mouse:
- Press the "Start" button to start moving the mouse and clicking. You can also use the keyboard shortcut <kbd>F9</kbd>. When using the desktop app, this shortcut works even when the app is not in focus.
- Dwell in one spot to click. To avoid clicking, you have to keep moving your head, or pause the app with <kbd>F9</kbd>.

### General usage tips:
- Adjust the settings until you can comfortably move the mouse to the edges of the screen with some accuracy.
- If the mouse cursor feels off-center, you can recalibrate by simply moving your head past where the cursor meets the edge of the screen.
- Note that not only rotating your head, but translating your head (moving it left/right, up/down, or forward/backward) moves the mouse.
  - One nuance to this is, if the camera is positioned above your head, leaning forward generally moves the pointer down, whereas if the camera is below your head, leaning forward generally moves the pointer up.

### Troubleshooting:
- If the camera feed appears black, make sure there is no privacy/dust cover on the camera, and ensure there's enough light. Check the camera in another application to make sure it's working.
- If the camera can't be accessed at all, make sure it's not being used by another application, then click "Allow Camera Access" in the app. Also try unplugging the camera and plugging it in again (if it's an external camera), or restarting your computer.
  - On Linux: Installing (and maybe running?) `guvcview` can magically fix a webcam not showing up. ([source](https://forums.linuxmint.com/viewtopic.php?t=131011))
- Auto-focus and auto-brightness can cause head tracking disruptions. Consider disabling auto-focus on your camera, and adjusting focus manually. If you disable auto-brightness, you will have to adjust the brightness regularly as the lighting changes, at least assuming you have any natural light in the room.
- If you have multiple cameras, the app does not yet support selecting a camera, so you'll have to disable the other cameras in your system settings (or unplug them, if they're external) in order to target the desired camera.

### Integrating with external software
Track Mouse comes with a command-line interface (CLI) which can be used to control the desktop app with a voice command system or other external programs. See [CLI documentation](./CLI.md) for usage.


## Add to your project

Tracky Mouse is available on npm:
```sh
npm install tracky-mouse
```

Read the [API documentation](./core/README.md) for more information.

## License

MIT-licensed, see [LICENSE.txt](./LICENSE.txt)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for project history and API changes.

## Why did I make this?

Someone emailed me asking about how they might adjust the UI of [JS Paint](https://jspaint.app/) to work with eye tracking (enlarging the color palette, hiding other UI elements, etc.)
and I decided to do them one better and build it as an official feature, with dwell clicking and everything.

To test the Eye Gaze Mode properly, I needed a facial mouse, but eye trackers are expensive, so I tried looking for head tracking software, and found eViacam, but... either it didn't work, or at some point it stopped working on my computer.

- eViacam wasn't working on my computer.
- There's not that much facial mouse software out there, especially cross-platform, and I think it's good to have options.
- I want people to be able to try JS Paint's Eye Gaze Mode out easily, and an embeddable facial mouse GUI would be great for that.
- Sometimes my joints hurt a lot and I'd like to relieve strain by switching to an alternative input method, such as head movement. Although I also have serious neck problems, so I don't know what I was thinking. Working on this project I have to use it very sparingly, using a demo video instead of camera input whenever possible for testing.

## Software Architecture

This is a monorepo containing packages for the library (`core`), the desktop app (`desktop-app`), and the website (`website`).


I tried npm workspaces, but it doesn't work with Electron Forge packaging. See [electron/forge#2306](https://github.com/electron/forge/issues/2306).

### Core

The core library uses the following third-party libraries:

- [jsfeat](https://github.com/inspirit/jsfeat) for point tracking
	- [MIT License](https://github.com/inspirit/jsfeat/blob/master/LICENSE)
- [clmtrackr.js](https://github.com/auduno/clmtrackr) for fast and lightweight but inaccurate face tracking
	- [MIT License](https://github.com/auduno/clmtrackr/blob/dev/LICENSE.txt)
- [facemesh](https://github.com/tensorflow/tfjs-models/tree/master/facemesh#mediapipe-facemesh) and [TensorFlow.js](https://www.tensorflow.org/) for accurate face tracking (once this loads, it stops using clmtrackr.js)
	- [tfjs-models: Apache License 2.0](https://github.com/tensorflow/tfjs-models/blob/master/LICENSE)
	- [TensorFlow: Apache License 2.0](https://github.com/tensorflow/tensorflow/blob/master/LICENSE)


To avoid the need for `unsafe-eval` in the Content Security Policy, I had to eliminate the use of `eval` (and `Function` construction) in `clmtrackr.js`.

The file [no-eval.js](./core/lib/no-eval.js) overrides `eval` with a function that handles the specific cases of `eval` usage in `clmtrackr.js`.
I made a tool to generate this file by running `clmtrackr.js` while instrumenting `eval` to collect the code it tries to evaluate.
This tool is located in [eval-is-evil.html](./website/eval-is-evil.html).

### Website

The website uses symlinks to reference the library (`core`) and shared resources (`images`) during development.

When deploying with `npm run in-website -- npm run deploy`, the symlinks are dereferenced using `cp -rL`.

The website is deployed to GitHub Pages using the [`gh-pages`](https://www.npmjs.com/package/gh-pages) npm package.

(GitHub Pages supports symlinks, but not to paths outside of `docs` when deploying `docs` as the site root, unfortunately,
hence I can't use symlinks to reference the library and avoid a deployment script, while keeping a clean repository structure.
I would have to have the website files at the root of the repository.)

### Desktop App

The desktop application's architecture is kind of *amusing*...

I will explain. First, some groundwork. Electron apps are multi-process programs. They have a main process, which creates browser windows, and renderer processes, which render the content of the browser windows.

In this app, there are two renderer processes, one for the main application window, and one for a screen overlay window.

The overlay window is transparent, always-on-top, and intangible. It's used to preview dwell clicks with a shrinking circle.

Now we get to the good stuff...

In a "sane" architecture, the overlay window, which can't receive any input directly, would be purely a visual output. The state would be kept in either the main process or the main renderer process, and it would only send messages to the overlay to draw the circle.

But I already had code for the dwell clicker, you see. I want it to behave similarly between the library and the desktop app, so I want the same timing logic and circle drawing to work in both.

Keeping the state in a separate process from where the circle is rendered would mean tearing apart and rewriting my code for the dwell clicker.

So instead I simply embed the dwell clicker into the screen overlay window, business logic and all.
It was already going to be an entire webpage just to render the circle, since this is Electron.
It was never going to be efficient.

So I ended up with an architecture where the **application window controls mouse movement**, and the **screen overlay window controls mouse clicking**, which I think is *pretty epic*. 😎

It genuinely was a good way to reuse the code for the dwell clicker.

Oh also I made a big, screen-sized, **invisible button**, so that the dwell clicker thinks there's something to click on. Pretty silly, but also pretty simple. 🆒

![](./images/software-architecture.svg)

**Not pictured:** the renderer processes each have preload scripts which are more privileged code than the rest of the renderer's code. Access to system functionality passes through the preload scripts.

The architecture for normal usage of the library is much simpler.

Ooh, but the diagram for the desktop app interacting with web pages (including pages using the library) through the browser extension would be interesting. That's all theoretical for now though.

## Development Setup

- Before cloning on Windows, make sure you have `git config --global core.symlinks true` set, or you may have issues with symbolic links.
- [Clone the repo.](https://help.github.com/articles/cloning-a-repository/)
- Install [Node.js](https://nodejs.org/) if you don't have it
- Open up a command prompt / terminal in the project directory.
- Run `npm install` to install project-wide dependencies.

For the website:
- Run `npm run in-website -- npm install` to install the website's dependencies. (`--` allows passing arguments to the script, which is just a simple wrapper to run a command within the directory of the package.)
- Run `npm run website` to start a web server that will automatically reload when files change.

For the desktop app:
- Run `npm run in-desktop-app -- npm install` to install dependencies.
- Run `npm run desktop-app` to start the app.
- To test the CLI, run `npx tracky-mouse --help`.
  - Alternatively, run `npm link` to make `tracky-mouse` available globally, but note that it may conflict with the installed app.
  - Those options skip Electron Forge currently. To test the CLI through Electron Forge, run `npm run desktop-app -- -- -- --help` (Yes it's a lot of dashes. It's going through npm, then npm within a subfolder, and then Electron Forge. Each tool has its own `--help` flag, but supports `--` to pass on any following arguments as-is.)
- Run `npm run in-desktop-app -- npm run make` to build the app for distribution. Look in the `desktop-app/out/` directory for build artifacts.

(The core library doesn't currently use `npm` for dependencies. It has dependencies stored in the `core/lib` directory. And it doesn't have any npm scripts.)

### Debugging

VS Code launch configurations are provided to debug the web version in Chrome, and to debug the Electron main process.

For the screen overlay window, you can use **View > Toggle Developer Tools (Screen Overlay)** from the main window's menu bar.

## Quality Assurance

- Run `npm run lint` to check for spelling and code issues.
- There are no tests yet.

## Release Process

This is a draft of a release process.

> Hm, the version numbers need to be updated for the desktop app build (for the about window and `--version` flag to make sense), but it seems a little awkward to have to bump the version numbers on all the operating systems. Should I separate committing the bump from pushing, and push to a branch first, in order to pull on the other systems with the bump? Is that even easier?  
> I guess it comes down to wanting to test the desktop app on all systems.  
> But maybe I should just hope for the best, and rely on patch releases if there are issues.  
> I guess ideally I should set up GitHub Actions to build the desktop app for all platforms, on a branch, on then test by downloading the artifacts, then merge to main and tag the commit.  

Run quality assurance checks:
```sh
npm run lint
```

Update CLI docs:
```sh
npm run update-cli-docs
```

Bump package versions.
```sh
# Assuming bash or similar shell syntax
# TODO: automate this in a cross-platform way
VERSION=1.1.0
npm run in-core -- npm version $VERSION --no-git-tag-version
npm run in-website -- npm version $VERSION --no-git-tag-version
npm run in-desktop-app -- npm version $VERSION --no-git-tag-version
npm version $VERSION --no-git-tag-version
```

Update the changelog.  
In CHANGELOG.md, first make sure all important changes are noted.  
Then add a new heading below "Unreleased" with the new version number and date, and update links defined at the bottom which are used for version comparison.  
Add "No changes here yet." below the "Unreleased" heading so that it doesn't appear to apply to the new version.

Update download links to point to the new version:
```sh
FILES_WITH_DL_LINKS="README.md website/index.html"
# sed -i "s/(https:\\/\\/github.com\\/1j01\\/tracky-mouse\\/releases\\/download\\/)[^/]*\\//\1v$VERSION\\//g" $FILES_WITH_DL_LINKS
node -e "const fs = require('fs'); const version = '$VERSION'; const files = '$FILES_WITH_DL_LINKS'.split(' '); files.forEach(file => { fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/(https:\/\/github.com\/1j01\/tracky-mouse\/releases\/download\/)[^/]*\//g, '\$1v' + version + '/')); });"
```

Build the desktop app (this must be done after updating the version number, but should be done before publishing the library to npm in case any issues come up):
```sh
# This step should be run on all supported platforms
npm run in-desktop-app -- npm run make
```

Create `desktop-app/.env` file if it doesn't exist, and inside it, set `GITHUB_TOKEN=...` with a GitHub personal access token with content permissions for creating a release.

Create a GitHub release draft, automatically uploading the desktop app distributable files:
```sh
# This step should be run on all supported platforms
npm run in-desktop-app -- npm run publish
```

Install and test the installed desktop app.

Then commit the changes, tag the commit, and push:
```sh
git add .
git commit -m "Release $VERSION"
git tag v$VERSION
git push
git push origin tag v$VERSION
```

Publish the library to npm:
```sh
npm run in-core -- npm publish --dry-run
npm run in-core -- npm publish
```

Deploy the website (this may be done at any time, but it's good to do it with a release):
```sh
npm run in-website -- npm run deploy
```

