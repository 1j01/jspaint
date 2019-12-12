
const TAU =     //////|//////
          /////     |     /////
       ///         tau         ///
     ///     ...--> | <--...     ///
   ///     -'   one | turn  '-     ///
  //     .'         |         '.     //
 //     /           |           \     //
//     |            | <-..       |     //
//    |          .->|     \       |    //
//    |         /   |      |      |    //
- - - - - - Math.PI + Math.PI - - - - - 0;
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

const is_pride_month = new Date().getMonth() === 5; // June (0-based, 0 is January)

const $G = $(window);

function make_css_cursor(name, coords, fallback){
	return `url(images/cursors/${name}.png) ${coords.join(" ")}, ${fallback}`;
}

function E(t){
	return document.createElement(t);
}

/** Returns a function, that, as long as it continues to be invoked, will not
be triggered. The function will be called after it stops being called for
N milliseconds. If `immediate` is passed, trigger the function on the
leading edge, instead of the trailing. */
function debounce(func, wait_ms, immediate) {
	let timeout;

	return function() {
		const context = this;
		const args = arguments;

		const later = ()=> {
			timeout = null;
			if (!immediate) {
				func.apply(context, args);
			}
		};

		const callNow = immediate && !timeout;

		clearTimeout(timeout);

		timeout = setTimeout(later, wait_ms);

		if (callNow) {
			func.apply(context, args);
		}
	};
}
  
function memoize_synchronous_function(func) {
	const cache = {};
	return (...args)=> {
		const key = JSON.stringify(args);
		if (cache[key]){
			return cache[key];
		} else{
			val = func.apply(null, args);
			cache[key] = val;
			return val; 
		}
	}
}

function memoize_synchronous_function_with_limit(func, max_entries) {
	const cache = {};
	const keys = [];
	return (...args)=> {
		const key = JSON.stringify(args);
		if (cache[key]){
			return cache[key];
		} else{
			val = func.apply(null, args);
			cache[key] = val;
			keys.push(key);
			if (keys.length > max_entries) {
				const oldest_key = keys.shift();
				delete cache[oldest_key];
			}
			return val; 
		}
	}
}

window.get_rgba_from_color = memoize_synchronous_function((color)=> {
	const single_pixel_canvas = make_canvas(1, 1);
	
	single_pixel_canvas.ctx.fillStyle = color;
	single_pixel_canvas.ctx.fillRect(0, 0, 1, 1);
	
	const image_data = single_pixel_canvas.ctx.getImageData(0, 0, 1, 1);
	
	// We could just return image_data.data, but let's return an Array instead
	// I'm not totally sure image_data.data wouldn't keep the ImageData object around in memory
	return Array.from(image_data.data);
});

function image_data_are_equal(a, b) {
	const a_data = a.data;
	const b_data = b.data;
	if (a_data.length !== b_data.length) {
		return false;
	}
	for (let len = a_data.length, i = 0; i < len; i++) {
		if (a_data[i] !== b_data[i]) {
			return false;
		}
	}
	return true;
}

function make_canvas(width, height){
	const image = width;
	
	const new_canvas = E("canvas");
	const new_ctx = new_canvas.getContext("2d");
	
	new_canvas.ctx = new_ctx;
	
	new_ctx.disable_image_smoothing = image => {
		new_ctx.mozImageSmoothingEnabled = false;
		new_ctx.webkitImageSmoothingEnabled = false;
		new_ctx.msImageSmoothingEnabled = false;
		new_ctx.imageSmoothingEnabled = false;
	};
	new_ctx.enable_image_smoothing = image => {
		new_ctx.mozImageSmoothingEnabled = true;
		new_ctx.webkitImageSmoothingEnabled = true;
		new_ctx.msImageSmoothingEnabled = true;
		new_ctx.imageSmoothingEnabled = true;
	};
	
	// TODO: simplify the abstraction by defining setters for width/height
	// that reset the image smoothing to disabled
	// and make image smoothing a parameter to make_canvas
	
	new_ctx.copy = image => {
		new_canvas.width = image.naturalWidth || image.width;
		new_canvas.height = image.naturalHeight || image.height;
		
		// setting width/height resets image smoothing (along with everything)
		new_ctx.disable_image_smoothing();
		
		if (image instanceof ImageData) {
			new_ctx.putImageData(image, 0, 0);
		} else {
			new_ctx.drawImage(image, 0, 0);
		}
	};
	
	if(width && height){
		// make_canvas(width, height)
		new_canvas.width = width;
		new_canvas.height = height;
		// setting width/height resets image smoothing (along with everything)
		new_ctx.disable_image_smoothing();
	}else if(image){
		// make_canvas(image)
		new_ctx.copy(image);
	}
	
	return new_canvas;
}

function get_icon_for_tool(tool) {
	const icon_img = new Image();
	icon_img.src = `help/${tool.help_icon}`;
	return icon_img;
}

function load_image(path) {
	return new Promise((resolve, reject)=> {
		const img = new Image();

		img.onload = ()=> { resolve(img); };
		img.onerror = ()=> { reject(); };

		img.src = path;
	});
}

function get_icon_for_tools(tools) {
	if (tools.length === 1) {
		return get_icon_for_tool(tools[0]);
	}
	const icon_canvas = make_canvas(16, 16);

	Promise.all(tools.map((tool)=> load_image(`help/${tool.help_icon}`)))
	.then((icons)=> {
		icons.forEach((icon, i)=> {
			const w = icon_canvas.width / icons.length;
			const x = i * w;
			const h = icon_canvas.height;
			const y = 0;
			icon_canvas.ctx.drawImage(icon, x, y, w, h, x, y, w, h);
		});
	})
	return icon_canvas;
}
