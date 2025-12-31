#!/usr/bin/env node
/**
 * Convert jspaint localizations to i18next JSON format
 *
 * Reads localization files from /localization/[lang]/localizations.js
 * and converts them to i18next JSON format in /public/locales/[lang]/translation.json
 */

const fs = require('fs');
const path = require('path');

const LOCALIZATION_DIR = path.join(__dirname, '../localization');
const OUTPUT_DIR = path.join(__dirname, '../public/locales');

// Language metadata (from jQuery version)
const LANGUAGE_METADATA = {
	ar: { name: 'العربية', emoji: '🇦🇪' },
	cs: { name: 'Čeština', emoji: '🇨🇿' },
	da: { name: 'Dansk', emoji: '🇩🇰' },
	de: { name: 'Deutsch', emoji: '🇩🇪' },
	el: { name: 'Ελληνικά', emoji: '🇬🇷' },
	en: { name: 'English', emoji: '🇺🇸' },
	es: { name: 'Español', emoji: '🇪🇸' },
	fi: { name: 'Suomi', emoji: '🇫🇮' },
	fr: { name: 'Français', emoji: '🇫🇷' },
	he: { name: 'עברית', emoji: '🇮🇱' },
	hu: { name: 'Magyar', emoji: '🇭🇺' },
	it: { name: 'Italiano', emoji: '🇮🇹' },
	ja: { name: '日本語', emoji: '🇯🇵' },
	ko: { name: '한국어', emoji: '🇰🇷' },
	nl: { name: 'Nederlands', emoji: '🇳🇱' },
	no: { name: 'Norsk', emoji: '🇳🇴' },
	pl: { name: 'Polski', emoji: '🇵🇱' },
	'pt-br': { name: 'Português (Brasil)', emoji: '🇧🇷' },
	pt: { name: 'Português', emoji: '🇵🇹' },
	ru: { name: 'Русский', emoji: '🇷🇺' },
	sk: { name: 'Slovenčina', emoji: '🇸🇰' },
	sl: { name: 'Slovenščina', emoji: '🇸🇮' },
	sv: { name: 'Svenska', emoji: '🇸🇪' },
	tr: { name: 'Türkçe', emoji: '🇹🇷' },
	uk: { name: 'Українська', emoji: '🇺🇦' },
	'zh-cn': { name: '简体中文', emoji: '🇨🇳' },
};

// Mock global function that localizations.js expects
global.loaded_localizations = function(lang, translations) {
	return translations;
};

// Get list of language directories
const langDirs = fs.readdirSync(LOCALIZATION_DIR)
	.filter(file => {
		const stat = fs.statSync(path.join(LOCALIZATION_DIR, file));
		return stat.isDirectory();
	});

console.log(`Found ${langDirs.length} languages: ${langDirs.join(', ')}`);

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Convert each language
langDirs.forEach(lang => {
	const localizationFile = path.join(LOCALIZATION_DIR, lang, 'localizations.js');

	if (!fs.existsSync(localizationFile)) {
		console.warn(`⚠️  Skipping ${lang}: No localizations.js found`);
		return;
	}

	try {
		// Load the localizations file
		const content = fs.readFileSync(localizationFile, 'utf8');

		// Execute the file to get the translations object
		const translations = eval(content);

		// Create output directory for this language
		const outputLangDir = path.join(OUTPUT_DIR, lang);
		if (!fs.existsSync(outputLangDir)) {
			fs.mkdirSync(outputLangDir, { recursive: true });
		}

		// Write JSON file
		const outputFile = path.join(outputLangDir, 'translation.json');
		fs.writeFileSync(outputFile, JSON.stringify(translations, null, 2), 'utf8');

		console.log(`✅ Converted ${lang}: ${Object.keys(translations).length} strings`);
	} catch (error) {
		console.error(`❌ Error converting ${lang}:`, error.message);
	}
});

// Write language metadata
const metadataFile = path.join(OUTPUT_DIR, 'languages.json');
fs.writeFileSync(metadataFile, JSON.stringify(LANGUAGE_METADATA, null, 2), 'utf8');
console.log(`\n✅ Wrote language metadata to ${metadataFile}`);
console.log(`\n✨ Conversion complete! Output in ${OUTPUT_DIR}`);
