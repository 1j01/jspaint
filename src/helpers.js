
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

function Cursor(cursor_def){
	return "url(images/cursors/" + cursor_def[0] + ".png) "
		+ cursor_def[1].join(" ")
		+ ", " + cursor_def[2]
}

function E(t){
	return document.createElement(t);
}

function get_rgba_from_color(color){
	
	var _c = new Canvas();
	_c.width = _c.height = 1;
	
	var _ctx = _c.getContext("2d");
	_ctx.fillStyle = color;
	_ctx.fillRect(0, 0, 1, 1);
	
	var _id = _ctx.getImageData(0, 0, 1, 1);
	
	// We could return _id.data, but we don't need to let that object out of this function.
	var fill_r = _id.data[0];
	var fill_g = _id.data[1];
	var fill_b = _id.data[2];
	var fill_a = _id.data[3];
	return [fill_r, fill_g, fill_b, fill_a];
	
}

function Canvas(width, height){
	var new_canvas = E("canvas");
	var new_ctx = new_canvas.getContext("2d");
	new_ctx.imageSmoothingEnabled = false;
	new_ctx.mozImageSmoothingEnabled = false;
	new_ctx.webkitImageSmoothingEnabled = false;
	if(width && height){
		// new Canvas(width, height)
		new_canvas.width = width;
		new_canvas.height = height;
	}else{
		// new Canvas(image)
		var copy_of = width;
		if(copy_of){
			new_canvas.width = copy_of.width;
			new_canvas.height = copy_of.height;
			new_ctx.drawImage(copy_of, 0, 0);
		}
	}
	new_canvas.ctx = new_ctx;
	return new_canvas;
}
