// This file defines globals used in the app, for typescript.
// Some types are installed through npm, like for jQuery and the Youtube API, so it doesn't need to be defined here,
// but some libraries don't have types (at least not installed), and the app uses a lot of custom globals.

// I'm working on transitioning to ES Modules, but having the ES Modules
// export globals until all dependent files are converted to ESM.
// The scripts are mostly converted to ESM, nominally, but not properly modularized.
// Once they all use imports and no globals, I should be able to remove a lot of code from this file.

// NOTE: IMPORTING/EXPORTING ANYTHING WILL BREAK AMBIENT DECLARATIONS

declare const libtess: any;
declare const firebase: any;
declare const GIF: any;
declare const UTIF: any;
declare const UPNG: any;
declare const encodeBMP: any;
declare const decodeBMP: any;
declare const saveAs: any;
declare const FontDetective: any;
declare const AnyPalette: any;
declare const ImageTracer: any;
declare const TrackyMouse: any;

// Globals from scripts that are not converted to ESM yet,
// and thus can't be imported. (I've been marking scripts as @ts-check as I convert them.)
// This supports bare identifier global access (no `window.` needed).
// app-localization.js
declare function localize(english_text: string, ...interpolations: string[]): string;
declare function get_direction(language?: string): "rtl" | "ltr";
declare function get_language(): string;
declare function set_language(language: string): void;
declare function get_language_endonym(language: string): string;
declare function get_iso_language_name(language: string): string;
declare function get_language_emoji(language: string): string;
declare const available_languages: string[];
// tools.js
declare const TOOL_PENCIL: "TOOL_PENCIL";
// app-state.js
// declare let brush_shape: BrushShape;
// declare let brush_size: number
// declare let eraser_size: number;
// declare let airbrush_size: number;
// declare let pencil_size: number;
// declare let stroke_size: number; // applies to lines, curves, shape outlines
// declare let default_brush_shape: BrushShape;
// declare let default_brush_size: number
// declare let default_eraser_size: number;
// declare let default_airbrush_size: number;
// declare let default_pencil_size: number;
// declare let default_stroke_size: number;

// declare let tool_transparent_mode: boolean;
// declare let stroke_color: string | CanvasPattern;
// declare let fill_color: string | CanvasPattern;
// declare let pick_color_slot: ColorSelectionSlot;

// declare let selected_tool: Tool;
// declare let selected_tools: Tool[];
// declare let return_to_tools: Tool[];
// declare let selected_colors: {
// 	foreground: string | CanvasPattern,
// 	background: string | CanvasPattern,
// 	ternary: string | CanvasPattern,
// };

// declare let selection: OnCanvasSelection;
// declare let textbox: OnCanvasTextBox;
// declare let helper_layer: OnCanvasHelperLayer;
// declare let $thumbnail_window: OSGUI$Window;
// declare let thumbnail_canvas: HTMLCanvasElement;
// declare let show_grid: boolean;
// declare let show_thumbnail: boolean;
// declare let text_tool_font: TextToolFontOptions;
interface TextToolFontOptions {
	/** should be an exact value detected by Font Detective */
	family: string,

	size: number,
	line_scale: number,

	bold: boolean,
	italic: boolean,
	underline: boolean,
	vertical: boolean,

	color: string,
	background: string,
};
// declare let root_history_node: HistoryNode;
// declare let current_history_node: HistoryNode;
// declare let history_node_to_cancel_to: HistoryNode | null;
// declare let undos: HistoryNode[];
// declare let redos: HistoryNode[];
// declare let file_name: string;
// declare let system_file_handle: UserFileHandle;
// declare let saved: boolean;
// declare let pointer: { x: number, y: number } | undefined;
// declare let pointer_start: { x: number, y: number } | undefined;
// declare let pointer_previous: { x: number, y: number } | undefined;
// declare let pointer_active: boolean;
// declare let pointer_type: string;
// declare let pointer_buttons: number;
// declare let reverse: boolean;
// declare let ctrl: boolean;
// declare let shift: boolean;
// declare let button: number;
// declare let pointer_over_canvas: boolean;
// declare let update_helper_layer_on_pointermove_active: boolean;
// declare let pointers: { x: number, y: number, pointerId: number, pointerType: string, isPrimary: boolean }[];

// $ToolBox.js
declare interface I$ToolBox {
	update_selected_tool(): void;
}
// $ColorBox.js
declare interface I$ColorBox {
	rebuild_palette(): void;
}

// $Component.js
interface I$Component {
	hide(): this;
	show(): this;
	toggle(): this;
	dock($dock_to?: JQuery<HTMLElement>): void;
	undock_to(x: number, y: number): void;
	destroy(): void;
}
// helpers.js
declare function make_css_cursor(name: string, coords: [number, number], fallback: string): string;
declare function make_canvas(width: number, height: number): PixelCanvas;
declare function make_canvas(source: HTMLImageElement | HTMLCanvasElement | ImageData): PixelCanvas;
declare function make_canvas(): PixelCanvas;
declare function get_format_from_extension<T extends FileFormat>(formats: T[], file_path_or_name_or_ext: string): T;
declare const $G: JQuery<Window>;

