// This file defines globals used in the app, for typescript.
// jQuery has proper types installed, so it doesn't need to be defined here,
// but some libraries don't, and the app uses a lot of custom globals.
// I'm working on transitioning to ES Modules, but having the ES Modules
// export globals until all dependent files are converted to ESM.

// IMPORTING/EXPORTING ANYTHING WILL BREAK AMBIENT DECLARATIONS
// import { PixelCanvas } from "./helpers.js";
/**
 * @typedef {HTMLCanvasElement & {ctx: PixelContext}} PixelCanvas
 * @typedef {CanvasRenderingContext2D & ExtraContextMethods} PixelContext
 * @typedef {Object} ExtraContextMethods
 * @property {() => void} disable_image_smoothing
 * @property {() => void} enable_image_smoothing
 * @property {(image: HTMLImageElement | HTMLCanvasElement | ImageData) => void} copy
 */

declare const libtess: any;
declare const firebase: any;
declare const GIF: any;
declare const saveAs: any;
declare const YT: any;
declare const FontDetective: any;
declare const AnyPalette: any;
declare const ImageTracer: any;
declare const TrackyMouse: any;
declare let Konami: any;

// Globals from scripts that are not converted to ESM yet,
// and thus can't be imported. (I've been marking scripts as @ts-check as I convert them.)
// This supports bare identifier global access (no `window.` needed).
// app-localization.js
declare function localize(text: string): string;
declare function get_direction(language?: string): "rtl" | "ltr";
declare function get_language(): string;
// tools.js
declare const TOOL_FREE_FORM_SELECT: "TOOL_FREE_FORM_SELECT";
declare const TOOL_SELECT: "TOOL_SELECT";
declare const TOOL_ERASER: "TOOL_ERASER";
declare const TOOL_FILL: "TOOL_FILL";
declare const TOOL_PICK_COLOR: "TOOL_PICK_COLOR";
declare const TOOL_MAGNIFIER: "TOOL_MAGNIFIER";
declare const TOOL_PENCIL: "TOOL_PENCIL";
declare const TOOL_BRUSH: "TOOL_BRUSH";
declare const TOOL_AIRBRUSH: "TOOL_AIRBRUSH";
declare const TOOL_TEXT: "TOOL_TEXT";
declare const TOOL_LINE: "TOOL_LINE";
declare const TOOL_CURVE: "TOOL_CURVE";
declare const TOOL_RECTANGLE: "TOOL_RECTANGLE";
declare const TOOL_POLYGON: "TOOL_POLYGON";
declare const TOOL_ELLIPSE: "TOOL_ELLIPSE";
declare const TOOL_ROUNDED_RECTANGLE: "TOOL_ROUNDED_RECTANGLE";
declare const tools: Tool[];
// app.js
declare let brush_shape = default_brush_shape;
declare let brush_size = default_brush_size
declare let eraser_size = default_eraser_size;
declare let airbrush_size = default_airbrush_size;
declare let pencil_size = default_pencil_size;
declare let stroke_size = default_stroke_size; // applies to lines, curves, shape outlines

declare let tool_transparent_mode: boolean;
declare let stroke_color: string | CanvasPattern;
declare let fill_color: string | CanvasPattern;
declare let stroke_color_k: "foreground" | "background" | "ternary";
declare let fill_color_k: "foreground" | "background" | "ternary";

declare let selected_tool: Tool;
declare let selected_tools: Tool[];
declare let return_to_tools: Tool[];
declare let selected_colors: {
	foreground: string,
	background: string,
	ternary: string,
};

