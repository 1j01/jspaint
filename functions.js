
function reset_colors(){
	colors = ["black", "white", ""];
	$colorbox && $colorbox.update_colors();
}

function reset(){
	undos = [];
	redos = [];
	reset_colors();
	
	file_name = "untitled";
	update_title();
	
	canvas.width = default_width;
	canvas.height = default_height;
	
	ctx.fillStyle = colors[1];
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function update_title(){
	document.title = file_name + " - Paint";
}

function open_from_Image(img, new_file_name){
	are_you_sure(function(){
		undos = [];
		redos = [];
		reset_colors();
		
		file_name = new_file_name;
		update_title();
		
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);
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
		var $input = $(E("input")).attr({type:"file"})
			.on("change", function(){
				open_from_FileList(this.files);
				$input.remove();
			})
			.appendTo("body")
			.hide()
			.click();
	}
}

function file_save(){
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
	}else{
		action();
	}
}

function render_history_as_gif(){
	var $win = $Window();
	$win.title("Rendering GIF");
	var $output = $win.$content;
	
	var gif = new GIF({
		workers: Math.min(5, Math.floor(undos.length/50)+1),
		workerScript: 'lib/gif.js/gif.worker.js',
		width: canvas.width,
		height: canvas.height,
	});
	
	gif.on('progress', function(p){
		$output.text(~~(p*100)+'%');
	});
	
	gif.on('finished', function(blob){
		$win.title("Rendered GIF");
		var url = URL.createObjectURL(blob);
		$output.empty().append(
			$(E("a")).attr({href: url, target: "_blank"}).append(
				$(E("img")).attr({src: url})
			).on("click", function(e){
				$win.close();
				if(window.chrome && chrome.fileSystem && chrome.fileSystem.chooseEntry){
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

function undoable(){
	if(redos.length > 5){
		var $w = new $Window();
		$w.title("Paint");
		$w.$content.html("Discard "+redos.length+" possible redo-able actions?<br>(Ctrl+Y to redo)<br>");
		$w.$Button("Discard", function(){
			$w.close();
			redos = [];
		});
		$w.$Button("Keep", function(){
			$w.close();
		});
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
	
	return true;
}
function undo(){
	if(undos.length<1) return false;
	
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
	$canvas_handles.trigger("update");
	
	return true;
}
function redo(){
	if(redos.length<1) return false;
	
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
	$canvas_handles.trigger("update");
	
	return true;
}
function cancel(){
	if(!selected_tool.passive) undo();
	$G.triggerHandler("mouseup", "cancel");
}
function deselect(){
	if(selection){
		selection.draw();
		selection.destroy();
		selection = null;
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

function invert(){
	if(undoable()){
		var id = ctx.getImageData(0, 0, canvas.width, canvas.height);
		for(var i=0; i<id.data.length; i+=4){
			id.data[i+0] = 255 - id.data[i+0];
			id.data[i+1] = 255 - id.data[i+1];
			id.data[i+2] = 255 - id.data[i+2];
		}
		ctx.putImageData(id, 0, 0);
	}
}


function $Handle(y_axis, x_axis){
	var $h = $(E("div")).addClass("jspaint-handle");
	$h.appendTo($canvas_area);
	
	var resizes_height = x_axis !== "left" && y_axis === "bottom";
	var resizes_width = x_axis === "right" && y_axis !== "top";
	var width = default_width;
	var height = default_height;
	var dragged = false;
	if(!(resizes_width || resizes_height)){
		$h.addClass("jspaint-useless-handle");
	}else{
		var cursor;
		if(resizes_width && resizes_height){
			cursor = "nwse-resize";
		}else if(resizes_width){
			cursor = "ew-resize";
		}else if(resizes_height){
			cursor = "ns-resize";
		}
		if(cursor){
			cursor = Cursor([cursor, [16, 16], cursor]);
		}
		$h.css({cursor:cursor});
		
		var mousemove = function(e){
			$resize_ghost.appendTo("body");
			dragged = true;
			
			var rect = canvas.getBoundingClientRect();
			$resize_ghost.css({
				position: "relative",
				left: 0,
				top: 0,
				width: width = (resizes_width? (e.clientX - rect.left) : (rect.width)),
				height: height = (resizes_height? (e.clientY - rect.top) : (rect.height)),
			});
		};
		$h.on("mousedown", function(e){
			dragged = false;
			if(e.button === 0){
				$G.on("mousemove", mousemove);
				$body.css({cursor:cursor});
				$canvas.css({pointerEvents:"none"});
			}
			$G.one("mouseup", function(e){
				$G.off("mousemove", mousemove);
				$body.css({cursor:"auto"});
				$canvas.css({pointerEvents:""});
				
				$resize_ghost.remove();
				if(dragged){
					if(undoable()){
						canvas.width = Math.max(1, width);
						canvas.height = Math.max(1, height);
						ctx.fillStyle = colors[1];
						ctx.fillRect(0, 0, width, height);
						
						var previous_canvas = undos[undos.length-1];
						if(previous_canvas){
							ctx.drawImage(previous_canvas, 0, 0);
						}
					}
				}
				$canvas_handles.trigger("update");
			});
		});
	}
	$h.on("update", function(){
		var rect = canvas.getBoundingClientRect();
		var hs = $h.width();
		if(x_axis === "middle"){
			$h.css({ left: (rect.width + hs) / 2 });
		}else if(x_axis === "left"){
			$h.css({ left: 0 });
		}else if(x_axis === "right"){
			$h.css({ left: rect.width + hs });
		}
		if(y_axis === "middle"){
			$h.css({ top: (rect.height + hs) / 2 });
		}else if(y_axis === "top"){
			$h.css({ top: 0 });
		}else if(y_axis === "bottom"){
			$h.css({ top: rect.height + hs });
		}
	});
}
