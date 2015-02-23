
function set_magnification(scale){
	magnification = scale;
	$canvas.css("zoom", scale);
	$G.triggerHandler("resize");
}

function reset_magnification(){
	set_magnification(1);
}

function reset_colors(){
	colors = ["#000000", "#ffffff", ""];
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
	
	ctx.fillStyle = colors[1];
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	$canvas_area.trigger("resize");
}

function update_title(){
	document.title = file_name + " - Paint";
}

function get_FileList(callback){
	var $input = $(E("input")).attr({type: "file"})
		.on("change", function(){
			callback(this.files);
			$input.remove();
		})
		.appendTo("body")
		.hide()
		.click();
}

function open_from_Image(img, callback){
	are_you_sure(function(){
		this_ones_a_frame_changer();
		
		reset_file();
		reset_colors();
		reset_canvas(); // (with newly reset colors)
		reset_magnification();
		
		ctx.copy(img);
		detect_transparency();
		$canvas_area.trigger("resize");
		
		callback && callback();
	});
}
function open_from_URI(uri, callback){
	var img = new Image();
	img.onload = function(){
		open_from_Image(img, callback);
	};
	img.src = uri;
}
function open_from_File(file, callback){
	// @TODO: use URL.createObjectURL(file) when available
	// use URL.revokeObjectURL() too
	var reader = new FileReader();
	reader.onload = function(e){
		open_from_URI(e.target.result, function(){
			file_name = file.name;
			update_title();
			saved = true;
			callback && callback();
		});
	};
	reader.readAsDataURL(file);
}
function open_from_FileList(files, callback){
	$.each(files, function(i, file){
		if(file.type.match(/image/)){
			open_from_File(file, callback);
			return false;
		}
	});
}
function open_from_FileEntry(entry, callback){
	entry.file(function(file){
		open_from_File(file, function(){
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
			open_from_FileEntry(entry);
		});
	}else{
		get_FileList(open_from_FileList);
	}
}

function file_save(){
	if(file_name.match(/\.svg$/)){
		file_name += ".png";
		//update_title()?
		return file_save_as();
	}
	if(window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry){
		if(window.file_entry){
			save_to_FileEntry(file_entry);
		}else{
			file_save_as();
		}
	}else{
		window.open(canvas.toDataURL());
		//saved = true;
	}
}

function file_save_as(){
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
		window.open(canvas.toDataURL());
		//saved = true;
	}
}


function are_you_sure(action){
	// @TODO: if you're in a session, you can be pretty sure
	console.log(saved);
	if(saved){
		action();
		return;
	}
	if(undos.length || redos.length){
		var $w = new $Window();
		$w.title("Paint");
		$w.$content.text("Save changes to "+file_name+"?");
		$w.$Button("Save", function(){
			$w.close();
			file_save();
			action();
		});
		$w.$Button("Discard", function(){
			$w.close();
			action();
		});
		$w.$Button("Cancel", function(){
			$w.close();
		});
		$w.center();
	}else{
		action();
	}
}

function paste_file(blob){
	var reader = new FileReader();
	reader.onload = function(e){
		var img = new Image();
		img.onload = function(){
			paste(img);
		};
		img.src = e.target.result;
	};
	reader.readAsDataURL(blob);
}

function paste_from(){
	get_FileList(function(files){
		$.each(files, function(i, file){
			if(file.type.match(/image/)){
				paste_file(file);
				return false;
			}
		});
	});
}

function paste(img){
	
	if(img.width > canvas.width || img.height > canvas.height){
		var $w = new $Window();
		$w.title("Paint");
		$w.$content.html(
			"The image is bigger than the canvas.<br>" +
			"Would you like the canvas to be enlarged?<br>"
		);
		$w.$Button("Enlarge", function(){
			// Additional undoable
			undoable(function(){
				var original = undos[undos.length-1];
				canvas.width = Math.max(original.width, img.width);
				canvas.height = Math.max(original.height, img.height);
				if(!transparency){
					ctx.fillStyle = colors[1];
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}
				ctx.drawImage(original, 0, 0);
				paste_img();
				$canvas_area.trigger("resize");
			});
		});
		$w.$Button("Crop", function(){
			paste_img();
		});
		$w.$Button("Cancel", function(){});
		$w.center();
	}else{
		paste_img();
	}
	
	function paste_img(){
		// Note: selecting a tool calls deselect();
		select_tool("Select");
		
		selection = new Selection(0, 0, img.width, img.height);
		selection.instantiate(img);
	}
}