// color-data.js
declare const default_palette: (string | CanvasPattern)[];
// file-format-data.js
declare function formats_unique_per_file_extension<T extends FileFormat>(formats: T[]): T[];
// storage.js
interface LocalStore {
	get(key: string, callback: (error: Error | null, value: string) => void): void,

	get(key_default_value_pairs: Record<string, string>, callback: (error: Error | null, values: Record<string, string>) => void): void,

	// This signature is more for showing a mistake, as only strings can be stored in localStorage.
	// That said, you can get arbitrary types when the default values are returned.
	// get(key_default_value_pairs: Record<string, unknown>, callback: (error: Error | null, values: Record<string, unknown>) => void): void,
	// This was an attempt to handle arbitrary default types as a feature, but it didn't work out.
	// get<T extends string>(key_default_value_pairs: Record<string, T>, callback: (error: Error | null, values: Record<string, T>) => void): void,
	// Actually this does what I meant (and I think this is most accurate):
	// (This generalizes the above too, but I might want to keep the above string-specific version for clarity.)
	get<T>(key_default_value_pairs: Record<string, T | string>, callback: (error: Error | null, values: Record<string, T | string>) => void): void,

	get(keys: string[], callback: (error: Error | null, values: Record<string, string>) => void): void,

	set(key: string, value: string, callback: (error: Error | null) => void): void,

	set(key_value_pairs: Record<string, string>, callback: (error: Error | null) => void): void,
}
// sessions.js
declare function new_local_session(): void;

// functions.js
declare function get_tool_by_id(id: string): Tool;
declare function make_monochrome_palette(rgba1?: number[], rgba2?: number[]): (string | CanvasPattern)[];
/**
 * @param {object} options
 * @param {HistoryNode | null=} options.parent - the state before this state (its basis), or null if this is the first state
 * @param {HistoryNode[]=} options.futures - the states branching off from this state (its children)
 * @param {number=} options.timestamp - when this state was created
 * @param {boolean=} options.soft - indicates that undo should skip this state; it can still be accessed with the History window
 * @param {ImageData | null=} options.image_data - the image data for the canvas (TODO: region updates)
 * @param {ImageData | null=} options.selection_image_data - the image data for the selection, if any
 * @param {number=} options.selection_x - the x position of the selection, if any
 * @param {number=} options.selection_y - the y position of the selection, if any
 * @param {string=} options.textbox_text - the text in the textbox, if any
 * @param {number=} options.textbox_x - the x position of the textbox, if any
 * @param {number=} options.textbox_y - the y position of the textbox, if any
 * @param {number=} options.textbox_width - the width of the textbox, if any
 * @param {number=} options.textbox_height - the height of the textbox, if any
 * @param {TextToolFontOptions | null=} options.text_tool_font - the font of the Text tool (important to restore a textbox-containing state, but persists without a textbox)
 * @param {boolean=} options.tool_transparent_mode - whether transparent mode is on for Select/Free-Form Select/Text tools; otherwise box is opaque
 * @param {string | CanvasPattern=} options.foreground_color - selected foreground color (left click)
 * @param {string | CanvasPattern=} options.background_color - selected background color (right click)
 * @param {string | CanvasPattern=} options.ternary_color - selected ternary color (ctrl+click)
 * @param {string=} options.name - the name of the operation, shown in the history window, e.g. localize("Resize Canvas")
 * @param {HTMLImageElement |HTMLCanvasElement | null=} options.icon - a visual representation of the operation type, shown in the history window, e.g. get_help_folder_icon("p_blank.png")
 * @returns {HistoryNode}
 */
declare function make_history_node({ parent, futures, timestamp, soft, image_data, selection_image_data, selection_x, selection_y, textbox_text, textbox_x, textbox_y, textbox_width, textbox_height, text_tool_font, tool_transparent_mode, foreground_color, background_color, ternary_color, name, icon, }: {
	parent?: (HistoryNode | null) | undefined;
	futures?: HistoryNode[] | undefined;
	timestamp?: number | undefined;
	soft?: boolean | undefined;
	image_data?: (ImageData | null) | undefined;
	selection_image_data?: (ImageData | null) | undefined;
	selection_x?: number | undefined;
	selection_y?: number | undefined;
	textbox_text?: string | undefined;
	textbox_x?: number | undefined;
	textbox_y?: number | undefined;
	textbox_width?: number | undefined;
	textbox_height?: number | undefined;
	text_tool_font?: (TextToolFontOptions | null) | undefined;
	tool_transparent_mode?: boolean | undefined;
	foreground_color?: (string | CanvasPattern) | undefined;
	background_color?: (string | CanvasPattern) | undefined;
	ternary_color?: (string | CanvasPattern) | undefined;
	name?: string | undefined;
	icon?: (HTMLImageElement | HTMLCanvasElement | null) | undefined;
}): HistoryNode;
declare function exit_fullscreen_if_ios(): void;
declare function show_about_paint(): void;
/**
 * @param {Blob} blob
 * @param {() => void} okay_callback
 * @param {number[]} [magic_number_bytes]
 * @param {boolean} [magic_wanted]
 */
