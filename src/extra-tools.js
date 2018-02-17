
extra_tools = [{
	name: "Airbrushbrush",
	description: "Draws randomly within a radius based on the selected Airbrush size, using a brush with the selected shape and size.",
	cursor: ["precise-dotted", [16, 16], "crosshair"],
	continuous: "time",
	rendered_color: "",
	rendered_size: 0,
	rendered_shape: "",
	paint: function(ctx, x, y){
		// XXX: copy pasted all this brush caching/rendering code!
		// TODO: DRY!
		var csz = brush_size * (brush_shape === "circle" ? 2.1 : 1);
		if(
			this.rendered_shape !== brush_shape ||
			this.rendered_color !== stroke_color ||
			this.rendered_size !== brush_size
		){
			brush_canvas.width = csz;
			brush_canvas.height = csz;
			// don't need to do brush_ctx.disable_image_smoothing() currently because images aren't drawn to the brush

			brush_ctx.fillStyle = brush_ctx.strokeStyle = stroke_color;
			render_brush(brush_ctx, brush_shape, brush_size);
			
			this.rendered_color = stroke_color;
			this.rendered_size = brush_size;
			this.rendered_shape = brush_shape;
		}
		var draw_brush = function(x, y){
			ctx.drawImage(brush_canvas, ~~(x-csz/2), ~~(y-csz/2));
		};
		var r = airbrush_size * 2;
		for(var i = 0; i < 6 + r/5; i++){
			var rx = (Math.random()*2-1) * r;
			var ry = (Math.random()*2-1) * r;
			var d = rx*rx + ry*ry;
			if(d <= r * r){
				draw_brush(x + ~~rx, y + ~~ry);
			}
		}
	},
	$options: $choose_brush
}, {
	name: "Spirobrush",
	description: "Spirals chaotically using a brush with the selected shape and size.",
	cursor: ["precise-dotted", [16, 16], "crosshair"],
	continuous: "time",
	rendered_color: "",
	rendered_size: 0,
	rendered_shape: "",
	position: {
		x: 0,
		y: 0,
	},
	velocity: {
		x: 0,
		y: 0,
	},
	pointerdown: function(ctx, x, y){
		this.position.x = x;
		this.position.y = y;
		this.velocity.x = 0;
		this.velocity.y = 0;
	},
	paint: function(ctx, x, y){
		// XXX: copy pasted all this brush caching/rendering code!
		// TODO: DRY!
		var csz = brush_size * (brush_shape === "circle" ? 2.1 : 1);
		if(
			this.rendered_shape !== brush_shape ||
			this.rendered_color !== stroke_color ||
			this.rendered_size !== brush_size
		){
			brush_canvas.width = csz;
			brush_canvas.height = csz;
			// don't need to do brush_ctx.disable_image_smoothing() currently because images aren't drawn to the brush

			brush_ctx.fillStyle = brush_ctx.strokeStyle = stroke_color;
			render_brush(brush_ctx, brush_shape, brush_size);
			
			this.rendered_color = stroke_color;
			this.rendered_size = brush_size;
			this.rendered_shape = brush_shape;
		}
		var draw_brush = function(x, y){
			ctx.drawImage(brush_canvas, ~~(x-csz/2), ~~(y-csz/2));
		};
		for(var i = 0; i < 60; i++){
			var x_diff = x - this.position.x;
			var y_diff = y - this.position.y;
			var dist = Math.hypot(x_diff, y_diff);
			var divisor = Math.max(1, dist);
			var force_x = x_diff / divisor;
			var force_y = y_diff / divisor;
			this.velocity.x += force_x;
			this.velocity.y += force_y;
			this.position.x += this.velocity.x;
			this.position.y += this.velocity.y;
			draw_brush(this.position.x, this.position.y);
		}
	},
	$options: $choose_brush
}, {
	name: "Airbrush Options",
	description: "Lets you configure the Airbrushbrush. It uses this type of tool option as well.",
	cursor: ["airbrush", [7, 22], "crosshair"],
	continuous: "time",
	paint: function(ctx, x, y){
		
	},
	$options: $choose_airbrush_size
}];