function render_history_as_gif(){
	var $win = $Window();
	$win.title("Rendering GIF");
	$win.center();
	var $output = $win.$content;
	var $progress = $(E("progress")).appendTo($output);
	var $progress_percent = $(E("span")).appendTo($output).css({
		width: "2.3em",
		display: "inline-block",
		textAlign: "center",
	});
	
	$win.$Button('Cancel');
	
	$win.on('close', function(){
		gif.abort();
	});
	
	try{
		var gif = new GIF({
			//workers: Math.min(5, Math.floor(undos.length/50)+1),
			workerScript: 'lib/gif.js/gif.worker.js',
			width: canvas.width,
			height: canvas.height,
		});
	
		gif.on('progress', function(p){
			$progress.val(p);
			$progress_percent.text(~~(p*100)+"%");
		});
	
		gif.on('finished', function(blob){
			$win.title("Rendered GIF");
			var url = URL.createObjectURL(blob);
			$output.empty().append(
				$(E("a")).attr({
					href: url,
					target: "_blank",
				}).append(
					$(E("img")).on("load", function(){
						$win.center();
					}).attr({
						src: url,
					})
				).on("click", function(e){
					$win.close();
					if(window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry){
						e.preventDefault();
						chrome.fileSystem.chooseEntry({
							type: "saveFile",
							suggestedName: file_name+" history",
							accepts: [{mimeTypes: ["image/gif"]}]
						}, function(entry){
							if(chrome.runtime.lastError){
								return console.error(chrome.runtime.lastError.message);
							}
							entry.createWriter(function(file_writer){
								file_writer.onwriteend = function(e){
									if(this.error){
										console.error(this.error + '\n\n\n@ ' + e);
									}else{
										console.log("File written!");
									}
								};
								file_writer.write(blob);
							});
						});
					}
				})
			);
		});
	
		for(var i=0; i<undos.length; i++){
			gif.addFrame(undos[i], {delay: 200});
		}
		gif.addFrame(canvas, {
			delay: 200,
			copy: true,
		});
		gif.render();
		
	}catch(e){
		$output.empty().append(
			$(E("p")).text("Failed to render GIF:\n").append(
				$(E("pre")).text(e.stack).css({
					background: "#A00",
					color: "white",
					fontFamily: "monospace",
					width: "500px",
					overflow: "auto",
				})
			)
		);
		$win.title("Error Rendering GIF");
		$win.center();
		console.error("Failed to render GIF:\n", e);
	}
}

function undoable(callback, action){
	saved = false;
	if(redos.length > 5){
		var $w = new $Window();
		$w.title("Paint");
		$w.$content.html("Discard "+redos.length+" possible redo-able actions?<br>(Ctrl+Y or Ctrl+Shift+Z to redo)<br>");
		$w.$Button(action ? "Discard and Apply" : "Discard", function(){
			$w.close();
			redos = [];
			action && action();
		});
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
	$G.triggerHandler("mouseup", "cancel");
}
function this_ones_a_frame_changer(){
	deselect();
	saved = false;
	$G.triggerHandler("mouseup", "cancel");
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
	deselect();
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
			ctx.fillStyle = colors[1];
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
	});
}

function view_bitmap(){
	if(canvas.requestFullscreen){ canvas.requestFullscreen(); }
	if(canvas.webkitRequestFullscreen){ canvas.webkitRequestFullscreen(); }
}

function select_tool(name){
	previous_tool = selected_tool;
	for(var i=0; i<tools.length; i++){
		if(tools[i].name == name){
			selected_tool = tools[i];
		}
	}
	if($toolbox){
		$toolbox.update_selected_tool();
	}
}

function detect_transparency(){
	transparency = false;
	
	// @TODO Optimization: Assume JPEGs and some other file types are opaque.
	// Raster file formats that SUPPORT transparency include GIF, PNG, BMP and TIFF
	// (Yes, even BMPs support transparency!)
	
	var id = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for(var i=0, l=id.data.length; i<l; i+=4){
		if(id.data[i+3] < 255){
			transparency = true;
		}
	}
}

