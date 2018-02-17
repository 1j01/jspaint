
function update_magnified_canvas_size(){
	$canvas.css("width", canvas.width * magnification);
	$canvas.css("height", canvas.height * magnification);
}

function set_magnification(scale){
	magnification = scale;
	update_magnified_canvas_size();
	$G.triggerHandler("resize");
}

function reset_magnification(){
	set_magnification(1);
}

function reset_colors(){
	colors = {
		foreground: "#000000",
		background: "#ffffff",
		ternary: "",
	};
	$G.trigger("option-changed");
}

function reset_file(){
	file_entry = null;
	file_name = "untitled";
	update_title();
	saved = true;
}

function reset_canvas(){
	undos = [];
	redos = [];

	canvas.width = my_canvas_width;
	canvas.height = my_canvas_height;
	ctx.disable_image_smoothing();
	ctx.fillStyle = colors.background;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	$canvas_area.trigger("resize");
}

function update_title(){
	document.title = file_name + " - Paint";
}

function create_and_trigger_input(attrs, callback){
	var $input = $(E("input")).attr(attrs)
		.on("change", function(){
			callback(this);
			$input.remove();
		})
		.appendTo($app)
		.hide()
		.click();
	return $input;
}

// TODO: rename these functions to lowercase (and maybe say "files" in this case)
function get_FileList_from_file_select_dialog(callback){
	// TODO: specify mime types?
	create_and_trigger_input({type: "file"}, function(input){
		callback(input.files);
	});
}

function open_from_Image(img, callback, canceled){
	are_you_sure(function(){
		// TODO: shouldn't open_from_* start a new session?

		this_ones_a_frame_changer();

		reset_file();
		reset_colors();
		reset_canvas(); // (with newly reset colors)
		reset_magnification();

		ctx.copy(img);
		detect_transparency();
		$canvas_area.trigger("resize");

		callback && callback();
	}, canceled);
}
function load_image_from_URI(uri, callback){
	fetch(uri)
	.then(function(response) {
		return response.blob();
	}).then(function(blob) {
		var img = new Image();
		img.crossOrigin = "Anonymous";
		img.onload = function(){
			if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth === 0) {
				return callback && callback(new Error("Image failed to load; naturalWidth == " + this.naturalWidth));
			}
			callback(null, img);
		};
		img.onerror = function(e) {
			callback && callback(new Error("Image failed to load"));
		};
		img.src = window.URL.createObjectURL(blob);
	}).catch(function(exception) {
		callback && callback(new Error("Image failed to load"));
	});
}
function open_from_URI(uri, callback, canceled){
	load_image_from_URI(uri, function(err, img){
		if(err){ return callback(err); }
		open_from_Image(img, callback, canceled);
	});
}
function open_from_File(file, callback, canceled){
	var blob_url = URL.createObjectURL(file);
	load_image_from_URI(blob_url, function(err, img){
		// revoke object URL regardless of error
		URL.revokeObjectURL(file);
		if(err){ return callback(err); }

		open_from_Image(img, function(){
			file_name = file.name;
			update_title();
			saved = true;
			callback();
		}, canceled);
	});
}
function get_image_file_from_FileList_or_show_error(files, file_list_user_input_method_verb_past_tense){
	for(var i=0; i<files.length; i++){
		var file = files[i];
		if(file.type.match(/^image/)){
			return file;
		}
	}
	if(files.length > 1){
		show_error_message("None of the files " + file_list_user_input_method_verb_past_tense + " appear to be images.");
	}else{
		// TODO: ucfirst(file_list_user_input_method_verb_past_tense) + " file" might be more natural
		show_error_message("File " + file_list_user_input_method_verb_past_tense + " does not appear to be an image.");
	}
}
function open_from_FileList(files, user_input_method_verb_past_tense){
	var file = get_image_file_from_FileList_or_show_error(files);
	if(file){
		open_from_File(file, function(err){
			if(err){ return show_error_message("Failed to open file:", err); }
		});
	}
}
function open_from_FileEntry(entry, callback){
	entry.file(function(file){
		open_from_File(file, function(err){
			if(err){ return callback && callback(err); }
			file_entry = entry;
			callback && callback();
		});
	});
}
function save_to_FileEntry(entry, callback){
	entry.createWriter(function(file_writer){
		file_writer.onwriteend = function(e){
			if(this.error){
				console.error(this.error + '\n\n\n@ ' + e);
			}else{
				callback && callback();
				console.log("File written!");
			}
		};
		canvas.toBlob(function(blob){
			file_writer.write(blob);
		});
	});
}

