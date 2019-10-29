
function update_magnified_canvas_size(){
	$canvas.css("width", canvas.width * magnification);
	$canvas.css("height", canvas.height * magnification);

	update_canvas_rect();
}

function update_canvas_rect() {
	canvas_bounding_client_rect = canvas.getBoundingClientRect();

	update_helper_layer();
}

var helper_layer_update_queued;
var info_for_updating_pointer; // for updating on scroll or resize, where the mouse stays in the same place but its coordinates in the document change
function update_helper_layer(e){
	if (e) {
		info_for_updating_pointer = {clientX: e.clientX, clientY: e.clientY, devicePixelRatio};
	}
	if (helper_layer_update_queued) {
		// console.log("update_helper_layer - nah, already queued");
		return;
	} else {
		// console.log("update_helper_layer");
	}
	helper_layer_update_queued = true;
	requestAnimationFrame(()=> {
		helper_layer_update_queued = false;
		update_helper_layer_immediately();
	});
}
function update_helper_layer_immediately(e) {
	// console.log("update helper layer NOW");
	if (info_for_updating_pointer) {
		var rescale = info_for_updating_pointer.devicePixelRatio / devicePixelRatio;
		info_for_updating_pointer.clientX *= rescale;
		info_for_updating_pointer.clientY *= rescale;
		info_for_updating_pointer.devicePixelRatio = devicePixelRatio;
		pointer = e2c(info_for_updating_pointer);
	}

	update_fill_and_stroke_colors_and_lineWidth(selected_tool);
	
	var grid_visible = show_grid && magnification >= 4 && (window.devicePixelRatio * magnification) >= 4;

	var scale = magnification * window.devicePixelRatio;

	if (!helper_layer) {
		helper_layer = new OnCanvasHelperLayer(0, 0, canvas.width, canvas.height, false, scale);
	}

	var hcanvas = helper_layer.canvas;
	var hctx = hcanvas.ctx;

	var margin = 15;
	// var viewport_width = Math.floor(Math.min($canvas_area.width() / magnification + margin*2, canvas.width));
	// var viewport_height = Math.floor(Math.min($canvas_area.height() / magnification + margin*2, canvas.height));
	var viewport_x = Math.floor(Math.max($canvas_area.scrollLeft() / magnification - margin, 0));
	var viewport_y = Math.floor(Math.max($canvas_area.scrollTop() / magnification - margin, 0));
	var viewport_x2 = Math.floor(Math.min(viewport_x + $canvas_area.width() / magnification + margin*2, canvas.width));
	var viewport_y2 = Math.floor(Math.min(viewport_y + $canvas_area.height() / magnification + margin*2, canvas.height));
	var viewport_width = viewport_x2 - viewport_x;
	var viewport_height = viewport_y2 - viewport_y;
	// console.log($canvas_area.width(), $canvas_area.height(), viewport_width, viewport_height, canvas.width, canvas.height);
	var resolution_width = viewport_width * scale;
	var resolution_height = viewport_height * scale;
	if (
		hcanvas.width !== resolution_width ||
		hcanvas.height !== resolution_height
	) {
		hcanvas.width = resolution_width;
		hcanvas.height = resolution_height;
		hcanvas.ctx.disable_image_smoothing();
		helper_layer.width = viewport_width;
		helper_layer.height = viewport_height;
	}
	helper_layer.x = viewport_x;
	helper_layer.y = viewport_y;
	helper_layer.position();

	hctx.clearRect(0, 0, hcanvas.width, hcanvas.height);
	
	hctx.save();
	selected_tools.forEach((selected_tool)=> {
		if(selected_tool.drawPreviewUnderGrid && pointer){
			selected_tool.drawPreviewUnderGrid(hctx, pointer.x, pointer.y, grid_visible, scale, -viewport_x, -viewport_y);
		}
	});
	hctx.restore();

	if (grid_visible) {
		draw_grid(hctx, scale);
	}

	hctx.save();
	selected_tools.forEach((selected_tool)=> {
		if(selected_tool.drawPreviewAboveGrid && pointer){
			selected_tool.drawPreviewAboveGrid(hctx, pointer.x, pointer.y, grid_visible, scale, -viewport_x, -viewport_y);
		}
	});
	hctx.restore();
}
function update_disable_aa() {
	var dots_per_canvas_px = window.devicePixelRatio * magnification;
	var round = Math.floor(dots_per_canvas_px) === dots_per_canvas_px;
	$canvas_area.toggleClass("disable-aa-for-things-at-main-canvas-scale", dots_per_canvas_px >= 3 || round);
}

