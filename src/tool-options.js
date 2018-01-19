
var brush_canvas = new Canvas();
var brush_ctx = brush_canvas.ctx;
var brush_shape = "circle";
var brush_size = 5;
var eraser_size = 8;
var airbrush_size = 9;
var pencil_size = 1;
var stroke_size = 1; // lines, curves, shape outlines
var transparent_opaque = "opaque"; // TODO: make this a boolean (and think of a good name)


var $shape_styles_warning_window;
var dont_show_shape_styles_warning_again = false;
try{
	dont_show_shape_styles_warning_again = localStorage["don't show shape styles not implemented warning again"];
}catch(e){}
var show_shape_styles_warning = function(){
	if($shape_styles_warning_window || dont_show_shape_styles_warning_again){
		return;
	}
	var $w = $shape_styles_warning_window = $FormWindow().title("Warning").addClass("dialogue-window");
	$w.$main.html(
		"<p>Shape styles and line widths are not implemented for all tools.</p>" +
		"<p>See issues <a href='https://github.com/1j01/jspaint/issues/7'>#7</a> and <a href='https://github.com/1j01/jspaint/issues/43'>#43</a>.</p>" +
		"<label><input type='checkbox' class='dont-tell-me-again'> Don't tell me again</label>"
	);
	$w.$main.find(".dont-tell-me-again").on("change", function(){
		dont_show_shape_styles_warning_again = $(this).is(":checked");
		try{
			if(dont_show_shape_styles_warning_again){
				localStorage["don't show shape styles not implemented warning again"] = "yeah, shush";
			}else{
				delete localStorage["don't show shape styles not implemented warning again"];
			}
		}catch(e){}
	});
	$w.$Button("OK", function(){
		$w.close();
		$shape_styles_warning_window = null;
	});
	$w.center();
};


var ChooserCanvas = function(
	url, invert,
	width, height,
	sourceX, sourceY, sourceWidth, sourceHeight,
	destX, destY, destWidth, destHeight
){
	var c = new Canvas(width, height);
	var img = ChooserCanvas.cache[url];
	if(!img){
		img = ChooserCanvas.cache[url] = E("img");
		img.src = url;
	}
	var render = function(){
		c.ctx.drawImage(
			img,
			sourceX, sourceY, sourceWidth, sourceHeight,
			destX, destY, destWidth, destHeight
		);
		if(invert){
			var id = c.ctx.getImageData(0, 0, c.width, c.height);
			for(var i=0; i<id.data.length; i+=4){
				id.data[i+0] = 255 - id.data[i+0];
				id.data[i+1] = 255 - id.data[i+1];
				id.data[i+2] = 255 - id.data[i+2];
			}
			c.ctx.putImageData(id, 0, 0);
		}
	};
	$(img).load(render);
	render();
	return c;
};
ChooserCanvas.cache = {};

var $Choose = function(things, display, choose, is_chosen){
	var $chooser = $(E("div")).addClass("chooser");
	$chooser.on("update", function(){
		$chooser.empty();
		for(var i=0; i<things.length; i++){
			(function(thing){
				var $option_container = $(E("div")).appendTo($chooser);
				var $option = $();
				var choose_thing = function(){
					if(is_chosen(thing)){
						return; // unnecessary optimization
					}
					choose(thing);
					$G.trigger("option-changed");
				}
				var update = function(){
					$option_container.css({
						backgroundColor: is_chosen(thing) ? "rgb(0, 0, 123)" : ""
					});
					$option_container.empty();
					$option = $(display(thing, is_chosen(thing)));
					$option.appendTo($option_container);
				};
				update();
				$chooser.on("redraw", update);
				$G.on("option-changed", update);
				
				$option_container.on("pointerdown click", choose_thing);
				$chooser.on("pointerdown", function(){
					$option_container.on("pointerenter", choose_thing);
				});
				$G.on("pointerup", function(){
					$option_container.off("pointerenter", choose_thing);
				});
				
			})(things[i]);
		}
	});
	return $chooser;
};
var $ChooseShapeStyle = function(){
	var $chooser = $Choose(
		[
			{stroke: true, fill: false},
			{stroke: true, fill: true},
			{stroke: false, fill: true}
		],
		function(a, is_chosen){
			var sscanvas = new Canvas(39, 21);
			var ssctx = sscanvas.ctx;
			
			// border px inwards amount
			var b = 5;
			ssctx.fillStyle = is_chosen ? "#fff" : "#000";
			
			if(a.stroke){
				// just using a solid rectangle for the stroke
				// so as not to have to deal with the pixel grid with strokes
				ssctx.fillRect(b, b, sscanvas.width-b*2, sscanvas.height-b*2);
			}
			
			// go inward a pixel for the fill
			b += 1;
			ssctx.fillStyle = "#777";
			
			if(a.fill){
				ssctx.fillRect(b, b, sscanvas.width-b*2, sscanvas.height-b*2);
			}else{
				ssctx.clearRect(b, b, sscanvas.width-b*2, sscanvas.height-b*2);
			}
			
			return sscanvas;
		},
		function(a){
			$chooser.stroke = a.stroke;
			$chooser.fill = a.fill;
			show_shape_styles_warning();
		},
		function(a){
			return $chooser.stroke === a.stroke && $chooser.fill === a.fill;
		}
	).addClass("choose-shape-style");
	
	$chooser.fill = false;
	$chooser.stroke = true;
	
	return $chooser;
};

