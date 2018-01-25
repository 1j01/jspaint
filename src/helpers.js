
// make jQuery play well with PEP
$.event.props.push("button", "buttons", "clientX", "clientY", "offsetX", "offsetY", "pageX", "pageY", "screenX", "screenY", "toElement");
$.event.props.push("pointerType", "pointerId", "width", "height", "pressure", "tiltX", "tiltY", "hwTimestamp", "isPrimary");

// configure Font Detective
FontDetective.swf = "./lib/FontList.swf";


var TAU =     //////|//////
          /////     |     /////
       ///         tau         ///
     ///     ...--> | <--...     ///
   ///     -'   one | turn  '-     ///
  //     .'         |         '.     //
 //     /           |           \     //
//     |            | <-..       |     //
//    |          .->|     \       |    //
//    |         /   |      |      |    //
- - - - - - Math.PI + Math.PI - - - - - 0
//    |         \   |      |      |    //
//    |          '->|     /       |    //
//     |            | <-''       |     //
 //     \           |           /     //
  //     '.         |         .'     //
   ///     -.       |       .-     ///
     ///     '''----|----'''     ///
       ///          |          ///
         //////     |     /////
              //////|//////          C/r;

var $G = $(window);

function Cursor(cursor_def){
	return "url(images/cursors/" + cursor_def[0] + ".png) " +
		cursor_def[1].join(" ") +
		", " + cursor_def[2];
}

function E(t){
	return document.createElement(t);
}

var get_rgba_from_color = (function(){
	var _single_pixel_canvas = new Canvas(1, 1);

	function get_rgba_from_color(color){
		
		_single_pixel_canvas.ctx.fillStyle = color;
		_single_pixel_canvas.ctx.fillRect(0, 0, 1, 1);
		
		var _id = _single_pixel_canvas.ctx.getImageData(0, 0, 1, 1);
		
		// We could just return _id.data, but let's return an Array instead
		// I'm not totally sure _id.data wouldn't keep _id around in memory
		return Array.from(_id.data);
	}

	return get_rgba_from_color;
}());

function Canvas(width, height){
	var image = width;
	
	var new_canvas = E("canvas");
	var new_ctx = new_canvas.getContext("2d");
	
	new_canvas.ctx = new_ctx;
	
	new_ctx.disable_image_smoothing = function(image){
		new_ctx.mozImageSmoothingEnabled = false;
		new_ctx.webkitImageSmoothingEnabled = false;
		new_ctx.msImageSmoothingEnabled = false;
		new_ctx.imageSmoothingEnabled = false;
	};
	
	// TODO: simplify the abstraction by defining setters for width/height
	// that reset the image smoothing to disabled
	// and remove all external calls to disable_image_smoothing
	
	new_ctx.copy = function(image){
		new_canvas.width = image.naturalWidth || image.width;
		new_canvas.height = image.naturalHeight || image.height;
		
		// setting width/height resets image smoothing (along with everything)
		new_ctx.disable_image_smoothing();
		
		new_ctx.drawImage(image, 0, 0);
	};
	
	if(width && height){
		// new Canvas(width, height)
		new_canvas.width = width;
		new_canvas.height = height;
		// setting width/height resets image smoothing (along with everything)
		new_ctx.disable_image_smoothing();
	}else if(image){
		// new Canvas(image)
		new_ctx.copy(image);
	}
	
	return new_canvas;
}