function set_magnification(scale){
	var prev_magnification = magnification;
	var scroll_left = $canvas_area.scrollLeft();
	var scroll_top = $canvas_area.scrollTop();

	magnification = scale;
	if(scale !== 1){
		return_to_magnification = scale;
	}
	update_magnified_canvas_size();

	// rescale viewport with top left as anchor
	scroll_left *= magnification / prev_magnification;
	scroll_top *= magnification / prev_magnification;

	$canvas_area.scrollLeft(scroll_left);
	$canvas_area.scrollTop(scroll_top);

	$G.triggerHandler("resize"); // updates handles & grid
	$G.trigger("option-changed"); // updates options area
}

var $custom_zoom_window;
function show_custom_zoom_window() {
	if ($custom_zoom_window) {
		$custom_zoom_window.close();
	}
	var $w = new $FormWindow("Custom Zoom");
	$custom_zoom_window = $w;

	// TODO: show Current zoom: blah% ?
	var $fieldset = $(E("fieldset")).appendTo($w.$main);
	$fieldset.append("<legend>Zoom to</legend>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='1'/>100%</label>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='2'/>200%</label>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='4'/>400%</label>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='6'/>600%</label>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='8'/>800%</label>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='really-custom'/><input type='number' min='10' max='1000' name='really-custom-zoom-input' value=''/>%</label>");
	var is_custom = true;
	$fieldset.find("input[type=radio]").get().forEach((el)=> {
		if (parseFloat(el.value) === magnification) {
			el.checked = true;
			is_custom = false;
		}
	});
	var $really_custom_radio_option = $fieldset.find("input[value='really-custom']");
	var $really_custom_input = $fieldset.find("input[name='really-custom-zoom-input']");

	$really_custom_input.closest("label").on("click", function(e){
		$really_custom_radio_option.prop("checked", true);
		$really_custom_input[0].focus();
	});

	if (is_custom) {
		$really_custom_input.val(magnification * 100);
		$really_custom_radio_option.prop("checked", true);
	}

	$fieldset.find("label").css({display: "block"});

	$w.$Button("Okay", function(){
		var option_val = $fieldset.find("input[name='custom-zoom-radio']:checked").val();
		var mag;
		if(option_val === "really-custom"){
			option_val = $really_custom_input.val();
			if(`${option_val}`.match(/\dx$/)) { // ...you can't actually type an x; oh well...
				mag = parseFloat(option_val);
			}else if(`${option_val}`.match(/\d%?$/)) {
				mag = parseFloat(option_val) / 100;
			}
			if(isNaN(mag)){
				var $msgw = new $FormWindow("Invalid Value").addClass("dialogue-window");
				$msgw.$main.text("The value specified for custom zoom was invalid.");
				$msgw.$Button("Okay", function(){
					$msgw.close();
				});
				return;
			}
		}else{
			mag = parseFloat(option_val);
		}

		set_magnification(mag);

		$w.close();
	})[0].focus();
	$w.$Button("Cancel", function(){
		$w.close();
	});

	$w.center();
}

