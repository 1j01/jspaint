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
	fileSetWallpaperTiled: () => void;
	fileSetWallpaperCentered: () => void;
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
	viewToggleAIPanel: () => void;
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
	isAIPanelVisible: () => boolean;
	isFullscreen: () => boolean;
	isDrawOpaque: () => boolean;
	getMagnification: () => number;
}

/**
 * Creates the complete menu structure with the provided action handlers.
 * @param {MenuActions} actions - Menu action handlers
 * @param {(key: string) => string} t - Translation function from i18next
 */
export function createMenus(actions: MenuActions, t: (key: string) => string = (key) => key): Record<string, MenuItem[]> {
	return {
		[t("&File")]: [
			{
				label: t("&New"),
				shortcutLabel: "Ctrl+Alt+N",
				ariaKeyShortcuts: "Control+Alt+N",
				description: t("Creates a new document."),
				action: actions.fileNew,
			},
			{
				label: t("&Open..."),
				shortcutLabel: "Ctrl+O",
				ariaKeyShortcuts: "Control+O",
				description: t("Opens an existing document."),
				action: actions.fileOpen,
			},
			{
				label: t("&Save"),
				shortcutLabel: "Ctrl+S",
				ariaKeyShortcuts: "Control+S",
				description: t("Saves the active document."),
				action: actions.fileSave,
			},
			{
				label: t("Save &As..."),
				shortcutLabel: "Ctrl+Shift+S",
				ariaKeyShortcuts: "Control+Shift+S",
				description: t("Saves the active document with a new name."),
				action: actions.fileSaveAs,
			},
			MENU_DIVIDER,
			{
				label: t("&Load From URL..."),
				description: t("Opens an image from the web."),
				action: actions.fileLoadFromUrl,
			},
			{
				label: t("&Upload To Imgur"),
				description: t("Uploads the active document to Imgur."),
				action: actions.fileUploadToImgur,
			},
			MENU_DIVIDER,
			{
				label: t("Manage Storage"),
				description: t("Manages storage of previously created or opened pictures."),
				action: actions.fileManageStorage,
			},
			MENU_DIVIDER,
			{
				label: t("Print Pre&view"),
				description: t("Displays full pages."),
				action: actions.filePrint,
			},
			{
				label: t("Page Se&tup"),
				description: t("Changes the page layout."),
				action: actions.filePrint,
			},
			{
				label: t("&Print..."),
				shortcutLabel: "Ctrl+P",
				ariaKeyShortcuts: "Control+P",
				description: t("Prints the active document and sets printing options."),
				action: actions.filePrint,
			},
			MENU_DIVIDER,
			{
				label: t("Set As &Wallpaper (Tiled)"),
				description: t("Tiles this bitmap as the desktop background."),
				action: actions.fileSetWallpaperTiled,
			},
			{
				label: t("Set As Wallpaper (&Centered)"),
				description: t("Centers this bitmap as the desktop background."),
				action: actions.fileSetWallpaperCentered,
			},
			MENU_DIVIDER,
			{
				label: t("Recent File"),
				disabled: true,
				description: "",
			},
			MENU_DIVIDER,
			{
				label: t("E&xit"),
				description: t("Quits Paint."),
				action: actions.fileExit,
			},
		],

		[t("&Edit")]: [
			{
				label: t("&Undo"),
				shortcutLabel: "Ctrl+Z",
				ariaKeyShortcuts: "Control+Z",
				description: t("Undoes the last action."),
				enabled: actions.canUndo,
				action: actions.editUndo,
			},
			{
				label: t("&Repeat"),
				shortcutLabel: "F4",
				ariaKeyShortcuts: "F4",
				description: t("Redoes the previously undone action."),
				enabled: actions.canRedo,
				action: actions.editRedo,
			},
			{
				label: t("&History"),
				shortcutLabel: "Ctrl+Shift+Y",
				ariaKeyShortcuts: "Control+Shift+Y",
				description: t("Shows the document history."),
				action: actions.editHistory,
			},
			MENU_DIVIDER,
			{
				label: t("Cu&t"),
				shortcutLabel: "Ctrl+X",
				ariaKeyShortcuts: "Control+X",
				description: t("Cuts the selection and puts it on the Clipboard."),
				enabled: actions.hasSelection,
				action: actions.editCut,
			},
			{
				label: t("&Copy"),
				shortcutLabel: "Ctrl+C",
				ariaKeyShortcuts: "Control+C",
				description: t("Copies the selection and puts it on the Clipboard."),
				enabled: actions.hasSelection,
				action: actions.editCopy,
			},
			{
				label: t("&Paste"),
				shortcutLabel: "Ctrl+V",
				ariaKeyShortcuts: "Control+V",
				description: t("Inserts the contents of the Clipboard."),
				enabled: actions.hasClipboard,
				action: actions.editPaste,
			},
			{
				label: t("C&lear Selection"),
				shortcutLabel: "Del",
				ariaKeyShortcuts: "Delete",
				description: t("Deletes the selection."),
				enabled: actions.hasSelection,
				action: actions.editClearSelection,
			},
			{
				label: t("Select &All"),
				shortcutLabel: "Ctrl+A",
				ariaKeyShortcuts: "Control+A",
				description: t("Selects everything."),
				action: actions.editSelectAll,
			},
			MENU_DIVIDER,
			{
				label: t("C&opy To..."),
				description: t("Copies the selection to a file."),
				enabled: actions.hasSelection,
				action: actions.editCopyTo,
			},
			{
				label: t("Paste &From..."),
				description: t("Pastes a file into the selection."),
				action: actions.editPasteFrom,
			},
		],

		[t("&View")]: [
			{
				label: t("&Tool Box"),
				description: t("Shows or hides the tool box."),
				checkbox: {
					check: actions.isToolBoxVisible,
					toggle: actions.viewToggleToolBox,
				},
			},
			{
				label: t("&Color Box"),
				shortcutLabel: "Ctrl+L",
				ariaKeyShortcuts: "Control+L",
				description: t("Shows or hides the color box."),
				checkbox: {
					check: actions.isColorBoxVisible,
					toggle: actions.viewToggleColorBox,
				},
			},
			{
				label: t("&Status Bar"),
				description: t("Shows or hides the status bar."),
				checkbox: {
					check: actions.isStatusBarVisible,
					toggle: actions.viewToggleStatusBar,
				},
			},
			{
				label: t("T&ext Toolbar"),
				description: t("Shows or hides the text toolbar."),
				checkbox: {
					check: actions.isTextToolbarVisible,
					toggle: actions.viewToggleTextToolbar,
				},
			},
			{
				label: t("&AI Assistant"),
				description: t("Shows or hides the AI assistant panel."),
				checkbox: {
					check: actions.isAIPanelVisible,
					toggle: actions.viewToggleAIPanel,
				},
			},
			MENU_DIVIDER,
			{
				label: t("&Zoom"),
				submenu: [
					{
						label: t("&Normal Size"),
						description: t("Zooms the picture to 100%."),
						enabled: () => actions.getMagnification() !== 1,
						action: actions.viewZoomNormal,
					},
					{
						label: t("&Large Size"),
						description: t("Zooms the picture to 400%."),
						enabled: () => actions.getMagnification() !== 4,
						action: actions.viewZoomLarge,
					},
					{
						label: t("Zoom To &Window"),
						description: t("Zooms the picture to fit within the view."),
						action: actions.viewZoomToWindow,
					},
					{
						label: t("C&ustom..."),
						description: t("Zooms the picture."),
						action: actions.viewZoomCustom,
					},
					MENU_DIVIDER,
					{
						label: t("Show &Grid"),
						shortcutLabel: "Ctrl+G",
						ariaKeyShortcuts: "Control+G",
						description: t("Shows or hides the grid."),
						enabled: () => actions.getMagnification() >= 4,
						checkbox: {
							check: actions.isGridVisible,
							toggle: actions.viewToggleGrid,
						},
					},
					{
						label: t("Show T&humbnail"),
						description: t("Shows or hides the thumbnail view of the picture."),
						checkbox: {
							check: actions.isThumbnailVisible,
							toggle: actions.viewToggleThumbnail,
						},
					},
				],
			},
			{
				label: t("&View Bitmap"),
				shortcutLabel: "Ctrl+F",
				ariaKeyShortcuts: "Control+F",
				description: t("Displays the entire picture."),
				action: actions.viewBitmap,
			},
			MENU_DIVIDER,
			{
				label: t("&Fullscreen"),
				shortcutLabel: "F11",
				ariaKeyShortcuts: "F11",
				description: t("Makes the application take up the entire screen."),
				checkbox: {
					check: actions.isFullscreen,
					toggle: actions.viewFullscreen,
				},
			},
		],

		[t("&Image")]: [
			{
				label: t("&Flip/Rotate..."),
				shortcutLabel: "Ctrl+Alt+R",
				ariaKeyShortcuts: "Control+Alt+R",
				description: t("Flips or rotates the picture or a selection."),
				action: actions.imageFlipRotate,
			},
			{
				label: t("&Stretch/Skew..."),
				shortcutLabel: "Ctrl+Alt+W",
				ariaKeyShortcuts: "Control+Alt+W",
				description: t("Stretches or skews the picture or a selection."),
				action: actions.imageStretchSkew,
			},
			{
				label: t("&Invert Colors"),
				shortcutLabel: "Ctrl+I",
				ariaKeyShortcuts: "Control+I",
				description: t("Inverts the colors of the picture or a selection."),
				action: actions.imageInvertColors,
			},
			{
				label: t("&Attributes..."),
				shortcutLabel: "Ctrl+E",
				ariaKeyShortcuts: "Control+E",
				description: t("Changes the attributes of the picture."),
				action: actions.imageAttributes,
			},
			{
				label: t("&Clear Image"),
				shortcutLabel: "Ctrl+Shift+N",
				ariaKeyShortcuts: "Control+Shift+N",
				description: t("Clears the picture."),
				enabled: () => !actions.hasSelection(),
				action: actions.imageClearImage,
			},
			{
				label: t("Crop To Se&lection"),
				description: t("Crops the picture to the current selection."),
				enabled: actions.hasSelection,
				action: actions.imageCropToSelection,
			},
			{
				label: t("&Draw Opaque"),
				description: t("Makes the current selection either opaque or transparent."),
				checkbox: {
					check: actions.isDrawOpaque,
					toggle: actions.imageToggleDrawOpaque,
				},
			},
		],

		[t("&Colors")]: [
			{
				label: t("&Edit Colors..."),
				description: t("Creates a new color."),
				action: actions.colorsEditColors,
			},
			{
				label: t("&Get Colors"),
				description: t("Uses a previously saved palette of colors."),
				action: actions.colorsGetColors,
			},
			{
				label: t("&Save Colors"),
				description: t("Saves the current palette of colors to a file."),
				action: actions.colorsSaveColors,
			},
		],

		[t("&Help")]: [
			{
				label: t("&Help Topics"),
				description: t("Displays Help for the current task or command."),
				action: actions.helpTopics,
			},
			MENU_DIVIDER,
			{
				label: t("&About Paint"),
				description: t("Displays information about this application."),
				action: actions.helpAbout,
			},
		],

		[t("E&xtras")]: [
			{
				label: t("🌍 &Language"),
				description: t("Changes the display language."),
				submenu: LANGUAGES.map((lang) => ({
					label: `${lang.emoji} ${lang.name}`,
					action: () => actions.extrasChangeLanguage(lang.code),
					enabled: () => actions.getCurrentLanguage() !== lang.code,
					description: t("Changes the language to {{name}}.", { name: lang.englishName || lang.name }),
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
		fileSetWallpaperTiled: stub("File > Set As Wallpaper (Tiled)"),
		fileSetWallpaperCentered: stub("File > Set As Wallpaper (Centered)"),
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
		viewToggleAIPanel: stub("View > Toggle AI Panel"),
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
		isAIPanelVisible: () => false,
		isFullscreen: () => false,
		isDrawOpaque: () => true,
		getMagnification: () => 1,
	};
}

export { MENU_DIVIDER };
