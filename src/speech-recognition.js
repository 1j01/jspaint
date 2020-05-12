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

	// Eye Gaze Mode
	"i gaze": "eye gaze",
	"auggies": "eye gaze",
	"a gizmodo": "eye gaze mode",
	"a gizmo": "eye gaze mode",
	"ideas mode": "eye gaze mode",
	"agee's mode": "eye gaze mode",
	"aggie's mode": "eye gaze mode",
	"iggy's mode": "eye gaze mode",
	"iggie's mode": "eye gaze mode",
	"tyga ligase mode": "toggle eye gaze mode",
	"puggle auggies mode": "toggle eye gaze mode",
	"tug ligase mode": "toggle eye gaze mode",
	"tonka ligase mode": "toggle eye gaze mode",
	"taco eye gaze mode": "toggle eye gaze mode",

	// Eye Gaze Mode: Pause/Resume Dwell Clicking
	"tangled dwell clicking": "toggle dwell clicking",
	"michael dwelle clicking": "toggle dwell clicking",
	"toggled dwell clicking": "toggle dwell clicking",
	"call goldwell clicking": "toggle dwell clicking",
	"toggled well clicking": "toggle dwell clicking",
	"toggled dwele clicking": "toggle dwell clicking",
	"toggled dwelle clicking": "toggle dwell clicking",
	"toggled while cooking": "toggle dwell clicking",
	"toggled wildflecken": "toggle dwell clicking",
	"puggle dwell clicking": "toggle dwell clicking",
	"tangled while clicking": "toggle dwell clicking",
	"taco bell cooking": "toggle dwell clicking",
	"a goldwell clicking": "toggle dwell clicking",
	"toggled while clicking": "toggle dwell clicking",
	"toggle do i click in": "toggle dwell clicking",
	"tangled while cooking": "toggle dwell clicking",
	"tacos while cutting": "toggle dwell clicking",
	"call coldwell clicking": "toggle dwell clicking",
	"taco bell clicking": "toggle dwell clicking",
	"tangled dwell clicks": "toggle dwell clicks",
	"michael dwelle clicks": "toggle dwell clicks",
	"toggled dwell clicks": "toggle dwell clicks",
	"call goldwell clicks": "toggle dwell clicks",
	"toggled well clicks": "toggle dwell clicks",
	"toggled dwele clicks": "toggle dwell clicks",
	"toggled dwelle clicks": "toggle dwell clicks",
	"toggle do i clicks": "toggle dwell clicks",
	"puggle dwell clicks": "toggle dwell clicks",
	"tangled while clicks": "toggle dwell clicks",
	"a goldwell clicks": "toggle dwell clicks",
	"toggled while clicks": "toggle dwell clicks",
	"call coldwell clicks": "toggle dwell clicks",
	"talk about cliques": "toggle dwell clicks",
	"target wall clocks": "toggle dwell clicks",
	"talk about sex": "toggle dwell clicks",
	"toggled welplex": "toggle dwell clicks",
	"taco bell clicks": "toggle dwell clicks",
	"12 quickening": "dwell clicking",
	"12 clicking": "dwell clicking",
	"12 cooking": "dwell clicking",
	"to a clicking": "dwell clicking",
	"12 clicks": "dwell clicks",
	"12 clicker": "dwell clicker",
	"to a click": "dwell click",
	"dwele clicking": "dwell clicking",
	"dwele click": "dwell click",
	"dwele clicks": "dwell clicks",
	"dwele clicker": "dwell clicker",
	"dwelle clicking": "dwell clicking",
	"dwelle click": "dwell click",
	"dwelle clicks": "dwell clicks",
	"dwelle clicker": "dwell clicker",
	"pasta while cutting": "pause dwell clicking",
	"pasquale cooking": "pause dwell clicking",
	"pause while clicking": "pause dwell clicking",
	"pause while cooking": "pause dwell clicking",
	"unpause while clicking": "unpause dwell clicking",
	"unpause while cooking": "unpause dwell clicking",
	"stop while clicking": "stop dwell clicking",
	"stop while cooking": "stop dwell clicking",
	"stopped while clicking": "stop dwell clicking",
	"stopped while cooking": "stop dwell clicking",
	"stopped wall clocks": "stop dwell clicks",
	"disabled while clicking": "disable dwell clicking",
	"disabled while cooking": "disable dwell clicking",
	"disabled wall clocks": "disable dwell clicks",
	"disable while clicking": "disable dwell clicking",
	"disable while cooking": "disable dwell clicking",
	"disable wall clocks": "disable dwell clicks",
	"mabel dwell clicking": "enable dwell clicking",
	"enable to walk clicking": "enable dwell clicking",
	"enabled while clicking": "enable dwell clicking",
	"enabled while cooking": "enable dwell clicking",
	"enabled wall clocks": "enable dwell clicks",
	"enable while clicking": "enable dwell clicking",
	"enable while cooking": "enable dwell clicking",
	"enable wall clocks": "enable dwell clicks",
	"stop wall clocks": "stop dwell clicks",
	"start wall clocks": "start dwell clicks",
	"start while cooking": "start dwell clicking",
	"start while clicking": "start dwell clicking",
	"resume while cooking": "resume dwell clicking",
	"resume while clicking": "resume dwell clicking",
	"resumed walk clicks": "resume dwell clicks",
	"startalk looking": "start dwell clicking",
	"dwell quickening": "dwell clicking",
	"dual clicking": "dwell clicking",
	"dual quickening": "dwell clicking",
	"dual cooking": "dwell clicking",
	"dwell cooking": "dwell clicking",
	"well clicking": "dwell clicking",
	"well quitting": "dwell clicking",
	"well clicks": "dwell clicks",

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
// @TODO: select foreground/background/ternary color specifically

