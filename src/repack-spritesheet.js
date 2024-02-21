// This script adds padding between tiles in a spritesheet, to avoid bleeding when at non-integer zoom levels
// (or indeed, design errors, where one icon accidentally extends into the space of another)

// USAGE: load an image into the app, then paste this code into the browser console, updating parameters as needed.

function repack_spritesheet(tile_width, tile_height = tile_width, padding = tile_width) {
	apply_image_transformation({
		name: localize("Repack Spritesheet"),
		icon: get_help_folder_icon("p_paste.png"),
		// icon: get_help_folder_icon("p_stretch_both.png"),
	}, (original_canvas, original_ctx, new_canvas, new_ctx) => {
		const tiles_x = Math.ceil(original_canvas.width / tile_width);
		const tiles_y = Math.ceil(original_canvas.height / tile_height);
		new_canvas.width = tiles_x * (tile_width + padding) + padding;
		new_canvas.height = tiles_y * (tile_height + padding) + padding;
		for (let x = 0; x < tiles_x; x++) {
			for (let y = 0; y < tiles_y; y++) {
				const sx = x * tile_width;
				const sy = y * tile_height;
				const dx = x * (tile_width + padding) + padding;
				const dy = y * (tile_height + padding) + padding;
				new_ctx.drawImage(original_canvas, sx, sy, tile_width, tile_height, dx, dy, tile_width, tile_height);
			}
		}
	});
}

repack_spritesheet(16, 16, 16)