declare function sanity_check_blob(blob: Blob, okay_callback: () => void, magic_number_bytes?: number[], magic_wanted?: boolean): void;
/**
 * @param {string} message
 * @param {Error | string} [error]
 */
declare function show_error_message(message: string, error?: Error | string | undefined): void;
/**
 * Prompts the user to save changes to the document.
 * @param {(info?: { canvas_modified_while_loading?: boolean }) => void} action
 * @param {() => void} [canceled]
 * @param {boolean} [from_session_load]
 */
declare function are_you_sure(
	action: (info?: { canvas_modified_while_loading?: boolean }) => void,
	canceled?: () => void, from_session_load?: boolean
): void;
/**
 * @param {Blob} file
 * @param {UserFileHandle} source_file_handle
 */
declare function open_from_file(file: Blob, source_file_handle: UserFileHandle): void;

// msgbox.js
declare function showMessageBox(options: MessageBoxOptions): Promise<string>;

// app.js
declare const systemHooks: SystemHooks;
declare const systemHookDefaults: SystemHooks;
declare const canvas_bounding_client_rect: DOMRect;
declare const _open_images_serially: boolean; // for testing
declare const $app: JQuery<HTMLDivElement>;
declare const $left: JQuery<HTMLDivElement>;
declare const $right: JQuery<HTMLDivElement>;
declare const $top: JQuery<HTMLDivElement>;
declare const $bottom: JQuery<HTMLDivElement>;
declare const $canvas_area: JQuery<HTMLDivElement>;
declare const $canvas: JQuery<HTMLCanvasElement>;
declare const $colorbox: JQuery<HTMLDivElement> & I$Component & I$ColorBox;
declare const $status_area: JQuery<HTMLDivElement>;
declare const $status_position: JQuery<HTMLDivElement>;
declare const $status_size: JQuery<HTMLDivElement>;
declare const $status_text: JQuery<HTMLDivElement> & { default: () => void };
declare const $toolbox: JQuery<HTMLDivElement> & I$Component & I$ToolBox;
declare const canvas_handles: Handles;
declare const clipboardData: DataTransfer | null; // old IE?
declare const debugKeepMenusOpen: boolean; // for debugging (otherwise you need `setTimeout(() => { debugger; }, 4000);`)
declare const initial_system_file_handle: UserFileHandle | null;
declare const menu_bar: MenuBar;
declare const systemHookDefaults: SystemHooks;
declare const systemHooks: SystemHooks;

declare function update_fill_and_stroke_colors_and_lineWidth(tool: Tool): void;
declare function tool_go(tool: Tool, event_name?: string): void;
declare function average_points(points: { x: number, y: number }[]): { x: number, y: number };

