function OnCanvasHelperLayer(x, y, width, height){
	OnCanvasObject.call(this, x, y, width, height);
	
	this.$el.addClass("helper-layer");
	this.$el.css({
		pointerEvents: "none"
	});
	this.position();
	
	this.canvas = new Canvas(this.width, this.height);
	this.$el.append(this.canvas);
}

OnCanvasHelperLayer.prototype = Object.create(OnCanvasObject.prototype);