function toggle_grid() {
	show_grid = !show_grid;
	// $G.trigger("option-changed");
	update_helper_layer();
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
	document_file_path = null;
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
		.trigger("click");
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
		set_magnification(1);

		ctx.copy(img);
		detect_transparency();
		$canvas_area.trigger("resize");

		callback && callback();
	}, canceled);
}
function get_URIs(text) {
	// parse text/uri-list
	// get lines, discarding comments
	var lines = text.split(/[\n\r]+/).filter(function(line){return line[0] !== "#" && line});
	// discard text with too many lines (likely pasted HTML or something) - may want to revisit this
	if (lines.length > 15) {
		return [];
	}
	// parse URLs, discarding anything that parses as a relative URL
	var uris = [];
	for (var i=0; i<lines.length; i++) {
		try {
			var url = new URL(lines[i]);
			uris.push(url.href);
		// eslint-disable-next-line no-empty
		} catch(e) {}
	}
	return uris;
}
function load_image_from_URI(uri, callback){
	// TODO: if URI is not blob: or data:, show dialog with progress bar and this string from mspaint.exe: "Downloading picture"
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
			document_file_path = file.path; // available in Electron
			update_title();
			saved = true;
			callback();
		}, canceled);
	});
}
function get_image_file_from_FileList_or_show_error(files, user_input_method_verb_past_tense){
	for(var i=0; i<files.length; i++){
		var file = files[i];
		if(file.type.match(/^image/)){
			return file;
		}
	}
	if(files.length > 1){
		show_error_message("None of the files " + user_input_method_verb_past_tense + " appear to be images.");
	}else{
		show_error_message("File " + user_input_method_verb_past_tense + " does not appear to be an image.");
	}
}
function open_from_FileList(files, user_input_method_verb_past_tense){
	var file = get_image_file_from_FileList_or_show_error(files, user_input_method_verb_past_tense);
	if(file){
		open_from_File(file, function(err){
			if(err){ return show_error_message("Failed to open file:", err); }
		});
	}
}

function file_new(){
	are_you_sure(function(){
		this_ones_a_frame_changer();

		reset_file();
		reset_colors();
		reset_canvas(); // (with newly reset colors)
		set_magnification(1);
	});
}

// TODO: factor out open_select/choose_file_dialog or get_file_from_file_select_dialog or whatever
// all these open_from_* things are done backwards, basically
// there's this little thing called Inversion of Control...
// also paste_from_file_select_dialog
function file_open(){
	get_FileList_from_file_select_dialog(function(files){
		open_from_FileList(files, "selected");
	});
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
		var uris = get_URIs($input.val());
		if (uris.length > 0) {
			// TODO: retry loading if same URL entered
			// actually, make it change the hash only after loading successfully
			// (but still load from the hash when necessary)
			// make sure it doesn't overwrite the old session before switching
			$w.close();
			location.hash = "load:" + encodeURIComponent(uris[0]);
		} else {
			show_error_message("Invalid URL. It must include a protocol (https:// or http://)");
		}
	});
	$w.$Button("Cancel", function(){
		$w.close();
	});
	$w.center();
	$input[0].focus();
}

function file_save(){
	deselect();
	if(file_name.match(/\.svg$/)){
		//TODO: only affect suggested name in save dialog, don't change file_name
		file_name = file_name.replace(/\.svg$/, "") + ".png";
		return file_save_as();
	}
	if(document_file_path){
		// TODO: save as JPEG by default if the previously opened/saved file was a JPEG?
		return save_to_file_path(document_file_path, "PNG", function(saved_file_path, saved_file_name){
			saved = true;
			document_file_path = saved_file_path;
			file_name = saved_file_name;
			update_title();
		});
	}
	file_save_as();
}

function file_save_as(){
	deselect();
	save_canvas_as(canvas, file_name.replace(/\.(bmp|dib|a?png|gif|jpe?g|jpe|jfif|tiff?|webp|raw)$/, "") + ".png", function(saved_file_path, saved_file_name){
		saved = true;
		document_file_path = saved_file_path;
		file_name = saved_file_name;
		update_title();
	});
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
		})[0].focus();
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
		"<p>Failed to load image from URL.</p>" +
		"<p>Check your browser's devtools for details.</p>" +
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

var $about_paint_window;
var $about_paint_content = $("#about-paint");
var $news_window;
var $this_version_news = $("#news");
var $latest_news = $this_version_news;

// not included directly in the HTML as a simple way of not showing it if it's loaded with fetch
// (...not sure how to phrase this clearly and concisely...)
// "Showing the news as of this version of JS Paint. For the latest, see <a href='https://jspaint.app'>jspaint.app</a>"
$this_version_news.prepend(
	$("<p>For the latest news, visit <a href='https://jspaint.app'>jspaint.app</a></p>")
	.css({padding: "8px 15px"})
);

