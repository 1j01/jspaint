
var clouds_img = document.createElement("img");
clouds_img.src = "clouds.jpg";
var mask_img = document.createElement("img");
mask_img.src = "cloud-mask.png";
var something_img = document.createElement("img");
something_img.src = "../images/icons/32.png";

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
	if(!(
		mask_img.complete && mask_img.naturalWidth > 1 &&
		clouds_img.complete && clouds_img.naturalWidth > 1
	)){
		return;
	}
	ctx.drawImage(
		clouds_img,
		Math.sin(now / x_interval_ms) * x_extent - x_extent,
		Math.cos(now / y_interval_ms) * y_extent - y_extent,
		clouds_width,
		clouds_height
	);
	if(something_img.complete && something_img.naturalWidth > 1){
		let t = now / 5000;
		ctx.globalAlpha = 0.3 + Math.max(0, Math.sin(-t) * 1);
		ctx.drawImage(something_img, Math.sin(-t) * canvas.width * 0.7, Math.cos(-t) * 70);
		ctx.globalAlpha = 1;
	}
	ctx.globalCompositeOperation = "screen";
	ctx.drawImage(mask_img, 0, 0);
	ctx.fillStyle = "white";
	ctx.fillRect(0, mask_img.naturalHeight, mask_img.naturalWidth, canvas.height);
	ctx.fillRect(mask_img.naturalWidth, 0, 50, canvas.height); // for scrollbar
};
animate();
