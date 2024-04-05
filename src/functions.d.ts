export type PaletteErrorGroup = {
    message: string;
    errors: PaletteErrorObject[];
};
export type PaletteErrorObject = {
    error: Error;
    __PATCHED_LIB_TO_ADD_THIS__format: {
        name: string;
    };
};
export const $this_version_news: JQuery<HTMLElement>;
export function apply_file_format_and_palette_info(info: any): void;
/**
 * Prompts the user to save changes to the document.
 * @param {(info?: { canvas_modified_while_loading?: boolean }) => void} action
 * @param {() => void} [canceled]
 * @param {boolean} [from_session_load]
 */
export function are_you_sure(action: (info?: {
    canvas_modified_while_loading?: boolean;
}) => void, canceled?: () => void, from_session_load?: boolean): void;
export function cancel(going_to_history_node: any, discard_document_state: any): void;
export function change_some_url_params(updates: any, { replace_history_state }?: {
    replace_history_state?: boolean;
}): void;
export function change_url_param(param_name: any, value: any, { replace_history_state }?: {
    replace_history_state?: boolean;
}): void;
export function choose_file_to_paste(): Promise<void>;
export function cleanup_bitmap_view(): void;
export function clear(): void;
export function confirm_overwrite_capability(): Promise<boolean>;
export function delete_selection(meta?: {}): void;
export function deselect(going_to_history_node: any): void;
export function detect_monochrome(ctx: any): {
    isMonochrome: boolean;
    presentNonTransparentRGBAs?: undefined;
    presentNonTransparentUint32s?: undefined;
    monochromeWithTransparency?: undefined;
} | {
    isMonochrome: boolean;
    presentNonTransparentRGBAs: any[];
    presentNonTransparentUint32s: number[];
    monochromeWithTransparency: boolean;
};
export function edit_copy(execCommandFallback: any): void;
export function edit_cut(execCommandFallback: any): void;
export function edit_paste(execCommandFallback: any): Promise<void>;
export function exit_fullscreen_if_ios(): void;
export function file_load_from_url(): void;
export function file_new(): void;
export function file_open(): Promise<void>;
export function file_save(maybe_saved_callback?: () => void, update_from_saved?: boolean): void;
export function file_save_as(maybe_saved_callback?: () => void, update_from_saved?: boolean): void;
export function getSelectionText(): string;
export function get_all_url_params(): {};
export function get_history_ancestors(node: any): any[];
export function get_tool_by_id(id: any): Tool;
/**
 * Parse text/uri-list format
 * @param {string} text
 * @returns {string[]} URLs
 */
export function get_uris(text: string): string[];
export function get_url_param(param_name: any): any;
/**
 * @param {HistoryNode} target_history_node
 * @param {boolean=} canceling
 * @param {boolean=} discard_document_state
 */
export function go_to_history_node(target_history_node: HistoryNode, canceling?: boolean | undefined, discard_document_state?: boolean | undefined): void;
export function handle_keyshortcuts($container: any): void;
export function has_any_transparency(ctx: any): boolean;
export function image_attributes(): void;
export namespace image_attributes {
    let $window: $Window;
    let unit: string;
}
export function image_flip_and_rotate(): void;
export function image_invert_colors(): void;
export function image_stretch_and_skew(): void;
/**
 * Load an image file from a URL by any means necessary.
 * For basic image loading, see `load_image_simple` instead.
 * @param {string} uri
 * @returns {Promise<ImageInfo>}
 * @throws {Error & { code?: string }}
 */
