
function OnCanvasObject(x, y, width, height){
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	
	this.$el = $(E("div")).addClass("on-canvas-object").appendTo($canvas_area);
	
	$canvas_handles.hide();
}

OnCanvasObject.prototype.position = function(){
	var offset_left = parseFloat($canvas_area.css("padding-left"));
	var offset_top = parseFloat($canvas_area.css("padding-top"));
	this.$el.css({
		position: "absolute",
		left: magnification * this.x + offset_left,
		top: magnification * this.y + offset_top,
		width: magnification * this.width,
		height: magnification * this.height,
	});
	$status_position.text(this.x + "," + this.y);
	$status_size.text(this.width + "," + this.height);
};

OnCanvasObject.prototype.destroy = function(){
	this.$el.remove();
	$canvas_handles.show();
};