// @TODO: Is there a way to enable the grammar only as a hint, non-restrictively?
// Construct a grammar that just contains an English dictionary, and set it as lower weight?
// That might mess with / not work with things like "MC" in "MC Hammer", numbers, emoji, etc.
/*const grammar = `#JSGF V1.0;
grammar jspaintCommands;
<color> = ${colorNames.join(' | ')};
<tool_name> = ${toolNames.join(' | ')};
<tool> = [the] <tool_name> [tool];
<pick-verb> = select | pick | choose | use | activate | "pick up" | grab;
<stop> = stop | end | cease | (that's | that is) enough | enough of that | terminate | halt | put an end to [this] | break off;
// @TODO: is there an escape hatch for "any text here"?
<something> = [a|an] (something | thing | anything | dog | cat | house | mouse | bird | snake | tree | turtle | mountain | [smiley | smiling | happy | frowny | frowning | sad] face);
<draw> = draw | sketch | doodle | render | ((draw | sketch | doodle | render | do | paint) [a picture | an image | a drawing | a painting | a rendition | a sketch | a doodle) of]);
<draw-something> = <draw> <something>;
public <command> = [<pick-verb>] (<color> | <tool>) | <stop> | <draw-something>;
`;*/

const recognition = new SpeechRecognition();
// const speechRecognitionList = new SpeechGrammarList();
// speechRecognitionList.addFromString(grammar, 1);
// recognition.grammars = speechRecognitionList;
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
		if (` ${command} `.toLowerCase().indexOf(` ${color.toLowerCase()} `) !== -1) {
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

	const all_menu_items = [];
	const collect_menu_items = (menu)=> {
		for (const menu_item of menu) {
			all_menu_items.push(menu_item);
		}
		if (menu.submenu) {
			collect_menu_items(menu.submenu);
		}
	};
	Object.values(menus).forEach(collect_menu_items);

	for (const menu_item of all_menu_items) {
		if (menu_item.speech_recognition) {
			for (const menu_item_phrase of menu_item.speech_recognition) {
				if (` ${command} `.toLowerCase().indexOf(` ${menu_item_phrase.toLowerCase()} `) !== -1) {
					if (menu_item_phrase.length > best_match_text.length) {
						best_match_text = menu_item_phrase;
						best_match_fn = ((menu_item)=> ()=> {
							if (menu_item.checkbox) {
								menu_item.checkbox.toggle();
							} else {
								menu_item.action();
							}
						})(menu_item);
					}
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
			best_match_fn = ()=> {
				const subject_matter = draw_match[1];
				find_clipart(subject_matter).then((results)=> {
					
					// @TODO: select less complex images (less file size to width, say?) maybe, and/or better semantic matches by looking for the search terms in the title?
					// detect gradients / spread out histogram at least, and reject based on that
					let image_url = results[~~(Math.random() * results.length)].image_url;
					console.log("Using source image:", image_url);
					if (!image_url.match(/^data:/)) {
						image_url = `https://jspaint-cors-proxy.herokuapp.com/${image_url}`;
					}
					const img = new Image();
					img.crossOrigin = "Anonymous";
					img.onerror = ()=> {
						$status_text.text("Failed to load clipart.");
					};
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
					};
					img.src = image_url;
				}, (error)=> {
					if (error.code === "no-results") {
						$status_text.text(`No clipart found for '${subject_matter}'`);
					} else {
						show_error_message("Failed to find clipart.", error);
					}
				});
			};
		}
	}

	const buttons = $("button, label").toArray();
	
	for (const button of buttons) {
		// @TODO: button.dataset.speechRecognition (data-speech-recognition)
		const button_text = button.textContent || button.getAttribute("aria-label") || button.title;
		let button_text_phrases = [button_text];
		if (!button_text) {
			button_text_phrases = [];
			// console.log("Button inaccessible for speech recognition:", button);
		}
		if (button_text.match(/^(Okay|OK)$/i)) {
			button_text_phrases = ["Okay", "OK"];
		}
		if (button_text.match(/^(Pause Dwell Clicking)$/i)) {
			button_text_phrases = [
				"Toggle Dwell Clicking", "Toggle Dwell Clicks",
				"Rest Eye Gaze", "Rest Eyes",
				// disable stop pause
				"Disable Dwell Clicking", "Disable Eye Gaze", "Disable Gaze Clicking", "Disable Dwell Clicks", "Disable Gaze Clicks",
				"Stop Dwell Clicking", "Stop Eye Gaze", "Stop Gaze Clicking", "Stop Dwell Clicks", "Stop Gaze Clicks",
				"Pause Dwell Clicking", "Pause Eye Gaze", "Pause Gaze Clicking", "Pause Dwell Clicks", "Pause Gaze Clicks",
			];
		}
		if (button_text.match(/^(Resume Dwell Clicking)$/i)) {
			button_text_phrases = [
				"Toggle Dwell Clicking", "Toggle Dwell Clicks",
				// enable reenable re-enable start resume unpause un-pause
				"Enable Dwell Clicking", "Enable Eye Gaze", "Enable Gaze Clicking", "Enable Dwell Clicks", "Enable Gaze Clicks", 
				"Reenable Dwell Clicking", "Reenable Eye Gaze", "Reenable Gaze Clicking", "Reenable Dwell Clicks", "Reenable Gaze Clicks", 
				"Re-enable Dwell Clicking", "Re-enable Eye Gaze", "Re-enable Gaze Clicking", "Re-enable Dwell Clicks", "Re-enable Gaze Clicks", 
				"Start Dwell Clicking", "Start Eye Gaze", "Start Gaze Clicking", "Start Dwell Clicks", "Start Gaze Clicks", 
				"Resume Dwell Clicking", "Resume Eye Gaze", "Resume Gaze Clicking", "Resume Dwell Clicks", "Resume Gaze Clicks", 
				"Unpause Dwell Clicking", "Unpause Eye Gaze", "Unpause Gaze Clicking", "Unpause Dwell Clicks", "Unpause Gaze Clicks", 
				"Un-pause Dwell Clicking", "Un-pause Eye Gaze", "Un-pause Gaze Clicking", "Un-pause Dwell Clicks", "Un-pause Gaze Clicks", 
			];
		}
		// console.log(button, button_text, button_text_phrases);
		for (const button_text_phrase of button_text_phrases) {
			const match_phrases = [button_text_phrase, `click ${button_text_phrase}`, `click on ${button_text_phrase}`];
			for (const match_phrase of match_phrases) {
				// console.log(match_phrase, ` ${command} `.toLowerCase().indexOf(` ${match_phrase.toLowerCase()} `));
				if (` ${command} `.toLowerCase().indexOf(` ${match_phrase.toLowerCase()} `) !== -1) {
					if (match_phrase.length > best_match_text.length) {
						best_match_text = match_phrase;
						best_match_fn = ((button)=> ()=> {
							clickButtonVisibly(button);
						})(button);
					}
				}
			}
		}
	}

	// after the above to allow for "draw a stop sign", "stop dwell clicking"
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
				if (document.activeElement && document.activeElement.matches("input[type='number']")) {
					document.activeElement.value = command;
				} else {
					document.execCommand("insertText", false, text_to_insert);
				}
			};
		}
	}

	// @TODO: more nuanced command matching, probably multiplying confidence levels together
	// and giving lower confidence for things that start in the middle of the phrase
	// and like higher confidence in "stop" if it's actively drawing

	if (best_match_text) {
		$status_text.html(`Speech:&nbsp;<span style="white-space: pre;">${
			command.replace(new RegExp(escapeRegExp(best_match_text), "i"), (important_text)=> `<b>${important_text}</b>`)
		}</span>`);
		console.log(`Interpreting command "${command}" as "${best_match_text}"`);
		best_match_fn();
	} else {
		$status_text.text(`Speech: ${command}`);
		console.log(`No interpretation for command "${command}"`);
	}
};

