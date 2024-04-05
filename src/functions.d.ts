declare function get_all_url_params(): {};
declare function get_url_param(param_name: any): any;
declare function change_url_param(param_name: any, value: any, { replace_history_state }?: {
    replace_history_state?: boolean;
}): void;
declare function change_some_url_params(updates: any, { replace_history_state }?: {
    replace_history_state?: boolean;
}): void;
declare function set_all_url_params(params: any, { replace_history_state }?: {
    replace_history_state?: boolean;
}): void;
declare function update_magnified_canvas_size(): void;
declare function update_canvas_rect(): void;
declare function update_helper_layer(e: any): void;
declare function update_helper_layer_immediately(): void;
declare function render_canvas_view(hcanvas: any, scale: any, viewport_x: any, viewport_y: any, is_helper_layer: any): void;
declare function update_disable_aa(): void;
declare function set_magnification(new_scale: any, anchor_point: any): void;
declare function show_custom_zoom_window(): void;
declare function toggle_grid(): void;
declare function toggle_thumbnail(): void;
declare function reset_selected_colors(): void;
declare function reset_file(): void;
declare function reset_canvas_and_history(): void;
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
 * @param {string=} options.foreground_color - selected foreground color (left click)
 * @param {string=} options.background_color - selected background color (right click)
 * @param {string=} options.ternary_color - selected ternary color (ctrl+click)
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
    foreground_color?: string | undefined;
    background_color?: string | undefined;
    ternary_color?: string | undefined;
    name?: string | undefined;
    icon?: (HTMLImageElement | HTMLCanvasElement | null) | undefined;
}): HistoryNode;
declare function update_title(): void;
declare function get_uris(text: any): string[];
declare function load_image_from_uri(uri: any): Promise<any>;
declare function open_from_image_info(info: any, callback: any, canceled: any, into_existing_session: any, from_session_load: any): void;
declare function open_from_file(file: any, source_file_handle: any): void;
declare function apply_file_format_and_palette_info(info: any): void;
declare function load_theme_from_text(fileText: any): void;
declare function file_new(): void;
declare function file_open(): Promise<void>;
declare function file_load_from_url(): void;
declare function confirm_overwrite_capability(): Promise<boolean>;
declare function file_save(maybe_saved_callback?: () => void, update_from_saved?: boolean): void;
declare function file_save_as(maybe_saved_callback?: () => void, update_from_saved?: boolean): void;
/**
 * Prompts the user to save changes to the document.
 * @param {(info?: { canvas_modified_while_loading?: boolean }) => void} action
 * @param {() => void} [canceled]
 * @param {boolean} [from_session_load]
 */
