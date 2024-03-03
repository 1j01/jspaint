module.exports = {
	packagerConfig: {
		icon: "./images/icons/jspaint",
		name: "jspaint",
		executableName: "jspaint",
	},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				name: "jspaint",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: [
				"darwin"
			],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {},
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {},
		}
	],
};
