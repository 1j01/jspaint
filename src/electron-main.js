const { app, shell, session, dialog, ipcMain, BrowserWindow, Menu, MenuItem } = require("electron");
const fs = require("fs");
const path = require("path");
const { ArgumentParser, SUPPRESS } = require("argparse");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	app.quit();
	// `app.quit` does not immediately exit the process.
	return;
}

const parser = new ArgumentParser({
	prog: "jspaint",
	description: "MS Paint in JavaScript, running in Electron.",
});

parser.add_argument("file_path", {
	help: "Image file to open",
	nargs: "?", // "?" indicates 0 or 1 arguments: it's optional
});

parser.add_argument("-v", "--version", {
	action: "version",
	version: require("../package.json").version,
});

// Squirrel.Windows passes "-squirrel-firstrun" when the app is first run after being installed.
// Other Squirrel.Windows event argument are handled by `electron-squirrel-startup`, which returns whether it handled an event.
// This could be used to show a "Thanks for installing" message or some such, but just hide and ignore it for now.
parser.add_argument("-s", "--squirrel-firstrun", {
	help: SUPPRESS,
	action: "store_true",
});

// Compare command line arguments:
// - unpackaged (in development):      "path/to/electron.exe" "." "maybe/a/file.png"
// - packaged (usually in production): "path/to/jspaint.exe" "maybe/a/file.png"
const { isPackaged } = app;
const args_array = process.argv.slice(isPackaged ? 1 : 2);
const args = parser.parse_args(args_array);

// After argument parsing that may have exited the app, handle single instance behavior.
// In other words, the priority is:
// - Squirrel event arguments (other than `--squirrel-firstrun`) which exit the app
// - `--help` or `--version` which print a message and exit the app
// - Opening an existing instance and exiting the app, forwarding arguments to the existing instance
// (If it quit because there was an existing instance before handling `--help`,
// you wouldn't get any help at the command line if the app was running.)

// Note: The "second-instance" event has an `argv` argument but it's unusably broken,
// and the documented workaround is to pass the arguments as `additionalData` here.
// https://www.electronjs.org/docs/api/app#event-second-instance
const got_single_instance_lock = app.requestSingleInstanceLock({
	argv: args_array,
});

// Note: If the main process crashes during the "second-instance" event, the second instance will get the lock,
// even if the first instance is still showing an error dialog.
if (!got_single_instance_lock) {
	console.log("Already running. Opening in existing instance.");
	app.quit();
	// `app.quit` does not immediately exit the process.
	// Return to avoid errors / main window briefly appearing.
	//   [52128:0304/194956.188:ERROR:cache_util_win.cc(20)] Unable to move the cache: Access is denied. (0x5)
	//   [52128:0304/194956.189:ERROR:cache_util.cc(145)] Unable to move cache folder C:\Users\Isaiah\AppData\Roaming\Electron\GPUCache to C:\Users\Isaiah\AppData\Roaming\Electron\old_GPUCache_000
	//   [52128:0304/194956.189:ERROR:disk_cache.cc(196)] Unable to create cache
	//   [52128:0304/194956.189:ERROR:shader_disk_cache.cc(613)] Shader Cache Creation failed: -2
	return;
} else {
	console.log("Got single instance lock.");
	// When a second instance is opened, the "second-instance" event will be emitted in the this instance.
	// See handler below.
}

app.enableSandbox();
app.commandLine.appendSwitch("high-dpi-support", 1);
app.commandLine.appendSwitch("force-device-scale-factor", 1);

// Reloading and dev tools shortcuts
const isDev = process.env.ELECTRON_DEBUG === "1" || !isPackaged;
if (isDev) {
	require("electron-debug")({ showDevTools: false });
}

