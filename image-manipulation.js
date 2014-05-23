
function draw_ellipse(ctx, x, y, w, h){
	var stroke_color = ctx.strokeStyle;
	var fill_color = ctx.fillStyle;
	
	var r1 = Math.round;
	var r2 = Math.round;
	
	var cx = x + w/2;
	var cy = y + h/2;
	
	if(aliasing){
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
	}else{
		if(w<0){ x+=w; w=-w; }
		if(h<0){ y+=h; h=-h; }
		ctx.beginPath();
		ctx.ellipse(cx, cy, w/2, h/2, 0, TAU, false);
		ctx.stroke();
		ctx.fill();
	}
}
function draw_rounded_rectangle(ctx, x, y, width, height, radius){
	var stroke_color = ctx.strokeStyle;
	var fill_color = ctx.fillStyle;
	
	if(aliasing){
		var iw = width - radius*2;
		var ih = height - radius*2;
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
	}else{
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
	}
}
function draw_line(ctx, x1, y1, x2, y2){
	if(aliasing){
		bresenham(x1, y1, x2, y2, function(x, y){
			ctx.fillRect(x, y, 1, 1);
		});
	}else{
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	}
}
function bresenham(x1, y1, x2, y2, callback){
	// Bresenham's line algorithm
	x1=~~x1, x2=~~x2, y1=~~y1, y2=~~y2;
	
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
function brosandham(x1, y1, x2, y2, callback){
	// Bresenham's line algorithm modified to callback in-between going horizontal and vertical
	x1=~~x1, x2=~~x2, y1=~~y1, y2=~~y2;
	
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
		callback(x1, y1);
		if(e2 < dx){ err += dx; y1 += sy; }
	}
}