function show_about_paint(){
	if($about_paint_window){
		$about_paint_window.close();
	}
	$about_paint_window = $Window().title("About Paint");

	$about_paint_window.$content.append($about_paint_content.show()).css({padding: "15px"});

	$("#maybe-outdated-view-project-news").removeAttr("hidden");

	$("#failed-to-check-if-outdated").attr("hidden", "hidden");
	$("#outdated").attr("hidden", "hidden");

	$about_paint_window.center();
	$about_paint_window.center(); // XXX - but it helps tho

	$("#refresh-to-update").on("click", (e)=> {
		e.preventDefault();
		location.reload();
	});
	
	$("#view-project-news").on("click", (e)=> {
		show_news();
	});
	
	$("#checking-for-updates").removeAttr("hidden");

	var url =
		// ".";
		// "test-news-newer.html";
		"https://jspaint.app";
	fetch(url)
	.then((response)=> response.text())
	.then((text)=> {
		var parser = new DOMParser();
		var htmlDoc = parser.parseFromString(text, "text/html");
		$latest_news = $(htmlDoc).find("#news");

		var $latest_entries = $latest_news.find(".news-entry");
		var $this_version_entries = $this_version_news.find(".news-entry");

		if (!$latest_entries.length) {
			$latest_news = $this_version_news;
			throw new Error(`No news found at fetched site (${url})`);
		}

		function entries_contains_update($entries, id) {
			return $entries.get().some((el_from_this_version)=> 
				id === el_from_this_version.id
			);
		}

		// TODO: visibly mark entries that overlap
		entries_newer_than_this_version =
			$latest_entries.get().filter((el_from_latest)=>
				!entries_contains_update($this_version_entries, el_from_latest.id)
			);
		
		entries_new_in_this_version = // i.e. in development, when updating the news
			$this_version_entries.get().filter((el_from_latest)=>
				!entries_contains_update($latest_entries, el_from_latest.id)
			);

		if (entries_newer_than_this_version.length > 0) {
			$("#outdated").removeAttr("hidden");
		} else if(entries_new_in_this_version.length > 0) {
			$latest_news = $this_version_news; // show this version's news for development
		}

		$("#checking-for-updates").attr("hidden", "hidden");
		update_css_classes_for_conditional_messages();
	}).catch((exception)=> {
		$("#failed-to-check-if-outdated").removeAttr("hidden");
		$("#checking-for-updates").attr("hidden", "hidden");
		update_css_classes_for_conditional_messages();
		console.log("Couldn't check for updates.", exception);
	});
}
// show_about_paint(); // for testing

function update_css_classes_for_conditional_messages() {

	$(".on-dev-host, .on-third-party-host, .on-official-host").hide();
	if (location.hostname.match(/localhost|127.0.0.1/)) {
		$(".on-dev-host").show();
	} else if (location.hostname.match(/jspaint.app/)) {
		$(".on-official-host").show();
	} else {
		$(".on-third-party-host").show();
	}

	$(".navigator-online, .navigator-offline").hide();
	if (navigator.onLine) {
		$(".navigator-online").show();
	} else {
		$(".navigator-offline").show();
	}
}

