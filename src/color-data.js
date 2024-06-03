// @ts-check

import { make_stripe_pattern } from "./functions.js";

const default_palette = [
	"rgb(0,0,0)", // Black
	"rgb(128,128,128)", // Dark Gray
	"rgb(128,0,0)", // Dark Red
	"rgb(128,128,0)", // Pea Green
	"rgb(0,128,0)", // Dark Green
	"rgb(0,128,128)", // Slate
	"rgb(0,0,128)", // Dark Blue
	"rgb(128,0,128)", // Lavender
	"rgb(128,128,64)", //
	"rgb(0,64,64)", //
	"rgb(0,128,255)", //
	"rgb(0,64,128)", //
	"rgb(64,0,255)", //
	"rgb(128,64,0)", //

	"rgb(255,255,255)", // White
	"rgb(192,192,192)", // Light Gray
	"rgb(255,0,0)", // Bright Red
	"rgb(255,255,0)", // Yellow
	"rgb(0,255,0)", // Bright Green
	"rgb(0,255,255)", // Cyan
	"rgb(0,0,255)", // Bright Blue
	"rgb(255,0,255)", // Magenta
	"rgb(255,255,128)", //
	"rgb(0,255,128)", //
	"rgb(128,255,255)", //
	"rgb(128,128,255)", //
	"rgb(255,0,128)", //
	"rgb(255,128,64)", //
];
const monochrome_palette_as_colors = [
	"rgb(0,0,0)",
	"rgb(9,9,9)",
	"rgb(18,18,18)",
	"rgb(27,27,27)",
	"rgb(37,37,37)",
	"rgb(46,46,46)",
	"rgb(55,55,55)",
	"rgb(63,63,63)",
	"rgb(73,73,73)",
	"rgb(82,82,82)",
	"rgb(92,92,92)",
	"rgb(101,101,101)",
	"rgb(110,110,110)",
	"rgb(119,119,119)",

	"rgb(255,255,255)",
	"rgb(250,250,250)",
	"rgb(242,242,242)",
	"rgb(212,212,212)",
	"rgb(201,201,201)",
	"rgb(191,191,191)",
	"rgb(182,182,182)",
	"rgb(159,159,159)",
	"rgb(128,128,128)",
	"rgb(173,173,173)",
	"rgb(164,164,164)",
	"rgb(155,155,155)",
	"rgb(146,146,146)",
	"rgb(137,137,137)",
];

// https://github.com/kouzhudong/win2k/blob/ce6323f76d5cd7d136b74427dad8f94ee4c389d2/trunk/private/shell/win16/comdlg/color.c#L38-L43
// These are a fallback in case colors are not received from some driver.
// const default_basic_colors = [
// 	"#8080FF", "#80FFFF", "#80FF80", "#80FF00", "#FFFF80", "#FF8000", "#C080FF", "#FF80FF",
// 	"#0000FF", "#00FFFF", "#00FF80", "#40FF00", "#FFFF00", "#C08000", "#C08080", "#FF00FF",
// 	"#404080", "#4080FF", "#00FF00", "#808000", "#804000", "#FF8080", "#400080", "#8000FF",
// 	"#000080", "#0080FF", "#008000", "#408000", "#FF0000", "#A00000", "#800080", "#FF0080",
// 	"#000040", "#004080", "#004000", "#404000", "#800000", "#400000", "#400040", "#800040",
// 	"#000000", "#008080", "#408080", "#808080", "#808040", "#C0C0C0", "#400040", "#FFFFFF",
// ];
// Grabbed with Color Cop from the screen with Windows 98 SE running in VMWare
const basic_colors = [
	"#FF8080", "#FFFF80", "#80FF80", "#00FF80", "#80FFFF", "#0080FF", "#FF80C0", "#FF80FF",
	"#FF0000", "#FFFF00", "#80FF00", "#00FF40", "#00FFFF", "#0080C0", "#8080C0", "#FF00FF",
	"#804040", "#FF8040", "#00FF00", "#008080", "#004080", "#8080FF", "#800040", "#FF0080",
	"#800000", "#FF8000", "#008000", "#008040", "#0000FF", "#0000A0", "#800080", "#8000FF",
	"#400000", "#804000", "#004000", "#004040", "#000080", "#000040", "#400040", "#400080",
	"#000000", "#808000", "#808040", "#808080", "#408080", "#C0C0C0", "#400040", "#FFFFFF",
];
// Note: this array gets modified even though the reference to it is constant.
const custom_colors = [
	"#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
	"#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
];

const lerp = (a, b, b_ness) => a + (b - a) * b_ness;

const color_ramp = (num_colors, start_hsla, end_hsla) =>
	Array(num_colors).fill().map((_undefined, ramp_index, array) => {
		// TODO: should this use (array.length - 1)?
		const h = lerp(start_hsla[0], end_hsla[0], ramp_index / array.length);
		const s = lerp(start_hsla[1], end_hsla[1], ramp_index / array.length);
		const l = lerp(start_hsla[2], end_hsla[2], ramp_index / array.length);
		const a = lerp(start_hsla[3], end_hsla[3], ramp_index / array.length);
		return `hsla(${h}deg, ${s}%, ${l}%, ${a})`;
	});

/**
 * @returns {(string | CanvasPattern)[]}  A palette of colors and patterns for the Winter theme.
 */
const get_winter_palette = () => {
	const make_stripe_patterns = (reverse) => [
		make_stripe_pattern(reverse, [
			"hsl(166, 93%, 38%)",
			"white",
		]),
		make_stripe_pattern(reverse, [
			"white",
			"hsl(355, 78%, 46%)",
		]),
		make_stripe_pattern(reverse, [
			"hsl(355, 78%, 46%)",
			"white",
			"white",
			"hsl(355, 78%, 46%)",
			"hsl(355, 78%, 46%)",
			"hsl(355, 78%, 46%)",
			"white",
			"white",
			"hsl(355, 78%, 46%)",
			"white",
		], 2),
		make_stripe_pattern(reverse, [
			"hsl(166, 93%, 38%)",
			"white",
			"white",
			"hsl(166, 93%, 38%)",
			"hsl(166, 93%, 38%)",
			"hsl(166, 93%, 38%)",
			"white",
			"white",
			"hsl(166, 93%, 38%)",
			"white",
		], 2),
		make_stripe_pattern(reverse, [
			"hsl(166, 93%, 38%)",
			"white",
			"hsl(355, 78%, 46%)",
			"white",
		], 2),
	];
	return [
		"black",
		// green
		"hsl(91, 55%, 81%)",
		"hsl(142, 57%, 64%)",
		"hsl(166, 93%, 38%)",
		"#04ce1f", // elf green
		"hsl(159, 93%, 16%)",
		// red
		"hsl(2, 77%, 27%)",
		"hsl(350, 100%, 50%)",
		"hsl(356, 97%, 64%)",
		// brown
		"#ad4632",
		"#5b3b1d",
		// stripes
		...make_stripe_patterns(false),
		// white to blue
		...color_ramp(
			6,
			[200, 100, 100, 100],
			[200, 100, 10, 100],
		),
		// pink
		"#fcbaf8",
		// silver
		"hsl(0, 0%, 90%)",
		"hsl(22, 5%, 71%)",
		// gold
		"hsl(48, 82%, 54%)",
		"hsl(49, 82%, 72%)",
		// stripes
		...make_stripe_patterns(true),
	];
};


export {
	basic_colors, custom_colors, default_palette, get_winter_palette, monochrome_palette_as_colors
};
// Temporary globals until all dependent code is converted to ES Modules
window.default_palette = default_palette; // used by app-state.js
