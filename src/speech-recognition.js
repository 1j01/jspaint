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
	"tuggle": "toggle",
	"about pink": "about paint",
	"projects news": "project news",
	"you project is": "view project news",
	"6 / 48": "flip/rotate",
	"flip / rotate": "flip/rotate",
	"flipper rotate": "flip or rotate",
	"flip rotate": "flip/rotate",
	"stretch / q": "stretch/skew",
	"stretch/q": "stretch/skew",
	"stretch / skew": "stretch/skew",
	"stretch scale": "stretch/skew",
	"stretch skew": "stretch/skew",
	"stretcher skew": "stretch or skew",
	"stretcher q": "stretch or skew",
	"stretcher scale": "stretch or skew",
	"black doll": "select all",
	"slept all": "select all",
	"torres election": "delete selection",
	"deweese election": "delete selection",
	"tilly": "delete",
	"multiuser": "multi-user",
	"horizontal books": "horizontal color box",
	"talk vertical color box": "toggle vertical color box",
	"talk horizontal color box": "toggle horizontal color box",
	"toggle rico color box": "toggle vertical color box",
	"taco rico color box": "toggle vertical color box",
	"title horizontal colorbox": "toggle horizontal color box",
	"dial neal": "file new",
	"dial now": "file new",
	"kyle neal": "file new",
	"bio on them": "file new",
	"eye on them": "file new",
	"found them": "file new",
	"kyle new": "file new",
	"kyle knew": "file new",
	"kyle now": "file new",
	"file nail": "file new",
	"fileopen": "file open",
	"well safe": "file save",
	"fail-safe": "file save",
	"i'll save": "file save",
	"a done deal": "edit undo",
	"how to undo": "edit undo",
	"q menu": "view menu",
	"resume sub menu": "show zoom submenu",
	"king's menu": "themes menu",
	"tim's menu": "themes menu",
	"dean's menu": "themes menu",
	"things menu": "themes menu",
	"pennsylvania": "themes menu",
	"teamz menu": "themes menu",
	"teams menu": "themes menu",
	"goldstein's menu": "close themes menu",
	"christine's menu": "close themes menu",
	"express menu": "extras menu",
	"heather colors": "edit colors",
	"help many mm": "help menu",
	"help many": "help menu",
	"kuzmania": "close menu",
	"close minded": "close menu",
	"pho extras menu": "show extras menu",

	// panning/scrolling the view
	"scrollview": "scroll view",
	"call north": "scroll north",
	"crawl north": "scroll north",
	"crawl northward": "scroll northward",
	"pen view": "pan view",
	"penn view": "pan view",
	"pam view": "pan view",
	"penn wright": "pan right",
	"pen wright": "pan right",
	"pam wright": "pan right",
	"penn right": "pan right",
	"pen right": "pan right",
	"pam right": "pan right",
	"penn left": "pan left",
	"pen left": "pan left",
	"pam left": "pan left",
	"penn up": "pan up",
	"pen up": "pan up",
	"pam up": "pan up",
	"penn down": "pan down",
	"pen down": "pan down",
	"pam down": "pan down",
	"penn upwards": "pan upwards",
	"pen upwards": "pan upwards",
	"pam upwards": "pan upwards",
	"penn downwards": "pan downwards",
	"pen downwards": "pan downwards",
	"pam downwards": "pan downwards",
	"penn upward": "pan upward",
	"pen upward": "pan upward",
	"pam upward": "pan upward",
	"penn downward": "pan downward",
	"pen downward": "pan downward",
	"pam downward": "pan downward",
	"penn north": "pan north",
	"pen north": "pan north",
	"pam north": "pan north",
	"penn south": "pan south",
	"pen south": "pan south",
	"pam south": "pan south",
	"penn east": "pan east",
	"pen east": "pan east",
	"pam east": "pan east",
	"penn west": "pan west",
	"pen west": "pan west",
	"pam west": "pan west",
	"penn northward": "pan northward",
	"pen northward": "pan northward",
	"pam northward": "pan northward",
	"penn southward": "pan southward",
	"pen southward": "pan southward",
	"pam southward": "pan southward",
	"penn eastward": "pan eastward",
	"pen eastward": "pan eastward",
	"pam eastward": "pan eastward",
	"penn westward": "pan westward",
	"pen westward": "pan westward",
	"pam westward": "pan westward",
	"penn northwest": "pan northwest",
	"pen northwest": "pan northwest",
	"pam northwest": "pan northwest",
	"penn northeast": "pan northeast",
	"pen northeast": "pan northeast",
	"pam northeast": "pan northeast",
	"penn southwest": "pan southwest",
	"pen southwest": "pan southwest",
	"pam southwest": "pan southwest",
	"penn southeast": "pan southeast",
	"pen southeast": "pan southeast",
	"pam southeast": "pan southeast",
	"tannerite": "pan right",
	"penray": "pan right",
	"pain left": "pan left",
	"pinup": "pan up",
	"pin-up": "pan up",
	"panna": "pan up",
	"pinned down": "pan down",
	"pin down": "pan down",
	"and down words": "pan downwards",
	"and downwards": "pan downwards",
	"pin-up words": "pan upwards",
	"pin-up word": "pan upward",
	"pinup words": "pan upwards",
	"pinup word": "pan upward",
	"co-op": "go up", // @TODO: ^$
	"correct": "go right", // @TODO: ^$
	"direct": "go right", // @TODO: ^$
	"collect": "go left", // @TODO: ^$
	"the left": "go left", // @TODO: ^$

	// zooming
	"normal-size": "normal size",
	"large-size": "large size",
	"name two large size": "zoom to large size",
	"dim to large size": "zoom to large size",
	"name two normal size": "zoom to normal size",
	"dim to normal size": "zoom to normal size",
	"seem to": "zoom to",
	"seem 2": "zoom to",
	"sin 2": "zoom to",
	"forex": "4x",
	"seem to 1x": "zoom to 1x",
	"seem 2 1x": "zoom to 1x",
	"zoom g1x": "zoom to 1x",
	"m24 x": "zoom to 4x",
	"jim to 1x": "zoom to 1x",
	"zoom 2 2x": "zoom to 2x",
	"zoom tattoo x": "zoom to 2x",
	"seemed forex": "4x",

	// switching themes
	"set game to": "set theme to",
	"set themed to": "set theme to",
	"set themed": "set theme",
	"second winter": "set theme to winter",
	"set theme to mother": "set theme to modern",
	"modern team": "modern theme",
	"classic team": "classic theme",
	"retro team": "retro theme",
	"default team": "default theme",
	"normal team": "normal theme",
	"my 19": "modern theme",
	"winter thing": "winter theme",
	"modern thing": "modern theme",
	"classic thing": "classic theme",
	"christmas-themed": "christmas theme",
	"christmas game": "christmas theme",
	"switch directory theme": "switch to retro theme",
	"penis": "themes",
	"things": "themes",
	"teams": "themes",

	// render gif animation from document history
	"render gift": "render gif",
	"create gift": "create gif",
	"make gift": "make gif",
	"render a gift": "render a gif",
	"create a gift": "create a gif",
	"make a gift": "make a gif",

	// opening help
	"hope topics": "help topics",
	"health topics": "help topics",
	"subtopics": "help topics",
	"topix": "help topics",
	"quickhelp": "click help",

	// help window
	"webhelp": "web help",
	"medhelp": "web help",
	"four words": "forwards",
	"forbearance": "forwards",
	"trirectangular square": "draw a rectangle or square",
	"draw rectangular square": "draw a rectangle or square",
	"draw a rectangular square": "draw a rectangle or square",
	"rectangular square": "draw a rectangle or square",
	"welcome the help": "welcome to help",
	"tri polygon": "draw a polygon",
	"chop polygon": "draw a polygon",
	"java polygon": "draw a polygon",
	"trop polygon": "draw a polygon",
	"drawpolygon": "draw a polygon",
	"print text in pictures": "putting text in pictures",
	"print texts and pictures": "putting text in pictures",
	"print texts in pictures": "putting text in pictures",
	"print text and pictures": "putting text in pictures",
	"bring text to pictures": "putting text in pictures",
	"an area with color": "fill an area with color",
	"culinaria was color": "fill an area with color",
	"tell an area with color": "fill an area with color",
	"typing format text": "type and format text",
	"risa small area": "erase a small area",
	"risa large area": "erase a large area",
	"harissa large area": "erase a large area",
	"harissa small area": "erase a small area",
	"erasing entire image": "erase an entire image",
	"erase entire image": "erase an entire image",
	"erase the entire image": "erase an entire image",
	"Maurice's small area": "erase a small area",
	"Theresa small area": "erase a small area",
	"threesome entire image": "erase an entire image",
	"select part of the picture": "select part of a picture",
	"stopped part of a picture": "select part of a picture",
	"flex part of a picture": "select part of a picture",
	"search part of a picture": "select part of a picture",
	"change how the picture looks on the screen": "changing how your picture looks on the screen",
	"changing how the picture looks on the screen": "change the size of your picture",
	"changing the size of your picture": "change the size of your picture",
	"changing the size of the picture": "change the size of your picture",
	"change the size of the picture": "change the size of your picture",
	"display grid lines": "display gridlines",
	"working with pride as a picture": "working with part of the picture",
	"change the size of a picture": "change the size of your picture",
	"clipper rotate a picture": "flip or rotate a picture",
	"set for rotated picture": "flip or rotate a picture",
	"set for rotate a picture": "flip or rotate a picture",
	"flip or rotator picture": "flip or rotate a picture",
	"clipper rotate picture": "flip or rotate a picture",
	"clipper rotate the picture": "flip or rotate a picture",
	"flipper rotate a picture": "flip or rotate a picture",
	"separatism picture": "flip or rotate a picture",
	"set for rotated the picture": "flip or rotate a picture",
	"set for rotate the picture": "flip or rotate a picture",
	"display the toolbox": "display the tool box",
	"stretcher skewen item": "stretch or skew an item",
	"stretch rescue and item": "stretch or skew an item",
	"stretcher sku and item": "stretch or skew an item",

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
	"pasta while cooking": "pause dwell clicking",
	"pasquale cooking": "pause dwell clicking",
	"pause while clicking": "pause dwell clicking",
	"pause while cooking": "pause dwell clicking",
	"paused while clicking": "pause dwell clicking",
	"paused while cooking": "pause dwell clicking",
	"unpause while clicking": "unpause dwell clicking",
	"unpause while cooking": "unpause dwell clicking",
	"unpaused while clicking": "unpause dwell clicking",
	"unpaused while cooking": "unpause dwell clicking",
	"stop while clicking": "stop dwell clicking",
	"stop while cooking": "stop dwell clicking",
	"stop wall clocks": "stop dwell clicks",
	"stopped while clicking": "stop dwell clicking",
	"stopped while cooking": "stop dwell clicking",
	"stopped wall clocks": "stop dwell clicks",
	"disabled while clicking": "disable dwell clicking",
	"disabled while cooking": "disable dwell clicking",
	"disabled wall clocks": "disable dwell clicks",
	"disabled wall clock in": "disable dwell clicking",
	"disable wall clock in": "disable dwell clicking",
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
	"start wall clocks": "start dwell clicks",
	"start while cooking": "start dwell clicking",
	"start while clicking": "start dwell clicking",
	"resume while cooking": "resume dwell clicking",
	"resumed while cooking": "resume dwell clicking",
	"resume while clicking": "resume dwell clicking",
	"resumed while clicking": "resume dwell clicking",
	"resume walk clicks": "resume dwell clicks",
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
	"straight life": "straight line",
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
			if (menu_item !== MENU_DIVIDER) {
				all_menu_items.push(menu_item);
			}
			if (menu_item.submenu) {
				collect_menu_items(menu_item.submenu);
			}
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
	
	const close_menus_match = command.match(/\b(?:(?:close|hide|dismiss) menus?|never ?mind)\b/i);
	if (close_menus_match) {
		if (close_menus_match[0].length > best_match_text.length) {
			best_match_text = close_menus_match[0];
			best_match_fn = ()=> {
				// from close_menus in $MenuBar
				$(".menu-button").trigger("release");
				// Close any rogue floating submenus
				$(".menu-popup").hide();
			};
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

	const buttons = $("button, .menu-button, .menu-item-label, label, .help-window .item").filter(":visible").toArray();
	
	for (const button of buttons) {
		const button_text = button.textContent || button.getAttribute("aria-label") || button.title;
		let button_text_phrases = [button_text];
		if (!button_text) {
			button_text_phrases = [];
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
		if (button.matches(".window-close-button")) {
			button_text_phrases = [
				"close", "close button", "close window", "close window button",
				// @TODO: condition on window type
				"close dialog", "close dialog window", "close dialog button", "close dialog window button",
			];
		}
		if (button.matches(".window-maximize-button")) {
			button_text_phrases = [
				// @TODO: condition of maximized state

				"maximize", "maximize button", "maximize window", "maximize window button",
				"enlarge window", "make window large", "make window larger",

				"unmaximize", "unmaximize button", "unmaximize window", "unmaximize window button",
				"restore", "restore button", "restore window", "restore window button", "restore window size", "restore window size button",
				"enlarge window", "make window small", "make window smallagain", "make window smaller", "make window smaller again",
			];
		}
		if (button.matches(".window-minimize-button")) {
			button_text_phrases = [
				"minimize", "minimize button", "minimize window", "minimize window button",
				"iconify", "iconify button", "iconify window", "iconify window button",
				"minimize to tray", "minimize to tray button", "minimize to tray window", "minimize to tray window button",
				"hide window", "hide window button",
			];
		}
		// some help topics
		if (button_text.match(/^Draw a/i)) {
			button_text_phrases = [button_text, button_text.replace(/ an? /i, " ")];
		}
		// some form labels
		if (button_text.match(/:$/i)) {
			button_text_phrases = [button_text.replace(/:$/i, "")];
		}
		// some menu items
		if (button_text.match(/\.\.\.$/i)) {
			button_text_phrases = [button_text.replace(/\.\.\.$/i, "")];
		}
		// top level menu buttons
		if (button.matches(".menu-button")) {
			button_text_phrases = [
				button_text, `${button_text} menu`,
				`show ${button_text} menu`,
				`open ${button_text} menu`,
				`access ${button_text} menu`,
				`view ${button_text} menu`,
			];
		}
		// menu items with submenus
		// (designed to fail if class name "menu-item-submenu-area" changes)
		if (button.closest(".menu-item") && button.closest(".menu-item").querySelector(".menu-item-submenu-area").innerHTML !== "") {
			button_text_phrases = [
				button_text, `${button_text} menu`,
				`show ${button_text} menu`, `show ${button_text} submenu`, `show ${button_text} sub-menu`, `show ${button_text} sub menu`,
				`open ${button_text} menu`, `open ${button_text} submenu`, `open ${button_text} sub-menu`, `open ${button_text} sub menu`,
				`access ${button_text} menu`, `access ${button_text} submenu`, `access ${button_text} sub-menu`, `access ${button_text} sub menu`,
				`view ${button_text} menu`, `view ${button_text} submenu`, `view ${button_text} sub-menu`, `view ${button_text} sub menu`,
			];
		}

		if (button_text_phrases.length === 0) {
			console.log("Button inaccessible for speech recognition:", button);
		}
		// console.log(button, button_text, button_text_phrases);
		for (const button_text_phrase of button_text_phrases) {
			const match_phrases = [button_text_phrase, `click ${button_text_phrase}`, `click on ${button_text_phrase}`];
			for (const match_phrase of match_phrases) {
				// console.log(match_phrase, ` ${command} `.toLowerCase().indexOf(` ${match_phrase.toLowerCase()} `));
				if (` ${command} `.toLowerCase().indexOf(` ${match_phrase.toLowerCase()} `) !== -1) {
					if ((match_phrase.length > best_match_text.length) || button.closest(".menu-popup")) {
						best_match_text = match_phrase;
						best_match_fn = ((button)=> ()=> {
							clickButtonVisibly(button);
							console.log("click", button);
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

	if (!best_match_text) {
		const scroll_match = command.match(/\b(?:scroll|pan|scroll view|pan view|go|view) ((?:up|down|left|right|north|south|west|east|north ?west|south ?west|north ?east|south ?east)(?:wards?)?|to the (?:north|south|west|east|north ?west|south ?west|north ?east|south ?east))\b/i);
		if (scroll_match) {
			best_match_text = scroll_match[0];
			const direction = scroll_match[1].toLowerCase();
			const vector = {x: 0, y: 0};
			if (direction.match(/up|north/i)) {
				vector.y = -1;
			}
			if (direction.match(/down|south/i)) {
				vector.y = +1;
			}
			if (direction.match(/left|west/i)) {
				vector.x = -1;
			}
			if (direction.match(/right|east/i)) {
				vector.x = +1;
			}
			const scroll_pane_el = $(".window *").toArray().filter((el)=> el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)[0] || $canvas_area[0];
			best_match_fn = ()=> {
				// scroll_pane_el.scrollLeft += vector.x * scroll_pane_el.clientWidth / 2;
				// scroll_pane_el.scrollTop += vector.y * scroll_pane_el.clientHeight / 2;
				$(scroll_pane_el).animate({
					scrollLeft: scroll_pane_el.scrollLeft + vector.x * scroll_pane_el.clientWidth / 2,
					scrollTop: scroll_pane_el.scrollTop + vector.y * scroll_pane_el.clientHeight / 2,
				}, 500);
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

	$(button).trigger($.Event("pointerdown", {
		pointerId: 12345,
		pointerType: "mouse",
		button: 0,
		buttons: 1,
		isPrimary: true,
	}));
	$(button).trigger($.Event("pointerup", {
		pointerId: 12345,
		pointerType: "mouse",
		button: 0,
		buttons: 0,
		isPrimary: true,
	}));

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
