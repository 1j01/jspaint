module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{html,wav,xml,json,js,mjs,png,ico,jpg,css,gif,hhc,hhk,htm,svg,webmanifest}'
	],
	globIgnores: [
		"node_modules/**", // Node modules (default, but needs inclusion when overriding)
		"package.json", // Node package
		"package-lock.json", // Node package
		"out/**", // Electron app build
		".history/**", // VS Code "Local History" extension (just in case?)
		".vscode/**", // VS Code settings
		"jsconfig.json", // VS Code JavaScript config
		".git/**", // Git (just in case?)
		"test*.html", // Test page(s)
		"about.html", // About page (homepage for the project)
		"src/simulate-random-gestures.js", // Test script
		"src/extra-tools.js", // experimental feature, disabled
		"src/electron-main.js", // Electron app entry point
		"src/electron-injected.js", // Electron app injected script
		"localization/preprocess.js", // script to prepare translation files
		"localization/parse-rc-file.js", // used by preprocess.js
		"images/meta/**", // images for README.md
		"images/about/**", // images for about.html
		"images/anypalette-logo-128x128.png", // should be in meta folder, no?
		"images/mspaint-win98-reference*", // screenshots used during dev for achieving pixel-perfection
		"images/**/*1bpp*", // monochrome icons (unused)
		"images/winter/present.png", // used by news indicator
		"cypress/**", // Cypress tests and snapshots
		"cypress.json", // Cypress config
		"lib/pdf.js/web/**", // PDF.js's UI, not used
		"lib/tracky-mouse/tracky-mouse-electron/**", // Tracky Mouse desktop app
		"lib/tracky-mouse/images/**", // Tracky Mouse logo icons
		"lib/tracky-mouse/lib/**", // clmtrackr.js, TensorFlow, and Facemesh models...
		// are quite large! The Tracky Mouse UI is not part of the core of the app,
		// it's more of a demo, and you can install the Electron app for a better
		// experience anyway.
		"lib/tracky-mouse/index.html", // Tracky Mouse UI
		"lib/tracky-mouse/tracky-mouse.css", // Tracky Mouse UI
		"lib/tracky-mouse/package.json", // Tracky Mouse package
		"lib/tracky-mouse/package-lock.json", // Tracky Mouse package

		// I want to include workbox in my `npm run dev` watch setup, but...
		// Workbox's own output is not ignored when using --watch!
		// The only way to ignore things is by adding it here:
		// "sw.js",
		// "sw.js.map",
		// "workbox-*.js",
		// "workbox-*.js.map",
		// But workbox-<hash>.js needs to be cached by the service worker!
		// (So does workbox-window, by the way, which could be accidentally matched if it weren't .mjs)
		// The service worker functioning is more important than the dev experience,
		// so I'm leaving these un-ignored for now.

		// Also I had to patch node_modules/workbox-cli/build/app.js to log the change it's detecting:
		// .on('all', async (event, path) => {
		// 	logger_js_1.logger.log(`Detected ${event}: ${path} (to ignore this, add ${path} to globIgnores in workbox-config.js)`);
		// 	await runBuildCommand({ command, config, watch: true });
		// })
	],
	swDest: 'sw.js',
	// "An optional ID to be prepended to cache names. This is primarily useful for local development where multiple sites may be served from the same http://localhost:port origin."
	cacheId: 'jspaint',
};