function file_new(){
	are_you_sure(function(){
		this_ones_a_frame_changer();

		reset_file();
		reset_colors();
		reset_canvas(); // (with newly reset colors)
		reset_magnification();
	});
}

// TODO: factor out open_select/choose_file_dialog or get_file_from_file_select_dialog or whatever
// all these open_from_* things are done backwards, basically
// there's this little thing called Inversion of Control...
// use the chooseEntry thing for paste_from_file_select_dialog as well or drop support for that
function file_open(){
	if(window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry){
		chrome.fileSystem.chooseEntry({
			type: "openFile",
			accepts: [{mimeTypes: ["image/*"]}]
		}, function(entry){
			file_entry = entry;
			if(chrome.runtime.lastError){
				return console.error(chrome.runtime.lastError.message);
			}
			open_from_FileEntry(entry, function(err){
				if(err){
					show_error_message("Failed to open file:", err);
				}
			});
		});
	}else{
		get_FileList_from_file_select_dialog(function(files){
			open_from_FileList(files, "selected");
		});
	}
}

var $file_load_from_url_window;
function file_load_from_url(){
	if($file_load_from_url_window){
		$file_load_from_url_window.close();
	}
	var $w = new $FormWindow().addClass("dialogue-window");
	$file_load_from_url_window = $w;
	$w.title("Load from URL");
	// TODO: URL validation (input has to be in a form (and we don't want the form to submit))
	$w.$main.html("<label>URL: <input type='url' required value='' class='url-input'/></label>");
	var $input = $w.$main.find(".url-input");
	$w.$Button("Load", function(){
		$w.close();
		// TODO: retry loading if same URL entered
		// actually, make it change the hash only after loading successfully
		// (but still load from the hash when necessary)
		// make sure it doesn't overwrite the old session before switching
		location.hash = "load:" + encodeURIComponent($input.val());
	}).focus();
	$w.$Button("Cancel", function(){
		$w.close();
	});
	$w.center();
	$input.focus();
}

function file_save(){
	deselect();
	if(file_name.match(/\.svg$/)){
		file_name = file_name.replace(/\.svg$/, "") + ".png";
		//TODO: update_title();?
		return file_save_as();
	}
	if(window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry && window.file_entry){
		save_to_FileEntry(file_entry);
	}else{
		file_save_as();
	}
}

function file_save_as(){
	deselect();
	if(window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry){
		chrome.fileSystem.chooseEntry({
			type: 'saveFile',
			suggestedName: file_name,
			accepts: [{mimeTypes: ["image/*"]}]
		}, function(entry){
			if(chrome.runtime.lastError){
				return console.error(chrome.runtime.lastError.message);
			}
			file_entry = entry;
			file_name = entry.name;
			update_title();
			save_to_FileEntry(file_entry);
		});
	}else{
		canvas.toBlob(function(blob){
			var file_saver = saveAs(blob, file_name.replace(/\.(bmp|png|gif|jpe?g|tiff|webp)$/, "") + ".png");
			file_saver.onwriteend = function(){
				// this won't fire in chrome
				saved = true;
			};
		});
	}
}


function are_you_sure(action, canceled){
	if(saved){
		action();
	}else{
		var $w = new $FormWindow().addClass("dialogue-window");
		$w.title("Paint");
		$w.$main.text("Save changes to "+file_name+"?");
		$w.$Button("Save", function(){
			$w.close();
			file_save();
			action();
		}).focus();
		$w.$Button("Discard", function(){
			$w.close();
			action();
		});
		$w.$Button("Cancel", function(){
			$w.close();
			canceled && canceled();
		});
		$w.$x.on("click", function(){
			canceled && canceled();
		});
		$w.center();
	}
}

function show_error_message(message, error){
	var $w = $FormWindow().title("Error").addClass("dialogue-window");
	$w.$main.text(message);
	$w.$main.css("max-width", "600px");
	if(error){
		$(E("pre"))
		.appendTo($w.$main)
		.text(error.stack || error.toString())
		.css({
			background: "white",
			color: "#333",
			// background: "#A00",
			// color: "white",
			fontFamily: "monospace",
			width: "500px",
			overflow: "auto",
		});
	}
	$w.$Button("OK", function(){
		$w.close();
	});
	$w.center();
	console.error(message, error);
}

