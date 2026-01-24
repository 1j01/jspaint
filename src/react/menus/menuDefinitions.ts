/**
 * Menu definitions for the React-based Paint application.
 * Matches the structure expected by os-gui MenuBar.
 */

import { LANGUAGES } from '../i18n/languages';

// Get MENU_DIVIDER from global scope (loaded by os-gui)
const MENU_DIVIDER = (globalThis as typeof globalThis & { MENU_DIVIDER: symbol }).MENU_DIVIDER;

export interface MenuAction {
	label: string;
	shortcutLabel?: string;
	ariaKeyShortcuts?: string;
	description?: string;
	action?: () => void;
	enabled?: boolean | (() => boolean);
	disabled?: boolean;
	checkbox?: {
		check: () => boolean;
		toggle: () => void;
	};
	submenu?: (MenuAction | symbol)[] | (() => (MenuAction | symbol)[]);
}

export type MenuItem = MenuAction | symbol;

export interface MenuActions {
	// File menu
	fileNew: () => void;
	fileOpen: () => void;
	fileSave: () => void;
	fileSaveAs: () => void;
	fileLoadFromUrl: () => void;
	fileUploadToImgur: () => void;
	fileManageStorage: () => void;
	filePrint: () => void;
	fileExit: () => void;

	// Edit menu
	editUndo: () => void;
	editRedo: () => void;
	editHistory: () => void;
	editCut: () => void;
	editCopy: () => void;
	editPaste: () => void;
	editClearSelection: () => void;
	editSelectAll: () => void;
	editCopyTo: () => void;
	editPasteFrom: () => void;

	// View menu
	viewToggleToolBox: () => void;
	viewToggleColorBox: () => void;
	viewToggleStatusBar: () => void;
	viewToggleTextToolbar: () => void;
	viewZoomNormal: () => void;
	viewZoomLarge: () => void;
	viewZoomToWindow: () => void;
	viewZoomCustom: () => void;
	viewToggleGrid: () => void;
	viewToggleThumbnail: () => void;
	viewBitmap: () => void;
	viewFullscreen: () => void;

	// Image menu
	imageFlipRotate: () => void;
	imageStretchSkew: () => void;
	imageInvertColors: () => void;
	imageAttributes: () => void;
	imageClearImage: () => void;
	imageCropToSelection: () => void;
	imageToggleDrawOpaque: () => void;

	// Colors menu
	colorsEditColors: () => void;
	colorsGetColors: () => void;
	colorsSaveColors: () => void;

	// Extras menu
	extrasChangeLanguage: (languageCode: string) => void;
	getCurrentLanguage: () => string;

	// Help menu
	helpTopics: () => void;
	helpAbout: () => void;

	// State checks
	canUndo: () => boolean;
	canRedo: () => boolean;
	hasSelection: () => boolean;
	hasClipboard: () => boolean;
	isToolBoxVisible: () => boolean;
	isColorBoxVisible: () => boolean;
	isStatusBarVisible: () => boolean;
	isTextToolbarVisible: () => boolean;
	isGridVisible: () => boolean;
	isThumbnailVisible: () => boolean;
	isFullscreen: () => boolean;
	isDrawOpaque: () => boolean;
	getMagnification: () => number;
}

/**
 * Creates the complete menu structure with the provided action handlers.
 */
