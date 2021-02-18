module.exports = {
	"env": {
		"browser": true,
		"es6": true
	},
	"extends": "eslint:recommended",
	"globals": {
		"Atomics": "readonly",
		"SharedArrayBuffer": "readonly",
		"ClipboardItem": "readonly",

		// libraries
		"$": "readonly",
		"jQuery": "readonly",
		"libtess": "readonly",
		"firebase": "readonly",
		"GIF": "readonly",
		"saveAs": "readonly",
		"Konami": "readonly",
		"YT": "readonly",
		"FontDetective": "readonly",
		"Palette": "readonly",

		/*
		// const
		"TAU": "writable",
		"is_pride_month": "writable",
		"default_tool": "writable",
		"default_canvas_width": "writable",
		"default_canvas_height": "writable",

		// global state: options
		"brush_shape": "writable",
		"brush_size": "writable",
		"pencil_size": "writable",
		"eraser_size": "writable",
		"airbrush_size": "writable",
		"stroke_size": "writable",
		"tool_transparent_mode": "writable",
		"magnification": "writable",
		"transparency": "writable",
		"aliasing": "writable",
		"monochrome": "writable",
		"colors": "writable",
		"palette": "writable",
		"polychrome_palette": "writable",
		"monochrome_palette": "writable",
		// global state: history
		"undos": "writable",
		"redos": "writable",
		"current_history_node": "writable",
		"root_history_node": "writable",
		"history_node_to_cancel_to": "writable",
		// global state
		"selection": "writable",
		"textbox": "writable",
		"pointer": "writable", // bad
		"pointer_start": "writable",
		"pointer_previous": "writable",
		"pointers": "writable",
		"saved": "writable",
		"file_name": "writable",
		"document_file_path": "writable",
		"selected_tool": "writable",
		"selected_tools": "writable",
		"default_tool": "writable",
		"shift": "writable",
		"ctrl": "writable",
		"my_canvas_width": "writable",
		"my_canvas_height": "writable",
		"pointer": "writable",
		// references that may contain state in some ways
		"canvas": "writable", // really bad
		"ctx": "writable", // really bad
		"helper_layer": "writable",
		"menus": "writable",
		"tools": "writable",
		"extra_tools": "writable",
		"$G": "writable",
		"$canvas": "writable",
		"$canvas_area": "writable",
		"$top": "writable",
		"$bottom": "writable",
		"$left": "writable",
		"$right": "writable",
		"$toolbox": "writable",
		"$colorbox": "writable",
		"$MenuBar": "writable",
		"$ToolBox": "writable",
		"$ColorBox": "writable",
		"$Window": "writable",
		"$ToolWindow": "writable",
		"$FormToolWindow": "writable",
		"$Handles": "writable",
		"OnCanvasSelection": "writable",
		"OnCanvasTextBox": "writable",
		
		// functions
		"E": "writable",
		"make_canvas": "writable",
		"debounce": "writable",
		"memoize_synchronous_function": "writable",
		"invert_rgb": "off",
		"get_theme": "writable",
		"get_tool_by_id": "writable",
		"redo": "writable",
		"undo": "writable",
		"undoable": "writable",
		"cancel": "writable",
		"deselect": "writable",
		"update_helper_layer": "writable",
		"show_error_message": "writable",
		"to_canvas_coords": "writable",
		"update_title": "writable",
		"get_help_folder_icon": "writable",
		"get_icon_for_tool": "writable",
		"draw_polygon": "writable",
		*/
	},
	"parserOptions": {
		"ecmaVersion": 2018
	},
	"rules": {
		"no-undef": 0, // FOR NOW OKAY? there are just tons of globals at the moment
		"no-unused-vars": 0, // ditto
	}
};