// Globals temporarily exported from ES Modules,
// as well as globals from scripts that are not converted to ESM yet.
// This supports `window.*` property access.
interface Window {
	// helpers.js
	$G: JQuery<Window>;
	make_canvas: {
		(width: number, height: number): PixelCanvas,
		(source: HTMLImageElement | HTMLCanvasElement | ImageData): PixelCanvas,
		(): PixelCanvas,
	};
	get_help_folder_icon: (file_name: string) => HTMLImageElement;
	get_format_from_extension: <T extends FileFormat>(formats: T[], file_path_or_name_or_ext: string) => T;
	// functions.js
	get_tool_by_id(id: string): Tool;
	make_monochrome_palette(rgba1?: number[], rgba2?: number[]): (string | CanvasPattern)[];
	/**
	 * @param {object} options
	 * @param {HistoryNode | null=} options.parent - the state before this state (its basis), or null if this is the first state
	 * @param {HistoryNode[]=} options.futures - the states branching off from this state (its children)
	 * @param {number=} options.timestamp - when this state was created
	 * @param {boolean=} options.soft - indicates that undo should skip this state; it can still be accessed with the History window
	 * @param {ImageData | null=} options.image_data - the image data for the canvas (TODO: region updates)
	 * @param {ImageData | null=} options.selection_image_data - the image data for the selection, if any
	 * @param {number=} options.selection_x - the x position of the selection, if any
	 * @param {number=} options.selection_y - the y position of the selection, if any
	 * @param {string=} options.textbox_text - the text in the textbox, if any
	 * @param {number=} options.textbox_x - the x position of the textbox, if any
	 * @param {number=} options.textbox_y - the y position of the textbox, if any
	 * @param {number=} options.textbox_width - the width of the textbox, if any
	 * @param {number=} options.textbox_height - the height of the textbox, if any
	 * @param {TextToolFontOptions | null=} options.text_tool_font - the font of the Text tool (important to restore a textbox-containing state, but persists without a textbox)
	 * @param {boolean=} options.tool_transparent_mode - whether transparent mode is on for Select/Free-Form Select/Text tools; otherwise box is opaque
	 * @param {string | CanvasPattern=} options.foreground_color - selected foreground color (left click)
	 * @param {string | CanvasPattern=} options.background_color - selected background color (right click)
	 * @param {string | CanvasPattern=} options.ternary_color - selected ternary color (ctrl+click)
	 * @param {string=} options.name - the name of the operation, shown in the history window, e.g. localize("Resize Canvas")
	 * @param {HTMLImageElement |HTMLCanvasElement | null=} options.icon - a visual representation of the operation type, shown in the history window, e.g. get_help_folder_icon("p_blank.png")
	 * @returns {HistoryNode}
	 */
	make_history_node({ parent, futures, timestamp, soft, image_data, selection_image_data, selection_x, selection_y, textbox_text, textbox_x, textbox_y, textbox_width, textbox_height, text_tool_font, tool_transparent_mode, foreground_color, background_color, ternary_color, name, icon, }: {
		parent?: (HistoryNode | null) | undefined;
		futures?: HistoryNode[] | undefined;
		timestamp?: number | undefined;
		soft?: boolean | undefined;
		image_data?: (ImageData | null) | undefined;
		selection_image_data?: (ImageData | null) | undefined;
		selection_x?: number | undefined;
		selection_y?: number | undefined;
		textbox_text?: string | undefined;
		textbox_x?: number | undefined;
		textbox_y?: number | undefined;
		textbox_width?: number | undefined;
		textbox_height?: number | undefined;
		text_tool_font?: (TextToolFontOptions | null) | undefined;
		tool_transparent_mode?: boolean | undefined;
		foreground_color?: (string | CanvasPattern) | undefined;
		background_color?: (string | CanvasPattern) | undefined;
		ternary_color?: (string | CanvasPattern) | undefined;
		name?: string | undefined;
		icon?: (HTMLImageElement | HTMLCanvasElement | null) | undefined;
	}): HistoryNode;
	exit_fullscreen_if_ios: () => void;
	show_about_paint: () => void;
	/**
	 * @param {Blob} blob
	 * @param {() => void} okay_callback
	 * @param {number[]} [magic_number_bytes]
	 * @param {boolean} [magic_wanted]
	 */
	sanity_check_blob: (blob: Blob, okay_callback: () => void, magic_number_bytes?: number[], magic_wanted?: boolean) => void;
	/**
	 * @param {string} message
	 * @param {Error | string} [error]
	 */
	show_error_message: (message: string, error?: Error | string | undefined) => void;
	/**
	 * Prompts the user to save changes to the document.
	 * @param {(info?: { canvas_modified_while_loading?: boolean }) => void} action
	 * @param {() => void} [canceled]
	 * @param {boolean} [from_session_load]
	 */
	are_you_sure(
		action: (info?: { canvas_modified_while_loading?: boolean }) => void,
		canceled?: () => void, from_session_load?: boolean
	): void;
	/**
	 * @param {File} file
	 * @param {UserFileHandle} source_file_handle
	 */
	open_from_file(file: File, source_file_handle: UserFileHandle): void;
	// tools.js
	TOOL_PENCIL: "TOOL_PENCIL";
	// app.js
	canvas_bounding_client_rect: DOMRect;
	_open_images_serially: boolean; // for testing
	$app: JQuery<HTMLDivElement>;
	$left: JQuery<HTMLDivElement>;
	$right: JQuery<HTMLDivElement>;
	$top: JQuery<HTMLDivElement>;
	$bottom: JQuery<HTMLDivElement>;
	$canvas_area: JQuery<HTMLDivElement>;
	$canvas: JQuery<HTMLCanvasElement>;
	$colorbox: JQuery<HTMLDivElement> & I$Component & I$ColorBox;
	$status_area: JQuery<HTMLDivElement>;
	$status_position: JQuery<HTMLDivElement>;
	$status_size: JQuery<HTMLDivElement>;
	$status_text: JQuery<HTMLDivElement> & { default: () => void };
	$toolbox: JQuery<HTMLDivElement> & I$Component & I$ToolBox;
	canvas_handles: Handles;
	clipboardData: DataTransfer | null; // old IE?
	debugKeepMenusOpen: boolean; // for debugging (otherwise you need `setTimeout(() => { debugger; }, 4000);`)
	initial_system_file_handle: UserFileHandle | null;
	menu_bar: MenuBar;
	systemHookDefaults: SystemHooks;
	systemHooks: SystemHooks;
	// app-state.js
	selection: OnCanvasSelection;
	textbox: OnCanvasTextBox;
	helper_layer: OnCanvasHelperLayer;
	selected_tool: Tool;
	selected_tools: Tool[];
	return_to_tools: Tool[];
	selected_colors: {
		foreground: string | CanvasPattern,
		background: string | CanvasPattern,
		ternary: string | CanvasPattern,
	};
	text_tool_font: {
		family: string, // should be an exact value detected by Font Detective
		size: number,
		line_scale: number,
		bold: boolean,
		italic: boolean,
		underline: boolean,
		vertical: boolean,
		color: string,
		background: string,
	};
	brush_shape: BrushShape;
	brush_size: number
	eraser_size: number;
	airbrush_size: number;
	pencil_size: number;
	stroke_size: number;
	default_brush_shape: BrushShape;
	default_brush_size: number
	default_eraser_size: number;
	default_airbrush_size: number;
	default_pencil_size: number;
	default_stroke_size: number;

