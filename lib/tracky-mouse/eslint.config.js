const globals = require("globals");
const js = require("@eslint/js");

/** @type {import('@types/eslint').Linter.FlatConfig[]} */
module.exports = [
	{
		"ignores": [
			"**/node_modules",
			"**/out",
			"**/dist",
			"**/lib",
			"**/.*",
		],
	},
	js.configs.recommended,
	{
		"languageOptions": {
			"globals": {
				...globals.browser,
				// ...globals.es2021,
			},
			"ecmaVersion": "latest"
		},
		"rules": {
			"indent": [
				"error",
				"tab",
				{ "SwitchCase": 1 }
			],
			// "quotes": [
			// 	"error",
			// 	"single"
			// ],
			"semi": [
				"error",
				"always"
			],
			// "no-unused-vars": "off",
			// "@typescript-eslint/no-unused-vars": [
			// 	"warn", // or "error"
			// 	{
			// 		"argsIgnorePattern": "^_",
			// 		"varsIgnorePattern": "^_",
			// 		"caughtErrorsIgnorePattern": "^_"
			// 	}
			// ]
			"no-unused-vars": ["warn", {
				"args": "all",
				"argsIgnorePattern": "^_",
				"caughtErrorsIgnorePattern": "^_",
				// "varsIgnorePattern": "^_",
			}],
		},
	},
	{
		"files": [
			"desktop-app/src/tracky-mouse-bin.js",
			"desktop-app/src/electron-main/*",
			"desktop-app/src/preload-app-window.js",
			"desktop-app/src/preload-screen-overlay.js",
			"desktop-app/forge.config.js",
			"eslint.config.js",
		],
		"languageOptions": {
			"globals": {
				// ...globals.commonjs,
				...globals.node
			},
			"sourceType": "commonjs"
		},
	}
];