declare let selection: OnCanvasSelection;
declare let textbox: OnCanvasTextBox;
declare let helper_layer: OnCanvasHelperLayer;
declare let $thumbnail_window: $Window;
declare let thumbnail_canvas: HTMLCanvasElement;
declare let show_grid: boolean;
declare let show_thumbnail: boolean;
declare let text_tool_font: {
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
declare let root_history_node: HistoryNode;
declare let current_history_node: HistoryNode;
declare let history_node_to_cancel_to: HistoryNode | null;
declare let undos: HistoryNode[];
declare let redos: HistoryNode[];
declare let file_name: string;
declare let system_file_handle: any;
declare let saved: boolean;
declare let pointer: { x: number, y: number } | undefined;
declare let pointer_start: { x: number, y: number } | undefined;
declare let pointer_previous: { x: number, y: number } | undefined;
declare let pointer_active: boolean;
declare let pointer_type: string;
declare let pointer_buttons: number;
declare let reverse: boolean;
declare let ctrl: boolean;
declare let shift: boolean;
declare let button: number;
declare let pointer_over_canvas: boolean;
declare let update_helper_layer_on_pointermove_active: boolean;
declare let pointers: { x: number, y: number, pointerId: number, pointerType: string, isPrimary: boolean }[];

// $FontBox.js
// declare class $FontBox extends $Window { }
// declare function $FontBox(): $FontBox;
declare function $FontBox(): $Window;
// $ToolBox.js
declare function $ToolBox(tools: Tool[], is_extras?: boolean): JQuery<HTMLDivElement> & $ComponentMethods & $ToolBoxMethods;
declare interface $ToolBoxMethods {
	update_selected_tool(): void;
}
// $ColorBox.js
declare interface $ColorBoxMethods {
	rebuild_palette(): void;
}

// $ToolWindow.js
declare function $ToolWindow($component?: JQuery<HTMLElement>): $Window;
declare function $DialogWindow(title?: string): $Window;
declare function make_window_supporting_scale(options: $WindowOptions): $Window;
// $Component.js
declare function $Component(title: string, className: string, orientation: "tall" | "wide", $el: JQuery<HTMLElement>): JQuery<HTMLDivElement> & $ComponentMethods;
interface $ComponentMethods {
	hide(): this;
	show(): this;
	toggle(): this;
	dock($dock_to: JQuery<HTMLElement>): void;
	undock_to(x: number, y: number): void;
	destroy(): void;
}
// helpers.js
declare function make_css_cursor(name: string, coords: [number, number], fallback: string): string;
// edit-colors.js
declare function show_edit_colors_window(
	$swatch_to_edit?: JQuery<HTMLDivElement>,
	color_selection_slot_to_edit?: "foreground" | "background" | "ternary",
): void;
// color-data.js
// declare const default_palette: (string | CanvasPattern)[];
// declare const monochrome_palette_as_colors: (string | CanvasPattern)[];
// declare const basic_colors: (string | CanvasPattern)[];
// declare const custom_colors: (string | CanvasPattern)[];
// declare const get_winter_palette: () => (string | CanvasPattern)[];
// imgur.js
declare function show_imgur_uploader(blob: Blob): void;

// The JS Paint API... ironically, untyped.
// Hey, I'm just working on internals right now!
declare const systemHooks: any;

// Globals temporarily exported from ES Modules,
// as well as globals from scripts that are not converted to ESM yet.
// This supports `window.*` property access.
interface Window {
	// helpers.js
	E: (tagName: string) => HTMLElement;
	$G: JQuery<Window>;
	TAU: number;
	is_pride_month: boolean;
	debounce: (func: Function, wait_ms: number, immediate?: boolean) => Function;
	memoize_synchronous_function: (func: Function, max_entries?: number) => Function;
	rgb_to_hsl: (r: number, g: number, b: number) => [number, number, number];
	get_rgba_from_color: (color: string) => [number, number, number, number];
	make_css_cursor: (name: string, coords: [number, number], fallback: string) => string;
	make_canvas: {
		(width: number, height: number): HTMLCanvasElement,
		(source: HTMLCanvasElement): HTMLCanvasElement,
		(): HTMLCanvasElement,
	};
	image_data_match: (a: ImageData, b: ImageData, threshold: number) => boolean;
	load_image_simple: (src: string) => Promise<HTMLImageElement>;
	get_help_folder_icon: (file_name: string) => Image;
	get_icon_for_tool: (tool: Tool) => Image;
	get_icon_for_tools: (tools: Tool[]) => Image;
	// tools.js
	TOOL_FREE_FORM_SELECT: "TOOL_FREE_FORM_SELECT";
	TOOL_SELECT: "TOOL_SELECT";
	TOOL_ERASER: "TOOL_ERASER";
	TOOL_FILL: "TOOL_FILL";
	TOOL_PICK_COLOR: "TOOL_PICK_COLOR";
	TOOL_MAGNIFIER: "TOOL_MAGNIFIER";
	TOOL_PENCIL: "TOOL_PENCIL";
	TOOL_BRUSH: "TOOL_BRUSH";
	TOOL_AIRBRUSH: "TOOL_AIRBRUSH";
	TOOL_TEXT: "TOOL_TEXT";
	TOOL_LINE: "TOOL_LINE";
	TOOL_CURVE: "TOOL_CURVE";
	TOOL_RECTANGLE: "TOOL_RECTANGLE";
	TOOL_POLYGON: "TOOL_POLYGON";
	TOOL_ELLIPSE: "TOOL_ELLIPSE";
	TOOL_ROUNDED_RECTANGLE: "TOOL_ROUNDED_RECTANGLE";
	tools: Tool[];
	// OnCanvasObject.js
	OnCanvasObject: typeof OnCanvasObject;
	// OnCanvasHelperLayer.js
	OnCanvasHelperLayer: typeof OnCanvasHelperLayer;
	// OnCanvasSelection.js
	OnCanvasSelection: typeof OnCanvasSelection;
	// OnCanvasTextBox.js
	OnCanvasTextBox: typeof OnCanvasTextBox;
	// Handles.js
	Handles: typeof Handles;
	// $FontBox.js
	$FontBox: typeof $FontBox;
	// $ToolBox.js
	$ToolBox: typeof $ToolBox;
	// $ColorBox.js
	$ColorBox: (vertical: boolean) => JQuery<HTMLDivElement> & $ComponentMethods & $ColorBoxMethods;
	$Swatch: (color: string | CanvasPattern | undefined) => JQuery<HTMLDivElement>;
	update_$swatch: ($swatch: JQuery<HTMLDivElement>, color: string | CanvasPattern | undefined) => void;
	// tool-options.js
	$ChooseShapeStyle: () => JQuery<HTMLElement> & { fill: boolean, stroke: boolean };
	$choose_brush: JQuery<HTMLElement>;
	$choose_eraser_size: JQuery<HTMLElement>;
	$choose_stroke_size: JQuery<HTMLElement>;
	$choose_magnification: JQuery<HTMLElement>;
	$choose_airbrush_size: JQuery<HTMLElement>;
	$choose_transparent_mode: JQuery<HTMLElement>;
	// app.js
	selected_tool: Tool;
	selected_tools: Tool[];
	return_to_tools: Tool[];
	selected_colors: {
		foreground: string,
		background: string,
		ternary: string,
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
	// The JS Paint API... ironically, untyped.
	// Hey, I'm just working on internals right now!
	systemHooks: any;
	// electron-injected.js
	is_electron_app?: boolean;
	electron_is_dev?: boolean;
	// Local Font Access API
	queryLocalFonts?: () => Promise<FontData[]>;
	// Chrome browser
	chrome?: { loadTimes: unknown, csi: unknown };
}

class FontData {
	family: string;
	fullName: string;
	postscriptName: string;
	style: string;
}

class OnCanvasObject {
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
class OnCanvasHelperLayer extends OnCanvasObject {
	constructor(x: any, y: any, width: any, height: any, hideMainCanvasHandles: any, pixelRatio?: number);
}
class OnCanvasSelection extends OnCanvasObject {
	constructor(x: number, y: number, width: number, height: number, img_or_canvas?: HTMLImageElement | HTMLCanvasElement);
	instantiate(img_or_canvas: HTMLImageElement | HTMLCanvasElement): void;
	cut_out_background(): void;
	update_tool_transparent_mode(): void;
	replace_source_canvas(new_source_canvas: PixelCanvas): void;
	resize(): void;
	scale(factor: number): void;
	draw(): void;
}
class OnCanvasTextBox extends OnCanvasObject {
	constructor(x: number, y: number, width: number, height: number, starting_text?: string);
	position(): void;
	static $fontbox: $Window | null;
}
class Handles {
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
	 * @param {() => { x: number, y: number, width: number, height: number }} options.get_rect
	 * @param {(rect: { x: number, y: number, width: number, height: number }) => void} options.set_rect
	 * @param {(rect: { x: number, y: number, width: number, height: number }, x_axis: -1 | 0 | 1, y_axis: -1 | 0 | 1) => { x: number, y: number, width: number, height: number }} [options.constrain_rect]
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
	handles: any[];
	hide: () => void;
	show: () => void;
}

// OS-GUI's $Window.js
interface $WindowOptions {
	title?: string;
	innerWidth?: number;
	innerHeight?: number;
	outerWidth?: number;
	outerHeight?: number;
	toolWindow?: boolean;
	minimizeButton?: boolean;
	maximizeButton?: boolean;
	closeButton?: boolean;
	resizable?: boolean;
	parentWindow?: $Window;
	$component?: any; // Replace with actual component type
	icons?: { [size: string]: string | HTMLImageElement };
	constrainRect?: (rect: { x: number; y: number; width: number; height: number; }, xAxis: number, yAxis: number) => { x: number; y: number; width: number; height: number; };
	minOuterWidth?: number;
	minOuterHeight?: number;
	minInnerWidth?: number;
	minInnerHeight?: number;
	iframes?: { ignoreCrossOrigin?: boolean };
}

declare function $Window(options?: $WindowOptions): $Window;
declare class $Window extends JQuery<HTMLDivElement> {
	static Z_INDEX: number;
	static DEBUG_FOCUS: boolean;
	static OVERRIDE_TRANSITION_DURATION: number | null;

	constructor(options?: $WindowOptions);

	element: HTMLDivElement;
	$titlebar: JQuery<HTMLDivElement>;
	$title_area: JQuery<HTMLDivElement>;
	$title: JQuery<HTMLSpanElement>;
	$minimize?: JQuery<HTMLButtonElement>;
	$maximize?: JQuery<HTMLButtonElement>;
	$x?: JQuery<HTMLButtonElement>;
	$content: JQuery<HTMLDivElement>;
	$icon: JQuery<HTMLElement>;

	icons: { [size: string]: string | HTMLElement };

	setDimensions(dimensions: { innerWidth?: number; innerHeight?: number; outerWidth?: number; outerHeight?: number; }): void;
	focus(): void;
	blur(): void;
	minimize(): void;
	unminimize(): void;
	maximize(): void;
	restore(): void;
	close(force?: boolean): void;
	closed: boolean;
	title(title: string): this;
	title(): string;
	getTitle(): string;
	setMenuBar(menuBar: MenuBar): void; // Replace with actual menu bar type
	bringToFront(): void;
	addChildWindow($childWindow: $Window): void;
	setMinimizeTarget(taskbarButtonEl: HTMLElement): void;
	setDimensions(dimensions: { innerWidth?: number; innerHeight?: number; outerWidth?: number; outerHeight?: number; }): void;
	applyBounds(): void;
	bringTitleBarInBounds(): void;
	center(): void;
	setTitlebarIconSize(size: number): this;
	getTitlebarIconSize(): number;
	getIconAtSize(size: number): HTMLElement | null;
	$Button(label: string, action: () => void): JQuery<HTMLButtonElement>;
	animateTitlebar(before_rect: { x: number, y: number, width: number, height: number }, after_rect: { x: number, y: number, width: number, height: number }, callback?: () => void): void;

	// Events
	// These functions return a function that removes the event listener.
	onFocus(callback: () => void): () => void;
	onBlur(callback: () => void): () => void;
	onClosed(callback: () => void): () => void;

	// Deprecated properties and methods
	// icon_name: string;
	// task: { $task: JQuery<HTMLDivElement>, updateTitle: () => void; };
	// setIconByID(iconName: string): this;
	// setIcons(icons: { [size: string]: string | HTMLImageElement; }): void;
	// getIconName(): string;

	// Extending JQuery didn't seem to work, so I'm adding these here.
	css(name: string): number;
	css(name: string, value: number | string): this;
	css(props: { [name: string]: string | number; }): this;
	height(): number;
	height(value: number): this;
}

declare class $FormWindow extends $Window {
	constructor(title: string);

	$form: JQuery<HTMLFormElement>;
	$main: JQuery<HTMLDivElement>;
	$buttons: JQuery<HTMLDivElement>;

	$Button(label: string, action: () => void): JQuery<HTMLButtonElement>;
}

// OS-GUI's MenuBar.js
declare class MenuBar {
	element: HTMLDivElement;
	closeMenus: () => void;
	setKeyboardScope: (...elements: HTMLElement[]) => void;
}
declare const MENU_DIVIDER: "MENU_DIVIDER";

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
// just look at paint_iteration for example. There are two overloads,
// simply because it's defined separately for two different tools.
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
	paint_iteration?(x: number, y: number): void,
	/** Used by Eraser tool */
	paint_iteration?(ctx: CanvasRenderingContext2D, x: number, y: number): void,
	/** Called when... */
	pointerup?(): void,
	/** Called when... */
	cancel?(): void,
	/** Called when... */
	end?(): void,
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
	get_brush?(): { size: number, shape: "circle" | "square" | "reverse_diagonal" | "diagonal" },
	/** Used by Polygon tool */
	reset?(): void,
	/** Used by Polygon tool */
	complete?(ctx: CanvasRenderingContext2D): void,
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
	text_tool_font: string | null;
	/** whether transparent mode is on for Select/Free-Form Select/Text tools; otherwise box is opaque */
	tool_transparent_mode: boolean;
	/** selected foreground color (left click) */
	foreground_color: string;
	/** selected background color (right click) */
	background_color: string;
	/** selected ternary color (ctrl+click) */
	ternary_color: string;
	/** the name of the operation, shown in the history window, e.g. localize("Resize Canvas") */
	name: string;
	/** a visual representation of the operation type, shown in the history window, e.g. get_help_folder_icon("p_blank.png") */
	icon: Image | HTMLCanvasElement | null;
}