	api_for_cypress_tests: {
		reset_for_next_test: () => void;
		selected_colors: {
			foreground: string | CanvasPattern,
			background: string | CanvasPattern,
			ternary: string | CanvasPattern,
		};
		set_theme: (theme_file_name: string) => void;
		$: JQueryStatic;
	};

	// app-localization.js
	available_languages: string[];
	loaded_localizations: (language: string, mapping: Record<string, string>) => void; // JSONP callback in the localization files
	// msgbox.js
	showMessageBox: (options: MessageBoxOptions) => Promise<string>;
	defaultMessageBoxTitle: string;
	audioContext: AudioContext;
	// color-data.js
	default_palette: (string | CanvasPattern)[];
	// help.js
	jQuery: JQueryStatic; // help.js reaches into iframe to use jQuery
	MouseEvent: typeof MouseEvent; // help.js reaches into iframe and uses MouseEvent
	applyTheme: (cssProperties: Record<string, string>, documentElement?: HTMLElement) => void; // this is defined in 98.js.org... does it actually exist [when running in 98.js.org]? btw HTMLHtmlElement would be more specific, but document.documentElement is typed as HTMLElement, so it'd just be annoying
	themeCSSProperties: Record<string, string>;
	// file-format-data.js
	image_formats: ImageFileFormat[];
	palette_formats: PaletteFileFormat[];
	formats_unique_per_file_extension: <T extends FileFormat>(formats: T[]) => T[];
	// sessions.js
	new_local_session: () => void;
	// speech-recognition.js
	search_page_html: string; // just for debugging
	search_page_$html: JQuery; // just for debugging
	// image-manipulation.js
	WEBGL_lose_context: WEBGL_lose_context | null; // just for debugging
	// eye-gaze-mode.js and speech-recognition.js
	untrusted_gesture: boolean;
	// simulate-random-gestures.js
	simulateRandomGesturesPeriodically: () => void;
	drawRandomlySeed: number;
	// electron-injected.js
	is_electron_app?: boolean;
	electron_is_dev?: boolean;
	setDocumentEdited?: (edited: boolean) => void;
	setRepresentedFilename?: (filename: string) => void;
	setMenus?: (menus: any) => void; // TODO: types for OS-GUI.js menus
	// OS-GUI's MenuBar.js
	MenuBar: typeof MenuBar;
	// Youtube API, used by vaporwave-fun.js, missing from @types/youtube
	onYouTubeIframeAPIReady?: () => void;
	// Local Font Access API
	queryLocalFonts?: () => Promise<FontData[]>;
	// Chrome browser detection
	chrome?: { loadTimes: unknown, csi: unknown };
}

// Extending OS-GUI's MenuBar API
interface OSGUIMenuItem {
	speech_recognition?: string[];
	emoji_icon?: string;
}

// The JS Paint `systemHooks` API
interface SaveFileDialogOptions {
	formats: FileFormat[];
	defaultFileName?: string;
	defaultPath?: UserFileHandle; // a bit of a misnomer since UserFileHandle is not _necessarily_ a path
	defaultFileFormatID?: string;
	getBlob: (formatID: string) => Promise<Blob>;
	savedCallbackUnreliable?: (params: { newFileName: string; newFileFormatID: string; newFileHandle: any; newBlob: Blob }) => void;
	dialogTitle?: string;
}

interface OpenFileDialogOptions {
	formats: FileFormat[];
}

interface SystemHooks {
	showSaveFileDialog(options: SaveFileDialogOptions): Promise<void>;
	showOpenFileDialog(options: OpenFileDialogOptions): Promise<{ file: Blob; fileHandle?: UserFileHandle; }>;
	writeBlobToHandle(fileHandle: UserFileHandle, blob: Blob): Promise<boolean | undefined>;
	readBlobFromHandle(fileHandle: UserFileHandle): Promise<Blob | undefined>;
	setWallpaperTiled(canvas: HTMLCanvasElement): void;
	setWallpaperCentered(canvas: HTMLCanvasElement): void;
}

//

interface MessageBoxOptions {
	title?: string;
	message?: string;
	messageHTML?: string;
	buttons?: { label: string, value: string, default?: boolean, action?: () => void }[];
	iconID?: "error" | "warning" | "info" | "nuke";
	windowOptions?: OSGUIWindowOptions;
}

declare class FontData {
	family: string;
	fullName: string;
	postscriptName: string;
	style: string;
}

