
function $Handles($container, element, options){
	var outset = options.outset || 0;
	var offset = options.offset || 0;
	var size_only = options.size_only || false;
	var el = element;
	$container.on("new-element", function(e, element){
		el = element;
	});
	
	var $resize_ghost = $(E("div")).addClass("jspaint-resize-ghost");
	var handles = $.map([
		["top", "right"], // ↗
		["top", "middle"], // ↑
		["top", "left"], // ↖
		["middle", "left"], // ←
		["bottom", "left"], // ↙
		["bottom", "middle"], // ↓
		["bottom", "right"], // ↘
		["middle", "right"], // →
	], function(pos){
		var y_axis = pos[0];
		var x_axis = pos[1];
		
		var $h = $(E("div")).addClass("jspaint-handle");
		$h.appendTo($container);
		
		var x, y, width, height;
		var dragged = false;
		var resizes_height = y_axis !== "middle";
		var resizes_width = x_axis !== "middle";
		if(size_only && (y_axis === "top" || x_axis === "left")){
			$h.addClass("jspaint-useless-handle");
		}else{
			
			var cursor_fname;
			if((x_axis === "left" && y_axis === "top") || (x_axis === "right" && y_axis === "bottom")){
				cursor_fname = "nwse-resize";
			}else if((x_axis === "right" && y_axis === "top") || (x_axis === "left" && y_axis === "bottom")){
				cursor_fname = "nesw-resize";
			}else if(resizes_width){
				cursor_fname = "ew-resize";
			}else if(resizes_height){
				cursor_fname = "ns-resize";
			}
			
			var cursor = "";
			if(y_axis === "top"){ cursor += "n"; }
			if(y_axis === "bottom"){ cursor += "s"; }
			if(x_axis === "left"){ cursor += "w"; }
			if(x_axis === "right"){ cursor += "e"; }
			
			cursor += "-resize";
			cursor = Cursor([cursor_fname, [16, 16], cursor]);
			$h.css({cursor: cursor});
			
			var drag = function(e){
				$resize_ghost.appendTo($container);
				dragged = true;
				
				var rect = el.getBoundingClientRect();
				width = ~~(resizes_width ? (e.clientX / magnification - rect.left) : (rect.width));
				height = ~~(resizes_height ? (e.clientY / magnification - rect.top) : (rect.height));
				$resize_ghost.css({
					position: "absolute",
					left: offset,
					top: offset,
					width: magnification * width,
					height: magnification * height,
				});
			};
			$h.on("mousedown", function(e){
				dragged = false;
				if(e.button === 0){
					$G.on("mousemove", drag);
					$body.css({cursor: cursor}).addClass("jspaint-cursor-bully");
				}
				$G.one("mouseup", function(e){
					$G.off("mousemove", drag);
					$body.css({cursor: ""}).removeClass("jspaint-cursor-bully");
					
					$resize_ghost.remove();
					if(dragged){
						$(el).trigger("user-resized", [x, y, width, height]);
					}
					$container.trigger("update");
				});
			});
			$h.on("mousedown selectstart", function(e){
				e.stopPropagation();
				e.preventDefault();
			});
		}
		
		var update_handle = function(){
			var rect = el.getBoundingClientRect();
			var hs = $h.width();
			if(x_axis === "middle"){
				$h.css({ left: offset + (magnification * rect.width - hs) / 2 });
			}else if(x_axis === "left"){
				$h.css({ left: offset - outset });
			}else if(x_axis === "right"){
				$h.css({ left: offset + (magnification * rect.width - hs/2) });
			}
			if(y_axis === "middle"){
				$h.css({ top: offset + (magnification * rect.height - hs) / 2 });
			}else if(y_axis === "top"){
				$h.css({ top: offset - outset });
			}else if(y_axis === "bottom"){
				$h.css({ top: offset + (magnification * rect.height - hs/2) });
			}
		};
		
		$container.on("update resize scroll", update_handle);
		$G.on("resize", update_handle);
		setTimeout(update_handle, 50);
	});
	return $(handles);
}
