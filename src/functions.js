
function reset_colors(){
	colors = ["#000000", "#ffffff", ""];
	$colorbox && $colorbox.update_colors();
}

function reset(){
	this_ones_a_frame_changer();
	
	undos = [];
	redos = [];
	reset_colors();
	
	file_entry = null;
	file_name = "untitled";
	update_title();
	
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

function open_from_Image(img, new_file_name){
	are_you_sure(function(){
		this_ones_a_frame_changer();
		
		undos = [];
		redos = [];
		reset_colors();
		
		file_name = new_file_name;
		update_title();
		
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);
		
		$canvas_area.trigger("resize");
	});
}
function open_from_URI(uri, new_file_name){
	var img = new Image();
	img.onload = function(){
		open_from_Image(img, new_file_name);
	};
	img.src = uri;
}
function open_from_File(file){
	var reader = new FileReader();
	reader.onload = function(e){
		open_from_URI(e.target.result, file.name);
	};
	reader.readAsDataURL(file);
}
function open_from_FileList(files){
	$.each(files, function(i, file){
		if(file.type.match(/image/)){
			open_from_File(file);
			return false;
		}
	});
}
function open_from_FileEntry(entry){
	entry.file(open_from_File);
}
function save_to_FileEntry(entry){
	entry.createWriter(function(file_writer){
		file_writer.onwriteend = function(e){
			if(this.error){
				console.error(this.error + '\n\n\n@ ' + e);
			}else{
				console.log("File written!");
			}
		};
		canvas.toBlob(function(blob){
			file_writer.write(blob);
		});
	});
}

function file_new(){
	are_you_sure(reset);
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
	}
}


function are_you_sure(action){
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
	// @TODO: select the selection tool
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
			//additional undo
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
		// note: selecting a tool calls deselect();
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
	
	$win.on('close', function(){
		gif.abort();
	});
	
	$win.$Button('Cancel');
	
	var gif = new GIF({
		//workers: Math.min(5, Math.floor(undos.length/50)+1),
		workerScript: 'lib/gif.js/gif.worker.js',
		width: canvas.width,
		height: canvas.height,
	});
	
	gif.on('progress', function(p){
		$progress.val(p);
	});
	
	gif.on('finished', function(blob){
		$win.title("Rendered GIF");
		var url = URL.createObjectURL(blob);
		$output.empty().append(
			$(E("a")).attr({href: url, target: "_blank"}).append(
				$(E("img")).on("load", function(){
					$win.center();
				}).attr({src: url})
			).on("click", function(e){
				$win.close();
				if(window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry){
					e.preventDefault();
					chrome.fileSystem.chooseEntry({
						type: 'saveFile',
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
	gif.addFrame(canvas, {delay: 200, copy: true});
	gif.render();
}

function undoable(callback, action){
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
	
	var c = document.createElement("canvas");
	c.width = canvas.width;
	c.height = canvas.height;
	var x = c.getContext("2d");
	x.drawImage(canvas, 0, 0);
	
	undos.push(c);
	
	action && action();
	callback && callback();
	return true;
}
function undo(){
	if(undos.length<1) return false;
	this_ones_a_frame_changer();
	
	var c = document.createElement("canvas");
	c.width = canvas.width;
	c.height = canvas.height;
	var x = c.getContext("2d");
	x.drawImage(canvas, 0, 0);
	
	redos.push(c);
	
	c = undos.pop();
	canvas.width = c.width;
	canvas.height = c.height;
	ctx.drawImage(c, 0, 0);
	
	$canvas_area.trigger("resize");
	
	return true;
}
function redo(){
	if(redos.length<1) return false;
	this_ones_a_frame_changer();
	
	var c = document.createElement("canvas");
	c.width = canvas.width;
	c.height = canvas.height;
	var x = c.getContext("2d");
	x.drawImage(canvas, 0, 0);
	
	undos.push(c);
	
	c = redos.pop();
	canvas.width = c.width;
	canvas.height = c.height;
	ctx.drawImage(c, 0, 0);
	
	$canvas_area.trigger("resize");
	
	return true;
}
function cancel(){
	if(!selected_tool.passive) undo();
	$G.triggerHandler("mouseup", "cancel");
}
function this_ones_a_frame_changer(){
	deselect();
	$G.triggerHandler("mouseup", "cancel");
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
	selected_tool.end && selected_tool.end();
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

function invert(){
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
	canvas.requestFullscreen && canvas.requestFullscreen();
	canvas.webkitRequestFullscreen && canvas.webkitRequestFullscreen();
}

function select_tool(name){
	previous_tool = selected_tool;
	for(var i=0; i<tools.length; i++){
		if(tools[i].name == name){
			selected_tool = tools[i];
		}
	}
	$toolbox && $toolbox.update_selected_tool();
}

