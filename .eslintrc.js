module.exports = {
	"env": {
		"browser": true,
		"es2022": true,
	},
	"extends": "eslint:recommended",
	"globals": {
		// libraries
		"$": "readonly",
		"jQuery": "readonly",
		"libtess": "readonly",
		"firebase": "readonly",
		"GIF": "readonly",
		"saveAs": "readonly",
		"YT": "readonly",
		"FontDetective": "readonly",
		"AnyPalette": "readonly",
		"ImageTracer": "readonly",
		// os-gui's MenuBar.js
		// "MenuBar": "readonly",
		// "MENU_DIVIDER": "readonly",
		// os-gui's $Window.js
		// "$Window": "readonly",
		// "$FormWindow": "readonly",
		// os-gui's parse-theme.js has more
	},
	"rules": {
		"no-undef": "warn",
		"no-unused-vars": 0,

		// "eqeqeq": "error",
		// "class-methods-use-this": "error",
		"no-alert": "error",
		"no-extend-native": "error",
		"no-extra-bind": "error",
		"no-invalid-this": "error",
		"no-new-func": "error",
		"no-eval": "error",
		"no-new-wrappers": "error",
		"no-proto": "error",
		"no-return-assign": "error",
		"no-return-await": "error",
		"no-script-url": "error",
		"no-self-compare": "error",
		"no-sequences": "error",
		"no-throw-literal": "error",
		"no-unmodified-loop-condition": "error",
		// "no-unused-expressions": "error", // a && a() used a lot, could switch to a?.() etc. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
		"no-useless-concat": "error",
		"prefer-promise-reject-errors": "error",
		"radix": "error",
		"require-await": "error",
		// "vars-on-top": "error",
		"wrap-iife": "error",
		"no-label-var": "error",
		// "no-shadow": "error",
		// "no-use-before-define": "error",

		// To target specific variables to rename or otherwise address:
		"no-restricted-globals": ["error", "event", "canvas", "ctx", "colors", "i", "j", "k", "x", "y", "z", "width", "height", "w", "h"],

		// Stylistic:
		// @TODO: https://eslint.org/docs/rules/#stylistic-issues
		// "array-bracket-spacing": "error",
		// "block-spacing": "error",
	},
	"overrides": [
		{
			// TODO: make module the default, since the app is mostly ES6 modules now
			files: [
				"src/app.js",
				"src/theme.js",
				"src/msgbox.js",
				"src/helpers.js",
				"src/storage.js",
				"src/sessions.js",
				"src/discord-activity-client.js",
				"src/$Component.js",
				"src/$ToolWindow.js",
				"src/$ToolBox.js",
				"src/$FontBox.js",
				"src/$ColorBox.js",
				"src/OnCanvasObject.js",
				"src/OnCanvasHelperLayer.js",
				"src/OnCanvasSelection.js",
				"src/OnCanvasTextBox.js",
				"src/Handles.js",
				"src/image-manipulation.js",
				"src/tool-options.js",
				"src/tools.js",
				"src/extra-tools.js",
				"src/color-data.js",
				"src/edit-colors.js",
				"src/manage-storage.js",
				"src/file-format-data.js",
				"src/imgur.js",
				"src/help.js",
				"src/simulate-random-gestures.js",
				"src/menus.js",
				"src/speech-recognition.js",
				"src/eye-gaze-mode.js",
				"src/functions.js",
				"src/test-news.js",
				"src/error-handling-enhanced.js",
				"src/vaporwave-fun.js",
				"src/konami.js",
				"src/repack-spritesheet.js",
				"cypress/**/*.js",
			],
			parserOptions: { sourceType: "module" },
			rules: {
				"no-undef": "warn",
				"no-unused-vars": ["warn", {
					"args": "all",
					"argsIgnorePattern": "^_",
					"caughtErrorsIgnorePattern": "^_",
					// "varsIgnorePattern": "^_",
				}],
			},
		}
	]
};