// @TODO: let user apply this setting somewhere in the UI (togglable)
// (Note: it would be better to use REG.EXE to apply the change, rather than a .reg file)
// This registry modification changes the right click > Edit option for images in Windows Explorer
// ...or in Windows 11, the right click > More Options > Edit option, increasingly buried and useless.
// Also, currently, this points to a specific version of the app e.g. "C:\Users\Isaiah\AppData\Local\jspaint\app-1.0.0\jspaint.exe" instead of "C:\Users\Isaiah\AppData\Local\jspaint\jspaint.exe"
// I guess this wouldn't be a problem if it manages the registry on every update, but it's manual for now, so it will break on any update.
// FOR NOW, I'm recommending that users use the "Open with" dialog and paste in the path to the exe manually.
const reg_contents = `Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\\SystemFileAssociations\\image\\shell\\edit\\command]
@="\\"${process.argv[0].replace(/\\/g, "\\\\")}\\" ${isPackaged ? "" : '\\".\\" '}\\"%1\\""
`; // oof that's a lot of escaping \\
////                                \\\\
//  /\   /\   /\   /\   /\   /\   /\  \\
// //\\ //\\ //\\ //\\ //\\ //\\ //\\ \\
//  ||   ||   ||   ||   ||   ||   ||  \\
//\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\
const reg_file_path = path.join(
	isPackaged ? path.dirname(process.argv[0]) : ".",
	`set-jspaint${isPackaged ? "" : "-DEV-MODE"}-as-default-image-editor.reg`
);
if (process.platform == "win32" && isPackaged) {
	fs.writeFile(reg_file_path, reg_contents, (err) => {
		if (err) {
			return console.error(err);
		}
	});
}

// In case of XSS holes, don't give the page free reign over the filesystem!
// Only allow allow access to files explicitly opened by the user.
const allowed_file_paths = [];

let initial_file_path;
if (args.file_path) {
	initial_file_path = path.resolve(args.file_path);
	allowed_file_paths.push(initial_file_path);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
// @TODO: It's been several electron versions. I doubt this is still necessary. (It was from a boilerplate.)
/** @type {BrowserWindow | undefined} */
let editor_window;

const createWindow = () => {
	// Create the browser window.
	editor_window = new BrowserWindow({
		useContentSize: true,
		autoHideMenuBar: true, // it adds height for a native menu bar unless we hide it here
		// setMenu(null) below is too late; it's already decided on the size by then
		width: 800,
		height: 600,
		minWidth: 260,
		minHeight: 360,
		icon: path.join(__dirname, "../images/icons",
			process.platform === "win32" ?
				"jspaint.ico" :
				process.platform === "darwin" ?
					"jspaint.icns" :
					"48x48.png"
		),
		title: "JS Paint",
		webPreferences: {
			preload: path.join(__dirname, "/electron-injected.js"),
			contextIsolation: false,
		},
	});

	// @TODO: maybe use the native menu for the "Modern" theme, or a "Native" theme
	editor_window.setMenu(null);

	// and load the index.html of the app.
	editor_window.loadURL(`file://${__dirname}/../index.html`);

	// Emitted when the window is closed.
	editor_window.on("closed", () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		editor_window = null;
	});

	// Emitted before the window is closed.
	editor_window.on("close", (event) => {
		// Don't need to check editor_window.isDocumentEdited(),
		// because the (un)edited state is handled by the renderer process, in are_you_sure().
		// Note: if the web contents are not responding, this will make the app harder to close.
		// Similarly, if there's an error, the app will be harder to close (perhaps worse as it's less likely to show a Not Responding dialog).
		// And this also prevents it from closing with Ctrl+C in the terminal, which is arguably a feature.
		// TODO: focus window if it's not focused, which can happen via right clicking the dock/taskbar icon, or Ctrl+C in the terminal
		// (but ideally not if it's going to close without prompting)
		editor_window.webContents.send("close-window-prompt");
		event.preventDefault();
	});

	// Open links without target=_blank externally.
	editor_window.webContents.on("will-navigate", (e, url) => {
		// check that the URL is not part of the app
		if (!url.includes("file://")) {
			e.preventDefault();
			shell.openExternal(url);
		}
	});
	// Open links with target=_blank externally.
	editor_window.webContents.setWindowOpenHandler(({ url }) => {
		// check that the URL is not part of the app
		if (!url.includes("file://")) {
			shell.openExternal(url);
		}
		return { action: "deny" };
	});

	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				// connect-src needs data: for loading from localStorage,
				// and maybe blob: for loading from IndexedDB in the future.
				// (It uses fetch().)
				// Note: this should mirror the CSP in index.html, except maybe for firebase stuff.
				"Content-Security-Policy": [`
					default-src 'self';
					style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
					img-src 'self' data: blob: http: https:;
					font-src 'self' https://fonts.gstatic.com;
					connect-src * data: blob:;
				`],
			},
		});
	});

	// Allow write access to files dropped onto the window.
	// I'm not sure if this is more secure than handling it in the preload script with IPC,
	// but it might be, due to the isolated context.
	// TODO: is there a way to intercept drag and drop from the main process directly?
	// "will-navigate" isn't sent even if the app's dragstart/dragover/drop handlers are disabled.
	// If there was an event for dropped files, or an API like wasFileDropped(filePath) or more generally,
	// wasFileOpenedByUserGesture(filePath), that would allow for tighter control.
	// Right now the renderer process tells the main process what file paths are allowed,
	// which is not ideal, although it's within an isolated world, and even separate from the preload script.
	// For file dialogs and command line arguments and all the other ways to open files,
	// the file list is managed exclusively by the main process, so drag and drop is the weak link.
	// If drag and drop could be handled by the main process, it would be more secure overall.
	editor_window.webContents.on("did-finish-load", () => {
		// Could use contextBridge, but re-registering an event listener recursively was easier.
		// It's a pattern I've done before, and this code actually worked on the first try.
		function handle_one_drop() {
			editor_window.webContents.executeJavaScriptInIsolatedWorld(777, [
				{
					code: `
						new Promise((resolve, reject) => {
							// The app's normal drag and drop handling will take care of dragstart, dragover,
							// and actually opening files. This is just to allow write access to the dropped file.
							window.addEventListener("drop", (event) => {
								const file_path = event.dataTransfer.files[0].path;
								resolve(file_path);
							}, { once: true });
						})
					`,
				},
			]).then((file_path) => {
				console.log("Allowing write access to dropped file:", file_path);
				allowed_file_paths.push(file_path);
				editor_window.webContents.send("open-file", file_path);
				handle_one_drop();
			});
		}
		handle_one_drop();
	});
};

