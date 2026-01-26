import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import prettierConfig from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import("@types/eslint").Linter.FlatConfig[]} */
export default [
	{
		// "if an ignores key is used without any other keys in the configuration object, then the patterns act as global ignores"
		"ignores": [
			"**/node_modules/",
			"**/.git/",
			"**/.history/",
			"**/.idea/",
			"**/.vscode/",
			"**/lib/", // vendored dependencies
			"**/out/", // Electron build
			"**/build/", // maybe nothing
			"**/dist/", // maybe nothing
			"**/localization/*/*.js", // generated files (note that there is some non-generated JS directly in `localization/`, hence not using `**/localization/**/*.js`)
		],
	},
	js.configs.recommended,
	{
		"linterOptions": {
			"reportUnusedDisableDirectives": "warn",
		},
		"languageOptions": {
			"ecmaVersion": 2022,
			"sourceType": "module",
			"globals": {
				...globals.browser,
				...globals.es2022,
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
		},
		"plugins": {
			"@stylistic": stylistic,
		},
		"rules": {
			"no-undef": "warn",
			"no-unused-vars": ["warn", {
				"args": "all",
				"argsIgnorePattern": "^_",
				"caughtErrorsIgnorePattern": "^_",
				// "varsIgnorePattern": "^_",
			}],

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
			"no-script-url": "error",
			"no-self-compare": "error",
			"no-sequences": "error",
			"no-throw-literal": "error",
			"no-unmodified-loop-condition": "error",
			"no-unused-expressions": "error", // Tip: `a && a();` can become `a?.();` https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
			"no-useless-concat": "error",
			"prefer-promise-reject-errors": "error",
			"radix": "error",
			"require-await": "error",
			// "vars-on-top": "error",
			"no-label-var": "error",
			// "no-shadow": "error",
			// "no-use-before-define": "error",

			// To target specific variables to rename or otherwise address:
			"no-restricted-globals": ["error", "event", "canvas", "ctx", "colors", "i", "j", "k", "x", "y", "z", "width", "height", "w", "h"],

			// Stylistic:
			"@stylistic/array-bracket-newline": ["error", "consistent"],
			"@stylistic/array-bracket-spacing": ["error", "never"],
			// "@stylistic/array-element-newline": ["error", "consistent"], // lot of big arrays with sometimes meaningful line breaks; could exclude certain files though
			"@stylistic/arrow-parens": ["error", "always"],
			"@stylistic/arrow-spacing": ["error", { "before": true, "after": true }],
			"@stylistic/block-spacing": ["error", "always"],
			"@stylistic/brace-style": ["error", "1tbs", { "allowSingleLine": true }],
			"@stylistic/indent": ["error", 2, { "SwitchCase": 1 }],
			"@stylistic/comma-dangle": ["error", {
				"arrays": "always-multiline", // ensure commas to avoid confusing git diffs
				"objects": "always-multiline", // ensure commas to avoid confusing git diffs
				"imports": "never", // always a single line anyways
				"exports": "never", // matches VS Code's default JS/TS formatter
				"functions": "only-multiline", // commas sometimes avoid confusing git diffs, sometimes are confusing themselves
			}],
			"@stylistic/comma-spacing": ["error", { "before": false, "after": true }],
			"@stylistic/comma-style": ["error", "last"],
			"@stylistic/computed-property-spacing": ["error", "never"],
			"@stylistic/dot-location": ["error", "property"],
			"@stylistic/eol-last": ["error", "always"],
			// "@stylistic/function-call-argument-newline": ["error", "consistent"], // several places with meaningful line breaks grouping arguments
			"@stylistic/function-call-spacing": ["error", "never"],
			// "@stylistic/function-paren-newline": ["error", "multiline-arguments"], // several places with meaningful line breaks grouping arguments
			"@stylistic/generator-star-spacing": ["error", "after"],
			// "@stylistic/implicit-arrow-linebreak": ["error", "beside"], // could encourage parens for clarity, but ESLint won't mention that's the reason, so probably not a good idea
			"@stylistic/indent-binary-ops": ["error", 2],
			// "@stylistic/jsx-child-element-spacing": "off",
			// "@stylistic/jsx-closing-bracket-location": "off",
			// "@stylistic/jsx-closing-tag-location": "off",
			// "@stylistic/jsx-curly-brace-presence": "off",
			// "@stylistic/jsx-curly-newline": "off",
			// "@stylistic/jsx-curly-spacing": "off",
			// "@stylistic/jsx-equals-spacing": "off",
			// "@stylistic/jsx-first-prop-new-line": "off",
			// "@stylistic/jsx-function-call-newline": "off",
			// "@stylistic/jsx-indent": "off",
			// "@stylistic/jsx-indent-props": "off",
			// "@stylistic/jsx-max-props-per-line": "off",
			// "@stylistic/jsx-newline": "off",
			// "@stylistic/jsx-one-expression-per-line": "off",
			// "@stylistic/jsx-pascal-case": "off",
			// "@stylistic/jsx-props-no-multi-spaces": "off",
			// "@stylistic/jsx-quotes": "off",
			// "@stylistic/jsx-self-closing-comp": "off",
			// "@stylistic/jsx-sort-props": "off",
			// "@stylistic/jsx-tag-spacing": "off",
			// "@stylistic/jsx-wrap-multilines": "off",
			"@stylistic/key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
			"@stylistic/keyword-spacing": ["error", { "before": true, "after": true }],
			// "@stylistic/line-comment-position": "off",
			// "@stylistic/linebreak-style": "off",
			// "@stylistic/lines-around-comment": ["error", ""], // TODO maybe (so many options...)
			// This conflicts with Prettier and creates lots of noisy failures.
			"@stylistic/lines-between-class-members": "off",
			// "@stylistic/max-len": ["error", ""], // TODO maybe along with changing export {} to individual exports
			"@stylistic/max-statements-per-line": ["error", { "max": 4 }], // TODO: maybe decrease this
			// TODO: lint .d.ts files, and ideally JSDoc comments
			// "@stylistic/member-delimiter-style": ["error", { "multiline": { "delimiter": "semi", "requireLast": true }, "singleline": { "delimiter": "semi", "requireLast": true } }],
			// "@stylistic/multiline-comment-style": ["error", "separate-lines"], // I use block comments sometimes for disabled code; also this is detecting a few JSDoc comments even though it says it won't without "checkJSDoc" set to true.
			// "@stylistic/multiline-ternary": ["error", "always-multiline"], // might want to change the ternary style in the future...
			"@stylistic/new-parens": ["error", "always"],
			"@stylistic/newline-per-chained-call": ["error", { "ignoreChainWithDepth": 5 }], // TODO: maybe decrease this
			// "@stylistic/no-confusing-arrow": ["error", { "allowParens": true }], // don't really like the changes this implies in the couple of places it flags
			// "@stylistic/no-extra-parens": ["error", "all"], // if there are extra parens, it's probably for clarity (TODO: look at the granular options), also, this doesn't seem to detect cases it should for function calls?
			"@stylistic/no-extra-semi": "error",
			"@stylistic/no-floating-decimal": "error",
			// "@stylistic/no-mixed-operators": ["error", ...], // TODO: investigate options
			"@stylistic/no-mixed-spaces-and-tabs": "error",
			"@stylistic/no-multi-spaces": "error",
			"@stylistic/no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1 }],
			// "@stylistic/no-tabs": "off", // I use tabs for indentation, in disabled code, and in template literals
			"@stylistic/no-trailing-spaces": "error",
			"@stylistic/no-whitespace-before-property": "error",
			"@stylistic/nonblock-statement-body-position": ["error", "beside"], // TODO: maybe drop curly braces from single line conditionals
			// "@stylistic/object-curly-newline": ["error", ""], // TODO: investigate options
			"@stylistic/object-curly-spacing": ["error", "always"],
			"@stylistic/object-property-newline": ["error", { "allowAllPropertiesOnSameLine": true }],
			// "@stylistic/one-var-declaration-per-line": ["error", "always"], // TODO maybe? there is a risk of `let a, b = 0;` leaving `a` as undefined, but sometimes it just looks better, for related variables...
			"@stylistic/operator-linebreak": ["error", "after"], // not sure about ternary operator tbh
			// "@stylistic/padded-blocks": "off", // it depends, especially on how much stuff is in the block
			// "@stylistic/padding-line-between-statements": ["error", ""], // TODO: investigate options, looks very complex
			// "@stylistic/quote-props": ["error", "consistent"], // I prefer it inconsistent if it's just for a few CSS custom properties when setting several CSS properties at once, especially since it's not going to be consistent with object property shorthand e.g. { "--requires-quotes": requiresQuotes, "quotedForConsistency": true, inconsistent }
                        "@stylistic/quotes": ["error", "double", { "avoidEscape": true, "allowTemplateLiterals": "always" }], // Note: allowTemplateLiterals allows template literals without any substitutions, and removing "allowTemplateLiterals" doesn't allow them for avoiding escaping
			"@stylistic/rest-spread-spacing": ["error", "never"],
			"@stylistic/semi": ["error", "always"],
			"@stylistic/semi-spacing": ["error", { "before": false, "after": true }],
			"@stylistic/semi-style": ["error", "last"],
			"@stylistic/space-before-blocks": ["error", "always"],
			"@stylistic/space-before-function-paren": ["error", {
				"anonymous": "always",
				"named": "never",
				"asyncArrow": "always",
			}],
			"@stylistic/space-in-parens": ["error", "never"],
			"@stylistic/space-infix-ops": "error",
			"@stylistic/space-unary-ops": ["error", {
				"words": true,
				"nonwords": false,
			}],
			// "@stylistic/spaced-comment": ["error", "always"], // TODO: investigate
			"@stylistic/switch-colon-spacing": ["error", { "after": true, "before": false }],
			"@stylistic/template-curly-spacing": ["error", "never"],
			"@stylistic/template-tag-spacing": ["error", "never"],
			// "@stylistic/type-annotation-spacing": ["error", ""], // TODO: lint TS
			// "@stylistic/type-generic-spacing": ["error", ""], // TODO: lint TS
			// "@stylistic/type-named-tuple-spacing": ["error", ""], // TODO: lint TS
			"@stylistic/wrap-iife": ["error", "inside"],
			// "@stylistic/wrap-regex": "error", // does that really clarify things? eh
			"@stylistic/yield-star-spacing": ["error", "after"],
		},
	},
	{
		"files": [
			"help/vaporwave.js",
			"src/app-localization.js",
			"src/app-state.js",
			"src/copy-inkscape-labels.js",
			"src/error-handling-basic.js",
			"svg-paint/svg-paint.js",
			"localization/**/*.js",
		],
		"languageOptions": {
			"sourceType": "script",
		},
	},
	{
		"files": [
                        "sync-package.js",
                        "prune-globals.js",
                        "cypress/plugins/index.js",
                        "cypress.config.js",
                        "localization/*.js",
                ],
                "languageOptions": {
                        "sourceType": "commonjs",
                        "globals": {
                                ...globals.node,
                        },
                },
        },
        {
                "files": [
                        "vite.config.js",
                        "vite.config.mjs",
                ],
                "languageOptions": {
                        "globals": {
                                ...globals.node,
                        },
                },
        },
	{
		"files": [
			"cypress/**/*.js",
		],
		"languageOptions": {
			"globals": {
				...globals.mocha,
				"expect": "readonly",
				"cy": "readonly",
				"Cypress": "readonly",
			},
		},
	},
	// Node scripts
	{
		files: ["scripts/**/*.mjs", "scripts/test-server.js"],
		languageOptions: {
			sourceType: "module",
			globals: {
				...globals.node,
			},
		},
	},
	{
		files: ["scripts/**/*.cjs", "scripts/convert-localizations.js"],
		languageOptions: {
			sourceType: "commonjs",
			globals: {
				...globals.node,
			},
		},
	},
	// TypeScript/React configuration
	...tseslint.configs.recommended.map((config) => ({
		...config,
		files: ["src/react/**/*.{ts,tsx}", "src/new/**/*.{ts,tsx,jsx}"],
	})),
	{
		files: ["src/react/**/*.{ts,tsx,jsx}", "src/new/**/*.{ts,tsx,jsx}"],
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		plugins: {
			prettier,
		},
		rules: {
			"prettier/prettier": "warn",
			// Alerts/confirms are used in a few places; prefer app dialogs, but don't
			// block development on this rule.
			"no-alert": "off",
			"@typescript-eslint/no-unused-vars": ["warn", {
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
			}],
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"@typescript-eslint/no-explicit-any": "warn",
		},
	},
	// Prettier config (disables conflicting rules) - must be last
	prettierConfig,
];
