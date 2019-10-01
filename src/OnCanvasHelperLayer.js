function OnCanvasHelperLayer(x, y, width, height, hideMainCanvasHandles, pixelRatio=1){
	OnCanvasObject.call(this, x, y, width, height, hideMainCanvasHandles);
	
	this.$el.addClass("helper-layer");
	this.$el.css({
		pointerEvents: "none",
		overflow: "hidden",
	});
	this.position();
	
	this.canvas = new Canvas(this.width * pixelRatio, this.height * pixelRatio);
	this.$el.append(this.canvas);
}

OnCanvasHelperLayer.prototype = Object.create(OnCanvasObject.prototype);