declare function are_you_sure(action: (info?: {
    canvas_modified_while_loading?: boolean;
}) => void, canceled?: () => void, from_session_load?: boolean): void;
declare function please_enter_a_number(): void;
declare function show_error_message(message: any, error: any): void;
declare function show_resource_load_error_message(error: any): void;
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
declare function show_file_format_errors({ as_image_error, as_palette_error }: {
    as_image_error?: Error | undefined;
    as_palette_error?: (Error | PaletteErrorGroup) | undefined;
}): void;
declare function show_about_paint(): void;
declare function exit_fullscreen_if_ios(): void;
declare function update_css_classes_for_conditional_messages(): void;
declare function show_news(): void;
declare function paste_image_from_file(blob: any): void;
declare function choose_file_to_paste(): Promise<void>;
declare function paste(img_or_canvas: any): void;
declare function render_history_as_gif(): void;
declare function go_to_history_node(target_history_node: any, canceling: any, discard_document_state: any): void;
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
declare function undoable({ name, icon, use_loose_canvas_changes, soft, assume_saved }: {
    name: string;
    icon?: (HTMLImageElement | HTMLCanvasElement) | undefined;
    use_loose_canvas_changes?: boolean | undefined;
    soft?: boolean | undefined;
    assume_saved?: boolean | undefined;
}, callback?: Function | undefined): void;
declare function make_or_update_undoable(undoable_meta: any, undoable_action: any): void;
declare function undo(): boolean;
declare function redo(): boolean;
declare function get_history_ancestors(node: any): any[];
declare function show_document_history(): void;
declare function cancel(going_to_history_node: any, discard_document_state: any): void;
declare function meld_selection_into_canvas(going_to_history_node: any): void;
declare function meld_textbox_into_canvas(going_to_history_node: any): void;
declare function deselect(going_to_history_node: any): void;
declare function delete_selection(meta?: {}): void;
declare function select_all(): void;
declare function try_exec_command(commandId: any): void;
declare function getSelectionText(): string;
declare function edit_copy(execCommandFallback: any): void;
declare function edit_cut(execCommandFallback: any): void;
declare function edit_paste(execCommandFallback: any): Promise<void>;
declare function image_invert_colors(): void;
declare function clear(): void;
declare function view_bitmap(): void;
declare function get_tool_by_id(id: any): any;
declare function select_tools(tools: any): void;
declare function select_tool(tool: any, toggle: any): void;
declare function has_any_transparency(ctx: any): boolean;
declare function detect_monochrome(ctx: any): {
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
declare function make_monochrome_pattern(lightness: any, rgba1?: number[], rgba2?: number[]): any;
declare function make_monochrome_palette(rgba1?: number[], rgba2?: number[]): any[];
/**
 * @param {boolean} reverse
 * @param {string[]} colors
 * @param {number=} stripe_size
 * @returns {CanvasPattern}
 */
declare function make_stripe_pattern(reverse: boolean, colors: string[], stripe_size?: number | undefined): CanvasPattern;
declare function switch_to_polychrome_palette(): void;
declare function make_opaque(): void;
declare function resize_canvas_without_saving_dimensions(unclamped_width: any, unclamped_height: any, undoable_meta?: {}): void;
declare function resize_canvas_and_save_dimensions(unclamped_width: any, unclamped_height: any, undoable_meta?: {}): void;
declare function image_attributes(): void;
declare namespace image_attributes {
    let $window: $Window;
    let unit: string;
}
declare function show_convert_to_black_and_white(): void;
declare function image_flip_and_rotate(): void;
declare function image_stretch_and_skew(): void;
declare function handle_keyshortcuts($container: any): void;
declare function save_as_prompt({ dialogTitle, defaultFileName, defaultFileFormatID, formats, promptForName, }: {
    dialogTitle?: any;
    defaultFileName?: string;
    defaultFileFormatID: any;
    formats: any;
    promptForName?: boolean;
}): Promise<any>;
declare function write_image_file(canvas: any, mime_type: any, blob_callback: any): void;
declare function read_image_file(blob: any, callback: any): void;
declare function update_from_saved_file(blob: any): void;
declare function save_selection_to_file(): void;
declare function sanity_check_blob(blob: any, okay_callback: any, magic_number_bytes: any, magic_wanted?: boolean): void;
declare function show_multi_user_setup_dialog(from_current_document: any): void;
declare const param_types: {
    "eye-gaze-mode": string;
    "vertical-color-box-mode": string;
    "speech-recognition-mode": string;
    local: string;
    session: string;
    load: string;
};
declare const exclusive_params: string[];
declare let helper_layer_update_queued: any;
declare let info_for_updating_pointer: any;
declare let $custom_zoom_window: any;
declare let dev_custom_zoom: boolean;
declare let $file_load_from_url_window: any;
declare let acknowledged_overwrite_capability: boolean;
declare const confirmed_overwrite_key: "jspaint confirmed overwrite capable";
declare let $about_paint_window: any;
declare const $about_paint_content: JQuery<HTMLElement>;
declare let $news_window: any;
declare const $this_version_news: JQuery<HTMLElement>;
declare let $latest_news: JQuery<HTMLElement>;
declare let $document_history_prompt_window: any;
declare let $document_history_window: any;
declare const ctrlOrCmd: "⌘" | "Ctrl";
declare const recommendationForClipboardAccess: string;
declare function cleanup_bitmap_view(): void;
type PaletteErrorGroup = {
    message: string;
    errors: PaletteErrorObject[];
};
type PaletteErrorObject = {
    error: Error;
    __PATCHED_LIB_TO_ADD_THIS__format: {
        name: string;
    };
};
