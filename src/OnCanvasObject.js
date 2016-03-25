
function OnCanvasObject(x, y, width, height){
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	
	this.$el = $(E("div")).addClass("jspaint-on-canvas-object").appendTo($canvas_area);
	
	$canvas_handles.hide();
}

OnCanvasObject.prototype.position = function(){
	this.$el.css({
		position: "absolute",
		left: magnification * this.x + 3,
		top: magnification * this.y + 3,
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
