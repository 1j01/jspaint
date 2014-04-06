
var app = {};
var TAU =     //////|//////
          /////     |     /////
       ///         tau         ///     Tau is the circumference divided by the radius.
     ///     ...--> | <--...     ///
   ///     -'   one | turn  '-     ///    One whole turn in radians.
  //     .'         |         '.     //
 //     /           |           \     //
//     |            | <-..       |     //
//    |          .->|     \       |    //
//    |         /   |      |      |    //    Pi is half a turn, as shown in this diagram.
- - - - - - Math.PI + Math.PI - - - - - 0
//    |         \   |      |      |    //
//    |          '->|     /       |    //
//     |            | <-''       |     //
 //     \           |           /     //
  //     '.         |         .'     //
   ///     -.       |       .-     ///
     ///     '''----|----'''     ///
       ///          |          ///
         //////     |     /////
              //////|//////

app.open = function(){
	
	var stroke_width = 1;
	var stroke_color;
	var fill_color;
	var stroke_color_i = 0;
	var fill_color_i = 0;
	
	var brush_image = new Image();
	brush_image.src = "images/scroll-left.png";
	var brush_canvas = $("<canvas>")[0];
	var brush_ctx = brush_canvas.getContext("2d");
	var brush_rendered_color;
	
	var $tool_options_area = $();
	
	var tools = [{
		name: "Free-Form Select",
		description: "Selects a free-form part of the picture to move, copy, or edit.",
		cursor: ["precise", [16, 16], "crosshair"],
		passive: true,
		implemented: false,
	},{
		name: "Select",
		description: "Selects a rectangular part of the picture to move, copy, or edit.",
		cursor: ["precise", [16, 16], "crosshair"],
		passive: true,
		implemented: "kinda",
		mousedown: function(){
			if(selection){
				selection.destroy();
			}
			var mouse_has_moved = false;
			$(window).one("mousemove", function(){
				mouse_has_moved = true;
			});
			$(window).one("mouseup", function(){
				if(!mouse_has_moved){
					selection && selection.destroy();
				}
			});
			var s = selection = new Selection(mouse.x, mouse.y, 1, 1);
			$canvas.one("mousedown", function(){
				if(selection === s){
					selection.destroy();
					selection = null;
				}
			});
		},
		paint: function(){
			if(!selection){return;}
			selection.w = selection.x - mouse.x;
			selection.h = selection.y - mouse.y;
			var x1 = Math.max(0, Math.min(selection.x, mouse.x));
			var y1 = Math.max(0, Math.min(selection.y, mouse.y));
			var x2 = Math.min(canvas.width, Math.max(selection.x, mouse.x));
			var y2 = Math.min(canvas.height, Math.max(selection.y, mouse.y));
			selection._x = x1;
			selection._y = y1;
			selection._w = Math.max(1, x2 - x1);
			selection._h = Math.max(1, y2 - y1);
			selection.position();
		},
		mouseup: function(){
			if(!selection){return;}
			
			selection.instantiate();
			if(ctrl){
				selection.crop();
				deselect();
			}
		},
		cancel: function(){
			if(!selection){return;}
			selection.destroy();
			selection = null;
		},
	},{
		name: "Eraser/Color Eraser",
		description: "Erases a portion of the picture, using the selected eraser shape.",
		continuous: "space",
		cursor: ["precise", [16, 16], "crosshair"],//@todo: draw square on canvas
		implemented: "partially",
		paint: function(ctx, x, y){
			ctx.fillStyle = colors[1];
			ctx.fillRect(x-4, y-4, 8, 8);
		}
	},{
		name: "Fill With Color",
		description: "Fills an area with the selected drawing color.",
		cursor: ["fill-bucket", [8, 22], "crosshair"],
		mousedown: function(ctx, x, y){
			var _c = document.createElement("canvas");
			_c.width = _c.height = 1;
			var _ctx = _c.getContext("2d");
			_ctx.fillStyle = fill_color;
			_ctx.fillRect(0,0,1,1);
			var _id = _ctx.getImageData(0,0,1,1);
			var fill_r = _id.data[0];
			var fill_g = _id.data[1];
			var fill_b = _id.data[2];
			
			var stack = [[x, y]];
			var c_width = canvas.width;
			var c_height = canvas.height;
			var id = ctx.getImageData(0,0,c_width,c_height);
			pixel_pos = (y*c_width + x) * 4;
			var start_r = id.data[pixel_pos+0];
			var start_g = id.data[pixel_pos+1];
			var start_b = id.data[pixel_pos+2];
			if(fill_r === start_r
			&& fill_g === start_g
			&& fill_b === start_b){
				return;
			}
			while(stack.length){
				var new_pos, x, y, pixel_pos, reach_left, reach_right;
				new_pos = stack.pop();
				x = new_pos[0];
				y = new_pos[1];

				pixel_pos = (y*c_width + x) * 4;
				while(match_start_color(pixel_pos)){
					pixel_pos -= c_width * 4, y--;
				}
				pixel_pos += c_width * 4, y++;
				reach_left = false;
				reach_right = false;
				while(y++ < c_height && match_start_color(pixel_pos)){
					color_pixel(pixel_pos);

					if(x > 0){
						if(match_start_color(pixel_pos - 4)){
							if(!reach_left){
								stack.push([x - 1, y]);
								reach_left = true;
							}
						}else if(reach_left){
							reach_left = false;
						}
					}

					if(x < c_width-1){
						if(match_start_color(pixel_pos + 4)){
							if(!reach_right){
								stack.push([x + 1, y]);
								reach_right = true;
							}
						}else if(reach_right){
							reach_right = false;
						}
					}

					pixel_pos += c_width * 4;
				}
			}
			ctx.putImageData(id, 0, 0);

			function match_start_color(pixel_pos){
				return (id.data[pixel_pos+0] === start_r
				     && id.data[pixel_pos+1] === start_g
				     && id.data[pixel_pos+2] === start_b);
			}

			function color_pixel(pixel_pos){
				id.data[pixel_pos+0] = fill_r;
				id.data[pixel_pos+1] = fill_g;
				id.data[pixel_pos+2] = fill_b;
				id.data[pixel_pos+3] = 255;
			}
		}
	},{
		name: "Pick Color",
		description: "Picks up a color from the picture for drawing.",
		cursor: ["eye-dropper", [9, 22], "crosshair"],
		deselect: true,
		passive: true,
		
		current_color: "",
		display_current_color: function(){
			$tool_options_area.css({
				background: this.current_color
			});
		},
		mousedown: function(){
			$(window).one("mouseup",function(){
				$tool_options_area.css({
					background: ""
				});
			});
		},
		paint: function(ctx, x, y){
			if(x >= 0 && y >= 0 && x < canvas.width && y < canvas.height){
				var id = ctx.getImageData(x|0, y|0, 1, 1);
				var r = id.data[0];
				var g = id.data[1];
				var b = id.data[2];
				var a = id.data[3];
				this.current_color = "rgba("+r+","+g+","+b+","+a/255+")";
			}else{
				this.current_color = "white";
			}
			this.display_current_color();
		},
		mouseup: function(){
			colors[fill_color_i] = this.current_color;
			$colorbox && $colorbox.update_colors();
		}
	},{
		name: "Magnifier",
		description: "Changes the magnification.",
		cursor: ["magnifier", [16, 16], "zoom-in"],//@todo: use zoom-in/zoom-out
		deselect: true,
		passive: true,
		implemented: false,
	},{
		name: "Pencil",
		description: "Draws a free-form line one pixel wide.",
		cursor: ["pencil", [13, 23], "crosshair"],
		continuous: "space",
		paint: function(ctx, x, y){
			ctx.fillRect(x, y, 1, 1);
		}
	},{
		name: "Brush",
		description: "Draws using a brush with the selected shape and size.",
		cursor: ["precise-dotted", [16, 16], "crosshair"],
		continuous: "space",
		paint: function(ctx, x, y){
			var sz = 16;
			if(brush_rendered_color !== stroke_color){
				brush_canvas.width = sz;
				brush_canvas.height = sz;
				brush_ctx.clearRect(0,0,sz,sz);
				brush_ctx.drawImage(brush_image,sz/2-brush_image.width/2,sz/2-brush_image.height/2);
				brush_ctx.globalCompositeOperation = "source-atop";
				brush_ctx.fillStyle = stroke_color;
				brush_ctx.fillRect(0,0,sz,sz);
				brush_ctx.globalCompositeOperation = "source-over";
				
				brush_rendered_color = stroke_color;
			}
			ctx.drawImage(brush_canvas, x-sz/2, y-sz/2);
		}
	},{
		name: "Airbrush",
		description: "Draws using an airbrush of the selected size.",
		cursor: ["airbrush", [7, 22], "crosshair"],
		continuous: "time",
		paint: function(ctx, x, y){
			var radius = 15;//@todo: options
			var sqr = radius * radius;
			for(var i=0; i<100; i++){
				var rx = (Math.random()*2-1)*radius;
				var ry = (Math.random()*2-1)*radius;
				var d = rx*rx + ry*ry;
				if(d <= radius){
					ctx.fillRect(x+rx|0, y+ry|0, 1, 1);
				}
			}
		}
	},{
		name: "Text",
		description: "Inserts text into the picture.",
		cursor: ["precise", [16, 16], "crosshair"],
		implemented: false,
	},{
		name: "Line",
		description: "Draws a straight line with the selected line width.",
		cursor: ["precise", [16, 16], "crosshair"],
		stroke_only: true,
		shape: function(ctx, x, y, w, h){
			line(ctx, x, y, x+w, y+h);
		}
	},{
		name: "Curve",
		description: "Draws a curved line with the selected line width.",
		cursor: ["precise", [16, 16], "crosshair"],
		implemented: false,
	},{
		name: "Rectangle",
		description: "Draws a rectangle with the selected fill style.",
		cursor: ["precise", [16, 16], "crosshair"],
		shape: function(ctx, x, y, w, h){
			ctx.beginPath();
			ctx.rect(x-0.5, y-0.5, w, h);
			ctx.fill();
			ctx.stroke();
		}
	},{
		name: "Polygon",
		description: "Draws a polygon with the selected fill style.",
		cursor: ["precise", [16, 16], "crosshair"],
		implemented: false,
	},{
		name: "Ellipse",
		description: "Draws an ellipse with the selected fill style.",
		cursor: ["precise", [16, 16], "crosshair"],
		shape: function(ctx, x, y, w, h){
			var r1 = Math.round;
			var r2 = Math.round;
			
			var cx = x + w/2;
			var cy = y + h/2;
			ctx.fillStyle = stroke_color;
			for(var r=0; r<TAU; r+=0.01){
				var rx = Math.cos(r) * w/2;
				var ry = Math.sin(r) * h/2;
				
				var rect_x = r1(cx+rx);
				var rect_y = r1(cy+ry);
				var rect_w = r2(-rx*2);
				var rect_h = r2(-ry*2);
				
				ctx.fillRect(rect_x+1, rect_y, rect_w, rect_h);
				ctx.fillRect(rect_x, rect_y+1, rect_w, rect_h);
				ctx.fillRect(rect_x-1, rect_y, rect_w, rect_h);
				ctx.fillRect(rect_x, rect_y-1, rect_w, rect_h);
			}
			ctx.fillStyle = fill_color;
			for(var r=0; r<TAU; r+=0.01){
				var rx = Math.cos(r) * w/2;
				var ry = Math.sin(r) * h/2;
				ctx.fillRect(
					r1(cx+rx),
					r1(cy+ry),
					r2(-rx*2),
					r2(-ry*2)
				);
			}
		}
	},{
		name: "Rounded Rectangle",
		description: "Draws a rounded rectangle with the selected fill style.",
		cursor: ["precise", [16, 16], "crosshair"],
		shape: function(ctx, x, y, w, h){
			if(w<0){ x+=w; w=-w; }
			if(h<0){ y+=h; h=-h; }
			var radius = Math.min(7, w/2, h/2);
			
			
			var iw = w-radius*2;
			var ih = h-radius*2;
			var ix = x+radius;
			var iy = y+radius;
			
			var r1 = Math.round;
			var r2 = Math.round;
			
			ctx.fillStyle = stroke_color;
			for(var r=0; r<TAU; r+=0.05){
				var rx = Math.cos(r) * radius;
				var ry = Math.sin(r) * radius;
				
				var rect_x = r1(ix+rx);
				var rect_y = r1(iy+ry);
				var rect_w = r2(iw-rx*2);
				var rect_h = r2(ih-ry*2);
				
				ctx.fillRect(rect_x+1, rect_y, rect_w, rect_h);
				ctx.fillRect(rect_x, rect_y+1, rect_w, rect_h);
				ctx.fillRect(rect_x-1, rect_y, rect_w, rect_h);
				ctx.fillRect(rect_x, rect_y-1, rect_w, rect_h);
			}
			ctx.fillStyle = fill_color;
			for(var r=0; r<TAU; r+=0.05){
				var rx = Math.cos(r) * radius;
				var ry = Math.sin(r) * radius;
				ctx.fillRect(
					r1(ix+rx),
					r1(iy+ry),
					r2(iw-rx*2),
					r2(ih-ry*2)
				);
			}
		}
	}];
	
	var palette = [
		"#000000","#787878","#790300","#757A01","#007902","#007778","#0A0078","#7B0077","#767A38","#003637","#286FFE","#083178","#4C00FE","#783B00",
		"#FFFFFF","#BBBBBB","#FF0E00","#FAFF08","#00FF0B","#00FEFF","#3400FE","#FF00FE","#FBFF7A","#00FF7B","#76FEFF","#8270FE","#FF0677","#FF7D36",
	];
	
	function Selection(x, y, w, h){
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this._x = x;
		this._y = y;
		this._w = w;
		this._h = h;
		
		this.$ghost = $("<div class='jspaint-selection'>").appendTo($canvas_area);
		$canvas_handles.hide();
	}
	Selection.prototype.instantiate = function(_img){
		var sel = this;
		
		sel.$ghost.addClass("instantiated").css({
			cursor: Cursor(["move", [8, 8], "move"])
		});
		sel.position();
		
		if(!undoable()){
			sel.destroy();
			return;
		}
		
		if(_img){
			sel.canvas = _img;
			sel.canvas.width = sel._w;
			sel.canvas.height = sel._h;
		}else{
			sel.canvas = document.createElement("canvas");
			sel.canvas.width = sel._w;
			sel.canvas.height = sel._h;
			sel.ctx = sel.canvas.getContext("2d");
			sel.ctx.drawImage(
				canvas,
				sel._x, sel._y,
				sel._w, sel._h,
				0, 0,
				sel._w, sel._h
			);
			// cut the selection from the canvas
			//@TODO: transparency
			//ctx.globalCompositeOperation = "destination-out";
			//ctx.drawImage()...
			ctx.fillStyle = colors[1];
			ctx.fillRect(
				sel._x, sel._y,
				sel._w, sel._h
			);
		}
		sel.$ghost.append(sel.canvas);
		
		var mox, moy;
		var mousemove = function(e){
			var m = e2c(e);
			sel._x = Math.max(Math.min(m.x - mox, canvas.width), -sel._w);
			sel._y = Math.max(Math.min(m.y - moy, canvas.height), -sel._h);
			sel.position();
			
			if(e.shiftKey){
				ctx.drawImage(sel.canvas, sel._x, sel._y);
			}
		};
		sel.$ghost.on("mousedown", function(e){
			e.preventDefault();
			mox = e.offsetX;
			moy = e.offsetY;
			$(window).on("mousemove", mousemove);
			$(window).one("mouseup", function(){
				$(window).off("mousemove", mousemove);
			});
		});
	};
	Selection.prototype.position = function(){
		this.$ghost.css({
			position: "absolute",
			left: this._x + 3,
			top: this._y + 3,
			width: this._w,
			height: this._h,
		});
	};
	Selection.prototype.destroy = function(){
		if(this.canvas){
			try{ctx.drawImage(this.canvas, this._x, this._y);}catch(e){}
		}
		
		this.$ghost.remove();
		$canvas_handles.show();
	};
	Selection.prototype.crop = function(){
		if(this.canvas && undoable()){
			canvas.width = this.canvas.width;
			canvas.height = this.canvas.height;
			ctx.drawImage(this.canvas, 0, 0);
		}
	}
	
	var selected_tool = tools[6];
	var previous_tool = selected_tool;
	var colors = [];
	
	var default_width = 683;
	var default_height = 384;
	
	
	var $app = $("<div class='jspaint'>").appendTo("body");
	
	var $V = $("<div class='jspaint-vertical'>").appendTo($app);
	var $H = $("<div class='jspaint-horizontal'>").appendTo($V);
	
	var $canvas_area = $("<div class='jspaint-canvas-area'>").appendTo($H);
	var $resize_ghost = $("<div class='jspaint-canvas-resize-ghost'>");
	var $canvas = $("<canvas>").appendTo($canvas_area);
	var canvas = $canvas[0];
	var ctx = canvas.getContext("2d");
	
	var $top = $("<c-area>").prependTo($V);
	var $bottom = $("<c-area>").appendTo($V);
	var $left = $("<c-area>").prependTo($H);
	var $right = $("<c-area>").appendTo($H);
	
	var $toolbox = $ToolBox();
	var $colorbox = $ColorBox();
	
	var selection;//the one and only Selection
	var undos = [];//array of <canvas>
	var redos = [];//array of <canvas>
	var frames = [];//array of {speed:N, undos:[<canvas>], redos:[<canvas>], canvas:<canvas>}
	
	var file_name;
	
	reset();
	
	if(window.file_entry){
		open_from_FileEntry(file_entry);
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
	
	function reset_colors(){
		colors = ["black", "white", ""];
		$colorbox && $colorbox.update_colors();
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
			ctx.drawImage(img,0,0);
		});
	}
	function open_from_File(file){
		var reader = new FileReader();
		reader.onload = function(e){
			var img = new Image();
			img.onload = function(){
				open_from_Image(img, file.name);
			};
			img.src = e.target.result;
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
			var $input = $("<input type=file>")
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
				$("<a>").attr({href: url, target: "_blank"}).append(
					$("<img>").attr({src: url})
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
		x.drawImage(canvas,0,0);
		
		undos.push(c);
		
		return true;
	}
	function undo(){
		if(undos.length<1) return false;
		
		var c = document.createElement("canvas");
		c.width = canvas.width;
		c.height = canvas.height;
		var x = c.getContext("2d");
		x.drawImage(canvas,0,0);
		
		redos.push(c);
		
		c = undos.pop();
		canvas.width = c.width;
		canvas.height = c.height;
		ctx.drawImage(c,0,0);
		$canvas_handles.trigger("update");
		
		return true;
	}
	function redo(){
		if(redos.length<1) return false;
		
		var c = document.createElement("canvas");
		c.width = canvas.width;
		c.height = canvas.height;
		var x = c.getContext("2d");
		x.drawImage(canvas,0,0);
		
		undos.push(c);
		
		c = redos.pop();
		canvas.width = c.width;
		canvas.height = c.height;
		ctx.drawImage(c,0,0);
		$canvas_handles.trigger("update");
		
		return true;
	}
	function cancel(){
		if(!selected_tool.passive) undo();
		$(window).triggerHandler("mouseup", "cancel");
	}
	function deselect(){
		if(selection){
			selection.destroy();
			selection = null;
		}
	}
	
	function invert(){
		if(undoable()){
			var id = ctx.getImageData(0,0,canvas.width,canvas.height);
			for(var i=0; i<id.data.length; i+=4){
				id.data[i+0] = 255 - id.data[i+0];
				id.data[i+1] = 255 - id.data[i+1];
				id.data[i+2] = 255 - id.data[i+2];
			}
			ctx.putImageData(id,0,0);
		}
	}
	
	
	function $Handle(y_axis, x_axis){
		var $h = $("<div>").addClass("jspaint-handle");
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
					$(window).on("mousemove", mousemove);
					$("body").css({cursor:cursor});
					$canvas.css({pointerEvents:"none"});
				}
				$(window).one("mouseup", function(e){
					$(window).off("mousemove", mousemove);
					$("body").css({cursor:"auto"});
					$canvas.css({pointerEvents:""});
					
					$resize_ghost.remove();
					if(dragged){
						if(undoable()){
							canvas.width = Math.max(1, width);
							canvas.height = Math.max(1, height);
							ctx.fillStyle = colors[1];
							ctx.fillRect(0,0,width,height);
							
							var previous_canvas = undos[undos.length-1];
							if(previous_canvas){
								ctx.drawImage(previous_canvas,0,0);
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
	$.each([
		["top", "right"],//↗
		["top", "middle"],//↑
		["top", "left"],//↖
		["middle", "left"],//←
		["bottom", "left"],//↙
		["bottom", "middle"],//↓
		["bottom", "right"],//↘
		["middle", "right"],//→
	],function(i,pos){
		$Handle(pos[0], pos[1]);
	});
	var $canvas_handles = $(".jspaint-handle");
	var update_handles = function(){
		$canvas_handles.trigger("update");
	};
	$(window).on("resize", update_handles);
	$canvas_area.on("scroll", update_handles);
	setTimeout(update_handles, 50);
	
	$("body").on("dragover dragenter", function(e){
		e.preventDefault();
		e.stopPropagation();
	}).on("drop", function(e){
		e.preventDefault();
		e.stopPropagation();
		var dt = e.originalEvent.dataTransfer
		if(dt && dt.files && dt.files.length){
			open_from_FileList(dt.files);
		}
	});
	
	
	$(window).on("keydown",function(e){
		if(e.keyCode === 27){//Escape
			if(selection){
				deselect();
			}else{
				cancel();
			}
		}else if(e.keyCode === 27){//F4
			redo();
		}else if(e.ctrlKey){
			switch(String.fromCharCode(e.keyCode).toUpperCase()){
				case "Z":
					e.shiftKey ? redo() : undo();
				break;
				case "Y":
					redo();
				break;
				case "G":
					render_history_as_gif();
				break;
				case "F":
					//show image fullscreen
					canvas.requestFullscreen && canvas.requestFullscreen();
					canvas.webkitRequestFullscreen && canvas.webkitRequestFullscreen();
				break;
				case "O":
					file_open();
				break;
				case "N":
					file_new();
				break;
				case "S":
					e.shiftKey ? file_save_as() : file_save();
				break;
				case "A":
					//select_all();
				break;
				case "I":
					invert();
				break;
				default: return true;
			}
			e.preventDefault();
			return false;
		}
	});
	$(window).on("cut copy paste", function(e){
		e.preventDefault();
		var cd = e.originalEvent.clipboardData || window.clipboardData;
		if(!cd){ return console.log("No clipboardData"); }
		
		if(e.type === "copy" || e.type === "cut"){
			if(selection && selection.canvas){
				var data = selection.canvas.toDataURL("image/png");
				cd.setData("URL", data);
				cd.setData("image/png", data);
				if(e.type === "cut"){
					selection.destroy();
					selection = null;
				}
			}
		}else if(e.type === "paste"){
			$.each(cd.items, function(i, item){
				if(item.type.match(/image/)){
					var blob = item.getAsFile();
					var reader = new FileReader();
					reader.onload = function(e){
						var img = new Image();
						img.onload = function(){
							if(img.width > canvas.width || img.height > canvas.height){
								var $w = new $Window();
								$w.title("Paint");
								$w.$content.html(
									"The image is bigger than the canvas.<br>"
									+"Would you like the canvas to be enlarged?<br>"
								);
								$w.$Button("Enlarge", function(){
									//additional undo
									if(undoable()){
										//@todo: non-destructive resize
										canvas.width = img.width;
										canvas.height = img.height;
										paste_img();
									}
								});
								$w.$Button("Crop", function(){
									paste_img();
								});
								$w.$Button("Cancel", function(){});
							}else{
								paste_img();
							}
							function paste_img(){
								if(selection){
									selection.destroy();
								}
								selection = new Selection(0, 0, img.width, img.height);
								selection.instantiate(img);
							}
						};
						img.src = e.target.result;
					};
					reader.readAsDataURL(blob);
					return false;
				}
			});
		}
	});
	
	var mouse, mouse_start, mouse_previous;
	var reverse, ctrl, button;
	function e2c(e){
		var rect = canvas.getBoundingClientRect();
		var cx = e.clientX - rect.left;
		var cy = e.clientY - rect.top;
		return {
			x: (cx / rect.width * canvas.width)|0,
			y: (cy / rect.height * canvas.height)|0,
		};
	}
	
	function tool_go(event_name){
		if(selected_tool.shape){
			var previous_canvas = undos[undos.length-1];
			if(previous_canvas){
				ctx.clearRect(0,0,canvas.width,canvas.height);
				ctx.drawImage(previous_canvas,0,0);
			}
			if(reverse ^ selected_tool.stroke_only){
				fill_color_i = 0;
				stroke_color_i = 1;
			}else{
				fill_color_i = 1;
				stroke_color_i = 0;
			}
			ctx.fillStyle = fill_color = colors[fill_color_i];
			ctx.strokeStyle = stroke_color = colors[stroke_color_i];
			
			selected_tool.shape(ctx, mouse_start.x, mouse_start.y, mouse.x-mouse_start.x, mouse.y-mouse_start.y);
		}else{
			ctx.fillStyle = fill_color = 
			ctx.strokeStyle = stroke_color = 
				colors[
					(ctrl && colors[2]) ? 2 :
					(reverse ? 1 : 0)
				];
			
			fill_color_i =
			stroke_color_i =
				ctrl ? 2 : (reverse ? 1 : 0)
		}
		
		if(selected_tool[event_name]){
			selected_tool[event_name](ctx, mouse.x, mouse.y);
		}
		if(selected_tool.paint){
			if(selected_tool.continuous === "space"){
				bresenham(mouse_previous.x, mouse_previous.y, mouse.x, mouse.y, function(x,y){
					selected_tool.paint(ctx, x, y);
				});
			}else{
				selected_tool.paint(ctx, mouse.x, mouse.y);
			}
		}
	}
	function canvas_mouse_move(e){
		ctrl = e.ctrlKey;
		mouse = e2c(e);
		if(e.shiftKey){
			if(selected_tool.name === "Line"){
				var dist = Math.sqrt(
					(mouse.y - mouse_start.y) * (mouse.y - mouse_start.y) +
					(mouse.x - mouse_start.x) * (mouse.x - mouse_start.x)
				);
				var octurn = (TAU / 8);
				var dir08 = Math.atan2(mouse.y - mouse_start.y, mouse.x - mouse_start.x) / octurn;
				var dir = Math.round(dir08) * octurn;
				mouse.x = Math.round(mouse_start.x + Math.cos(dir) * dist);
				mouse.y = Math.round(mouse_start.y + Math.sin(dir) * dist);
			}else if(selected_tool.shape){
				var w = Math.abs(mouse.x - mouse_start.x);
				var h = Math.abs(mouse.y - mouse_start.y);
				if(w < h){
					if(mouse.y > mouse_start.y){
						mouse.y = mouse_start.y + w;
					}else{
						mouse.y = mouse_start.y - w;
					}
				}else{
					if(mouse.x > mouse_start.x){
						mouse.x = mouse_start.x + h;
					}else{
						mouse.x = mouse_start.x - h;
					}
				}
			}
		}
		tool_go();
		mouse_previous = mouse;
	}
	$canvas.on("mousedown", function(e){
		if(e.button === 0){
			reverse = false;
		}else if(e.button === 2){
			reverse = true;
		}else{
			return false;
		}
		if(reverse ? (button === 0) : (button === 2)){
			return cancel();
		}
		button = e.button;
		ctrl = e.ctrlKey;
		mouse_start = mouse_previous = mouse = e2c(e);
		
		if(!selected_tool.passive){
			if(!undoable()) return;
		}
		if(selected_tool.paint || selected_tool.mousedown){
			tool_go("mousedown");
		}
		
		$(window).on("mousemove", canvas_mouse_move);
		if(selected_tool.continuous === "time"){
			var iid = setInterval(function(){
				tool_go();
			},10);
		}
		$(window).one("mouseup", function(e, canceling){
			button = undefined;
			if(selected_tool.mouseup && !canceling){
				selected_tool.mouseup();
			}
			if(selected_tool.cancel && canceling){
				selected_tool.cancel();
			}
			if(selected_tool.deselect){
				selected_tool = previous_tool;
				$toolbox && $toolbox.update_selected_tool();
			}
			$(window).off("mousemove",canvas_mouse_move);
			if(iid){
				clearInterval(iid);
			}
		});
	});
	
	function bresenham(x1, y1, x2, y2, callback){
		// Bresenham's line algorithm
		
		x1=x1|0,x2=x2|0,y1=y1|0,y2=y2|0;
		
		var dx = Math.abs(x2 - x1);
		var dy = Math.abs(y2 - y1);
		var sx = (x1 < x2) ? 1 : -1;
		var sy = (y1 < y2) ? 1 : -1;
		var err = dx - dy;
		
		while(1){
			callback(x1, y1);
			
			if(x1===x2 && y1===y2) break;
			var e2 = err*2;
			if(e2 >-dy){ err -= dy; x1 += sx; }
			if(e2 < dx){ err += dx; y1 += sy; }
		}
		
	}
	
	function line(ctx, x1, y1, x2, y2){
		bresenham(x1, y1, x2, y2, function(x,y){
			ctx.fillRect(x,y,1,1);
		});
	}
	
	function $ToolBox(){
		var $tb = $("<div>").addClass("jspaint-tool-box");
		var $tools = $("<div class='jspaint-tools'>");
		var $tool_options = $("<div class='jspaint-tool-options'>");
		$tool_options_area = $tool_options;
		
		var $buttons;
		$.each(tools, function(i, tool){
			var $b = $("<button class='jspaint-tool'>");
			$b.appendTo($tools);
			tool.$button = $b;
			
			$b.attr("title", tool.name);
			
			var $icon = $("<span/>");
			$icon.appendTo($b);
			var bx = (i%2)*24;
			var by = ((i/2)|0)*25;
			$icon.css({
				display: "block",
				width: "100%",
				height: "100%",
				backgroundImage: "url(images/toolbar-icons.png)",
				backgroundPositionX: bx,
				backgroundPositionY: -by,
			});
			
			$b.on("click", function(){
				if(selected_tool === tool && tool.deselect){
					selected_tool = previous_tool;
				}else{
					if(!tool.deselect){
						previous_tool = tool;
					}
					selected_tool = tool;
				}
				$c.update_selected_tool();
			});
		});
		$buttons = $tools.find("button");
		
		var $c = $Component("Tools", "tall", $tools.add($tool_options));
		$c.update_selected_tool = function(){
			$buttons.removeClass("selected");
			selected_tool.$button.addClass("selected");
			$canvas.css({
				cursor: Cursor(selected_tool.cursor)
			});
		};
		$c.update_selected_tool();
		return $c;
	}
	function $ColorBox(){
		var $cb = $("<div>").addClass("jspaint-color-box");
		$cb.addClass("jspaint-color-box");
		
		var $current_colors = $("<div>").addClass("jspaint-current-colors");
		var $palette = $("<div>").addClass("jspaint-palette");
		
		$cb.append($current_colors, $palette);
		
		var $color0 = $("<div class='jspaint-color-selection'>");
		var $color1 = $("<div class='jspaint-color-selection'>");
		$current_colors.append($color0, $color1);
		
		$current_colors.css({
			position: "relative",
		});
		$color0.css({
			position: "absolute",
			zIndex: 1,
			left: 2,
			top: 4,
		});
		$color1.css({
			position: "absolute",
			right: 3,
			bottom: 3,
		});
		
		function update_colors(){
			$current_colors.css({background:colors[2]});
			$color0.css({background:colors[0]});
			$color1.css({background:colors[1]});
		}
		
		$.each(palette, function(i, color){
			var $b = $("<button class='jspaint-color-button'>");
			$b.appendTo($palette);
			$b.css("background-color", color);
			
			var $i = $("<input type='color'>");
			$i.appendTo($b);
			$i.on("change", function(){
				color = $i.val();
				$b.css("background-color", color);
				set_color(color);
			});
			$i.css("pointer-events", "none");
			$i.css("opacity", 0);
			
			$i.val(rgb2hex($b.css("background-color")));
			
			var button, ctrl;
			$b.on("mousedown", function(e){
				ctrl = e.ctrlKey;
				button = e.button;
				
				set_color($b.css("background-color"));
				
				$i.val(rgb2hex($b.css("background-color")));
				
				$i.css("pointer-events", "all");
				setTimeout(function(){
					$i.css("pointer-events", "none");
				}, 400);
			});
			
			function set_color(col){
				console.log("set_color", col);
				if(ctrl){
					colors[2] = col;
				}else if(button === 0){
					colors[0] = col;
				}else if(button === 2){
					colors[1] = col;
				}
				update_colors();
			};
			function rgb2hex(col){
				var rgb = col.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
				function hex(x){
					return ("0" + parseInt(x).toString(16)).slice(-2);
				}
				return rgb ? ("#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3])) : col;
			}
		});
		
		var $c = $Component("Colors", "wide", $cb);
		$c.update_colors = update_colors;
		return $c;
		
	}
	function $Component(name, orientation, $el){
		//a draggable widget that can be undocked into a window
		var $c = $("<div>").addClass("jspaint-component");
		$c.addClass("jspaint-"+name+"-component");
		$c.append($el);
		$c.appendTo({
			tall: $left,
			wide: $bottom,
		}[orientation]);
		
		var ox, oy, w, h, pos, pos_axis;
		var dragging = false;
		var $dock_to;
		var $ghost;
		$c.on("mousedown",function(e){
			if(e.button !== 0) return;
			
			var rect = $c[0].getBoundingClientRect();
			w = ((rect.width/2)|0)*2+1;//make sure these dimensions are odd numbers
			h = ((rect.height/2)|0)*2+1;
			ox = $c.position().left - e.clientX;
			oy = $c.position().top - e.clientY;
			dragging = true;
			
			if(!$ghost){
				$ghost = $("<div class='jspaint-component-ghost dock'>");
				$ghost.css({
					position: "absolute",
					display: "block",
					width: w,
					height: h,
					left: e.clientX + ox,
					top: e.clientY + oy
				});
				$ghost.appendTo("body");
			}
			
			e.preventDefault();
		});
		$el.on("mousedown",function(e){
			return false;
		});
		$(window).on("mousemove",function(e){
			if(!dragging) return;
			
			$ghost.css({
				left: e.clientX + ox,
				top: e.clientY + oy,
			});
			
			$dock_to = null;
			
			var ghost_rect = $ghost[0].getBoundingClientRect();
			var q = 5;
			if(orientation === "tall"){
				pos_axis = "top";
				if(ghost_rect.left-q < $left[0].getBoundingClientRect().right){
					$dock_to = $left;
				}
				if(ghost_rect.right+q > $right[0].getBoundingClientRect().left){
					$dock_to = $right;
				}
			}else{
				pos_axis = "left";
				if(ghost_rect.top-q < $top[0].getBoundingClientRect().bottom){
					$dock_to = $top;
				}
				if(ghost_rect.bottom+q > $bottom[0].getBoundingClientRect().top){
					$dock_to = $bottom;
				}
			}
			pos = ghost_rect[pos_axis];
			
			if($dock_to){
				var dock_to_rect = $dock_to[0].getBoundingClientRect();
				pos -= dock_to_rect[pos_axis];
				$ghost.addClass("dock");
			}else{
				$ghost.removeClass("dock");
			}
			
			e.preventDefault();
		});
		$(window).on("mouseup",function(e){
			if(!dragging) return;
			dragging = false;
			
			if($dock_to){
				$dock_to.append($c);
				
				pos = Math.max(pos, 0);
				if(pos_axis === "top"){
					pos = Math.min(pos, $dock_to.height() - $ghost.height());
				}else{
					pos = Math.min(pos, $dock_to.width() - $ghost.width());
				}
				
				$c.css("position", "relative");
				$c.css(pos_axis, pos);
			}else{
				//put component in window
			}
			
			$ghost && $ghost.remove(), $ghost = null;
			
			update_handles();
		});
		return $c;
	}
	function $Window(){
		var $w = $("<div class='jspaint-window'/>").appendTo("body");
		$w.$titlebar = $("<div class='jspaint-window-titlebar'/>").appendTo($w);
		$w.$title = $("<span class='jspaint-window-title'/>").appendTo($w.$titlebar);
		$w.$x = $("<button class='jspaint-window-close-button'/>").appendTo($w.$titlebar);
		$w.$content = $("<div class='jspaint-window-content'/>").appendTo($w);
		
		$w.$x.on("click", function(){
			$w.close();
		});
		
		$w.$Button = function(text, handler){
			$w.$content.append(
				$("<button>")
					.text(text)
					.on("click", function(){
						handler();
						$w.close();
					})
			);
		};
		$w.title = function(title){
			if(title){
				$w.$title.text(title);
				return $w;
			}else{
				return $w.$title.text();
			}
		};
		$w.close = function(){
			$w.remove();
		};
		
		$w.css({
			position: "absolute",
			right: 50,
			top: 50
		});
		
		return $w;
	}
	function Cursor(cursor_def){
		return "url(images/cursors/" + cursor_def[0] + ".png) "
			+ cursor_def[1].join(" ")
			+ ", " + cursor_def[2]
	}
};

$(function(){
	app.open();
	$("body").on("contextmenu",function(e){
		return false;
	});
	$("body").on("mousedown",function(e){
		e.preventDefault();
	});
});