function show_news(){
	if($news_window){
		$news_window.close();
	}
	$news_window = $Window().title("Project News");

	// var $latest_entries = $latest_news.find(".news-entry");
	// var latest_entry = $latest_entries[$latest_entries.length - 1];
	// console.log("LATEST MEWS:", $latest_news);
	// console.log("LATEST ENTRY:", latest_entry);

	$latest_news_style = $latest_news.find("style");
	$this_version_news.find("style").remove();
	$latest_news.append($latest_news_style); // in case $this_version_news is $latest_news

	$news_window.$content.append($latest_news.removeAttr("hidden"));

	$news_window.center();
	$news_window.center(); // XXX - but it helps tho
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
		// TODO: this shouldn't really have the CORS error message, if it's from a blob URI
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
				ctx.putImageData(original, 0, 0);
				do_the_paste();
				$canvas_area.trigger("resize");
			});
		})[0].focus();
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

		var x = Math.max(0, Math.ceil($canvas_area.scrollLeft() / magnification));
		var y = Math.max(0, Math.ceil($canvas_area.scrollTop() / magnification));
		selection = new OnCanvasSelection(x, y, img.width, img.height, img);
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
			$win.$Button("Upload to Imgur", function(){
				$win.close();
				sanity_check_blob(blob, function(){
					show_imgur_uploader(blob);
				});
			});
			$win.$Button("Save", function(){
				$win.close();
				sanity_check_blob(blob, function(){
					saveAs(blob, file_name.replace(/\.(bmp|dib|a?png|gif|jpe?g|jpe|jfif|tiff?|webp|raw)$/, "") + " history.gif");
				});
			});
			$cancel.appendTo($win.$buttons);
			$win.center();
		});

		var gif_canvas = new Canvas(width, height);
		var frames = [...undos, ctx.getImageData(0, 0, canvas.width, canvas.height)];
		for(var i=0; i<frames.length; i++){
			gif_canvas.ctx.clearRect(0, 0, gif_canvas.width, gif_canvas.height);
			gif_canvas.ctx.putImageData(frames[i], 0, 0);
			gif.addFrame(gif_canvas, {delay: 200, copy: true});
		}
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
		var frames = [...undos, ctx.getImageData(0, 0, canvas.width, canvas.height)];
		// var apng = new APNG(frames, {loops: Infinity}, function(blob){
		var apng = new APNG({loops: Infinity})
		for(var i=0; i<frames.length; i++){
			apng.addFrame(frames[i], {delay: 200});
		}
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
				sanity_check_blob(blob, function(){
					saveAs(blob, file_name + " history.png");
				});
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
		})[0].focus();
		$w.$Button("Keep", function(){
			$w.close();
		});
		$w.center();
		return false;
	}else{
		redos = [];
	}

	undos.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

	action && action();
	callback && callback();
	return true;
}
function undo(){
	if(undos.length<1){ return false; }
	this_ones_a_frame_changer();

	redos.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

	ctx.copy(undos.pop());

	$canvas_area.trigger("resize");

	return true;
}
function redo(){
	if(redos.length<1){ return false; }
	this_ones_a_frame_changer();

	undos.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

	ctx.copy(redos.pop());

	$canvas_area.trigger("resize");

	return true;
}
function isPassive(tools) {
	return tools.every((tool)=>
		(typeof tool.passive === "function") ? tool.passive() : tool.passive
	);
}
function cancel(){
	if(!isPassive(selected_tools)){ undo(); }
	$G.triggerHandler("pointerup", "cancel");
	update_helper_layer();
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

	selection = new OnCanvasSelection(0, 0, canvas.width, canvas.height);
}

const browserRecommendationForClipboardAccess = "Try using Chrome 76+";
function try_exec_command(commandId) {
	if (document.queryCommandEnabled(commandId)) { // not a reliable source for whether it'll work, if I recall
		document.execCommand(commandId);
		if (navigator.userAgent.indexOf("Firefox") === -1 || commandId === "paste") {
			return show_error_message(`That ${commandId} probably didn't work. ${browserRecommendationForClipboardAccess}`);
		}
	} else {
		return show_error_message(`Cannot perform ${commandId}. ${browserRecommendationForClipboardAccess}`);
	}
}