export function createMenus(actions: MenuActions): Record<string, MenuItem[]> {
	return {
		"&File": [
			{
				label: "&New",
				shortcutLabel: "Ctrl+Alt+N",
				ariaKeyShortcuts: "Control+Alt+N",
				description: "Creates a new document.",
				action: actions.fileNew,
			},
			{
				label: "&Open...",
				shortcutLabel: "Ctrl+O",
				ariaKeyShortcuts: "Control+O",
				description: "Opens an existing document.",
				action: actions.fileOpen,
			},
			{
				label: "&Save",
				shortcutLabel: "Ctrl+S",
				ariaKeyShortcuts: "Control+S",
				description: "Saves the active document.",
				action: actions.fileSave,
			},
			{
				label: "Save &As...",
				shortcutLabel: "Ctrl+Shift+S",
				ariaKeyShortcuts: "Control+Shift+S",
				description: "Saves the active document with a new name.",
				action: actions.fileSaveAs,
			},
			MENU_DIVIDER,
			{
				label: "&Load From URL...",
				description: "Opens an image from the web.",
				action: actions.fileLoadFromUrl,
			},
			{
				label: "&Upload To Imgur",
				description: "Uploads the active document to Imgur.",
				action: actions.fileUploadToImgur,
			},
			MENU_DIVIDER,
			{
				label: "Manage Storage",
				description: "Manages storage of previously created or opened pictures.",
				action: actions.fileManageStorage,
			},
			MENU_DIVIDER,
			{
				label: "Print Pre&view",
				description: "Displays full pages.",
				action: actions.filePrint,
			},
			{
				label: "Page Se&tup",
				description: "Changes the page layout.",
				action: actions.filePrint,
			},
			{
				label: "&Print...",
				shortcutLabel: "Ctrl+P",
				ariaKeyShortcuts: "Control+P",
				description: "Prints the active document and sets printing options.",
				action: actions.filePrint,
			},
			MENU_DIVIDER,
			{
				label: "Set As &Wallpaper (Tiled)",
				description: "Tiles this bitmap as the desktop background.",
				disabled: true,
				action: () => {},
			},
			{
				label: "Set As Wallpaper (&Centered)",
				description: "Centers this bitmap as the desktop background.",
				disabled: true,
				action: () => {},
			},
			MENU_DIVIDER,
			{
				label: "Recent File",
				disabled: true,
				description: "",
			},
			MENU_DIVIDER,
			{
				label: "E&xit",
				description: "Quits Paint.",
				action: actions.fileExit,
			},
		],

		"&Edit": [
			{
				label: "&Undo",
				shortcutLabel: "Ctrl+Z",
				ariaKeyShortcuts: "Control+Z",
				description: "Undoes the last action.",
				enabled: actions.canUndo,
				action: actions.editUndo,
			},
			{
				label: "&Repeat",
				shortcutLabel: "F4",
				ariaKeyShortcuts: "F4",
				description: "Redoes the previously undone action.",
				enabled: actions.canRedo,
				action: actions.editRedo,
			},
			{
				label: "&History",
				shortcutLabel: "Ctrl+Shift+Y",
				ariaKeyShortcuts: "Control+Shift+Y",
				description: "Shows the document history.",
				action: actions.editHistory,
			},
			MENU_DIVIDER,
			{
				label: "Cu&t",
				shortcutLabel: "Ctrl+X",
				ariaKeyShortcuts: "Control+X",
				description: "Cuts the selection and puts it on the Clipboard.",
				enabled: actions.hasSelection,
				action: actions.editCut,
			},
			{
				label: "&Copy",
				shortcutLabel: "Ctrl+C",
				ariaKeyShortcuts: "Control+C",
				description: "Copies the selection and puts it on the Clipboard.",
				enabled: actions.hasSelection,
				action: actions.editCopy,
			},
			{
				label: "&Paste",
				shortcutLabel: "Ctrl+V",
				ariaKeyShortcuts: "Control+V",
				description: "Inserts the contents of the Clipboard.",
				enabled: actions.hasClipboard,
				action: actions.editPaste,
			},
			{
				label: "C&lear Selection",
				shortcutLabel: "Del",
				ariaKeyShortcuts: "Delete",
				description: "Deletes the selection.",
				enabled: actions.hasSelection,
				action: actions.editClearSelection,
			},
			{
				label: "Select &All",
				shortcutLabel: "Ctrl+A",
				ariaKeyShortcuts: "Control+A",
				description: "Selects everything.",
				action: actions.editSelectAll,
			},
			MENU_DIVIDER,
			{
				label: "C&opy To...",
				description: "Copies the selection to a file.",
				enabled: actions.hasSelection,
				action: actions.editCopyTo,
			},
			{
				label: "Paste &From...",
				description: "Pastes a file into the selection.",
				action: actions.editPasteFrom,
			},
		],

		"&View": [
			{
				label: "&Tool Box",
				description: "Shows or hides the tool box.",
				checkbox: {
					check: actions.isToolBoxVisible,
					toggle: actions.viewToggleToolBox,
				},
			},
			{
				label: "&Color Box",
				shortcutLabel: "Ctrl+L",
				ariaKeyShortcuts: "Control+L",
				description: "Shows or hides the color box.",
				checkbox: {
					check: actions.isColorBoxVisible,
					toggle: actions.viewToggleColorBox,
				},
			},
			{
				label: "&Status Bar",
				description: "Shows or hides the status bar.",
				checkbox: {
					check: actions.isStatusBarVisible,
					toggle: actions.viewToggleStatusBar,
				},
			},
			{
				label: "T&ext Toolbar",
				description: "Shows or hides the text toolbar.",
				checkbox: {
					check: actions.isTextToolbarVisible,
					toggle: actions.viewToggleTextToolbar,
				},
			},
			MENU_DIVIDER,
			{
				label: "&Zoom",
				submenu: [
					{
						label: "&Normal Size",
						description: "Zooms the picture to 100%.",
						enabled: () => actions.getMagnification() !== 1,
						action: actions.viewZoomNormal,
					},
					{
						label: "&Large Size",
						description: "Zooms the picture to 400%.",
						enabled: () => actions.getMagnification() !== 4,
						action: actions.viewZoomLarge,
					},
					{
						label: "Zoom To &Window",
						description: "Zooms the picture to fit within the view.",
						action: actions.viewZoomToWindow,
					},
					{
						label: "C&ustom...",
						description: "Zooms the picture.",
						action: actions.viewZoomCustom,
					},
					MENU_DIVIDER,
					{
						label: "Show &Grid",
						shortcutLabel: "Ctrl+G",
						ariaKeyShortcuts: "Control+G",
						description: "Shows or hides the grid.",
						enabled: () => actions.getMagnification() >= 4,
						checkbox: {
							check: actions.isGridVisible,
							toggle: actions.viewToggleGrid,
						},
					},
					{
						label: "Show T&humbnail",
						description: "Shows or hides the thumbnail view of the picture.",
						checkbox: {
							check: actions.isThumbnailVisible,
							toggle: actions.viewToggleThumbnail,
						},
					},
				],
			},
			{
				label: "&View Bitmap",
				shortcutLabel: "Ctrl+F",
				ariaKeyShortcuts: "Control+F",
				description: "Displays the entire picture.",
				action: actions.viewBitmap,
			},
			MENU_DIVIDER,
			{
				label: "&Fullscreen",
				shortcutLabel: "F11",
				ariaKeyShortcuts: "F11",
				description: "Makes the application take up the entire screen.",
				checkbox: {
					check: actions.isFullscreen,
					toggle: actions.viewFullscreen,
				},
			},
		],

		"&Image": [
			{
				label: "&Flip/Rotate...",
				shortcutLabel: "Ctrl+Alt+R",
				ariaKeyShortcuts: "Control+Alt+R",
				description: "Flips or rotates the picture or a selection.",
				action: actions.imageFlipRotate,
			},
			{
				label: "&Stretch/Skew...",
				shortcutLabel: "Ctrl+Alt+W",
				ariaKeyShortcuts: "Control+Alt+W",
				description: "Stretches or skews the picture or a selection.",
				action: actions.imageStretchSkew,
			},
			{
				label: "&Invert Colors",
				shortcutLabel: "Ctrl+I",
				ariaKeyShortcuts: "Control+I",
				description: "Inverts the colors of the picture or a selection.",
				action: actions.imageInvertColors,
			},
			{
				label: "&Attributes...",
				shortcutLabel: "Ctrl+E",
				ariaKeyShortcuts: "Control+E",
				description: "Changes the attributes of the picture.",
				action: actions.imageAttributes,
			},
			{
				label: "&Clear Image",
				shortcutLabel: "Ctrl+Shift+N",
				ariaKeyShortcuts: "Control+Shift+N",
				description: "Clears the picture.",
				enabled: () => !actions.hasSelection(),
				action: actions.imageClearImage,
			},
			{
				label: "Crop To Se&lection",
				description: "Crops the picture to the current selection.",
				enabled: actions.hasSelection,
				action: actions.imageCropToSelection,
			},
			{
				label: "&Draw Opaque",
				description: "Makes the current selection either opaque or transparent.",
				checkbox: {
					check: actions.isDrawOpaque,
					toggle: actions.imageToggleDrawOpaque,
				},
			},
		],

		"&Colors": [
			{
				label: "&Edit Colors...",
				description: "Creates a new color.",
				action: actions.colorsEditColors,
			},
			{
				label: "&Get Colors",
				description: "Uses a previously saved palette of colors.",
				action: actions.colorsGetColors,
			},
			{
				label: "&Save Colors",
				description: "Saves the current palette of colors to a file.",
				action: actions.colorsSaveColors,
			},
		],

		"&Help": [
			{
				label: "&Help Topics",
				description: "Displays Help for the current task or command.",
				action: actions.helpTopics,
			},
			MENU_DIVIDER,
			{
				label: "&About Paint",
				description: "Displays information about this application.",
				action: actions.helpAbout,
			},
		],

		"E&xtras": [
			{
				label: "🌍 &Language",
				description: "Changes the display language.",
				submenu: LANGUAGES.map((lang) => ({
					label: `${lang.emoji} ${lang.name}`,
					action: () => actions.extrasChangeLanguage(lang.code),
					enabled: () => actions.getCurrentLanguage() !== lang.code,
					description: `Changes the language to ${lang.englishName || lang.name}.`,
				})),
			},
		],
	};
}

