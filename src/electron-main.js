const { app, BrowserWindow } = require('electron');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
	app.quit();
}

if (require('electron-is-dev')){
	require('electron-debug')({ showDevTools: false });
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		useContentSize: true,
		autoHideMenuBar: true, // it adds height for a native menu bar unless we hide it here
		// setMenu(null) below is too late; it's already decided on the size by then
		width: 800,
		height: 600,
		minWidth: 260,
		minHeight: 360,
		icon: require("path").join(__dirname, "../images/icons",
			process.platform === "win32" ?
				"windows.ico" :
				process.platform === "darwin" ?
					"mac.icns" :
					"48.png"
		),
		title: "JS Paint",
		webPreferences: {
			preload: require("path").join(__dirname, "/electron-injected.js"),
		},
	});

	// @TODO: maybe use the native menu for the "Modern" theme
	mainWindow.setMenu(null);

	// and load the index.html of the app.
	mainWindow.loadURL(`file://${__dirname}/../index.html`);

	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});

	const handleRedirect = (e, url) => {
		// check that the URL is not part of the app
		if(!url.includes("file://")){
			e.preventDefault();
			require('electron').shell.openExternal(url);
		}
	};
	// Open links without target=_blank externally.
	mainWindow.webContents.on('will-navigate', handleRedirect);
	// Open links with target=_blank externally.
	mainWindow.webContents.on('new-window', handleRedirect);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