function getSelectionText() {
    var text = "";
    var activeEl = document.activeElement;
    var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
    if (
		(activeElTagName == "textarea") || (activeElTagName == "input" &&
		/^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
		(typeof activeEl.selectionStart == "number")
    ) {
        text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
    } else if (window.getSelection) {
        text = window.getSelection().toString();
    }
    return text;
}

async function edit_copy(execCommandFallback){
	var text = getSelectionText();

	if (text.length > 0) {
		if (!navigator.clipboard || !navigator.clipboard.writeText) {
			if (execCommandFallback) {
				return try_exec_command("copy");
			} else {
				throw new Error("The Async Clipboard API is not supported by this browser. " + browserRecommendationForClipboardAccess);
			}
		}
		navigator.clipboard.writeText(text);
	} else if(selection && selection.canvas) {
		if (!navigator.clipboard || !navigator.clipboard.write) {
			if (execCommandFallback) {
				return try_exec_command("copy");
			} else {
				throw new Error("The Async Clipboard API is not supported by this browser. " + browserRecommendationForClipboardAccess);
			}
		}
		selection.canvas.toBlob(function(blob) {
			sanity_check_blob(blob, function(){
				navigator.clipboard.write([
					new ClipboardItem(Object.defineProperty({}, blob.type, {
						value: blob,
						enumerable: true,
					}))
				]).then(function(){
					console.log("Copied image to the clipboard");
				}, function(error){
					show_error_message("Failed to copy to the Clipboard.", error);
				});
			});
		});
	}
}
function edit_cut(execCommandFallback){
	if (!navigator.clipboard || !navigator.clipboard.write) {
		if (execCommandFallback) {
			return try_exec_command("cut");
		} else {
			throw new Error("The Async Clipboard API is not supported by this browser. " + browserRecommendationForClipboardAccess);
		}
	}
	edit_copy();
	delete_selection();
}
async function edit_paste(execCommandFallback){
	if(
		document.activeElement instanceof HTMLInputElement ||
		document.activeElement instanceof HTMLTextAreaElement
	){
		if (!navigator.clipboard || !navigator.clipboard.readText) {
			if (execCommandFallback) {
				return try_exec_command("paste");
			} else {
				throw new Error("The Async Clipboard API is not supported by this browser. " + browserRecommendationForClipboardAccess);
			}
		}
		const clipboardText = await navigator.clipboard.readText();
		document.execCommand("InsertText", false, clipboardText);
		return;
	}
	if (!navigator.clipboard || !navigator.clipboard.read) {
		if (execCommandFallback) {
			return try_exec_command("paste");
		} else {
			throw new Error("The Async Clipboard API is not supported by this browser. " + browserRecommendationForClipboardAccess);
		}
	}
	try {
		const clipboardItems = await navigator.clipboard.read();
		console.log(clipboardItems);
		const blob = await clipboardItems[0].getType("image/png");
		paste_image_from_file(blob);
		console.log("Image pasted.");
	} catch(error) {
		if (error.name === "NotFoundError") {
			try {
				const clipboardText = await navigator.clipboard.readText();
				if(clipboardText) {
					var uris = get_URIs(clipboardText);
					if (uris.length > 0) {
						load_image_from_URI(uris[0], function(err, img){
							if(err){ return show_resource_load_error_message(); }
							paste(img);
						});
					} else {
						show_error_message("The information on the Clipboard can't be inserted into Paint.");
					}
				} else {
					show_error_message("The information on the Clipboard can't be inserted into Paint.");
				}
			} catch(error) {
				show_error_message("Failed to read from the Clipboard.", error);
			}
		} else {
			show_error_message("Failed to read from the Clipboard.", error);
		}
	}
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
	for(let i=0; i<tools.length; i++){
		if(tools[i].name == name){
			return tools[i];
		}
	}
	for(let i=0; i<extra_tools.length; i++){
		if(extra_tools[i].name == name){
			return extra_tools[i];
		}
	}
}

// hacky but whatever
// this whole "multiple tools" thing is hacky for now
function select_tools(tools) {
	for (var i=0; i<tools.length; i++) {
		select_tool(tools[i], i > 0);
	}
	update_helper_layer();
}

function select_tool(tool, toggle){
	if(!(selected_tools.length === 1 && selected_tool.deselect)){
		return_to_tools = [...selected_tools];
	}
	if (toggle) {
		var index = selected_tools.indexOf(tool);
		if (index === -1) {
			selected_tools.push(tool);
			selected_tools.sort((a, b)=> {
				if (tools.indexOf(a) < tools.indexOf(b)) {
					return -1;
				}
				if (tools.indexOf(a) > tools.indexOf(b)) {
					return +1;
				}
				return 0;
			});
		} else {
			selected_tools.splice(index, 1);
		}
		if (selected_tools.length > 0) {
			selected_tool = selected_tools[selected_tools.length - 1];
		} else {
			selected_tool = tools[6];
			selected_tools = [selected_tool];
		}
	} else {
		selected_tool = tool;
		selected_tools = [tool];
	}
	
	deselect();

	if(tool.preload){
		tool.preload();
	}
	
	$toolbox.update_selected_tool();
	// $toolbox2.update_selected_tool();
}

function has_any_transparency(ctx) {
	// @TODO Optimization: Assume JPEGs and some other file types are opaque.
	// Raster file formats that SUPPORT transparency include GIF, PNG, BMP and TIFF
	// (Yes, even BMPs support transparency!)
	var id = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for(var i=0, l=id.data.length; i<l; i+=4){
		if(id.data[i+3] < 255){
			return true;
		}
	}
	return false;
}

function detect_transparency(){
	transparency = has_any_transparency(ctx);
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
	for(let i=0; i<n_colors_per_row; i++){
		let lightness = i / n_colors;
		palette.push(make_monochrome_pattern(lightness));
	}
	for(let i=0; i<n_colors_per_row; i++){
		let lightness = 1 - i / n_colors;
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
				// TODO: offer to convert to monochrome (with some threshold) (but don't require it)
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
	})[0].focus();

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
		var num_input = $label.find("input[type='number']")[0];
		if (num_input) {
			num_input.focus();
		}
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
	})[0].focus();
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
	})[0].focus();

	$w.$Button("Cancel", function(){
		$w.close();
	});

	$w.center();
}