/**
 * Default stub actions for development/testing.
 * Replace with actual implementations.
 */
export function createStubActions(): MenuActions {
	const stub = (_name: string) => () => {};

	return {
		// File menu
		fileNew: stub("File > New"),
		fileOpen: stub("File > Open"),
		fileSave: stub("File > Save"),
		fileSaveAs: stub("File > Save As"),
		fileLoadFromUrl: stub("File > Load From URL"),
		fileUploadToImgur: stub("File > Upload To Imgur"),
		fileManageStorage: stub("File > Manage Storage"),
		filePrint: stub("File > Print"),
		fileExit: stub("File > Exit"),

		// Edit menu
		editUndo: stub("Edit > Undo"),
		editRedo: stub("Edit > Redo"),
		editHistory: stub("Edit > History"),
		editCut: stub("Edit > Cut"),
		editCopy: stub("Edit > Copy"),
		editPaste: stub("Edit > Paste"),
		editClearSelection: stub("Edit > Clear Selection"),
		editSelectAll: stub("Edit > Select All"),
		editCopyTo: stub("Edit > Copy To"),
		editPasteFrom: stub("Edit > Paste From"),

		// View menu
		viewToggleToolBox: stub("View > Toggle Tool Box"),
		viewToggleColorBox: stub("View > Toggle Color Box"),
		viewToggleStatusBar: stub("View > Toggle Status Bar"),
		viewToggleTextToolbar: stub("View > Toggle Text Toolbar"),
		viewZoomNormal: stub("View > Zoom > Normal Size"),
		viewZoomLarge: stub("View > Zoom > Large Size"),
		viewZoomToWindow: stub("View > Zoom > Zoom To Window"),
		viewZoomCustom: stub("View > Zoom > Custom"),
		viewToggleGrid: stub("View > Zoom > Toggle Grid"),
		viewToggleThumbnail: stub("View > Zoom > Toggle Thumbnail"),
		viewBitmap: stub("View > View Bitmap"),
		viewFullscreen: stub("View > Fullscreen"),

		// Image menu
		imageFlipRotate: stub("Image > Flip/Rotate"),
		imageStretchSkew: stub("Image > Stretch/Skew"),
		imageInvertColors: stub("Image > Invert Colors"),
		imageAttributes: stub("Image > Attributes"),
		imageClearImage: stub("Image > Clear Image"),
		imageCropToSelection: stub("Image > Crop To Selection"),
		imageToggleDrawOpaque: stub("Image > Toggle Draw Opaque"),

		// Colors menu
		colorsEditColors: stub("Colors > Edit Colors"),
		colorsGetColors: stub("Colors > Get Colors"),
		colorsSaveColors: stub("Colors > Save Colors"),

		// Extras menu
		extrasChangeLanguage: (_lang: string) => {},
		getCurrentLanguage: () => 'en',

		// Help menu
		helpTopics: stub("Help > Help Topics"),
		helpAbout: stub("Help > About Paint"),

		// State checks - default to false/disabled
		canUndo: () => false,
		canRedo: () => false,
		hasSelection: () => false,
		hasClipboard: () => false,
		isToolBoxVisible: () => true,
		isColorBoxVisible: () => true,
		isStatusBarVisible: () => true,
		isTextToolbarVisible: () => false,
		isGridVisible: () => false,
		isThumbnailVisible: () => false,
		isFullscreen: () => false,
		isDrawOpaque: () => true,
		getMagnification: () => 1,
	};
}

export { MENU_DIVIDER };
