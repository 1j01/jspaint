// @ts-check
const fs = require("fs");
const glob = require("glob");
const parse_rc_file = require("./parse-rc-file");
const { AccessKeys } = require("../lib/os-gui/MenuBar.js");

const base_lang = "en";
const available_langs = fs.readdirSync(__dirname).filter((dir) => dir.match(/^\w+(-\w+)?$/));
const target_langs = available_langs.filter((lang) => lang !== base_lang);

console.log("Target languages:", target_langs);

const remove_ellipsis = (str) => str.replace("...", "");

const only_unique = (value, index, self) => self.indexOf(value) === index;

const get_strings = (lang) => {
	const rc_files = glob.sync(`${lang}/**/*.rc`, { cwd: __dirname, absolute: true });
	rc_files.sort((a, b) => a.localeCompare(b, "en"));
	return rc_files.map(
		(rc_file) => parse_rc_file(fs.readFileSync(rc_file, "utf16le").replace(/\ufeff/g, ""))
	).flat();
};

const base_strings = get_strings(base_lang);
for (const target_lang of target_langs) {
	const target_strings = get_strings(target_lang);
	const localizations = {};
	const add_localization = (base_string, target_string, fudgedness) => {
		localizations[base_string] = localizations[base_string] || [];
		localizations[base_string].push({ target_string, fudgedness });
	};
	const add_localizations = (base_strings, target_strings) => {
		for (let i = 0; i < target_strings.length; i++) {
			const base_string = base_strings[i];
			const target_string = target_strings[i];
			if (base_string !== target_string && base_string && target_string) {
				// Split strings like "&Attributes...\tCtrl+E"
				// and "Fills an area with the current drawing color.\nFill With Color"
				const splitter = /\t|\r?\n/;
				if (base_string.match(splitter)) {
					add_localizations(
						base_string.split(splitter),
						target_string.split(splitter)
					);
				} else {
					// add_localization(base_string, target_string, 0);
					add_localization(remove_ellipsis(base_string), remove_ellipsis(target_string), 1);
					if (AccessKeys.has(base_string)) {
						// add_localization(AccessKeys.remove(base_string), AccessKeys.remove(target_string), 2);
						add_localization(remove_ellipsis(AccessKeys.remove(base_string)), remove_ellipsis(AccessKeys.remove(target_string)), 3);
					}
				}
			}
		}
	};
	add_localizations(base_strings, target_strings);

	for (const base_string in localizations) {
		const options = localizations[base_string];
		options.sort((a, b) => a.fudgedness - b.fudgedness);
		const unique_strings = options.map(({ target_string }) => target_string).filter(only_unique);
		if (unique_strings.length > 1) {
			console.warn(`Collision for "${base_string}": ${JSON.stringify(unique_strings, null, "\t")}`);
		}
		localizations[base_string] = unique_strings[0];
	}
	const js = `//
// NOTE: This is a generated file! Don't edit it directly.
// Eventually community translation will be set up on some translation platform.
// 
// Generated with: npm run update-localization
//
loaded_localizations("${target_lang}", ${JSON.stringify(localizations, null, "\t")});\n`;
	fs.writeFileSync(`${__dirname}/${target_lang}/localizations.js`, js);
}

// Update available_languages list automatically!
// This feature is likely no longer useful, as I have added all the languages
// from Windows 98 editions that I could find, and additional languages
// will not be through preprocessing resource files from Windows 98,
// but through AI and community translation.
const file = require("path").resolve(__dirname + "/../src/app-localization.js");
const old_code = fs.readFileSync(file, "utf8");
const available_languages_regex = /(available_languages\s*=\s*)\[[^\]]*\]/;
if (!old_code.match(available_languages_regex)) {
	console.error(`Failed to find available_languages list in "${file}"`);
	process.exit(1);
}
const new_code = old_code.replace(available_languages_regex, `$1${JSON.stringify(available_langs).replace(/","/g, `", "`)}`);
if (new_code === old_code) {
	console.log(`No changes needed to available_languages list in "${file}"`);
} else {
	fs.writeFileSync(file, new_code, "utf8");
	console.log(`Updated available_languages list in "${file}"`);
}