// Register listeners outside of createWindow to avoid them being added multiple times
// on macOS, where the app is not actually closed when the window is closed,
// and thus it can be opened multiple times from the same electron main process.
// (It causes an error in the case of handle() but not on().)
//     Error: Attempted to register a second handler for 'show-save-dialog'
// I'm using an indented block here just to avoid a large git diff, for now.
{
	ipcMain.on("get-env-info", (event) => {
		const env_info = {
			isDev,
			isMacOS: process.platform === "darwin",
			initialFilePath: initial_file_path,
		};
		event.returnValue = env_info;
		// not sure if this is the best way to do this, but like,
		// it shouldn't open the file if the window is closed and re-opened, right?
		initial_file_path = null;
	});
	ipcMain.on("set-represented-filename", (_event, filePath) => {
		// filePath of "" is used to reset the title bar's filename,
		// and "" isn't in the allow list.
		if (!allowed_file_paths.includes(filePath)) {
			filePath = "";
		}
		editor_window.setRepresentedFilename(filePath);
	});
	ipcMain.on("set-document-edited", (_event, isEdited) => {
		editor_window.setDocumentEdited(isEdited);
	});
	let request_counter = 0;
	ipcMain.on("set-menus", (_event, menusJSON) => {
		// Parse the JSON, reviving functions.
		const menus = JSON.parse(menusJSON, (_key, value) => {
			if (typeof value === "string" && value.startsWith("$$function$$")) {
				const function_id = Number(value.slice("$$function$$".length));
				return () => {
					// https://www.electronjs.org/docs/latest/tutorial/ipc#optional-returning-a-reply
					// "There's no equivalent for ipcRenderer.invoke for main-to-renderer IPC.
					// Instead, you can send a reply back to the main process from within the ipcRenderer.on callback."
					// Kinda lame but OK.
					// There's also no sendSync, so I have to make the (un)marshalled functions return Promises,
					// deviating from OS-GUI's API.
					const this_request_id = ++request_counter;
					editor_window?.webContents.send("menu-function", function_id, this_request_id);
					return new Promise((resolve, _reject) => {
						ipcMain.once(`menu-function-result-${this_request_id}`, (_event, result) => {
							resolve(result);
						});
					});
				};
			}
			return value;
		});

		// Adapt the structure defined in menus.js to the Electron Menu API.
		// const menus = {
		// 	"&Example": [
		// 		{
		// 			label: "&Nothing",
		// 			shortcut?: "Ctrl+N",
		// 			speech_recognition?: ["nothing", "no-op"],
		// 			action?: () => { },
		// 			description?: "Does nothing. This is an example.",
		// 			submenu?: [ ... ],
		// 			enabled?: () => true, // or a plain boolean
		// 			emoji_icon?: "🚫", // not part of OS-GUI.js, just jspaint
		// 			checkbox?: { // exclusive with action and submenu
		// 				toggle?: () => { },
		// 				check?: () => true,
		// 			},
		// 		},
		// 	],
		// 	"MENU_DIVIDER",
		// 	...
		// };
		const menubar = new Menu();
		const intervalIDs = [];
		editor_window.once("closed", () => {
			for (const intervalID of intervalIDs) {
				clearInterval(intervalID);
			}
			function disable_menu(menu) {
				// TypeError: menu.items is not iterable
				// for (const menu_item of menu.items) {
				for (let i = 0; i < menu.items.length; i++) {
					const menu_item = menu.items[i];
					if (menu_item.submenu) {
						disable_menu(menu_item.submenu);
					} else {
						menu_item.enabled = false;
					}
				}
			}
			disable_menu(menubar);
		});
		if (process.platform === "darwin") {
			// @TODO: localize like other menus
			menubar.append(new MenuItem({
				label: "JS Paint",
				submenu: [
					{
						label: "About JS Paint",
						click: () => {
							// TODO handle editor_window closed on macOS
							editor_window?.webContents.send("show-about-dialog");
						},
					},
					{ type: "separator" },
					{
						label: "Services",
						role: "services",
						submenu: [],
					},
					{ type: "separator" },
					{
						label: "Hide JS Paint",
						role: "hide",
					},
					{
						label: "Hide Others",
						role: "hideothers",
					},
					{
						label: "Show All",
						role: "unhide",
					},
					{ type: "separator" },
					{
						label: "Quit JS Paint",
						role: "quit",
					},
				],
			}));
		}
		for (const menu_key in menus) {
			const menu = menus[menu_key];
			menubar.append(new MenuItem({
				label: menu_key,
				submenu: makeMenu(menu),
			}));
		}

		/**
		 * @param {OSGUIMenuFragment[]} menu_items
		 * @returns {MenuItem[]}
		 */
		function makeMenu(menu_items) {
			return menu_items.map((menu_item) => {
				if (menu_item === "MENU_DIVIDER") {
					return { type: "separator" };
				}
				const electron_menu_item = new MenuItem({
					// Emoji actually look terrible in macOS (mojave at least),
					// they get super blown out when white from the canvas shows through.
					// @TODO: remove emoji or try using `icon` field,
					// either by rendering emoji with <canvas> in the renderer process
					// or by designing custom icons.
					label:
						(menu_item.emoji_icon ? menu_item.emoji_icon + " " : "") +
						menu_item.label,
					// There's some hacky translation of shortcuts here,
					// but the app supports Cmd for all Ctrl shortcuts.
					// @TODO: use "CmdOrCtrl", make OS-GUI.js support it, and simplify this.
					accelerator:
						menu_item.shortcut ?
							menu_item.shortcut
								.replace(/^F4$/, "Shift+Cmd+Z")
								.replace(/Ctrl/g, "Cmd") :
							undefined,
					// Fix Cmd+C/Cmd+V etc. in devtools, let renderer process handle it.
					// `role: "copy"` might work better, and handle text selections as well,
					// but handling text selections from the non-native Edit menu is still TODO anyways,
					// so might as well implement that instead if possible.
					registerAccelerator: false,
					//
					click: () => menu_item.action(),
					submenu: menu_item.submenu ? makeMenu(menu_item.submenu) : undefined,
					type: menu_item.checkbox ? "checkbox" : undefined,
					// @TODO: disable menu items when window is closed, and
					// make File > Exit work on macOS or hide it since it's redundant with Quit JS Paint
					// Right now it gets an Uncaught Exception:
					// TypeError: Cannot read properties of null (reading 'webContents')
					enabled:
						typeof menu_item.enabled === "function" ?
							true : // dynamically updated below, don't need `await menu_item.enabled()`
							(menu_item.enabled ?? true),
				});
				if (typeof menu_item.enabled === "function") {
					// @TODO: avoid polling (OS-GUI.js queries the state when showing the menu, but I doubt that's an option for the native menus)
					intervalIDs.push(setInterval(async () => {
						// OS-GUI.js doesn't use Promises here but the (un)marshalled functions do.
						electron_menu_item.enabled = editor_window?.webContents && await menu_item.enabled();
					}, 100));
				}
				if (menu_item.checkbox) {
					electron_menu_item.type = "checkbox";
					if (menu_item.checkbox.check) {
						intervalIDs.push(setInterval(async () => {
							// OS-GUI.js doesn't use Promises here but the (un)marshalled functions do.
							electron_menu_item.checked = await menu_item.checkbox.check();
						}, 100));
					}
					electron_menu_item.click = () => menu_item.checkbox.toggle?.();
				}
				return electron_menu_item;
			});
		}

		Menu.setApplicationMenu(menubar);
	});
	ipcMain.handle("show-save-dialog", async (_event, options) => {
		const { filePath, canceled } = await dialog.showSaveDialog(editor_window, {
			title: options.title,
			// defaultPath: options.defaultPath,
			defaultPath: options.defaultPath || (options.defaultFileName ? path.basename(options.defaultFileName) : undefined),
			filters: options.filters,
		});
		const fileName = path.basename(filePath);
		allowed_file_paths.push(filePath);
		return { filePath, fileName, canceled };
	});
	ipcMain.handle("show-open-dialog", async (_event, options) => {
		const { filePaths, canceled } = await dialog.showOpenDialog(editor_window, {
			title: options.title,
			defaultPath: options.defaultPath,
			filters: options.filters,
			properties: options.properties,
		});
		allowed_file_paths.push(...filePaths);
		return { filePaths, canceled };
	});
	ipcMain.handle("write-file", async (_event, file_path, data) => {
		if (!allowed_file_paths.includes(file_path)) {
			return { responseCode: "ACCESS_DENIED" };
		}
		// make sure data is an ArrayBuffer, so you can't use an options object for (unknown) evil reasons
		if (data instanceof ArrayBuffer) {
			try {
				await fs.promises.writeFile(file_path, Buffer.from(data));
			} catch (error) {
				return { responseCode: "WRITE_FAILED", error };
			}
			return { responseCode: "SUCCESS" };
		} else {
			return { responseCode: "INVALID_DATA" };
		}
	});
	ipcMain.handle("read-file", async (_event, file_path) => {
		if (!allowed_file_paths.includes(file_path)) {
			return { responseCode: "ACCESS_DENIED" };
		}
		try {
			const buffer = await fs.promises.readFile(file_path);
			return { responseCode: "SUCCESS", data: new Uint8Array(buffer), fileName: path.basename(file_path) };
		} catch (error) {
			return { responseCode: "READ_FAILED", error };
		}
	});
	ipcMain.handle("set-wallpaper", async (_event, data) => {
		const image_path = path.join(app.getPath("userData"), "bg.png"); // Note: used without escaping
		if (!(data instanceof ArrayBuffer)) {
			return { responseCode: "INVALID_DATA" };
		}
		data = new Uint8Array(data);
		const png_magic_bytes = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
		for (let i = 0; i < png_magic_bytes.length; i++) {
			if (data[i] !== png_magic_bytes[i]) {
				console.log("Found bytes:", data.slice(0, png_magic_bytes.length), "but expected:", png_magic_bytes);
				return { responseCode: "INVALID_PNG_DATA" };
			}
		}
		try {
			await fs.promises.writeFile(image_path, Buffer.from(data));
		} catch (error) {
			return { responseCode: "WRITE_TEMP_PNG_FAILED", error };
		}

		// The wallpaper module actually has support for Xfce, but it's not general enough.
		const bash_for_xfce = `xfconf-query -c xfce4-desktop -l | grep last-image | while read path; do xfconf-query -c xfce4-desktop -p $path -s '${image_path}'; done`;
		const { lookpath } = require("lookpath");
		if (await lookpath("xfconf-query") && await lookpath("grep")) {
			const exec = require("util").promisify(require("child_process").exec);
			try {
				await exec(bash_for_xfce);
			} catch (error) {
				console.error("Error setting wallpaper for Xfce:", error);
				return { responseCode: "XFCONF_FAILED", error };
			}
			return { responseCode: "SUCCESS" };
		} else {
			// Note: { scale: "center" } is only supported on macOS.
			// I worked around this by providing an image with a transparent margin on other platforms,
			// in setWallpaperCentered.
			return new Promise((resolve, _reject) => {
				require("wallpaper").set(image_path, { scale: "center" }, (error) => {
					if (error) {
						resolve({ responseCode: "SET_WALLPAPER_FAILED", error });
					} else {
						resolve({ responseCode: "SUCCESS" });
					}
				});
			});
			// Newer promise-based wallpaper API that I can't import:
			// try {
			// 	await setWallpaper(image_path, { scale: "center" });
			// } catch (error) {
			// 	return { responseCode: "SET_WALLPAPER_FAILED", error };
			// }
			// return { responseCode: "SUCCESS" };
		}
	});
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

async function activate_app() {
	await app.whenReady();
	if (editor_window) {
		console.log("Focusing existing window.");
		// show() handles focus, un-minimizing, and bringing to front.
		// focus() and restore() doesn't bring to front on macOS.

		// However, on Windows, show() causes the window to become un-snapped from the corner/edge of the screen,
		// and may end up significantly off-screen. https://github.com/electron/electron/issues/25359

		// Here's some more people dealing with these pitfalls in various ways:
		// https://stackoverflow.com/questions/70925355/why-does-win-focus-not-bring-the-window-to-the-front
		// "If you want the window to be brought to the front, you'll have to get more creative."
		if (process.platform === "win32") {
			if (editor_window.isMinimized()) {
				editor_window.restore();
			}
			editor_window.focus();
		} else {
			editor_window.show();
		}
	} else {
		console.log("Creating window.");
		createWindow();
	}
}

function open_file_in_app(file_path) {
	allowed_file_paths.push(file_path);
	if (editor_window) {
		console.log("Telling existing editor window to open file.");
		editor_window.webContents.send("open-file", file_path);
	} else {
		console.log("Setting initial file path to be opened when window is ready.");
		initial_file_path = file_path;
	}
}

// Note: to test dragging a file onto the dock in macOS, the app needs to be packaged,
// since the dock icon doesn't accept files without CFBundleDocumentTypes defined in Info.plist,
// which tells macOS what files can be opened with the app, and Info.plist is generated by Electron Forge,
// configured with `extendInfo` in forge.config.js.
// It may be possible to test this in development by copying the Info.plist outside the package,
// or somehow, though I haven't seen any evidence of anyone achieving that.
// Worst case scenario, I guess you could edit files within the package to iterate more quickly,
// possibly with some symbolic links or rsync or something.
app.on("open-file", (event, file_path) => {
	// Emitted when dragging a file onto the dock on macOS (when the app was NOT running),
	// or when opening a file from the file manager (when the app WAS already running),
	// either via Open With or dragging a file onto the desktop icon.

	// NOTE: if implementing support for multiple editor windows, make sure not to create two windows at startup.
	// Right now activate_app checks for an existing window, and both "open-file" and the initial general window creation use it.

	event.preventDefault();
	console.log("open-file", file_path);
	activate_app();
	open_file_in_app(file_path);
});

app.on("second-instance", (_event, uselessCorruptedArgv, workingDirectory, additionalData) => {
	// Someone tried to run a second instance, we should focus our window,
	// and handle the file path if there is one.

	// Note: the "second-instance" event sends a broken argv which may rearrange and add extra arguments,
	// so we have to use the `additionalData` object, passed from `requestSingleInstanceLock`.
	// This hack is recommended in the docs: https://www.electronjs.org/docs/api/app#event-second-instance
	console.log("second-instance", uselessCorruptedArgv, workingDirectory, additionalData);

	activate_app();

	// I was glad when I finally saw there was at least an official workaround for the broken argv,
	// as I was very much ready to be done with this complicated nonsense.
	// Unfortunately, it turns out `additionalData` is buggy too, and becomes null under some obscure conditions.
	// To reproduce it:
	//   Terminal 1:  npx electron .
	//   Terminal 2:  npx electron .
	// Empty arrays seem to cause the problem, but it's dependent on key order and key names.
	// Odd-length key names seem to be unaffected, in isolation.
	// I could rename "argv" to "arguments" and it would likely work,
	// but I wouldn't feel comfortable removing this safeguard anyway until it's better understood,
	// and hopefully fixed.
	// https://github.com/electron/electron/issues/40615
	if (!additionalData) {
		console.log(`second-instance: additionalData === ${additionalData}, likely due to an empty list of command-line arguments.`);
		return;
	}

	const argv = additionalData.argv;
	const args = parser.parse_args(argv);
	if (args.file_path) {
		const file_path = path.resolve(workingDirectory, args.file_path);
		console.log("second-instance: Opening file from second instance:", file_path);
		open_file_in_app(file_path);
	}
});

// On OS X it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
// Don't really need focus/restore logic of activate_app here,
// as I believe macOS will do that, but it's simpler to just call activate_app.
app.on("activate", activate_app);

// Create the main window when Electron is ready.
// Use `activate_app` instead of `app.on("ready", createWindow)`, because it includes a check for an existing window,
// so it could avoid potentially creating two windows at startup (though I suspect the event order would prevent that).
activate_app();

// Test cases for opening files in the app:
//
//                                                                    |                                                                     |
//                                                                    |                     App State Before Action                         |
//                                                                    | ------------------------------------------------------------------- |
// | Operating System | Action                                        | App Window Open | App Running with No Windows | App Completely Quit |
// | ---------------- | --------------------------------------------- | --------------- | --------------------------- | ------------------- |
// | 🍏 Mac           | Open With[1]                                  |                 |                             |                     |
// | 🍏 Mac           | Drag onto dock icon                           |                 |                             |                     |
// | 🍏 Mac           | Drag onto desktop icon                        |                 |                             |                     |
// | 🍏 Mac           | Drag onto app window directly                 |                 | N/A                         | N/A                 |
// | 🍏 Mac           | Drag onto app window after hovering dock icon | [3]             | N/A                         | N/A                 |
// | 🍏 Mac           | File > Open                                   |                 | N/A [4]                     | N/A                 |
// | 🪟 Windows       | Open With[1]                                  |                 | N/A                         |                     |
// | 🪟 Windows       | Drag onto taskbar icon                        | N/A             | N/A                         | N/A                 |
// | 🪟 Windows       | Drag onto JS Paint shortcut desktop icon      |                 | N/A                         |                     |
// | 🪟 Windows       | Drag onto app window                          |                 | N/A                         | N/A                 |
// | 🪟 Windows       | File > Open in app                            |                 | N/A                         | N/A                 |
// | 🐧 Ubuntu        | Open With[1]                                  |                 | N/A                         |                     |
// | 🐧 Ubuntu        | Drag onto dock icon                           | N/A             | N/A                         | N/A                 |
// | 🐧 Ubuntu        | Drag onto desktop icon[2]                     |                 | N/A                         |                     |
// | 🐧 Ubuntu        | Drag onto app window                          |                 | N/A                         | N/A                 |
// | 🐧 Ubuntu        | File > Open                                   |                 | N/A                         | N/A                 |
//
// [1] On Mac, make sure to test with Open With > Other... > Cmd+Shift+G, paste ~/Projects/jspaint/out/make/zip/darwin/x64/JS Paint.app
//     even if JS Paint shows up in the list, because it might not be the one you expect.
// [2] I've tested this by dragging onto the /lib/jspaint/jspaint binary so far.
// [3] This seems to be broken, but I don't know if macOS supports it.
//     It would be a middle ground between having the app as a target and a specific point on a window,
//     so they might not have an API for it, or it may be uncommon to implement at the app level.
//     I'm not familiar enough with macOS to say.
// [4] Not applicable until/unless I add native menus with File > Open, since macOS menu bar is present without windows.