function image_attributes(){
	if(image_attributes.$window){
		image_attributes.$window.close();
	}
	var $w = image_attributes.$window = new $FormWindow("Attributes");
	
	var $form_left = $w.$form_left;
	var $form_right = $w.$form_right;
	
	// Information
	
	var table = {
		"File last saved": "Not available",
		"Size on disk": "Not available",
		"Resolution": "72 x 72 dots per inch",
	};
	var $table = $(E("table")).appendTo($form_left);
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
	
	var $width_label = $(E("label")).appendTo($form_left).text("Width:");
	var $height_label = $(E("label")).appendTo($form_left).text("Height:");
	var $width = $(E("input")).appendTo($width_label);
	var $height = $(E("input")).appendTo($height_label);
	
	$form_left.find("input")
		.css({width: "40px"})
		.on("change keyup keydown keypress mousedown mousemove paste drop", function(){
			if($(this).is($width)){
				width_in_px = $width.val() * unit_sizes_in_px[current_unit];
			}
			if($(this).is($height)){
				height_in_px = $height.val() * unit_sizes_in_px[current_unit];
			}
		});
	
	// Fieldsets
	
	var $units = $(E("fieldset")).appendTo($form_left).append('<legend>Transparency</legend>');
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
	
	var $transparency = $(E("fieldset")).appendTo($form_left).append('<legend>Transparency</legend>');
	$transparency.append('<label><input type="radio" name="transparency" value="transparent">Transparent</label>');
	$transparency.append('<label><input type="radio" name="transparency" value="opaque">Opaque</label>');
	$transparency.find("[value=" + (transparency ? "transparent" : "opaque") + "]").attr({checked: true});
	
	// Buttons on the right
	
	$w.$Button("Okay", function(){
		var to = $transparency.find(":checked").val();
		var unit = $units.find(":checked").val();
		
		image_attributes.unit = unit;
		transparency = (to == "transparent");
		
		var unit_to_px = unit_sizes_in_px[unit];
		var width = $width.val() * unit_to_px;
		var height = $height.val() * unit_to_px;
		$canvas.trigger("user-resized", [0, 0, ~~width, ~~height]);
		
		image_attributes.$window.close();
	});
	
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
	
	var $fieldset = $(E("fieldset")).appendTo($w.$form_left);
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
	// @TODO: enable all controls that are accessable to the mouse
	
	$fieldset.find("label").css({display: "block"});
	
	$w.$Button("Okay", function(){
		var action = $fieldset.find("input[name='flip-or-rotate']:checked").val();
		var angle_val = $fieldset.find("input[name='rotate-by-angle']:checked").val();
		if(angle_val === "arbitrary"){
			angle_val = $fieldset.find("input[name='rotate-by-arbitrary-angle']").val();
		}
		var angle_deg = parseFloat(angle_val);
		var angle = angle_deg / 360 * TAU;
		
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
		
		$w.close();
	});
	$w.$Button("Cancel", function(){
		$w.close();
	});
	
	$w.center();
}

function image_stretch_and_skew(){
	var $w = new $FormWindow("Stretch and Skew");
	
	var $fieldset_stretch = $(E("fieldset")).appendTo($w.$form_left);
	$fieldset_stretch.append("<legend>Stretch</legend><table></table>");
	var $fieldset_skew = $(E("fieldset")).appendTo($w.$form_left);
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
		$w.close();
	});
	$w.$Button("Cancel", function(){
		$w.close();
	});
	
	$w.center();
}

function set_as_wallpaper_tiled(c){
	c = c || canvas;
	
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
	
	if(window.chrome && chrome.wallpaper){
		chrome.wallpaper.setWallpaper({
			url: c.toDataURL(),
			layout: 'CENTER_CROPPED',
			name: file_name,
		}, function(){});
	}else{
		window.open(c.toDataURL());
	}
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
					return console.error(chrome.runtime.lastError.message);
				}
				entry.createWriter(function(file_writer){
					file_writer.onwriteend = function(e){
						if(this.error){
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
			window.open(selection.canvas.toDataURL());
		}
	}
}
