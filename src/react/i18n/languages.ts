/**
 * Language metadata for MCPaint
 *
 * Contains display names and emoji flags for all 26 supported languages.
 * Synced with jQuery version from src/app-localization.js
 */

export interface LanguageInfo {
	code: string;
	name: string;      // Endonym (native name)
	emoji: string;     // Flag emoji
	englishName?: string;
}

export const LANGUAGES: LanguageInfo[] = [
	{ code: 'ar', name: 'العربية', emoji: '🇦🇪', englishName: 'Arabic' },
	{ code: 'cs', name: 'Čeština', emoji: '🇨🇿', englishName: 'Czech' },
	{ code: 'da', name: 'Dansk', emoji: '🇩🇰', englishName: 'Danish' },
	{ code: 'de', name: 'Deutsch', emoji: '🇩🇪', englishName: 'German' },
	{ code: 'el', name: 'Ελληνικά', emoji: '🇬🇷', englishName: 'Greek' },
	{ code: 'en', name: 'English', emoji: '🇺🇸', englishName: 'English' },
	{ code: 'es', name: 'Español', emoji: '🇪🇸', englishName: 'Spanish' },
	{ code: 'fi', name: 'Suomi', emoji: '🇫🇮', englishName: 'Finnish' },
	{ code: 'fr', name: 'Français', emoji: '🇫🇷', englishName: 'French' },
	{ code: 'he', name: 'עברית', emoji: '🇮🇱', englishName: 'Hebrew' },
	{ code: 'hu', name: 'Magyar', emoji: '🇭🇺', englishName: 'Hungarian' },
	{ code: 'it', name: 'Italiano', emoji: '🇮🇹', englishName: 'Italian' },
	{ code: 'ja', name: '日本語', emoji: '🇯🇵', englishName: 'Japanese' },
	{ code: 'ko', name: '한국어', emoji: '🇰🇷', englishName: 'Korean' },
	{ code: 'nl', name: 'Nederlands', emoji: '🇳🇱', englishName: 'Dutch' },
	{ code: 'no', name: 'Norsk', emoji: '🇳🇴', englishName: 'Norwegian' },
	{ code: 'pl', name: 'Polski', emoji: '🇵🇱', englishName: 'Polish' },
	{ code: 'pt-br', name: 'Português (Brasil)', emoji: '🇧🇷', englishName: 'Portuguese (Brazil)' },
	{ code: 'pt', name: 'Português', emoji: '🇵🇹', englishName: 'Portuguese' },
	{ code: 'ru', name: 'Русский', emoji: '🇷🇺', englishName: 'Russian' },
	{ code: 'sk', name: 'Slovenčina', emoji: '🇸🇰', englishName: 'Slovak' },
	{ code: 'sl', name: 'Slovenščina', emoji: '🇸🇮', englishName: 'Slovenian' },
	{ code: 'sv', name: 'Svenska', emoji: '🇸🇪', englishName: 'Swedish' },
	{ code: 'tr', name: 'Türkçe', emoji: '🇹🇷', englishName: 'Turkish' },
	{ code: 'zh', name: '简体中文', emoji: '🇨🇳', englishName: 'Chinese (Simplified)' },
	{ code: 'zh-simplified', name: '简体中文', emoji: '🇨🇳', englishName: 'Chinese (Simplified)' },
];

/**
 * Get language info by code
 */
export function getLanguageInfo(code: string): LanguageInfo | undefined {
	return LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get all available language codes
 */
export function getAvailableLanguages(): string[] {
	return LANGUAGES.map(lang => lang.code);
}