declare class OnCanvasObject {
	constructor(x: number, y: number, width: number, height: number, hideMainCanvasHandles: boolean);
	x: number;
	y: number;
	width: number;
	height: number;
	hideMainCanvasHandles: boolean;
	$el: JQuery<HTMLDivElement>;
	// _global_resize_handler: () => void;
	position(updateStatus?: boolean): void;
	destroy(): void;
}
declare class OnCanvasHelperLayer extends OnCanvasObject {
	constructor(x: any, y: any, width: any, height: any, hideMainCanvasHandles: any, pixelRatio?: number);
	canvas: PixelCanvas;
}
declare class OnCanvasSelection extends OnCanvasObject {
	constructor(x: number, y: number, width: number, height: number, image_source?: HTMLImageElement | HTMLCanvasElement | ImageData);
	instantiate(image_source: HTMLImageElement | HTMLCanvasElement | ImageData): void;
	cut_out_background(): void;
	update_tool_transparent_mode(): void;
	replace_source_canvas(new_source_canvas: PixelCanvas): void;
	resize(): void;
	scale(factor: number): void;
	draw(): void;
	canvas: PixelCanvas;
	source_canvas: PixelCanvas;
	dragging: boolean;
}
declare class OnCanvasTextBox extends OnCanvasObject {
	constructor(x: number, y: number, width: number, height: number, starting_text?: string);
	position(): void;
	static $fontbox: OSGUI$Window | null;
	canvas: PixelCanvas;
	$editor: JQuery<HTMLTextAreaElement>;
	dragging: boolean;
}

// `Handles` declaration may not be needed anymore, but its options are complex enough
// that it might make sense to define them here as `HandlesOptions`...
declare class Handles {
	/**
	 * Handles for resizable, draggable, on-canvas objects.
	 * @param {object} options
	 * @param {JQuery} options.$handles_container
	 * @param {JQuery} options.$object_container
	 * @param {number} [options.outset=0]
	 * @param {() => number} [options.get_handles_offset_left=() => 0]
	 * @param {() => number} [options.get_handles_offset_top=() => 0]
	 * @param {() => number} [options.get_ghost_offset_left=() => 0]
	 * @param {() => number} [options.get_ghost_offset_top=() => 0]
	 * @param {boolean} [options.size_only=false]
	 * @param {() => Rect} options.get_rect
	 * @param {(rect: Rect) => void} options.set_rect
	 * @param {(rect: Rect, x_axis: -1 | 0 | 1, y_axis: -1 | 0 | 1) => Rect} [options.constrain_rect]
	 * @param {boolean} [options.thick]
	 * @constructor
	 * @property {HTMLElement[]} handles
	 * @property {() => void} hide
	 * @property {() => void} show
	 * @property {HTMLElement[]} handles
	 */
	constructor(options: {
		$handles_container: JQuery;
		$object_container: JQuery;
		outset?: number;
		get_handles_offset_left?: () => number;
		get_handles_offset_top?: () => number;
		get_ghost_offset_left?: () => number;
		get_ghost_offset_top?: () => number;
		size_only?: boolean;
		get_rect: () => {
			x: number;
			y: number;
			width: number;
			height: number;
		};
		set_rect: (rect: {
			x: number;
			y: number;
			width: number;
			height: number;
		}) => void;
		constrain_rect?: (rect: {
			x: number;
			y: number;
			width: number;
			height: number;
		}, x_axis: -1 | 0 | 1, y_axis: -1 | 0 | 1) => {
			x: number;
			y: number;
			width: number;
			height: number;
		};
		thick?: boolean;
	});
	handles: HTMLElement[];
	hide: () => void;
	show: () => void;
}

interface Rect { x: number; y: number; width: number; height: number; }

// part of os-gui.js which was extracted from jspaint into a library
// interface I$FormWindow {
// 	$form: JQuery<HTMLFormElement>;
// 	$main: JQuery<HTMLDivElement>;
// 	$buttons: JQuery<HTMLDivElement>;

// 	$Button(label: string, action: () => void): JQuery<HTMLButtonElement>;
// }

// still part of jspaint, uncomfortably overlapping with os-gui.js's I$FormWindow
interface I$DialogWindow {
	$form: JQuery<HTMLFormElement>;
	$main: JQuery<HTMLDivElement>;
	$buttons: JQuery<HTMLDivElement>;

	$Button(label: string | Node, action: () => void, options?: { type?: string }): JQuery<HTMLButtonElement>;
}
// definitely some cleanup to be done here regarding the window "classes"
interface I$ToolWindow { }

//

type ToolID =
	"TOOL_FREE_FORM_SELECT" |
	"TOOL_SELECT" |
	"TOOL_ERASER" |
	"TOOL_FILL" |
	"TOOL_PICK_COLOR" |
	"TOOL_MAGNIFIER" |
	"TOOL_PENCIL" |
	"TOOL_BRUSH" |
	"TOOL_AIRBRUSH" |
	"TOOL_TEXT" |
	"TOOL_LINE" |
	"TOOL_CURVE" |
	"TOOL_RECTANGLE" |
	"TOOL_POLYGON" |
	"TOOL_ELLIPSE" |
	"TOOL_ROUNDED_RECTANGLE";

