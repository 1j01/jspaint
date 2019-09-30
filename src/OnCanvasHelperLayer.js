function OnCanvasHelperLayer(x, y, width, height, hideMainCanvasHandles, hiDPI){
	OnCanvasObject.call(this, x, y, width, height, hideMainCanvasHandles);
	
	this.$el.addClass("helper-layer");
	this.$el.css({
		pointerEvents: "none"
	});
	this.position();
	
	var scale = hiDPI ? magnification * window.devicePixelRatio : 1;
	this.canvas = new Canvas(this.width * scale, this.height * scale);
	this.$el.append(this.canvas);
}

OnCanvasHelperLayer.prototype = Object.create(OnCanvasObject.prototype);