// TODO: close are_you_sure windows and these Error windows when switching sessions
// because it can get pretty confusing
function show_resource_load_error_message(){
	// NOTE: apparently distinguishing cross-origin errors is disallowed
	var $w = $FormWindow().title("Error").addClass("dialogue-window");
	$w.$main.html(
		"<p>Failed to load image.</p>" +
		"<p>Make sure to use an image host that supports " +
		"<a href='https://en.wikipedia.org/wiki/Cross-origin_resource_sharing'>Cross-Origin Resource Sharing</a>" +
		", such as <a href='https://imgur.com/'>Imgur</a>."
	);
	$w.$main.css({maxWidth: "500px"});
	$w.$Button("OK", function(){
		$w.close();
	});
	$w.center();
}

// TODO: DRY between these functions and open_from_* functions further?

// function paste_image_from_URI(uri, callback){
// 	load_image_from_URI(uri, function(err, img){
// 		if(err){ return callback(err); }
// 		paste(img);
// 	});
// };

function paste_image_from_file(file){
	// TODO: revoke object URL
	var blob_url = URL.createObjectURL(file);
	// paste_image_from_URI(blob_url);
	load_image_from_URI(blob_url, function(err, img){
		if(err){ return show_resource_load_error_message(); }
		paste(img);
		console.log("revokeObjectURL", blob_url);
		URL.revokeObjectURL(blob_url);
	});
}

function paste_from_file_select_dialog(){
	get_FileList_from_file_select_dialog(function(files){
		var file = get_image_file_from_FileList_or_show_error(files, "selected");
		if(file){
			paste_image_from_file(file);
		}
	});
}

function paste(img){

	if(img.width > canvas.width || img.height > canvas.height){
		var $w = new $FormWindow().addClass("dialogue-window");
		$w.title("Paint");
		$w.$main.html(
			"The image is bigger than the canvas.<br>" +
			"Would you like the canvas to be enlarged?<br>"
		);
		$w.$Button("Enlarge", function(){
			$w.close();
			// Additional undoable
			undoable(function(){
				var original = undos[undos.length-1];
				canvas.width = Math.max(original.width, img.width);
				canvas.height = Math.max(original.height, img.height);
				ctx.disable_image_smoothing();
				if(!transparency){
					ctx.fillStyle = colors.background;
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}
				ctx.drawImage(original, 0, 0);
				do_the_paste();
				$canvas_area.trigger("resize");
			});
		}).focus();
		$w.$Button("Crop", function(){
			$w.close();
			do_the_paste();
		});
		$w.$Button("Cancel", function(){
			$w.close();
		});
		$w.center();
	}else{
		do_the_paste();
	}

	function do_the_paste(){
		// Note: relying on select_tool to call deselect();
		select_tool(get_tool_by_name("Select"));

		selection = new Selection(0, 0, img.width, img.height);
		selection.instantiate(img);
	}
}

function render_history_as_gif(){
	var $win = $FormWindow();
	$win.title("Rendering GIF");
	$win.center();
	var $output = $win.$main;
	var $progress = $(E("progress")).appendTo($output);
	var $progress_percent = $(E("span")).appendTo($output).css({
		width: "2.3em",
		display: "inline-block",
		textAlign: "center",
	});
	$win.$main.css({padding: 5});

	var $cancel = $win.$Button('Cancel', function(){
		$win.close();
	});

	$win.on('close', function(){
		gif.abort();
	});

	try{
		var width = canvas.width;
		var height = canvas.height;
		var gif = new GIF({
			//workers: Math.min(5, Math.floor(undos.length/50)+1),
			workerScript: "lib/gif.js/gif.worker.js",
			width: width,
			height: height,
		});

		gif.on("progress", function(p){
			$progress.val(p);
			$progress_percent.text(~~(p*100)+"%");
		});

		gif.on("finished", function(blob){
			$win.title("Rendered GIF");
			var url = URL.createObjectURL(blob);
			$output.empty().append(
				$(E("img")).attr({
					src: url,
					width: width,
					height: height,
				})
			);
			$win.$Button("Save", function(){
				$win.close();
				saveAs(blob, file_name.replace(/\.(bmp|png|gif|jpe?g|tiff|webp)$/, "") + " history.gif");
			});
			$cancel.appendTo($win.$buttons);
			$win.center();
		});

		for(var i=0; i<undos.length; i++){
			gif.addFrame(undos[i], {delay: 200});
		}
		gif.addFrame(canvas, {
			delay: 200,
			copy: true,
		});
		gif.render();

	}catch(err){
		$win.close();
		show_error_message("Failed to render GIF:", err);
	}
}