var $choose_brush = $Choose(
	(function(){
		var brush_shapes = ["circle", "square", "reverse_diagonal", "diagonal"];
		var brush_sizes = [8, 5, 2];
		var things = [];
		for(var brush_shape_i in brush_shapes){
			for(var brush_size_i in brush_sizes){
				things.push({
					shape: brush_shapes[brush_shape_i],
					size: brush_sizes[brush_size_i],
				});
			}
		}
		return things;
	})(),
	function(o, is_chosen){
		var cbcanvas = new Canvas(10, 10);
		
		var shape = o.shape;
		var size = o.size;
		if(shape === "circle"){
			size -= 1;
		}
		
		cbcanvas.ctx.fillStyle =
		cbcanvas.ctx.strokeStyle =
			is_chosen ? "#fff" : "#000";
		
		render_brush(cbcanvas.ctx, shape, size);
		
		return cbcanvas;
	},
	function(o){
		brush_shape = o.shape;
		brush_size = o.size;
	},
	function(o){
		return brush_shape === o.shape && brush_size === o.size;
	}
).addClass("choose-brush");

var $choose_eraser_size = $Choose(
	[4, 6, 8, 10],
	function(size, is_chosen){
		var cecanvas = new Canvas(39, 16);
		
		cecanvas.ctx.fillStyle = is_chosen ? "#fff" : "#000";
		render_brush(cecanvas.ctx, "square", size);
		
		return cecanvas;
	},
	function(size){
		eraser_size = size;
	},
	function(size){
		return eraser_size === size;
	}
).addClass("choose-eraser");

var $choose_stroke_size = $Choose(
	[1, 2, 3, 4, 5],
	function(size, is_chosen){
		var w = 39, h = 12, b = 5;
		var cscanvas = new Canvas(w, h);
		var center_y = (h - size) / 2;
		cscanvas.ctx.fillStyle = is_chosen ? "#fff" : "#000";
		cscanvas.ctx.fillRect(b, ~~center_y, w - b*2, size);
		return cscanvas;
	},
	function(size){
		stroke_size = size;
		show_shape_styles_warning();
	},
	function(size){
		return stroke_size === size;
	}
).addClass("choose-stroke-size");

var magnifications = [1, 2, 6, 8/*, 10*/]; // ten is secret
var $choose_magnification = $Choose(
	magnifications,
	function(scale, is_chosen){
		var i = magnifications.indexOf(scale);
		return ChooserCanvas(
			"images/options-magnification.png",
			is_chosen, // invert if chosen
			39, 13, // width, height of destination canvas
			i*23, 0, 23, 9, // x, y, width, height from source image
			8, 2, 23, 9 // x, y, width, height on destination
		);
	},
	function(scale){
		set_magnification(scale);
		if(scale > 1){
			$choose_magnification.enlarged_magnification = scale;
		}
	},
	function(scale){
		return scale === magnification;
	}
).addClass("choose-magnification");

// The default enlarged (>1) magnification for when you use the tool
// is 4x, which isn't an option you can get to from the tool options.
$choose_magnification.enlarged_magnification = 4;


var airbrush_sizes = [9, 16, 24];
var $choose_airbrush_size = $Choose(
	airbrush_sizes,
	function(size, is_chosen){
		
		var image_width = 72; // width of source image
		var i = airbrush_sizes.indexOf(size); // 0 or 1 or 2
		var l = airbrush_sizes.length; // 3
		var is_bottom = (i === 2);
		
		var shrink = 4 * !is_bottom;
		var w = image_width / l - shrink * 2;
		var h = 23;
		var source_x = image_width / l * i + shrink;
		
		return ChooserCanvas(
			"images/options-airbrush-size.png",
			is_chosen, // invert if chosen
			w, h, // width, height of created destination canvas
			source_x, 0, w, h, // x, y, width, height from source image
			0, 0, w, h // x, y, width, height on created destination canvas
		);
	},
	function(size){
		airbrush_size = size;
	},
	function(size){
		return size === airbrush_size;
	}
).addClass("choose-airbrush-size");

var $choose_transparency = $Choose(
	["opaque", "transparent"],
	function(t_o, is_chosen){
		var sw = 35, sh = 23; // width, height from source image
		var b = 2; // margin by which the source image is inset on the destination
		return ChooserCanvas(
			"images/options-transparency.png",
			false, // never invert it
			b+sw+b, b+sh+b, // width, height of created destination canvas
			0, (t_o === "opaque" ? 0 : 22), sw, sh, // x, y, width, height from source image
			b, b, sw, sh // x, y, width, height on created destination canvas
		);
	},
	function(t_o){
		transparent_opaque = t_o;
	},
	function(t_o){
		return t_o === transparent_opaque;
	}
).addClass("choose-transparency");

