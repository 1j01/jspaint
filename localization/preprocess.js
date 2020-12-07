/*
first i did this:

 2020-12-06 20:08:31 ⌚  ironsmith in ~/Projects/jspaint/localization/ko
± |localization ↑1 {5} ?:1 ✗| → find -name '*.rc' -exec cat {} \; > combined.rc

 2020-12-06 20:08:54 ⌚  ironsmith in ~/Projects/jspaint/localization/ko
± |localization ↑1 {5} ?:1 ✗| → cd ../en

 2020-12-06 20:16:51 ⌚  ironsmith in ~/Projects/jspaint/localization/en
± |localization ↑2 {5} ?:2 ✗| → find -name '*.rc' -exec cat {} \; > combined.rc

and removed U+FEFF ZERO WIDTH NO-BREAK SPACE that seemed to get introduced between files
could do this in Node.js but whatever
*/

const fs = require("fs");
const parse_rc_file = require("./parse-rc-file");
const base_lang = "en";
const get_strings = (lang)=> {
	const rc_file_text = fs.readFileSync(`${lang}/combined.rc`, "utf16le");
	const orig_strings = parse_rc_file(rc_file_text);
	return orig_strings;
	// this will break correlation because things can have different numbers of tabs
	// const new_strings = [];
	// for (const orig_string of orig_strings) {
	// 	new_strings.push(...orig_string.split(/\t/g));
	// }
	// return new_strings;
};
const base_strings = get_strings(base_lang);
for (const target_lang of ["ko"]) {
	const target_strings = get_strings(target_lang);
	const localizations = {};
	for (let i = 0; i < target_strings.length; i++) {
		const base_string = base_strings[i];
		const target_string = target_strings[i];
		if (base_string !== target_string) {
			// Split strings like "&Attributes...\tCtrl+E"
			if (base_string.match(/\t/)) {
				const base_split = base_string.split(/\t/);
				const target_split = target_string.split(/\t/);
				// TODO: DRY (could use recursion)
				for (let j = 0; j < target_split.length; j++) {
					const base_part = base_split[j];
					const target_part = target_split[j];
					if (base_part !== target_part && base_part && target_part) {
						if (localizations[base_part] && localizations[base_part] !== target_part) {
							console.warn(`Collision for '${base_part}' : '${localizations[base_part]}' vs '${target_part}'`);
						}
						localizations[base_part] = target_part;
						// this causes more collisions @TODO
						localizations[base_part.replace(/&/g, "")] = target_part;
						localizations[base_part.replace(/\.\.\./g, "")] = target_part.replace(/\.\.\./g, "");
					}
				}
			} else {
				if (localizations[base_string] && localizations[base_string] !== target_string) {
					console.warn(`Collision for '${base_string}' : '${localizations[base_string]}' vs '${target_string}'`);
				}
				localizations[base_string] = target_string;
				// this causes more collisions @TODO
				localizations[base_string.replace(/&/g, "")] = target_string;
				localizations[base_string.replace(/\.\.\./g, "")] = target_string.replace(/\.\.\./g, "");
			}
		}
	}
	fs.writeFileSync(`${target_lang}/localizations.json`, JSON.stringify(localizations));
}
