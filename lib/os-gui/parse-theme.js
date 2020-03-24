function parseINIString(data){
	var regex = {
		section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
		param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
		comment: /^\s*;.*$/
	};
	var value = {};
	var lines = data.split(/[\r\n]+/);
	var section = null;
	lines.forEach(function(line){
		if(regex.comment.test(line)){
			return;
		}else if(regex.param.test(line)){
			var match = line.match(regex.param);
			if(section){
				value[section][match[1]] = match[2];
			}else{
				value[match[1]] = match[2];
			}
		}else if(regex.section.test(line)){
			var match = line.match(regex.section);
			value[match[1]] = {};
			section = match[1];
		}else if(line.length == 0 && section){
			section = null;
		};
	});
	return value;
}

// takes a CSSStyleDeclaration or simple object of CSS properties
function renderThemeGraphics(cssProperties) {
	var getProp = (propName)=> cssProperties.getPropertyValue ? cssProperties.getPropertyValue(propName) : cssProperties[propName];

	var canvas = document.createElement("canvas");
	canvas.width = canvas.height = 2;
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = getProp("--ButtonFace");
	ctx.fillRect(0, 1, 1, 1);
	ctx.fillRect(1, 0, 1, 1);
	ctx.fillStyle = getProp("--ButtonHilight");
	ctx.fillRect(0, 0, 1, 1);
	ctx.fillRect(1, 1, 1, 1);
	var checker = `url("${canvas.toDataURL()}")`;

	var scrollbar_size = parseInt(getProp("--scrollbar-size"));
	if (!isFinite(scrollbar_size)) {
		scrollbar_size = 13;
	}
	var scrollbar_button_inner_size = scrollbar_size - 4;
	
	// I don't know the exact formula, so approximate and special-case it for now
	// (It may very well *be* special cased, tho)
	var arrow_size = Math.floor(0.3 * scrollbar_size);
	if (scrollbar_size < 16 && scrollbar_size > 13) arrow_size -= 1;

	var arrow_width = arrow_size * 2 - 1;

	var arrow_canvas = document.createElement("canvas");
	var arrow_ctx = arrow_canvas.getContext("2d");
	arrow_canvas.width = arrow_width;
	arrow_canvas.height = arrow_size;
	arrow_ctx.fillStyle = "white";
	for (let y = 0; y < arrow_size; y += 1) {
		for (let x = y; x < arrow_width - y; x += 1) {
			arrow_ctx.fillRect(x, y, 1, 1);
		}
	}

	canvas.width = scrollbar_button_inner_size * 4;
	canvas.height = scrollbar_button_inner_size;
	let i = 0;
	for (let horizontal = 0; horizontal < 2; horizontal += 1) {
		for (let decrement = 0; decrement < 2; decrement += 1) {
			ctx.save();
			ctx.translate(i * scrollbar_button_inner_size, 0);
			ctx.translate(scrollbar_button_inner_size/2, scrollbar_button_inner_size/2);
			// ctx.rotate(i * Math.PI / 2);
			if (horizontal) {
				ctx.rotate(-Math.PI / 2);
			}
			if (decrement) {
				ctx.scale(1, -1);
			}
			ctx.translate(-scrollbar_button_inner_size/2, -scrollbar_button_inner_size/2);
			ctx.drawImage(arrow_canvas, ~~(scrollbar_button_inner_size/2-arrow_width/2), ~~(scrollbar_button_inner_size/2-arrow_size/2));
			ctx.restore();
			i += 1;
		}
	}

	ctx.save();
	ctx.globalCompositeOperation = "source-in";
	ctx.fillStyle = getProp("--ButtonText");
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	var scrollbar_arrows_ButtonText = `url("${canvas.toDataURL()}")`;
	ctx.fillStyle = getProp("--GrayText");
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	var scrollbar_arrows_GrayText = `url("${canvas.toDataURL()}")`;
	ctx.fillStyle = getProp("--ButtonHilight");
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	var scrollbar_arrows_ButtonHilight = `url("${canvas.toDataURL()}")`;
	// ctx.fillStyle = "red";
	// ctx.fillRect(0, 0, canvas.width, canvas.height);
	// canvas.style.background = "rgba(0, 0, 0, 0.2)";
	// $("h1").append(arrow_canvas).append(canvas);
	ctx.restore();

	function border_image(border_size, svg_contents) {
		var base_size = 8;
		var border_size = border_size;
		var scale = 32;
		var slice_size = border_size * scale;
		var view_size = base_size * scale;
		// transform causes janky buggy garbage
		// var svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${view_size}px" height="${view_size}px" viewBox="0 0 ${view_size} ${view_size}">
		// 	<g transform="scale(${scale})">
		// 		${svg_contents}
		// 	</g>
		// </svg>`;
		var svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${view_size}px" height="${view_size}px" viewBox="0 0 ${view_size} ${view_size}">
			${svg_contents.replace(/(d|x|y|width|height|stroke-width)="[^"]*"/g, (attr)=> attr.replace(/\d+/g, (n)=> n * scale))}
		</svg>`;
		var url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
		return `url("${url}") ${slice_size} / ${border_size}px`;
	}

	var button_active_border_image = border_image(2, `
		<path d="M0 0h8v8h-8v-8z" fill="${getProp("--ButtonDkShadow")}"/>
		<path d="M1 1h6v6h-6v-6z" fill="${getProp("--ButtonShadow")}"/>
		<path d="M2 2h4v4h-4v-4z" fill="${getProp("--ButtonFace")}"/>
	`);
	var button_default_active_border_image = border_image(2, `
		<path d="M0 0h8v8h-8v-8z" fill="${getProp("--ButtonDkShadow")}"/>
		<path d="M1 1h6v6h-6v-6z" fill="${getProp("--ButtonShadow")}"/>
		<path d="M2 2h4v4h-4v-4z" fill="${getProp("--ButtonFace")}"/>
		<rect x="0" y="0" width="8" height="8" stroke-width="2" stroke="${getProp("--WindowFrame")}" fill="none"/>
	`);
	// TODO: rename
	var button_normal_border_image = border_image(2, `
		<path d="M0 0h7v1h-6v6h-1v-7z" fill="${getProp("--ButtonHilight")}"/>
		<path d="M7 0h1v8h-8v-1h7v-7z" fill="${getProp("--ButtonDkShadow")}"/>
		<path d="M1 1h5v1h-4v4h-1v-5z" fill="${getProp("--ButtonLight")}"/>
		<path d="M6 1h1v6h-6v-1h5v-5z" fill="${getProp("--ButtonShadow")}"/>
		<path d="M2 2h4v4h-4v-4z" fill="${getProp("--ButtonFace")}"/>
	`);
	var inset_deep_border_image = border_image(2, `
		<path d="M0 0h7v1h-6v6h-1v-7z" fill="${getProp("--ButtonDkShadow")}"/>
		<path d="M7 0h1v8h-8v-1h7v-7z" fill="${getProp("--ButtonHilight")}"/>
		<path d="M1 1h5v1h-4v4h-1v-5z" fill="${getProp("--ButtonShadow")}"/>
		<path d="M6 1h1v6h-6v-1h5v-5z" fill="${getProp("--ButtonLight")}"/>
		<path d="M2 2h4v4h-4v-4z" fill="${getProp("--ButtonFace")}"/>
	`);
	var button_default_border_image = border_image(3, `
		<path d="M0 0h8v8h-8v-8z" fill="${getProp("--ButtonDkShadow")}"/>
		<path d="M1 1h5v1h-4v4h-1v-5z" fill="${getProp("--ButtonHilight")}"/>
		<path d="M2 2h3v1h-2v2h-1v-3z" fill="${getProp("--ButtonLight")}"/>
		<path d="M5 2h1v4h-4v-1h3v-3z" fill="${getProp("--ButtonShadow")}"/>
		<path d="M3 3h2v2h-2v-2z" fill="${getProp("--ButtonFace")}"/>
		<rect x="0" y="0" width="8" height="8" stroke-width="2" stroke="${getProp("--WindowFrame")}" fill="none"/>
	`);

	return {
		"--checker": checker,
		"--button-active-border-image": button_active_border_image,
		"--button-normal-border-image": button_normal_border_image,
		"--inset-deep-border-image": inset_deep_border_image,
		"--button-default-border-image": button_default_border_image,
		"--button-default-active-border-image": button_default_active_border_image,
		"--scrollbar-arrows-ButtonText": scrollbar_arrows_ButtonText,
		"--scrollbar-arrows-GrayText": scrollbar_arrows_GrayText,
		"--scrollbar-arrows-ButtonHilight": scrollbar_arrows_ButtonHilight,
		"--scrollbar-size": `${scrollbar_size}px`,
		"--scrollbar-button-inner-size": `${scrollbar_button_inner_size}px`,
	};
}

// Parse NonClientMetrics
// https://docs.microsoft.com/en-us/windows/win32/controls/themesfileformat-overview?redirectedfrom=MSDN#metrics-section
// https://docs.microsoft.com/en-us/windows/win32/winprog/windows-data-types

// using https://github.com/toji/js-struct

// var NonClientMetricsStruct = Struct.create(
//     Struct.uint32("cbSize"),
//     Struct.int32("iBorderWidth"),
//     Struct.int32("iScrollWidth"),
//     Struct.int32("iScrollHeight"),
//     Struct.int32("iCaptionWidth"),
//     Struct.int32("iCaptionHeight"),
// 	// after that, it may be W or A
// //   LOGFONTW lfCaptionFont;
// //   int      iSmCaptionWidth;
// //   int      iSmCaptionHeight;
// //   LOGFONTW lfSmCaptionFont;
// //   int      iMenuWidth;
// //   int      iMenuHeight;
// //   LOGFONTW lfMenuFont;
// //   LOGFONTW lfStatusFont;
// //   LOGFONTW lfMessageFont;
// //   int      iPaddedBorderWidth;
// );

// var NonClientMetrics_buffer = new Uint8Array(NonClientMetrics_string.split(" ").map((str)=> parseInt(str))).buffer;

// NonClientMetricsStruct.readStructs(NonClientMetrics_buffer, 0, 1)[0];

function parseThemeFileString(themeIni) {
	// .theme is a renamed .ini text file
	// .themepack is a renamed .cab file, and parsing it as .ini seems to work well enough for the most part, as the .ini data appears in plain,
	// but it may not if compression is enabled for the .cab file
	var theme = parseINIString(themeIni);
	var colors = theme["Control Panel\\Colors"];
	if (!colors) {
		alert("Invalid theme file, no [Control Panel\\Colors] section");
		console.log(theme);
	}
	for (var k in colors) {
		// for .themepack file support, just ignore bad keys that were parsed
		if (k.match(/\W/)) {
			delete colors[k];
		} else {
			colors[k] = `rgb(${colors[k].split(" ").join(", ")})`;
		}
	}

	var cssProperties = {};
	for (var k in colors) {
		cssProperties[`--${k}`] = colors[k];
	}

	cssProperties = Object.assign(renderThemeGraphics(cssProperties), cssProperties);

	return cssProperties;
}

function applyCSSProperties(cssProperties, element=document.documentElement) {
	for (var k in cssProperties) {
		element.style.setProperty(k, cssProperties[k]);
	}
}

function makeThemeCSSFile(cssProperties) {
	var css = `
/* This is a generated file. */
:root {
`;
	for (var k in cssProperties) {
		css += `\t${k}: ${cssProperties[k]};\n`;
	}
	css += `}
`;
	return css;
}
