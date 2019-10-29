
class OnCanvasObject {
	constructor(x, y, width, height, hideMainCanvasHandles) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.hideMainCanvasHandles = hideMainCanvasHandles;
		this.$el = $(E("div")).addClass("on-canvas-object").appendTo($canvas_area);
		if (this.hideMainCanvasHandles) {
			$canvas_handles.hide();
		}
	}
	position(updateStatus) {
		var offset_left = parseFloat($canvas_area.css("padding-left"));
		var offset_top = parseFloat($canvas_area.css("padding-top"));
		this.$el.css({
			position: "absolute",
			left: magnification * this.x + offset_left,
			top: magnification * this.y + offset_top,
			width: magnification * this.width,
			height: magnification * this.height,
		});
		if (updateStatus) {
			$status_position.text(this.x + "," + this.y);
			$status_size.text(this.width + "," + this.height);
		}
	}
	destroy() {
		this.$el.remove();
		if (this.hideMainCanvasHandles) {
			$canvas_handles.show();
		}
	}
}
