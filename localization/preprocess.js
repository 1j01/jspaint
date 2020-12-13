const fs = require("fs");
const glob = require("glob");
const parse_rc_file = require("./parse-rc-file");

const base_lang = "en";
const available_langs = fs.readdirSync(__dirname).filter((dir)=> dir.match(/^\w+(-\w+)?$/));
const target_langs = available_langs.filter((lang)=> lang !== base_lang);

console.log("Target languages:", target_langs);

const has_hotkey = str => str.match(/&(\w)/);
const remove_hotkey = str => str.replace(/&(\w)/, "$1").replace(/\s?\(.\)/, "");
const remove_ellipsis = str => str.replace("...", "");

const get_strings = (lang)=> {
	return glob.sync(`${__dirname}/${lang}/**/*.rc`).map(
		(rc_file)=> parse_rc_file(fs.readFileSync(rc_file, "utf16le").replace(/\ufeff/g, ""))
	).flat();
};

const base_strings = get_strings(base_lang);
for (const target_lang of target_langs) {
	const target_strings = get_strings(target_lang);
	const localizations = {};
	const add_localization = (base_string, target_string)=> {
		if (localizations[base_string] && localizations[base_string] !== target_string) {
			console.warn(`Collision for '${base_string}' : '${localizations[base_string]}' vs '${target_string}'`);
		} else {
			localizations[base_string] = target_string;
		}
	};
	const add_localizations = (base_strings, target_strings)=> {
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
					add_localization(base_string, target_string);
					add_localization(remove_ellipsis(base_string), remove_ellipsis(target_string));
					if (has_hotkey(base_string)) {
						add_localization(remove_hotkey(base_string), remove_hotkey(target_string));
					}
				}
			}
		}
	};
	add_localizations(base_strings, target_strings);
	const js = `loaded_localizations("${target_lang}", ${JSON.stringify(localizations, null, "\t")});\n`;
	fs.writeFileSync(`${__dirname}/${target_lang}/localizations.js`, js);
}