/*
function render_history_as_apng(){
	var $win = $FormWindow();
	$win.title("Rendering APNG");
	$win.center();
	var $output = $win.$main;
	var $progress = $(E("progress")).appendTo($output);
	var $progress_percent = $(E("span")).appendTo($output).css({
		width: "2.3em",
		display: "inline-block",
		textAlign: "center",
	});
	$win.$main.css({padding: 5});

	var $cancel = $win.$Button('Cancel', function(){
		$win.close();
	});

	$win.on('close', function(){
		// abort any workers
	});

	try{
		var width = canvas.width;
		var height = canvas.height;
		// var frames = undos.concat([canvas]);
		// var apng = new APNG(frames, {loops: Infinity}, function(blob){
		var apng = new APNG({loops: Infinity})
		for(var i=0; i<undos.length; i++){
			apng.addFrame(undos[i], {delay: 200});
		}
		apng.addFrame(canvas, {delay: 200});
		apng.render(function(blob){
			$win.title("Rendered APNG");
			var url = URL.createObjectURL(blob);
			$output.empty().append(
				$(E("img")).attr({
					src: url,
					width: width,
					height: height,
				})
			);
			$win.$Button("Save", function(){
				$win.close();
				saveAs(blob, file_name + " history.png");
			});
			$cancel.appendTo($win.$buttons);
			$win.center();
		});
	}catch(err){
		$win.close();
		show_error_message("Failed to render APNG:", err);
	}
}
*/

function undoable(callback, action){
	saved = false;
	// TODO: this is annoying and arbitrary. nonlinear undo would be much better.
	if(redos.length > 5){
		var $w = new $FormWindow().addClass("dialogue-window");
		$w.title("Paint");
		$w.$main.html("Discard "+redos.length+" possible redo-able actions?<br>(Ctrl+Y or Ctrl+Shift+Z to redo)<br>");
		$w.$Button(action ? "Discard and Apply" : "Discard", function(){
			$w.close();
			redos = [];
			action && action();
		}).focus();
		$w.$Button("Keep", function(){
			$w.close();
		});
		$w.center();
		return false;
	}else{
		redos = [];
	}

	undos.push(new Canvas(canvas));

	action && action();
	callback && callback();
	return true;
}
function undo(){
	if(undos.length<1){ return false; }
	this_ones_a_frame_changer();

	redos.push(new Canvas(canvas));

	ctx.copy(undos.pop());

	$canvas_area.trigger("resize");

	return true;
}
function redo(){
	if(redos.length<1){ return false; }
	this_ones_a_frame_changer();

	undos.push(new Canvas(canvas));

	ctx.copy(redos.pop());

	$canvas_area.trigger("resize");

	return true;
}
function cancel(){
	if(!selected_tool.passive){ undo(); }
	$G.triggerHandler("pointerup", "cancel");
}
function this_ones_a_frame_changer(){
	deselect();
	saved = false;
	$G.triggerHandler("pointerup", "cancel");
	$G.triggerHandler("session-update");
}
function deselect(){
	if(selection){
		selection.draw();
		selection.destroy();
		selection = null;
	}
	if(textbox){
		textbox.draw();
		textbox.destroy();
		textbox = null;
	}
	if(selected_tool.end){
		selected_tool.end();
	}
}
function delete_selection(){
	if(selection){
		selection.destroy();
		selection = null;
	}
}
function select_all(){
	// Note: relying on select_tool to call deselect();
	select_tool(get_tool_by_name("Select"));

	selection = new Selection(0, 0, canvas.width, canvas.height);
	selection.instantiate();
}

function image_invert(){
	apply_image_transformation(function(original_canvas, original_ctx, new_canvas, new_ctx){
		var id = original_ctx.getImageData(0, 0, original_canvas.width, original_canvas.height);
		for(var i=0; i<id.data.length; i+=4){
			id.data[i+0] = 255 - id.data[i+0];
			id.data[i+1] = 255 - id.data[i+1];
			id.data[i+2] = 255 - id.data[i+2];
		}
		new_ctx.putImageData(id, 0, 0);
	});
}

