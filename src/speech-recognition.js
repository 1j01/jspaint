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
	
	// tools
	"loop": "loupe",
	"slick to the": "select the",
	"like the": "select the",
	"tail with color": "fill with color",
	"pillbox hat": "fill bucket",
	"creve coeur": "curve tool",
	"tell tool": "fill tool",
	"till tool": "fill tool",
	"delta": "fill tool",
	"tilt": "fill tool",
	"mandy tatinkin": "rounded rectangle",
	"lips": "ellipse",
	"clips": "ellipse",
	"eclipse": "ellipse",
	"flip store": "ellipse tool",
	"random rectangles": "rounded rectangle",
	"random rectangle": "rounded rectangle",
	"x2": "text tool",
	"text talk": "text tool",
	"tracer": "eraser",
	"pickpocket": "paint bucket",
	"pink bucket": "paint bucket",
	"flekstore": "select tool",
	"tour": "tool",
	"grace": "erase",
	"blind": "line tool",
	"toefl": "oval",
	"offal": "oval",
	"google": "oval",
	"hopeful": "oval",
	"oporto": "oval tool",
	"careful": "curve tool",
	"capital": "curve tool",
	"curveball": "curve tool",
	"curved wall": "curve tool",
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
<pick-verb> = select | pick | choose | use | activate | "pick up";
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

window.toggle_speech_recognition = function() {
	if (window.speech_recognition_active) {
		window.speech_recognition_active = false;
		recognition.stop();
	} else {
		window.speech_recognition_active = true;
		recognition.start();
	}
};

recognition.onresult = function(event) {
	// The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
	// The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
	// It has a getter so it can be accessed like an array
	// The first [0] returns the SpeechRecognitionResult at the last position.
	// Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
	// These also have getters so they can be accessed like arrays.
	// The second [0] returns the SpeechRecognitionAlternative at position 0.
	// We then return the transcript property of the SpeechRecognitionAlternative object
	console.log(event.results);
	console.log(event.results[0]);
	console.log(event.results[0][0]);
	let command = event.results[0][0].transcript;
	console.log(`Result received: "${command}"`);
	console.log('Confidence: ' + event.results[0][0].confidence);
	command = command.toLowerCase();
	for (const [bad, good] of Object.entries(recognitionFixes)) {
		command = command.replace(new RegExp(`\\b${bad}\\b`, "ig"), good);
	}
	console.log(`After any fixes: "${command}"`);
	$status_text.text(`Speech: "${command}"`);
	for (const color of colorNames) {
		if (` ${command} `.toLowerCase().indexOf(` ${color} `) !== -1) {
			colors.foreground = color;
		}
	}
	for (const tool of tools) {
		for (const tool_phrase of tool.speech_recognition) {
			if (` ${command} `.toLowerCase().indexOf(` ${tool_phrase} `) !== -1) {
				select_tool(tool);
			}
		}
	}
	$G.trigger("option-changed");
};

recognition.onspeechend = function() {
	recognition.addEventListener("end", ()=> {
		recognition.start();
	}, {once: true});
	recognition.stop();
};

recognition.onnomatch = function(event) {
	$status_text.text("I didn't recognise that color.");
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

})();
