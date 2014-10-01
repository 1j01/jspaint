
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
	
	var _c = E("canvas");
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