// TODO: establish a better pattern for this (platform-specific functions, with browser-generic fallbacks)
// Note: we can't just poke in a different save_canvas_as function in electron-injected.js because electron-injected.js is loaded first
function save_canvas_as(canvas, fileName, savedCallbackUnreliable){
	if(window.systemSaveCanvasAs){
		return systemSaveCanvasAs(canvas, fileName, savedCallbackUnreliable);
	}

	// TODO: file name + type dialog
	canvas.toBlob(function(blob){
		sanity_check_blob(blob, function(){
			var file_saver = saveAs(blob, file_name.replace(/\.(bmp|dib|a?png|gif|jpe?g|jpe|jfif|tiff?|webp|raw)$/, "") + ".png");
			file_saver.onwriteend = function(){
				// this won't fire in chrome
				savedCallbackUnreliable();
			};
		});
	});
}

function set_as_wallpaper_tiled(c){
	c = c || canvas;

	// Note: we can't just poke in a different set_as_wallpaper_tiled function, because it's stored by reference in menus.js
	if(window.systemSetAsWallpaperTiled){
		return window.systemSetAsWallpaperTiled(c);
	}

	var wallpaperCanvas = new Canvas(screen.width, screen.height);
	var pattern = wallpaperCanvas.ctx.createPattern(c, "repeat");
	wallpaperCanvas.ctx.fillStyle = pattern;
	wallpaperCanvas.ctx.fillRect(0, 0, wallpaperCanvas.width, wallpaperCanvas.height);

	set_as_wallpaper_centered(wallpaperCanvas);
}

function set_as_wallpaper_centered(c){
	c = c || canvas;
	
	// Note: we can't just poke in a different set_as_wallpaper_centered function, because it's stored by reference in menus.js
	if(window.systemSetAsWallpaperCentered){
		return window.systemSetAsWallpaperCentered(c);
	}

	c.toBlob(function(blob){
		sanity_check_blob(blob, function(){
			saveAs(blob, file_name.replace(/\.(bmp|dib|a?png|gif|jpe?g|jpe|jfif|tiff?|webp|raw)$/, "") + " wallpaper.png");
		});
	});
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
			sanity_check_blob(blob, function(){
				file_reader.readAsArrayBuffer(blob);
			});
		});
	});
}

function save_selection_to_file(){
	if(selection && selection.canvas){
		selection.canvas.toBlob(function(blob){
			sanity_check_blob(blob, function(){
				saveAs(blob, "selection.png");
			});
		});
	}
}

function sanity_check_blob(blob, okay_callback){
	if(blob.size > 0){
		okay_callback();
	}else{
		var $w = $FormWindow().title("Warning").addClass("dialogue-window");
		$w.$main.html(
			"<p>Tried to save file, but file was empty.</p>" +
			"<p>Try again, or if the problem persists, report here: " +
			"<a href='https://github.com/1j01/jspaint/issues/118'>Issue #118</a>"
		);
		$w.$main.css({maxWidth: "500px"});
		$w.$Button("OK", function(){
			$w.close();
		});
		$w.center();
	}
}

function blob_to_buffer(blob, callback) {
	const file_reader = new FileReader()

	file_reader.addEventListener("loadend", event => {
		if (file_reader.error) {
			callback(file_reader.error)
		} else {
			callback(null, new Buffer(file_reader.result))
		}
	}, false)

	// Read the blob as a typed array.
	file_reader.readAsArrayBuffer(blob)

	return file_reader
}
