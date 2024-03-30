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
declare let Konami: any;

// This clearly is not sustainable.
// I have to define things here outside the interface so that accessing them with `E` etc. works.
declare let E: (tagName: string) => HTMLElement;
declare let $G: JQuery<Window>;
// I have to define them inside the interface so that `window.E = ...` works.
// And I can't define the types nearby the implementations with this strategy.
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
	constructor(x: number, y: number, width: number, height: number, img_or_canvas: HTMLImageElement | HTMLCanvasElement);
	instantiate(img_or_canvas: HTMLImageElement | HTMLCanvasElement): void;
	cut_out_background(): void;
	update_tool_transparent_mode(): void;
	replace_source_canvas(new_source_canvas: PixelCanvas): void;
	resize(): void;
	scale(factor: number): void;
	draw(): void;
}
class OnCanvasTextBox extends OnCanvasObject {
	constructor(x: number, y: number, width: number, height: number, starting_text: string);
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

interface WindowOptions {
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

class $Window extends JQuery<HTMLDivElement> {
	static Z_INDEX: number;
	static DEBUG_FOCUS: boolean;
	static OVERRIDE_TRANSITION_DURATION: number | null;

	constructor(options?: WindowOptions);

	element: HTMLDivElement;
	$titlebar: JQuery<HTMLDivElement>;
	$title_area: JQuery<HTMLDivElement>;
	$title: JQuery<HTMLSpanElement>;
	$minimize?: JQuery<HTMLButtonElement>;
	$maximize?: JQuery<HTMLButtonElement>;
	$x?: JQuery<HTMLButtonElement>;
	$content: JQuery<HTMLDivElement>;
	icons: { [size: string]: string | HTMLImageElement };

	setDimensions(dimensions: { innerWidth?: number; innerHeight?: number; outerWidth?: number; outerHeight?: number; }): void;
	focus(): void;
	blur(): void;
	minimize(): void;
	unminimize(): void;
	maximize(): void;
	restore(): void;
	close(force?: boolean): void;
	closed: boolean;
	title(title?: string): this | string;
	getTitle(): string;
	setMenuBar(menuBar: any): void; // Replace with actual menu bar type
	bringToFront(): void;
	addChildWindow($childWindow: $Window): void;
	setMinimizeTarget(taskbarButtonEl: HTMLElement): void;

	// Deprecated properties and methods
	icon_name: string;
	task: any; // Replace with actual task type
	setIconByID(iconName: string): this;
	setIcons(icons: { [size: string]: string | HTMLImageElement; }): void;
	getIconName(): string;
}

class $FormWindow extends $Window {
	constructor(title: string);

	$form: JQuery<HTMLFormElement>;
	$main: JQuery<HTMLDivElement>;
	$buttons: JQuery<HTMLDivElement>;

	$Button(label: string, action: () => void): JQuery<HTMLButtonElement>;
}


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

interface Tool {
	id: ToolID,
	name: string,
	speech_recognition: string[],
	help_icon: string,
	description: string,
	cursor: [string, [number, number], string],

	/** Called when... */
	pointerdown?(ctx: CanvasRenderingContext2D, x: number, y: number): void,
	/** Called when... */
	paint?(ctx: CanvasRenderingContext2D, x: number, y: number): void,
	/** Called when... */
	paint_iteration(x: number, y: number): void,
	/** Called when... */
	pointerup?(): void,
	/** Called when... */
	cancel?(): void,
	/** Called when rendering... */
	drawPreviewUnderGrid?(ctx: CanvasRenderingContext2D, x: number, y: number, grid_visible: boolean, scale: number, translate_x: number, translate_y: number);
	$options?: JQuery<HTMLElement>,
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