window.trace_and_sketch = (subject_imagedata)=> {
	window.trace_and_sketch_stop && window.trace_and_sketch_stop();

	// @TODO: clickable cancel button? (in addition to Escape key handling and the "stop" voice command)
	$status_text.text(`To stop drawing, ${window.speech_recognition_active ? `say "stop", or ` : ""}press Esc.`);

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
				items = $html.find("img:not(.sw_spd):not(.rms_img):not(.flagIcon)").toArray()
					.filter((el)=> !el.closest("[role='navigation'], nav")) // ignore "Related searches", "Refine your search" etc.
					.map((el)=> ({image_url: el.src || el.dataset.src, title: ""}))
					.filter(validate_item);
			}
			console.log(`Search results for '${query}':`, items);
			if (items.length === 0) {
				const error = new Error(`failed to get clipart: no results returned for query '${query}'`);
				error.code = "no-results";
				throw error;
			}
			return items;
		})
}

function clickButtonVisibly(button) {
	if (button.matches("button:not(.toggle)")) {
		button.style.borderImage = "var(--inset-deep-border-image)";
		setTimeout(()=> {
			button.style.borderImage = "";
			// delay the button click to here so the pressed state is
			// visible even if the button action closes a dialog
			button.click();
		}, 100);
	} else {
		button.click();
	}
}

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
  
})();