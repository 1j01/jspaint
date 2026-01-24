import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Initialize i18next for MCPaint
// Loads translations from /locales/[lang]/translation.json

i18n
	// Load translations via HTTP
	.use(HttpBackend)
	// Detect user language from browser/localStorage
	.use(LanguageDetector)
	// Pass i18n instance to react-i18next
	.use(initReactI18next)
	// Initialize
	.init({
		// Fallback language if translation missing
		fallbackLng: 'en',

		// Debug mode (disable for production)
		debug: false,

		// Namespace configuration
		ns: ['translation'],
		defaultNS: 'translation',

		// Interpolation options
		interpolation: {
			// React already escapes values
			escapeValue: false,
		},

		// Detection options
		detection: {
			// Order of language detection
			order: ['localStorage', 'navigator', 'htmlTag'],

			// Keys for localStorage
			lookupLocalStorage: 'mcpaint-language',

			// Cache language in localStorage
			caches: ['localStorage'],
		},

		// Backend configuration (loads from /locales/)
		backend: {
			loadPath: '/locales/{{lng}}/translation.json',
		},

		// React-specific options
		react: {
			// Wait for translations to load before rendering
			useSuspense: false,
		},

		// Supported languages (26 languages from jQuery version)
		supportedLngs: [
			'ar',    // Arabic
			'cs',    // Czech
			'da',    // Danish
			'de',    // German
			'el',    // Greek
			'en',    // English (default)
			'es',    // Spanish
			'fi',    // Finnish
			'fr',    // French
			'he',    // Hebrew
			'hu',    // Hungarian
			'it',    // Italian
			'ja',    // Japanese
			'ko',    // Korean
			'nl',    // Dutch
			'no',    // Norwegian
			'pl',    // Polish
			'pt',    // Portuguese
			'pt-br', // Portuguese (Brazil)
			'ru',    // Russian
			'sk',    // Slovak
			'sl',    // Slovenian
			'sv',    // Swedish
			'tr',    // Turkish
			'zh',    // Chinese
			'zh-simplified', // Chinese Simplified
		],

		// Non-explicit whitelist allows all languages
		nonExplicitSupportedLngs: false,
	});

export default i18n;