// This is very silly!
// This isn't a coherent API, but rather a layered set of functionality
// all typed as if it were a single API.
// It's not providing much type safety,
// just look at eraser_paint_iteration/ffs_paint_iteration for example.
// I had to rename them from "paint_iteration" because was defined differently for two different tools.
// A class hierarchy may be in order, or another way of encapsulating
// subsets of functionality, such as functions that return tool objects,
// instead of properties that imply other properties should be generated.
interface Tool {
	id: ToolID,
	name: string,
	speech_recognition: string[],
	help_icon: string,
	description: string,
	cursor: Parameters<typeof make_css_cursor>,
	/** Indicates that the brush operation should be previewed on the canvas at the cursor location. */
	dynamic_preview_cursor?: boolean,
	/** Indicates that the tool should be deselected after a single use. */
	deselect?: boolean,
	/** Used by Polygon tool. Indicates that the tool should use colors like point-to-point shape tools, even though it has different UI. */
	shape_colors?: boolean,
	/** Used for Curve, Line, Pencil tools. */
	stroke_only?: boolean,
	/** Used by Airbrush tool */
	paint_on_time_interval?: number,

	/** Called when... */
	preload?(): void,
	/** Called when... */
	pointerdown?(ctx: CanvasRenderingContext2D, x: number, y: number): void,
	/** Called when... */
	paint?(ctx: CanvasRenderingContext2D, x: number, y: number): void,
	/** Used by Free-Form Select tool */
	ffs_paint_iteration?(x: number, y: number): void,
	/** Used by Eraser tool */
	eraser_paint_iteration?(ctx: CanvasRenderingContext2D, x: number, y: number): void,
	/** Called when... */
	pointerup?(ctx: CanvasRenderingContext2D, x: number, y: number): void,
	/** Called when... */
	cancel?(): void,
	/** Called when... */
	end?(ctx: CanvasRenderingContext2D): void,
	/** Called when rendering... */
	drawPreviewUnderGrid?(ctx: CanvasRenderingContext2D, x: number, y: number, grid_visible: boolean, scale: number, translate_x: number, translate_y: number);
	/** Called when rendering... */
	drawPreviewAboveGrid?(ctx: CanvasRenderingContext2D, x: number, y: number, grid_visible: boolean, scale: number, translate_x: number, translate_y: number);
	/** Called when... */
	init_mask_canvas?(): void,
	/** Called when... Can return true to indicate it should be animated (re-rendered next frame) */
	render_from_mask?(ctx: CanvasRenderingContext2D, previewing?: boolean): void | boolean,
	/** Defines the tool as one that draws a shape between the mouse down location and mouse up location. */
	shape?(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void,
	/** Defines the tool as one that paints a region with the current color... */
	paint_mask?(ctx: CanvasRenderingContext2D, x: number, y: number): void,
	/** Called when... */
	selectBox?(x: number, y: number, w: number, h: number): void,
	/** Defines the tool as one that paints continuously as the cursor moves. */
	get_brush?(): { size: number, shape: BrushShape },
	/** Used by Polygon tool */
	reset?(): void,
	/** Used by Polygon tool */
	complete?(ctx: CanvasRenderingContext2D): void,
	/** Used by Polygon tool */
	updateStatus?(): void,
	/** Used by Magnifier tool */
	getProspectiveMagnification?(): number,

	/** Used by several tools */
	mask_canvas?: PixelCanvas,
	/** Used by some tools */
	shape_canvas?: PixelCanvas,
	/** Used by some tools */
	preview_canvas?: PixelCanvas,
	/** Used by Free-Form Select tool */
	x_min?: number,
	/** Used by Free-Form Select tool */
	x_max?: number,
	/** Used by Free-Form Select tool */
	y_min?: number,
	/** Used by Free-Form Select tool */
	y_max?: number,
	/** Used by Free-Form Select, Curve, and Polygon tools */
	points?: { x: number, y: number }[],
	/** Used by Polygon tool */
	last_click_pointerdown?: { x: number, y: number, time: number },
	/** Used by Polygon tool */
	last_click_pointerup?: { x: number, y: number, time: number },
	/** Used by Eraser tool */
	get_rect?(x: number, y: number): { rect_x: number, rect_y: number, rect_w: number, rect_h: number },
	/** Used by Eraser tool */
	color_eraser_mode?: boolean,
	/** Used by Pick Color tool */
	current_color?: string,
	/** Used by Pick Color tool */
	display_current_color?(): void,

	// UI
	$options?: JQuery<HTMLElement> & { fill?: boolean, stroke?: boolean },
	$button?: JQuery<HTMLElement>,
}

interface HistoryNode {
	/** the state before this state (its basis), or null if this is the first state */
	parent: HistoryNode | null;
	/** the states branching off from this state (its children) */
	futures: HistoryNode[];
	/** when this state was created */
	timestamp: number;
	/** indicates that undo should skip this state; it can still be accessed with the History window */
	soft: boolean;
	/** the image data for the canvas (TODO: region updates) */
	image_data: ImageData | null;
	/** the image data for the selection, if any */
	selection_image_data: ImageData | null;
	/** the x position of the selection, if any */
	selection_x: number;
	/** the y position of the selection, if any */
	selection_y: number;
	/** the text in the textbox, if any */
	textbox_text: string;
	/** the x position of the textbox, if any */
	textbox_x: number;
	/** the y position of the textbox, if any */
	textbox_y: number;
	/** the width of the textbox, if any */
	textbox_width: number;
	/** the height of the textbox, if any */
	textbox_height: number;
	/** the font of the Text tool (important to restore a textbox-containing state, but persists without a textbox) */
	text_tool_font: TextToolFontOptions | null;
	/** whether transparent mode is on for Select/Free-Form Select/Text tools; otherwise box is opaque */
	tool_transparent_mode: boolean;
	/** selected foreground color (left click) */
	foreground_color: string | CanvasPattern;
	/** selected background color (right click) */
	background_color: string | CanvasPattern;
	/** selected ternary color (ctrl+click) */
	ternary_color: string | CanvasPattern;
	/** the name of the operation, shown in the history window, e.g. localize("Resize Canvas") */
	name: string;
	/** a visual representation of the operation type, shown in the history window, e.g. get_help_folder_icon("p_blank.png") */
	icon: HTMLImageElement | HTMLCanvasElement | null;
}

interface ActionMetadata {
	name: string;
	icon?: HTMLImageElement | HTMLCanvasElement;
	use_loose_canvas_changes?: boolean;
	soft?: boolean;
	assume_saved?: boolean;
}

interface ActionMetadataUpdate extends ActionMetadata {
	update_name?: boolean;
	match?: (current_history_node: HistoryNode) => boolean;
}

/**
 * A canvas with a 2D context that has some extra methods. Returned by `make_canvas`.
 */
interface PixelCanvas extends HTMLCanvasElement {
	ctx: PixelContext;
}
interface PixelContext extends CanvasRenderingContext2D {
	disable_image_smoothing(): void;
	enable_image_smoothing(): void;
	copy(image: HTMLImageElement | HTMLCanvasElement | ImageData): void;
	canvas: PixelCanvas;
}

type BrushShape = "circle" | "square" | "reverse_diagonal" | "diagonal";

type ColorSelectionSlot = "foreground" | "background" | "ternary";

interface ImageFileFormat {
	formatID: string;
	mimeType: string;
	name: string;
	nameWithExtensions: string;
	extensions: string[];
}

interface PaletteFileFormat {
	formatID: string;
	// mimeType: string;
	name: string;
	nameWithExtensions: string;
	extensions: string[];
}

interface MonochromeInfo {
	isMonochrome: boolean;
	presentNonTransparentRGBAs?: Uint8ClampedArray[];
	presentNonTransparentUint32s?: number[];
	monochromeWithTransparency?: boolean;
}

type FileFormat = ImageFileFormat | PaletteFileFormat;

interface ImageInfo {
	file_format: string,
	monochrome: boolean,
	palette?: string[],
	image?: HTMLImageElement, // exclusive with image_data
	image_data?: ImageData, // exclusive with image
	source_blob: Blob,
	source_file_handle?: UserFileHandle,
}

/** It's up to the user of the API to define this; could be parametrized in a better version of the JS Paint API. */
type UserFileHandle = any;

interface VoiceCommand {
	match_text: string,
	exec: () => void,
	// for sorting
	prioritize?: boolean,
	// extra info for test assertions
	type?: string,
	tool_id?: ToolID,
	sketch_subject?: string,
	vector?: { x: number, y: number },
	size?: number,
}

// Fullscreen API vendor prefixes
interface Document {
	webkitFullscreenElement?: Document["fullscreenElement"];
	mozFullScreenElement?: Document["fullscreenElement"];
	msFullscreenElement?: Document["fullscreenElement"];
	webkitExitFullscreen?: typeof Document.prototype.exitFullscreen;
	mozCancelFullScreen?: typeof Document.prototype.exitFullscreen;
	msExitFullscreen?: typeof Document.prototype.exitFullscreen;
	webkitFullscreenEnabled?: Document["fullscreenEnabled"];
	mozFullScreenEnabled?: Document["fullscreenEnabled"];
	msFullscreenEnabled?: Document["fullscreenEnabled"];
}
interface HTMLElement {
	webkitRequestFullscreen?: typeof HTMLElement.prototype.requestFullscreen;
	mozRequestFullScreen?: typeof HTMLElement.prototype.requestFullscreen;
	msRequestFullscreen?: typeof HTMLElement.prototype.requestFullscreen;
}

// Discord Embedded App SDK
// Copied from:
// https://github.com/discord/embedded-app-sdk/blob/49d23756144ebf36a5735bd7f161aae6cb359939/examples/react-colyseus/packages/client/src/types.tsx#L13C1-L31C2
interface IGuildsMembersRead {
	roles: string[];
	nick: string | null;
	avatar: string | null;
	premium_since: string | null;
	joined_at: string;
	is_pending: boolean;
	pending: boolean;
	communication_disabled_until: string | null;
	user: {
		id: string;
		username: string;
		avatar: string | null;
		discriminator: string;
		public_flags: number;
	};
	mute: boolean;
	deaf: boolean;
}
