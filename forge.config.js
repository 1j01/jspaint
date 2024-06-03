const sharedDebRpmOptions = {
	name: "jspaint",
	productName: "JS Paint",
	productDescription: "MS Paint clone with extra features",
	genericName: "Image Editor",
	homepage: "https://jspaint.app/about",
	icon: "images/icons/512x512.png",
	categories: [
		"Graphics",
	],
	mimeType: [
		// Affects whether the app shows as a recommended app in the "Open With" menu/dialog
		"image/*", // wildcard doesn't seem to work
		"image/bmp",
		"image/gif",
		"image/jpeg",
		"image/png",
		"image/tiff",
		"image/webp",
		"image/avif",
		"image/x-icon",
		"image/vnd.microsoft.icon",
		"image/x-win-bitmap",
		"image/x-icns",
		"application/x-gimp-palette",
	],
};
module.exports = {
	packagerConfig: {
		icon: "./images/icons/jspaint",
		name: "JS Paint",
		executableName: "jspaint",
		appBundleId: "io.isaiahodhner.jspaint",
		appCategoryType: "public.app-category.graphics-design",
		appCopyright: "© 2024 Isaiah Odhner",
		extendInfo: {
			// Based on https://gist.github.com/sonnypgs/de2b6a4a4936d5b8e0fe43946002964a
			// This extends Info.plist to allow dropping files onto the macOS dock icon.
			// (all files, not just images, since it's much simpler and I support loading palettes from arbitrary text files)
			CFBundleDocumentTypes: [
				{
					CFBundleTypeName: "All Files",
					CFBundleTypeRole: "Editor", // *
					LSHandlerRank: "Alternate",
					LSItemContentTypes: [
						"public.data",
						"public.content",
					],
				},
			],
			// *Added, but... I'm not sure what CFBundleTypeRole exactly affects in practice.
			// The app is an editor, of both images and palettes, but it's not an editor of all file types,
			// so it's unclear if this is appropriate.
			// TODO: granular image types?
			// like https://github.com/electron/forge/issues/492#issuecomment-385956851
		},
		junk: true,
		// TODO: assess filtering of files; I see eslint in node_modules, why? prune is true by default
		ignore: [
			".history", // VS Code "Local History" extension
			"cypress", // Cypress tests
			"cypress.json", // Cypress config
			"browserconfig.xml", // Windows 8/10 start menu tile
			"about.html", // homepage
			"parse-rc-file.js", // localization
			"preprocess.js", // localization
			/\.rc$/, // localization
			/\.sh$/, // localization
			/\.psd$/, // theming source files
			"images/meta", // images used on README, OpenGraph, etc. (arguably README images could be included)
			// TODO: "lib/pdf.js/web", // PDF.js UI? (PDF.js is only used as a library, but does it use data from this folder?)
			// TODO: Bubblegum theme has some files that are embedded in an SVG, so they're not used directly
			// I'd want to move them to a folder or give them a suffix or something, rather than just ignoring them as they are,
			// since I may want to use them in the future.
		],
		// TODO: maybe
		// https://electron.github.io/packager/main/interfaces/Options.html#darwinDarkModeSupport
	},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				name: "jspaint",
				exe: "jspaint.exe",
				title: "JS Paint",
				description: "MS Paint clone with extra features",
				iconUrl: "https://raw.githubusercontent.com/1j01/jspaint/5af996478e28a32627794526ec9d25a799187119/images/icons/192x192.png",
				setupIcon: "./images/icons/jspaint.ico",
				loadingGif: "images/about/flagani.gif",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: [
				"darwin", // macOS uses a .zip, which may be automatically extracted when opened
			],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {
				options: {
					...sharedDebRpmOptions,
					section: "graphics",
					maintainer: "Isaiah Odhner <isaiahodhner@gmail.com>",
				},
			},
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {
				options: {
					...sharedDebRpmOptions,
					license: "MIT",
				},
			},
		},
	],
	publishers: [
		{
			name: "@electron-forge/publisher-github",
			config: {
				repository: {
					owner: "1j01",
					name: "jspaint",
				},
				prerelease: true,
				draft: true,
			},
		},
	],
};
