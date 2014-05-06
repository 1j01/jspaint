
function $Handles($container, canvas, options){
	var outset = options.outset;
	var offset = options.offset || 0;
	
	var $resize_ghost = $(E("div")).addClass("jspaint-canvas-resize-ghost");
	var handles = $.map([
		["top", "right"], //↗
		["top", "middle"], //↑
		["top", "left"], //↖
		["middle", "left"], //←
		["bottom", "left"], //↙
		["bottom", "middle"], //↓
		["bottom", "right"], //↘
		["middle", "right"], //→
	], function(pos){
		var y_axis = pos[0];
		var x_axis = pos[1];
		
		var $h = $(E("div")).addClass("jspaint-handle");
		$h.appendTo($container);
		
		var resizes_height = x_axis !== "left" && y_axis === "bottom";
		var resizes_width = x_axis === "right" && y_axis !== "top";
		var width, height;
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
			
			var drag = function(e){
				$resize_ghost.appendTo($container);
				dragged = true;
				
				var rect = canvas.getBoundingClientRect();
				$resize_ghost.css({
					position: "absolute",
					left: offset,
					top: offset,
					width: width = (resizes_width? (e.clientX - rect.left) : (rect.width)),
					height: height = (resizes_height? (e.clientY - rect.top) : (rect.height)),
				});
			};
			$h.on("mousedown", function(e){
				dragged = false;
				if(e.button === 0){
					$G.on("mousemove", drag);
					$body.css({cursor:cursor});
					$(canvas).css({pointerEvents:"none"});
				}
				$G.one("mouseup", function(e){
					$G.off("mousemove", drag);
					$body.css({cursor:"auto"});
					$(canvas).css({pointerEvents:""});
					
					$resize_ghost.remove();
					if(dragged){
						$(canvas).trigger("user-resized", [width, height]);
					}
					$container.trigger("update");
				});
			});
		}
		
		var update_handle = function(){
			var rect = canvas.getBoundingClientRect();
			var hs = $h.width();
			if(x_axis === "middle"){
				$h.css({ left: offset + (rect.width - hs) / 2 });
			}else if(x_axis === "left"){
				$h.css({ left: offset - outset });
			}else if(x_axis === "right"){
				$h.css({ left: offset + rect.width - hs/2 });
			}
			if(y_axis === "middle"){
				$h.css({ top: offset + (rect.height - hs) / 2 });
			}else if(y_axis === "top"){
				$h.css({ top: offset - outset });
			}else if(y_axis === "bottom"){
				$h.css({ top: offset + rect.height - hs/2 });
			}
		};
		
		$container.on("update resize scroll", update_handle);
		$G.on("resize", update_handle);
		setTimeout(update_handle, 50);
	});
	
	return $(handles);
}
