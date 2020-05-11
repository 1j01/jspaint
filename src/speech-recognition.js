(function() {

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
// const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

window.speech_recognition_available = !!(SpeechRecognition && SpeechGrammarList);

if (!window.speech_recognition_available) {
	return;
}

const recognitionFixes = {
	// colors
	"Rhett": "red",
	"Brett": "red",
	"friend": "red",
	"hello": "yellow",
	"grave": "green",
	"the ruse": "maroon",
	"the wren": "maroon",
	"Ren": "maroon",
	"Arun": "maroon",
	"cream": "green",
	"LiteBlue": "light blue",
	"crown": "brown",
	"ombre": "umbre",
	"tan-tan": "tan tan",
	"pan": "tan",
	
	// interpreted as symbols
	":-)": "smiley face", // so that it can be searched for on Bing for images
	":-(": "sad face", // may also be from "frowny face"

	// commands/misc
	"slick to the": "select the",
	"like the": "select the",
	"to all": "tool",
	"stool": "tool",
	"tour": "tool",
	"draught": "draw a",
	"try": "draw", // seems too general - (unless you previously told it to draw something...) - but it keeps coming up!
	// "drag": "draw a", // too general
	"try picture": "draw a picture",

	// Free-Form Select
	"state farm": "freeform",
	// Select
	"flekstore": "select tool",
	"select one": "select tool",
	"selectel": "select tool",
	// Eraser/Color Eraser
	"tracer": "eraser",
	"grace": "erase",
	"rapper": "rubber",
	"robber": "rubber",
	"racing": "eraser",
	// Fill With Color
	"tail with color": "fill with color",
	"pickpocket": "paint bucket",
	"pink bucket": "paint bucket",
	"pillbox hat": "fill bucket",
	"pill lookup": "fill bucket",
	"tell bucket": "fill bucket",
	"phil luckett": "fill bucket",
	"fel bucket": "fill bucket",
	"phil bucket": "fill bucket",
	"bobcat": "bucket",
	"tell tool": "fill tool",
	"till tool": "fill tool",
	"delta": "fill tool",
	"tilt": "fill tool",
	// Pick Color
	// Magnifier
	"loop": "loupe",
	// Pencil
	"penn": "pen",
	// Brush
	// Airbrush
	"hair brush": "airbrush",
	// Text
	"x2": "text tool",
	"text talk": "text tool",
	"hacks": "text",
	"pex tool": "text tool",
	// Line
	"blind": "line tool",
	"mine": "line",
	// Curve
	"careful": "curve tool",
	"capital": "curve tool",
	"curveball": "curve tool",
	"curved wall": "curve tool",
	"creve coeur": "curve tool",
	"busy acre": "bezier curve",
	"sheriff": "curve",
	"leaving bye": "wavy line",
	"weave": "wave",
	"cosign": "cosine",
	"co-sign": "cosine",
	// Rectangle
	// Polygon
	// Ellipse
	"lips": "ellipse",
	"clips": "ellipse",
	"eclipse": "ellipse",
	"flip store": "ellipse tool",
	"toefl": "oval",
	"offal": "oval",
	"google": "oval",
	"hopeful": "oval",
	"duval": "oval",
	"oporto": "oval tool",
	// Rounded Rectangle
	"mandy tatinkin": "rounded rectangle",
	"random rectangles": "rounded rectangle",
	"random rectangle": "rounded rectangle",
};
const colorNames = [ 'aqua', 'azure', 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate', 'coral', 'crimson', 'cyan', 'fuchsia', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'indigo', 'ivory', 'khaki', 'lavender', 'lime', 'linen', 'magenta', 'maroon', 'moccasin', 'navy', 'olive', 'orange', 'orchid', 'peru', 'pink', 'plum', 'purple', 'red', 'salmon', 'sienna', 'silver', 'snow', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'white', 'yellow'];
const toolNames = tools.map((tool)=> tool.speech_recognition).flat();
// @TODO: "click [on] X"?
// @TODO: select foreground/background/ternary color specifically
const grammar = `#JSGF V1.0;
grammar jspaintCommands;
<color> = ${colorNames.join(' | ')};
<tool_name> = ${toolNames.join(' | ')};
<tool> = [the] <tool_name> [tool];
<pick-verb> = select | pick | choose | use | activate | "pick up" | grab;
public <command> = [<pick-verb>] (<color> | <tool>);
`;

const recognition = new SpeechRecognition();
const speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

window.speech_recognition_active = false;

window.enable_speech_recognition = function() {
	if (!window.speech_recognition_active) {
		window.speech_recognition_active = true;
		recognition.start();
	}
};
window.disable_speech_recognition = function() {
	if (window.speech_recognition_active) {
		window.speech_recognition_active = false;
		recognition.stop();
	}
};

recognition.onresult = function(event) {
	if (document.visibilityState !== "visible") {
		return;
	}
	// The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
	// The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
	// It has a getter so it can be accessed like an array
	// The first [0] returns the SpeechRecognitionResult at the last position.
	// Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
	// These also have getters so they can be accessed like arrays.
	// The second [0] returns the SpeechRecognitionAlternative at position 0.
	// We then return the transcript property of the SpeechRecognitionAlternative object
	console.log(event.results);
	let command = event.results[0][0].transcript;
	console.log(`Result received: "${command}"`);
	console.log('Confidence: ' + event.results[0][0].confidence);
	command = command.toLowerCase();
	if (!command.match(/^draw /i) && !(document.activeElement && document.activeElement.matches("input, textarea, [contenteditable]"))) {
		for (const [bad, good] of Object.entries(recognitionFixes)) {
			if (bad.match(/^\W|\W$/)) {
				command = command.replace(new RegExp(escapeRegExp(bad), "ig"), good);
			} else {
				command = command.replace(new RegExp(`\\b${escapeRegExp(bad)}\\b`, "ig"), good);
			}
		}
	}
	console.log(`After any fixes: "${command}"`);
	interpret_command(command, true);
};

recognition.onspeechend = function() {
	recognition.addEventListener("end", ()=> {
		recognition.start();
	}, {once: true});
	recognition.stop();
};

recognition.onnomatch = function(event) {
	if (document.visibilityState !== "visible") {
		return;
	}
	$status_text.text("Speech not recognized.");
};

recognition.onstart = function(event) {
	window.speech_recognition_active = true;
};
recognition.onend = function(event) {
	window.speech_recognition_active = false;
};

recognition.onerror = function(event) {
	if (event.error.toString().match(/no-speech/)) {
		try {
			recognition.start();
		} catch(error) {
			recognition.addEventListener("end", ()=> {
				recognition.start();
			}, {once: true});
		}
	} else {
		$status_text.text('Error occurred in speech recognition: ' + event.error);
		console.log('Error occurred in speech recognition:', event.error);
		// window.speech_recognition_active = false;
	}
};

window.interpret_command = (command, default_to_entering_text)=> {
	let best_match_fn;
	let best_match_text = "";
	for (const color of colorNames) {
		if (` ${command} `.toLowerCase().indexOf(` ${color} `) !== -1) {
			if (color.length > best_match_text.length) {
				best_match_text = color;
				best_match_fn = ((color)=> ()=> {
					colors.foreground = color;
					$G.trigger("option-changed");
				})(color);
			}
		}
	}
	for (const tool of tools) {
		for (const base_tool_phrase of tool.speech_recognition) {
			// Note: if "select" wasn't matched here, the phrase "select text" would select the Select tool instead of the Text tool (because "select" is longer than "text")
			const select_tool_match = command.match(new RegExp(`\\b(?:(?:select|pick|choose|use|activate|pick up|grab) )?(?:the )?${escapeRegExp(base_tool_phrase)}(?: tool)?\\b`, "i"));
			if (select_tool_match) {
				if (select_tool_match[0].length > best_match_text.length) {
					best_match_text = select_tool_match[0];
					best_match_fn = ((tool)=> ()=> {
						select_tool(tool);
					})(tool);
				}
			}
		}
	}
	if (!best_match_text) {
		// @TODO: clipboard as a source.. but you might want to just draw the clipboard directly to the canvas,
		// so maybe it should be limited to saying "sketch"/"doodle"/"do a rendition of"
		// /(?:sketch|doodle|do a (?:rendition|sketch|doodle) of) (?:the (?:contents of |(?:image|picture|data) on the )|(?:what's|what is) on the )?clipboard/i
		const draw_match = command.match(/(?:draw|sketch|doodle|render|(?:paint|draw|do|render|sketch) (?:a picture|an image|a drawing|a painting|a rendition|a sketch|a doodle) of) (?:an? )?(.+)/i);
		if (draw_match) {
			best_match_text = draw_match[0];
			best_match_fn = async ()=> {
				const subject_matter = draw_match[1];
				const results = await find_clipart(subject_matter);
				// @TODO: select less complex images (less file size to width, say?) maybe, and/or better semantic matches by looking for the search terms in the title?
				// detect gradients / spread out histogram at least, and reject based on that
				let image_url = results[~~(Math.random() * results.length)].image_url;
				console.log("Using source image:", image_url);
				if (!image_url.match(/^data:/)) {
					image_url = `https://jspaint-cors-proxy.herokuapp.com/${image_url}`;
				}
				const img = new Image();
				img.crossOrigin = "Anonymous";
				img.onload = ()=> {
					// @TODO: find an empty spot on the canvas for the sketch, smaller if need be
					const max_sketch_width = 500;
					const max_sketch_height = 500;
					let aspect_ratio = img.width / img.height;
					let width = Math.min(img.width, max_sketch_width);
					let height = Math.min(img.height, max_sketch_height);
					if (width / height < aspect_ratio) {
						height = width / aspect_ratio;
					}
					if (width / height > aspect_ratio) {
						width = height * aspect_ratio;
					}
					const img_canvas = make_canvas(width, height);
					img_canvas.ctx.drawImage(img, 0, 0, width, height);
					const image_data = img_canvas.ctx.getImageData(0, 0, img_canvas.width, img_canvas.height);
					resize_canvas_without_saving_dimensions(Math.max(canvas.width, image_data.width), Math.max(canvas.height, image_data.height));
					trace_and_sketch(image_data);
					// @TODO: visible cancel button, and Escape key handling, in addition to the "stop" voice command
				};
				img.src = image_url;
			};
		}
	}
	// after the above to allow for "draw a stop sign"
	if (!best_match_text) {
		const stop_match = command.match(/\b(?:stop|end|cease|(?:that's|that is) enough|enough of that|terminate|halt|put an end to(?: this)?|break off)\b/i);
		if (stop_match) {
			best_match_text = stop_match[0];
			best_match_fn = ()=> {
				window.stopSimulatingGestures && window.stopSimulatingGestures();
				window.trace_and_sketch_stop && window.trace_and_sketch_stop();
			};
		}
	}
	if (document.activeElement && document.activeElement.matches("input, textarea, [contenteditable]")) {
		const new_line_match = command.match(/^(?:new line|newline|line break|return|enter|carriage return|)$|\b(?:(?:insert|add|put|put in|input)(?: an?)? (?:new line|newline|line break|return|enter|carriage return))\b/i);
		if (new_line_match) {
			if (new_line_match[0].length > best_match_text.length) {
				best_match_text = new_line_match[0];
				best_match_fn = ()=> {
					document.execCommand("insertText", false, "\n");
				};
			}
		}
	}
	if (window.textbox) {
		const stop_match = command.match(/\b(?:(?:finish(?:ed)?|done)(?: with)? (text|text input|textbox|text box|writing))\b/i);
		if (stop_match) {
			best_match_text = stop_match[0];
			best_match_fn = deselect;
		}
	}
	if (window.selection) {
		const stop_match = command.match(/\b(?:(?:finish(?:ed)?|done)(?: with)? selection|deselect|unselect)\b/i);
		if (stop_match) {
			best_match_text = stop_match[0];
			best_match_fn = deselect;
		}
	}
	if (!best_match_text && default_to_entering_text) {
		if (document.activeElement && document.activeElement.matches("input, textarea, [contenteditable]")) {
			best_match_text = command;
			const text_to_insert = command.replace(/new[ -]?line|line[ -]?break|carriage return/g, "\n");
			best_match_fn = ()=> {
				document.execCommand("insertText", false, text_to_insert);
			};
		}
	}

	// @TODO: more nuanced command matching, probably multiplying confidence levels together
	// and giving lower confidence for things that start in the middle of the phrase
	// and like higher confidence in "stop" if it's actively drawing

	if (best_match_text) {
		$status_text.html(`Speech:&nbsp;<span style="white-space: pre;">${command.replace(best_match_text, (important_text)=> `<b>${important_text}</b>`)}</span>`);
		console.log(`Interpreting command "${command}" as "${best_match_text}"`);
		best_match_fn();
	} else {
		$status_text.text(`Speech: ${command}`);
		console.log(`No interpretation for command "${command}"`);
	}
};

window.trace_and_sketch = (subject_imagedata)=> {
	window.trace_and_sketch_stop && window.trace_and_sketch_stop();

	// const subject_imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
	// const pal = palette.map((color)=> get_rgba_from_color(color)).map(([r, g, b, a])=> ({r, g, b, a}));
	const tracedata = ImageTracer.imagedataToTracedata(subject_imagedata, { ltres:1, qtres:0.01, scale:10, /*pal,*/ numberofcolors: 6, });
	const {layers} = tracedata;
	const brush = get_tool_by_name("Brush");
	select_tool(brush);

	let layer_index = 0;
	let path_index = 0;
	let segment_index = 0;
	let active_path;
	window.sketching_iid = setInterval(()=> {
		const layer = layers[layer_index];
		if (!layer) {
			clearInterval(window.sketching_iid);
			return;
		}
		const path = layer[path_index];
		if (!path) {
			path_index = 0;
			segment_index = 0;
			layer_index += 1;
			return;
		}
		const segment = path.segments[segment_index];
		if (!segment) {
			segment_index = 0;
			path_index += 1;
			brush.pointerup(ctx, pointer.x, pointer.y);
			return;
		}
		let {x1, y1, x2, y2} = segment;
		if (path !== active_path) {
			pointer_previous = {x: x1, y: y1};
			pointer = {x: x1, y: y1};
			brush.pointerdown(ctx, x1, y1);
			active_path = path;
		}
		pointer_previous = {x: x1, y: y1};
		pointer = {x: x2, y: y2};
		brush.paint();
		pointer_active = true;
		pointer_over_canvas = true;
		update_helper_layer();
		segment_index += 1;
	}, 20);
};
window.trace_and_sketch_stop = ()=> {
	clearInterval(window.sketching_iid);
	pointer_active = false;
	pointer_over_canvas = false;
};

function find_clipart(query) {
	const bing_url = new URL(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&qft=+filterui:photo-clipart+filterui:license-L1&FORM=IRFLTR`)
	return fetch(`https://jspaint-cors-proxy.herokuapp.com/${bing_url}`)
		.then(response=> response.text())
		.then((html)=> {
			// handle relative data-src
			html = html.replace(
				/((?:data-src)=["'])(?!(?:https?:|data:))(\/?)/gi,
				($0, $1, $2)=> `${$1}${bing_url.origin}${$2 ? bing_url.pathname : ""}`
			);
			// handle relative src and href in a less error-prone way, with a <base> tag
			const doc = new DOMParser().parseFromString(html, "text/html");
			const $html = $(doc.documentElement);
			const base = doc.createElement("base");
			base.href = bing_url.origin + bing_url.pathname;
			doc.head.appendChild(base);

			window.search_page_html = html;
			window.search_page_$html = $html;
			console.log("window.search_page_html and window.search_page_$html are a available for debugging");

			const validate_item = (item)=> item.image_url && (item.image_url.match(/^data:/) ? item.image_url.length > 1000 : true);

			let items = $html.find("[m]").toArray()
				.map((el)=> el.getAttribute("m"))
				.map((json)=> {
					try {
						return JSON.parse(json);
					} catch(error) {
						return null;
					}
				})
				.filter((maybe_parsed)=> maybe_parsed && maybe_parsed.murl)
				.map(({murl, t})=> ({image_url: murl, title: t || ""}))
				.filter(validate_item);
			
			// fallback to thumbnails in case they get rid of the "m" attribute (thumbnails are not as good, more likely to be jpeg)
			if (items.length === 0) {
				console.log("Fallback to thumbnails");
				items = $html.find("img.mimg").toArray()
					.map((el)=> ({image_url: el.src || el.dataset.src, title: ""}))
					.filter(validate_item);
			}
			// fallback in case they also change the class for images (this may match totally irrelevant things)
			if (items.length === 0) {
				console.log("Fallback to most imgs");
				items = $html.find("img").toArray()
					.filter((el)=> !el.closest("[role='navigation'], nav")) // ignore "Related searches", "Refine your search" etc.
					.map((el)=> ({image_url: el.src || el.dataset.src, title: ""}))
					.filter(validate_item);
			}
			console.log(`Search results for '${query}':`, items);
			if (items.length === 0) {
				throw new Error(`failed to get clipart: no results returned for query '${query}'`);
			}
			return items;
		})
}

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
  
})();