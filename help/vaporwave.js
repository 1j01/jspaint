
var clouds_img = document.createElement("img");
clouds_img.src = "clouds.jpg";
var mask_img = document.createElement("img");
mask_img.src = "cloud-mask.png";
// var something_img = document.createElement("img");
// something_img.src = "p_paint.gif";

var canvas = document.createElement("canvas");
document.getElementById("background-animation").append(canvas);
var ctx = canvas.getContext("2d");
var animate = function () {
	rAF_ID = requestAnimationFrame(animate);

	canvas.width = canvas.parentElement.offsetWidth;
	canvas.height = canvas.parentElement.offsetHeight;

	var clouds_scale = 1;
	var clouds_width = clouds_img.width * clouds_scale;
	var clouds_height = clouds_img.width * clouds_scale;
	var x_extent = (clouds_width - canvas.width) / 2;
	var y_extent = (clouds_height - canvas.height) / 2;
	var x_interval_ms = 19000;
	var y_interval_ms = 7000;
	var now = performance.now();
	ctx.drawImage(
		clouds_img,
		Math.sin(now / x_interval_ms) * x_extent - x_extent,
		Math.cos(now / y_interval_ms) * y_extent - y_extent,
		clouds_width,
		clouds_height
	);
	ctx.globalCompositeOperation = "screen";
	ctx.drawImage(mask_img, 0, 0);
	ctx.fillStyle = "white";
	ctx.fillRect(0, mask_img.naturalHeight, mask_img.naturalWidth, canvas.height);
	ctx.fillRect(mask_img.naturalWidth, 0, 50, canvas.height); // for scrollbar
	// ctx.globalCompositeOperation = "source-over";
	// ctx.drawImage(something_img, Math.sin(now / 5000) * 501, Math.cos(now / 5000) * 510);
};
animate();