function clear(){
	undoable(0, function(){
		this_ones_a_frame_changer();

		if(transparency){
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}else{
			ctx.fillStyle = colors.background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
	});
}

function view_bitmap(){
	if(canvas.requestFullscreen){ canvas.requestFullscreen(); }
	if(canvas.webkitRequestFullscreen){ canvas.webkitRequestFullscreen(); }
}

function get_tool_by_name(name){
	for(var i=0; i<tools.length; i++){
		if(tools[i].name == name){
			return tools[i];
		}
	}
	for(var i=0; i<extra_tools.length; i++){
		if(extra_tools[i].name == name){
			return extra_tools[i];
		}
	}
}

function select_tool(tool){
	if(!selected_tool.deselect){
		previous_tool = selected_tool;
	}
	selected_tool = tool;
	
	deselect();
	if(selected_tool.activate){
		selected_tool.activate();
	}
	
	$toolbox.update_selected_tool();
	// $toolbox2.update_selected_tool();
}

// TODO: factor this into a simple (pure) function, to be used like:
// transparency = has_any_transparency(ctx);
function detect_transparency(){
	transparency = false;

	// @TODO Optimization: Assume JPEGs and some other file types are opaque.
	// Raster file formats that SUPPORT transparency include GIF, PNG, BMP and TIFF
	// (Yes, even BMPs support transparency!)

	var id = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for(var i=0, l=id.data.length; i<l; i+=4){
		if(id.data[i+3] < 255){
			transparency = true;
			return;
		}
	}
}

function make_monochrome_pattern(lightness){

	var dither_threshold_table = Array.from({length: 64}, function(undef, p){
		var q = p ^ (p >> 3);
		return (
			((p & 4) >> 2) | ((q & 4) >> 1) |
			((p & 2) << 1) | ((q & 2) << 2) |
			((p & 1) << 4) | ((q & 1) << 5)
		) / 64;
	});

	var pattern_canvas = document.createElement("canvas");
	var pattern_ctx = pattern_canvas.getContext("2d");

	pattern_canvas.width = 8;
	pattern_canvas.height = 8;

	var pattern_image_data = ctx.createImageData(pattern_canvas.width, pattern_canvas.height);

	for(var x = 0; x < pattern_canvas.width; x += 1){
		for(var y = 0; y < pattern_canvas.width; y += 1){
			var map_value = dither_threshold_table[(x & 7) + ((y & 7) << 3)];
			var px_white = lightness > map_value;
			var index = ((y * pattern_image_data.height) + x) * 4;
			pattern_image_data.data[index + 0] = px_white * 255;
			pattern_image_data.data[index + 1] = px_white * 255;
			pattern_image_data.data[index + 2] = px_white * 255;
			pattern_image_data.data[index + 3] = 255;
		}
	}

	pattern_ctx.putImageData(pattern_image_data, 0, 0);

	return ctx.createPattern(pattern_canvas, "repeat");
}

function make_monochrome_palette(){
	// TODO: maybe *offer* to convert the existing image to monochrome
	// (offer as opposed to forcing it)

	var palette = [];
	var n_colors_per_row = 14;
	var n_colors = n_colors_per_row * 2;
	for(var i=0; i<n_colors_per_row; i++){
		var lightness = i / n_colors;
		palette.push(make_monochrome_pattern(lightness));
	}
	for(var i=0; i<n_colors_per_row; i++){
		var lightness = 1 - i / n_colors;
		palette.push(make_monochrome_pattern(lightness));
	}

	return palette;
}

function switch_to_polychrome_palette(){

}

function image_attributes(){
	if(image_attributes.$window){
		image_attributes.$window.close();
	}
	var $w = image_attributes.$window = new $FormWindow("Attributes");

	var $main = $w.$main;
	var $buttons = $w.$buttons;

	// Information

	var table = {
		"File last saved": "Not available", // @TODO
		"Size on disk": "Not available", // @TODO
		"Resolution": "72 x 72 dots per inch",
	};
	var $table = $(E("table")).appendTo($main);
	for(var k in table){
		var $tr = $(E("tr")).appendTo($table);
		var $key = $(E("td")).appendTo($tr).text(k + ":");
		var $value = $(E("td")).appendTo($tr).text(table[k]);
	}

	// Dimensions

	var unit_sizes_in_px = {px: 1, in: 72, cm: 28.3465};
	var current_unit = image_attributes.unit = image_attributes.unit || "px";
	var width_in_px = canvas.width;
	var height_in_px = canvas.height;

	var $width_label = $(E("label")).appendTo($main).text("Width:");
	var $height_label = $(E("label")).appendTo($main).text("Height:");
	var $width = $(E("input")).appendTo($width_label);
	var $height = $(E("input")).appendTo($height_label);

	$main.find("input")
		.css({width: "40px"})
		.on("change keyup keydown keypress pointerdown pointermove paste drop", function(){
			if($(this).is($width)){
				width_in_px = $width.val() * unit_sizes_in_px[current_unit];
			}
			if($(this).is($height)){
				height_in_px = $height.val() * unit_sizes_in_px[current_unit];
			}
		});

	// Fieldsets

	var $units = $(E("fieldset")).appendTo($main).append('<legend>Units</legend>');
	$units.append('<label><input type="radio" name="units" value="in">Inches</label>');
	$units.append('<label><input type="radio" name="units" value="cm">Cm</label>');
	$units.append('<label><input type="radio" name="units" value="px">Pixels</label>');
	$units.find("[value=" + current_unit + "]").attr({checked: true});
	$units.on("change", function(){
		var new_unit = $units.find(":checked").val();
		$width.val(width_in_px / unit_sizes_in_px[new_unit]);
		$height.val(height_in_px / unit_sizes_in_px[new_unit]);
		current_unit = new_unit;
	}).triggerHandler("change");

	var $colors = $(E("fieldset")).appendTo($main).append('<legend>Colors</legend>');
	$colors.append('<label><input type="radio" name="colors" value="monochrome">Black and White</label>');
	$colors.append('<label><input type="radio" name="colors" value="polychrome">Color</label>');
	$colors.find("[value=" + (monochrome ? "monochrome" : "polychrome") + "]").attr({checked: true});

	var $transparency = $(E("fieldset")).appendTo($main).append('<legend>Transparency</legend>');
	$transparency.append('<label><input type="radio" name="transparency" value="transparent">Transparent</label>');
	$transparency.append('<label><input type="radio" name="transparency" value="opaque">Opaque</label>');
	$transparency.find("[value=" + (transparency ? "transparent" : "opaque") + "]").attr({checked: true});

	// Buttons on the right

	$w.$Button("Okay", function(){
		var transparency_option = $transparency.find(":checked").val();
		var colors_option = $colors.find(":checked").val();
		var unit = $units.find(":checked").val();

		var was_monochrome = monochrome;

		image_attributes.unit = unit;
		transparency = (transparency_option == "transparent");
		monochrome = (colors_option == "monochrome");

		if(monochrome != was_monochrome){
			if(monochrome){
				palette = monochrome_palette;
			}else{
				palette = polychrome_palette;
			}

			$colorbox.rebuild_palette();
			reset_colors();
		}

		var unit_to_px = unit_sizes_in_px[unit];
		var width = $width.val() * unit_to_px;
		var height = $height.val() * unit_to_px;
		$canvas.trigger("user-resized", [0, 0, ~~width, ~~height]);

		image_attributes.$window.close();
	}).focus();

	$w.$Button("Cancel", function(){
		image_attributes.$window.close();
	});

	$w.$Button("Default", function(){
		width_in_px = default_canvas_width;
		height_in_px = default_canvas_height;
		$width.val(width_in_px / unit_sizes_in_px[current_unit]);
		$height.val(height_in_px / unit_sizes_in_px[current_unit]);
	});

	// Reposition the window

	image_attributes.$window.center();
}

function image_flip_and_rotate(){
	var $w = new $FormWindow("Flip and Rotate");

	var $fieldset = $(E("fieldset")).appendTo($w.$main);
	$fieldset.append("<legend>Flip or rotate</legend>");
	$fieldset.append("<label><input type='radio' name='flip-or-rotate' value='flip-horizontal' checked/>Flip horizontal</label>");
	$fieldset.append("<label><input type='radio' name='flip-or-rotate' value='flip-vertical'/>Flip vertical</label>");
	$fieldset.append("<label><input type='radio' name='flip-or-rotate' value='rotate-by-angle'/>Rotate by angle<div></div></label>");

	var $rotate_by_angle = $fieldset.find("div")
	$rotate_by_angle.css({paddingLeft: "30px"});
	$rotate_by_angle.append("<label><input type='radio' name='rotate-by-angle' value='90' checked/>90°</label>");
	$rotate_by_angle.append("<label><input type='radio' name='rotate-by-angle' value='180'/>180°</label>");
	$rotate_by_angle.append("<label><input type='radio' name='rotate-by-angle' value='270'/>270°</label>");
	$rotate_by_angle.append("<label><input type='radio' name='rotate-by-angle' value='arbitrary'/><input type='number' min='-360' max='360' name='rotate-by-arbitrary-angle' value=''/> Degrees</label>");
	$rotate_by_angle.find("input").attr({disabled: true});

	$fieldset.find("input").on("change", function(){
		var action = $fieldset.find("input[name='flip-or-rotate']:checked").val();
		$rotate_by_angle.find("input").attr({
			disabled: action !== "rotate-by-angle"
		});
	});
	$rotate_by_angle.find("label, input").on("click", function(e){
		// Select "Rotate by angle" and enable subfields
		$fieldset.find("input[value='rotate-by-angle']").prop("checked", true);
		$fieldset.find("input").triggerHandler("change");

		var $label = $(this).closest("label");
		// Focus the numerical input if this field has one
		$label.find("input[type='number']").focus();
		// Select the radio for this field
		$label.find("input[type='radio']").prop("checked", true);
	});
	// @TODO: enable all controls that are accessable to the pointer

	$fieldset.find("label").css({display: "block"});

	$w.$Button("Okay", function(){
		var action = $fieldset.find("input[name='flip-or-rotate']:checked").val();
		var angle_val = $fieldset.find("input[name='rotate-by-angle']:checked").val();
		if(angle_val === "arbitrary"){
			angle_val = $fieldset.find("input[name='rotate-by-arbitrary-angle']").val();
		}
		var angle_deg = parseFloat(angle_val);
		var angle = angle_deg / 360 * TAU;

		if(isNaN(angle)){
			var $msgw = new $FormWindow("Invalid Value").addClass("dialogue-window");
			$msgw.$main.text("The value specified for Degrees was invalid.");
			$msgw.$Button("Okay", function(){
				$msgw.close();
			});
			return;
		}

		switch(action){
			case "flip-horizontal":
				flip_horizontal();
				break;
			case "flip-vertical":
				flip_vertical();
				break;
			case "rotate-by-angle":
				rotate(angle);
				break;
		}

		$canvas_area.trigger("resize");

		$w.close();
	}).focus();
	$w.$Button("Cancel", function(){
		$w.close();
	});

	$w.center();
}

function image_stretch_and_skew(){
	var $w = new $FormWindow("Stretch and Skew");

	var $fieldset_stretch = $(E("fieldset")).appendTo($w.$main);
	$fieldset_stretch.append("<legend>Stretch</legend><table></table>");
	var $fieldset_skew = $(E("fieldset")).appendTo($w.$main);
	$fieldset_skew.append("<legend>Skew</legend><table></table>");

	var $RowInput = function($table, img_src, label_text, default_value, label_unit){
		var $tr = $(E("tr")).appendTo($table);
		var $img = $(E("img")).attr({
			src: "images/transforms/" + img_src + ".png"
		}).css({
			marginRight: "20px"
		});
		var $input = $(E("input")).attr({
			value: default_value
		}).css({
			width: "40px"
		});
		$(E("td")).appendTo($tr).append($img);
		$(E("td")).appendTo($tr).text(label_text);
		$(E("td")).appendTo($tr).append($input);
		$(E("td")).appendTo($tr).text(label_unit);

		return $input;
	};

	var stretch_x = $RowInput($fieldset_stretch.find("table"), "stretch-x", "Horizontal:", 100, "%");
	var stretch_y = $RowInput($fieldset_stretch.find("table"), "stretch-y", "Vertical:", 100, "%");
	var skew_x = $RowInput($fieldset_skew.find("table"), "skew-x", "Horizontal:", 0, "Degrees");
	var skew_y = $RowInput($fieldset_skew.find("table"), "skew-y", "Vertical:", 0, "Degrees");

	$w.$Button("Okay", function(){
		var xscale = parseFloat(stretch_x.val())/100;
		var yscale = parseFloat(stretch_y.val())/100;
		var hskew = parseFloat(skew_x.val())/360*TAU;
		var vskew = parseFloat(skew_y.val())/360*TAU;
		stretch_and_skew(xscale, yscale, hskew, vskew);
		$canvas_area.trigger("resize");
		$w.close();
	}).focus();

	$w.$Button("Cancel", function(){
		$w.close();
	});

	$w.center();
}

function set_as_wallpaper_tiled(c){
	c = c || canvas;

	// Note: we can't just poke in a different set_as_wallpaper_tiled function, because it's stored in menus.js
	if(window.systemSetAsWallpaperTiled){
		return window.systemSetAsWallpaperTiled(c);
	}

	var wp = new Canvas(screen.width, screen.height);
	for(var x=0; x<wp.width; x+=c.width){
		for(var y=0; y<wp.height; y+=c.height){
			wp.ctx.drawImage(c, x, y);
		}
	}

	set_as_wallpaper_centered(wp);
}

function set_as_wallpaper_centered(c){
	c = c || canvas;
	
	// Note: we can't just poke in a different set_as_wallpaper_centered function, because it's stored in menus.js
	if(window.systemSetAsWallpaperCentered){
		return window.systemSetAsWallpaperCentered(c);
	}

	// TODO: move the chrome handling into chrome-app.js using the system-specific override
	// can do it for nw.js too, although that doesn't have a separate file yet (i.e. nw-app.js)

	if(window.chrome && chrome.wallpaper){
		get_array_buffer_from_canvas(c)
			.then(function(buffer) {
				chrome.wallpaper.setWallpaper({
					data: buffer,
					layout: "CENTER_CROPPED",
					filename: file_name,
				}, function on_thumbnail_created() {
				});
			}).catch(function(error) {
				show_error_message("Failed to set as desktop background: couldn't read image file.", error);
			});
	}else if(window.require){
		var gui = require("nw.gui");
		var fs = require("fs");
		var wallpaper = require("wallpaper");

		var base64 = c.toDataURL().replace(/^data:image\/png;base64,/, "");
		var imgPath = require("path").join(gui.App.dataPath, "bg.png");

		fs.writeFile(imgPath, base64, "base64", function(err){
			if(err){
				return show_error_message("Failed to set as desktop background: couldn't write temporary image file.", err);
			}
			wallpaper.set(imgPath, function(err){
				if(err){
					show_error_message("Failed to set as desktop background!", err);
				}
			});
		});
	}else{
		c.toBlob(function(blob){
			saveAs(blob, file_name.replace(/\.(bmp|png|gif|jpe?g|tiff|webp)$/, "") + " wallpaper.png");
		});
	}
}

/**
 * @param {HTMLElement} canvas
 * @return {Promise}
 */
function get_array_buffer_from_canvas(canvas) {
	return new Promise(function(resolve, reject) {
		var file_reader = new FileReader();

		file_reader.onloadend = function() {
			resolve(file_reader.result);
		};

		file_reader.onerror = function() {
			reject(new Error("Failed to read canvas image to array buffer"));
		};

		canvas.toBlob(function(blob) {
			file_reader.readAsArrayBuffer(blob);
		});
	});
}

function save_selection_to_file(){
	if(selection && selection.canvas){
		if(window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry){
			chrome.fileSystem.chooseEntry({
				type: 'saveFile',
				suggestedName: 'Selection',
				accepts: [{mimeTypes: ["image/*"]}]
			}, function(entry){
				if(chrome.runtime.lastError){
					// TODO: should show an error unless this can also be the user just canceling
					// also in other places
					// or just drop support for chrome.fileSystem stuff
					// show_error_message("Failed to write selection to file:", chrome.runtime.lastError);
					return console.error(chrome.runtime.lastError.message);
				}
				entry.createWriter(function(file_writer){
					file_writer.onwriteend = function(e){
						if(this.error){
							show_error_message("Failed to write selection to file:", this.error);
							console.error(this.error + '\n\n\n@ ' + e);
						}else{
							console.log("Wrote selection to file!");
						}
					};
					selection.canvas.toBlob(function(blob){
						file_writer.write(blob);
					});
				});
			});
		}else{
			selection.canvas.toBlob(function(blob){
				saveAs(blob, "selection.png");
			});
		}
	}
}
