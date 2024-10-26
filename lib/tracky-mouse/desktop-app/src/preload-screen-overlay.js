// This script is injected into the screen overlay window, before other scripts,
// with privileged access to the electron API, which it should expose in a limited way.
// That said, mouse control is pretty powerful, so it's important to keep it secure.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	onChangeDwellClicking: (callback) => ipcRenderer.on('change-dwell-clicking', callback),
	// Note terrible naming inconsistency.
	onMouseMove: (callback) => ipcRenderer.on('move-mouse', callback),

	// This is pretty weird but I'm giving the overlay window control over clicking,
	// whereas the app window has control over moving the mouse.
	// The app window has the head tracker, which moves the mouse,
	// and the overlay window handles the dwell clicking (rendering, and, in this case, clicking).
	// It's quite the hacky architecture.
	// A more sane architecture might have the overlay window, which can't receive any input directly,
	// as purely a visual output, rather than containing business logic for handling clicks.
	// But this let me reuse my existing code for dwell clicking, without tearing it apart.

	mouseClick: (x, y) => ipcRenderer.send('click', x, y, performance.now()),
});