export function load_image_from_uri(uri: string): Promise<ImageInfo>;
export function load_theme_from_text(fileText: any): void;
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
export function make_history_node({ parent, futures, timestamp, soft, image_data, selection_image_data, selection_x, selection_y, textbox_text, textbox_x, textbox_y, textbox_width, textbox_height, text_tool_font, tool_transparent_mode, foreground_color, background_color, ternary_color, name, icon, }: {
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
export function make_monochrome_palette(rgba1?: number[], rgba2?: number[]): any[];
export function make_monochrome_pattern(lightness: any, rgba1?: number[], rgba2?: number[]): any;
export function make_opaque(): void;
export function make_or_update_undoable(undoable_meta: any, undoable_action: any): void;
/**
 * @param {boolean} reverse
 * @param {string[]} colors
 * @param {number=} stripe_size
 * @returns {CanvasPattern}
 */
export function make_stripe_pattern(reverse: boolean, colors: string[], stripe_size?: number | undefined): CanvasPattern;
export function meld_selection_into_canvas(going_to_history_node: any): void;
export function meld_textbox_into_canvas(going_to_history_node: any): void;
export function open_from_file(file: any, source_file_handle: any): void;
/**
 * @param {ImageInfo} info
 * @param {() => void} [callback]
 * @param {() => void} [canceled]
 * @param {boolean} [into_existing_session]
 * @param {boolean} [from_session_load]
 */
export function open_from_image_info(info: ImageInfo, callback?: () => void, canceled?: () => void, into_existing_session?: boolean, from_session_load?: boolean): void;
export function paste(img_or_canvas: any): void;
export function paste_image_from_file(blob: any): void;
export function please_enter_a_number(): void;
/**
 * @param {Blob} blob
 * @param {(error: Error|null, result?: ImageInfo) => void} callback
 */
export function read_image_file(blob: Blob, callback: (error: Error | null, result?: ImageInfo) => void): void;
export function redo(): boolean;
export function render_canvas_view(hcanvas: any, scale: any, viewport_x: any, viewport_y: any, is_helper_layer: any): void;
export function render_history_as_gif(): void;
export function reset_canvas_and_history(): void;
export function reset_file(): void;
export function reset_selected_colors(): void;
export function resize_canvas_and_save_dimensions(unclamped_width: any, unclamped_height: any, undoable_meta?: {}): void;
export function resize_canvas_without_saving_dimensions(unclamped_width: any, unclamped_height: any, undoable_meta?: {}): void;
export function sanity_check_blob(blob: any, okay_callback: any, magic_number_bytes: any, magic_wanted?: boolean): void;
export function save_as_prompt({ dialogTitle, defaultFileName, defaultFileFormatID, formats, promptForName, }: {
    dialogTitle?: any;
    defaultFileName?: string;
    defaultFileFormatID: any;
    formats: any;
    promptForName?: boolean;
}): Promise<any>;
export function save_selection_to_file(): void;
export function select_all(): void;
export function select_tool(tool: any, toggle: any): void;
export function select_tools(tools: any): void;
export function set_all_url_params(params: any, { replace_history_state }?: {
    replace_history_state?: boolean;
}): void;
export function set_magnification(new_scale: any, anchor_point: any): void;
export function show_about_paint(): void;
export function show_convert_to_black_and_white(): void;
export function show_custom_zoom_window(): void;
export function show_document_history(): void;
export function show_error_message(message: any, error: any): void;
/**
 * @typedef {object} PaletteErrorGroup
 * @property {string} message
 * @property {PaletteErrorObject[]} errors
 *
 * @typedef {object} PaletteErrorObject
 * @property {Error} error
 * @property {{name: string}} __PATCHED_LIB_TO_ADD_THIS__format
 *
 * @param {object} options
 * @param {Error=} options.as_image_error
 * @param {Error|PaletteErrorGroup=} options.as_palette_error
 */
export function show_file_format_errors({ as_image_error, as_palette_error }: {
    as_image_error?: Error | undefined;
    as_palette_error?: (Error | PaletteErrorGroup) | undefined;
}): void;
export function show_multi_user_setup_dialog(from_current_document: any): void;
export function show_news(): void;
export function show_resource_load_error_message(error: any): void;
export function switch_to_polychrome_palette(): void;
export function toggle_grid(): void;
export function toggle_thumbnail(): void;
export function try_exec_command(commandId: any): void;
export function undo(): boolean;
/**
 * Creates an undo point.
 * @param {object} options
 * @param {string} options.name
 * @param {HTMLImageElement | HTMLCanvasElement=} options.icon
 * @param {boolean=} options.use_loose_canvas_changes
 * @param {boolean=} options.soft
 * @param {boolean=} options.assume_saved
 * @param {function=} callback
 */
export function undoable({ name, icon, use_loose_canvas_changes, soft, assume_saved }: {
    name: string;
    icon?: (HTMLImageElement | HTMLCanvasElement) | undefined;
    use_loose_canvas_changes?: boolean | undefined;
    soft?: boolean | undefined;
    assume_saved?: boolean | undefined;
}, callback?: Function | undefined): void;
export function update_canvas_rect(): void;
export function update_css_classes_for_conditional_messages(): void;
export function update_disable_aa(): void;
export function update_from_saved_file(blob: any): void;
export function update_helper_layer(e: any): void;
export function update_helper_layer_immediately(): void;
export function update_magnified_canvas_size(): void;
export function update_title(): void;
export function view_bitmap(): void;
export function write_image_file(canvas: any, mime_type: any, blob_callback: any): void;
