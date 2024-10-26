// Copyright (c) 2011-2022 GitHub Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

let setxPath;
const { app } = require('electron');
const fs = require('fs-plus');
const path = require('path');
const Spawner = require('./spawner');
// const WinShell = require('./win-shell');
const WinPowerShell = require('./win-powershell');

const appFolder = path.resolve(process.execPath, '..');
const rootTrackyMouseFolder = path.resolve(appFolder, '..');
const binFolder = path.join(rootTrackyMouseFolder, 'bin');
const updateDotExe = path.join(rootTrackyMouseFolder, 'Update.exe');
const execName = path.basename(app.getPath('exe'));

if (process.env.SystemRoot) {
	const system32Path = path.join(process.env.SystemRoot, 'System32');
	setxPath = path.join(system32Path, 'setx.exe');
} else {
	setxPath = 'setx.exe';
}

// Spawn setx.exe and callback when it completes
const spawnSetx = (args, callback) => Spawner.spawn(setxPath, args, callback);

// Spawn the Update.exe with the given arguments and invoke the callback when
// the command completes.
const spawnUpdate = (args, callback) =>
	Spawner.spawn(updateDotExe, args, callback);

// Add `tracky-mouse` to the `PATH`
//
// This is done by adding .cmd shims to the root bin folder in the Tracky Mouse
// install directory that point to the newly installed versions inside
// the versioned app directories.
const addCommandsToPath = callback => {
	const cmdName = execName.replace('.exe', '.cmd');
	const shName = execName.replace('.exe', '');

	const installCommands = callback => {
		const cmdPath = path.join(binFolder, cmdName);
		// const relativeCmdPath = path.relative(
		// 	binFolder,
		// 	path.join(appFolder, 'resources', 'cli', 'tracky-mouse.cmd')
		// );
		// const command = `@echo off\r\n"%~dp0\\${relativeCmdPath}" %*`;
		const relativeExePath = path.relative(
			binFolder,
			path.join(appFolder, 'tracky-mouse.exe')
		);
		const command = `@echo off\r\n"%~dp0\\${relativeExePath}" %*`;

		const shCommandPath = path.join(binFolder, shName);
		// const relativeShPath = path.relative(
		// 	binFolder,
		// 	path.join(appFolder, 'resources', 'cli', 'tracky-mouse.sh')
		// );
		// const shCommand = `#!/bin/sh\r\n"$(dirname "$0")/${relativeShPath.replace(
		// 	/\\/g,
		// 	'/'
		// )}" "$@"\r\necho`;
		const shCommand = `#!/bin/sh\r\n"$(dirname "$0")/${relativeExePath.replace(
			/\\/g,
			'/'
		)}" "$@"\r\necho`;

		fs.writeFile(cmdPath, command, () =>
			fs.writeFile(shCommandPath, shCommand, () => callback())
		);
	};

	const addBinToPath = (pathSegments, callback) => {
		pathSegments.push(binFolder);
		const newPathEnv = pathSegments.join(';');
		spawnSetx(['Path', newPathEnv], callback);
	};

	installCommands(error => {
		if (error) return callback(error);

		WinPowerShell.getPath((error, pathEnv) => {
			if (error) return callback(error);

			const pathSegments = pathEnv
				.split(/;+/)
				.filter(pathSegment => pathSegment);
			if (pathSegments.indexOf(binFolder) === -1) {
				addBinToPath(pathSegments, callback);
			} else {
				callback();
			}
		});
	});
};

// Remove `tracky-mouse` from the `PATH`
const removeCommandsFromPath = callback =>
	WinPowerShell.getPath((error, pathEnv) => {
		if (error != null) {
			return callback(error);
		}

		const pathSegments = pathEnv
			.split(/;+/)
			.filter(pathSegment => pathSegment && pathSegment !== binFolder);
		const newPathEnv = pathSegments.join(';');

		if (pathEnv !== newPathEnv) {
			return spawnSetx(['Path', newPathEnv], callback);
		} else {
			return callback();
		}
	});

// Create a desktop and start menu shortcut by using the command line API
// provided by Squirrel's Update.exe
const createShortcuts = (locations, callback) =>
	spawnUpdate(
		['--createShortcut', execName, '-l', locations.join(',')],
		callback
	);

// Update the desktop and start menu shortcuts by using the command line API
// provided by Squirrel's Update.exe
const updateShortcuts = callback => {
	const homeDirectory = fs.getHomeDirectory();
	if (homeDirectory) {
		const desktopShortcutPath = path.join(
			homeDirectory,
			'Desktop',
			`${app.getName()}.lnk`
		);
		// Check if the desktop shortcut has been previously deleted and
		// and keep it deleted if it was
		fs.exists(desktopShortcutPath, desktopShortcutExists => {
			const locations = ['StartMenu'];
			if (desktopShortcutExists) {
				locations.push('Desktop');
			}

			createShortcuts(locations, callback);
		});
	} else {
		createShortcuts(['Desktop', 'StartMenu'], callback);
	}
};

// Remove the desktop and start menu shortcuts by using the command line API
// provided by Squirrel's Update.exe
const removeShortcuts = callback =>
	spawnUpdate(['--removeShortcut', execName], callback);

exports.spawn = spawnUpdate;

// Is the Update.exe installed with Tracky Mouse?
exports.existsSync = () => fs.existsSync(updateDotExe);

// Restart Tracky Mouse using the version pointed to by the tracky-mouse.cmd shim
exports.restartTrackyMouse = () => {
	let args;
	const cmdName = execName.replace('.exe', '.cmd');

	// if (global.atomApplication && global.atomApplication.lastFocusedWindow) {
	// 	const { projectPath } = global.atomApplication.lastFocusedWindow;
	// 	if (projectPath) args = [projectPath];
	// }
	Spawner.spawn(path.join(binFolder, cmdName), args);
	app.quit();
};

// const updateContextMenus = callback =>
// 	WinShell.fileContextMenu.update(() =>
// 		WinShell.folderContextMenu.update(() =>
// 			WinShell.folderBackgroundContextMenu.update(() => callback())
// 		)
// 	);

// Handle squirrel events denoted by --squirrel-* command line arguments.
exports.handleStartupEvent = squirrelCommand => {
	switch (squirrelCommand) {
		case '--squirrel-install':
			createShortcuts(['Desktop', 'StartMenu'], () =>
				addCommandsToPath(() =>
					app.quit()
					// WinShell.fileHandler.register(() =>
					// 	updateContextMenus(() => app.quit())
					// )
				)
			);
			return true;
		case '--squirrel-updated':
			updateShortcuts(() =>
				addCommandsToPath(() =>
					app.quit()
					// WinShell.fileHandler.update(() =>
					// 	updateContextMenus(() => app.quit())
					// )
				)
			);
			return true;
		case '--squirrel-uninstall':
			app.setLoginItemSettings({ openAtLogin: false });
			removeShortcuts(() =>
				removeCommandsFromPath(() =>
					app.quit()
					// WinShell.fileHandler.deregister(() =>
					// 	WinShell.fileContextMenu.deregister(() =>
					// 		WinShell.folderContextMenu.deregister(() =>
					// 			WinShell.folderBackgroundContextMenu.deregister(() =>
					// 				app.quit()
					// 			)
					// 		)
					// 	)
					// )
				)
			);
			return true;
		case '--squirrel-obsolete':
			app.quit();
			return true;
		default:
			return false;
	}
};
