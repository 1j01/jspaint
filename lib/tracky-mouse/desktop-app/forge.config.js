const sharedDebRpmOptions = {
	name: "tracky-mouse",
	productName: "Tracky Mouse",
	productDescription: "Hands-free mouse control",
	genericName: "Facial Mouse",
	homepage: "https://trackymouse.js.org/",
	icon: "images/tracky-mouse-logo-512.png",
	categories: [
		"Utility",
	],
	mimeType: [
		// Affects whether the app shows as a recommended app in the "Open With" menu/dialog.
		// Not sure if this would be useful for a config file format, or only standard file formats.
		// "application/x-tracky-mouse",
	],
};
module.exports = {
	packagerConfig: {
		icon: "./images/tracky-mouse-logo",
		name: "Tracky Mouse",
		executableName: "tracky-mouse",
		appBundleId: "io.isaiahodhner.tracky-mouse",
		appCategoryType: "public.app-category.utilities",
		appCopyright: "© 2024 Isaiah Odhner",
		junk: true,
		// TODO: assess filtering of files; check node_modules to make sure prune is working
		ignore: [
			".history", // VS Code "Local History" extension
			// TODO: organize image files so I can ignore most of them
			// Maybe add a custom lint script to check that no images are being used by the app
			// that won't be packaged, and that all images are being used
		],
		// TODO: maybe
		// https://electron.github.io/packager/main/interfaces/Options.html#darwinDarkModeSupport
	},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				name: "tracky-mouse",
				exe: "tracky-mouse.exe",
				title: "Tracky Mouse",
				description: "Hands-free mouse control",
				iconUrl: "https://raw.githubusercontent.com/1j01/tracky-mouse/4f22321a3f65ecf66d0a9ed431a24a76d547ea4c/images/tracky-mouse-logo-512.png",
				setupIcon: "./images/tracky-mouse-logo.ico",
				// loadingGif: "images/install.gif",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: [
				"darwin",  // macOS uses a .zip, which may be automatically extracted when opened
			],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {
				options: {
					...sharedDebRpmOptions,
					section: "utils",
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
		}
	],
	publishers: [
		{
			name: '@electron-forge/publisher-github',
			config: {
				repository: {
					owner: '1j01',
					name: 'tracky-mouse'
				},
				prerelease: false,
				draft: true,
			}
		}
	],
};
