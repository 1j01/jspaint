(()=>{

window.stopSimulatingGestures && window.stopSimulatingGestures();
window.simulatingGestures = false;

let gestureTimeoutID;
let periodicGesturesTimeoutID;

let choose = (array)=> array[~~(Math.random() * array.length)];
let isAnyMenuOpen = ()=> $(".menu-button.active").length > 0;

let cursor_image = new Image();
cursor_image.src = "images/cursors/default.png";

var $cursor = $(cursor_image).addClass("user-cursor");
$cursor.css({
	position: "absolute",
	left: 0,
	top: 0,
	opacity: 0,
	zIndex: 500, // arbitrary; maybe too high
	pointerEvents: "none",
	transition: "opacity 0.5s",
});

window.simulateRandomGesture = (callback, {shift, shiftToggleChance=0.01, secondary, secondaryToggleChance, target=canvas}) => {
	let startWithinRect = target.getBoundingClientRect();
	let canvasAreaRect = $canvas_area[0].getBoundingClientRect();

	let startMinX = Math.max(startWithinRect.left, canvasAreaRect.left);
	let startMaxX = Math.min(startWithinRect.right, canvasAreaRect.right);
	let startMinY = Math.max(startWithinRect.top, canvasAreaRect.top);
	let startMaxY = Math.min(startWithinRect.bottom, canvasAreaRect.bottom);
	let startPointX = startMinX + Math.random() * (startMaxX - startMinX);
	let startPointY = startMinY + Math.random() * (startMaxY - startMinY);

	$cursor.appendTo($app);
	let triggerMouseEvent = (type, point) => {
		
		if (isAnyMenuOpen()) {
			return;
		}

		var clientX = point.x;
		var clientY = point.y;
		var el_over = document.elementFromPoint(clientX, clientY);
		var do_nothing = !type.match(/move/) && (!el_over || !el_over.closest(".canvas-area"));
		$cursor.css({
			display: "block",
			position: "absolute",
			left: clientX,
			top: clientY,
			opacity: do_nothing ? 0.5 : 1,
		});
		if (do_nothing) {
			return;
		}

		let event = new $.Event(type, {
			view: window,
			bubbles: true,
			cancelable: true,
			clientX: clientX,
			clientY: clientY,
			screenX: clientX,
			screenY: clientY,
			offsetX: point.x,
			offsetY: point.y,
			button: secondary ? 2 : 0,
			buttons: secondary ? 2 : 1,
			shiftKey: shift,
		});
		$(target).trigger(event);
	};

	let t = 0;
	let gestureComponents = [];
	let numberOfComponents = 5;
	for (let i = 0; i < numberOfComponents; i += 1) {
		gestureComponents.push({
			rx:
				(Math.random() * Math.min(canvasAreaRect.width, canvasAreaRect.height)) /
				2 /
				numberOfComponents,
			ry:
				(Math.random() * Math.min(canvasAreaRect.width, canvasAreaRect.height)) /
				2 /
				numberOfComponents,
			angularFactor: Math.random() * 5 - Math.random(),
			angularOffset: Math.random() * 5 - Math.random(),
		});
	}
	const stepsInGesture = 50;
	let pointForTimeWithArbitraryStart = (t) => {
		let point = { x: 0, y: 0 };
		for (let i = 0; i < gestureComponents.length; i += 1) {
			let { rx, ry, angularFactor, angularOffset } = gestureComponents[i];
			point.x +=
				Math.sin(Math.PI * 2 * ((t / 2) * angularFactor + angularOffset)) *
				rx;
			point.y +=
				Math.cos(Math.PI * 2 * ((t / 2) * angularFactor + angularOffset)) *
				ry;
		}
		return point;
	};
	let pointForTime = (t) => {
		let point = pointForTimeWithArbitraryStart(t);
		let zeroPoint = pointForTimeWithArbitraryStart(0);
		point.x -= zeroPoint.x;
		point.y -= zeroPoint.y;
		point.x += startPointX;
		point.y += startPointY;
		return point;
	};
	triggerMouseEvent("pointerdown", pointForTime(t));
	let move = () => {
		t += 1 / stepsInGesture;
		if (Math.random() < shiftToggleChance) {
			shift = !shift;
		}
		if (Math.random() < secondaryToggleChance) {
			secondary = !secondary;
		}
		if (t > 1) {
			triggerMouseEvent("pointerup", pointForTime(t));
			
			$cursor.remove();

			if (callback) {
				callback();
			}
		} else {
			triggerMouseEvent("pointermove", pointForTime(t));
			gestureTimeoutID = setTimeout(move, 10);
		}
	};
	move();
};

window.simulateRandomGesturesPeriodically = () => {
	window.simulatingGestures = true;

	let delayBetweenGestures = 500;
	let shiftStart = false;
	let shiftStartToggleChance = 0.1;
	let shiftToggleChance = 0.001;
	let secondaryStart = false;
	let secondaryStartToggleChance = 0.1;
	let secondaryToggleChance = 0.001;
	let switchToolsChance = 0.5;
	let multiToolsChance = 0.0;
	let pickColorChance = 0.5;
	let pickToolOptionsChance = 0.8;
	let scrollChance = 0.2;
	let dragSelectionChance = 0.8;
	
	let _simulateRandomGesture = (callback)=> {
		window.simulateRandomGesture(callback, {
			shift: shiftStart,
			shiftToggleChance,
			secondary: secondaryStart,
			secondaryToggleChance
		});
	};
	let waitThenGo = () => {
		// TODO: a button to stop it as well (maybe make "stop drawing randomly" a link button?)
		$status_text.text("Press Esc to stop drawing randomly.");
		if (isAnyMenuOpen()) {
			setTimeout(waitThenGo, 50);
			return;
		}

		if (Math.random() < shiftStartToggleChance) {
			shiftStart = !shiftStart;
		}
		if (Math.random() < secondaryStartToggleChance) {
			secondaryStart = !secondaryStart;
		}
		if (Math.random() < switchToolsChance) {
			let multiToolsPlz = Math.random() < multiToolsChance;
			$(choose($(".tool, tool-button"))).trigger($.Event("click", {shiftKey: multiToolsPlz}));
		}
		if (Math.random() < pickToolOptionsChance) {
			$(choose($(".tool-options *"))).trigger("click");
		}
		if (Math.random() < pickColorChance) {
			// TODO: maybe these should respond to a normal click?
			let secondary = Math.random() < 0.5;
			var colorButton = choose($(".swatch, .color-button"));
			$(colorButton)
				.trigger($.Event("pointerdown", {button: secondary ? 2 : 0}))
				.trigger($.Event("click", {button: secondary ? 2 : 0}))
				.trigger($.Event("pointerup", {button: secondary ? 2 : 0}));
		}
		if (Math.random() < scrollChance) {
			let scrollAmount = (Math.random() * 2 - 1) * 700;
			if (Math.random() < 0.5) {
				$canvas_area.scrollTop($canvas_area.scrollTop() + scrollAmount);
			} else {
				$canvas_area.scrollLeft($canvas_area.scrollLeft() + scrollAmount);
			}
		}
		periodicGesturesTimeoutID = setTimeout(() => {
			_simulateRandomGesture(()=> {
				if (selection && Math.random() < dragSelectionChance) {
					window.simulateRandomGesture(waitThenGo, {
						shift: shiftStart,
						shiftToggleChance,
						secondary: secondaryStart,
						secondaryToggleChance,
						target: selection.canvas
					});
				} else {
					waitThenGo();
				}
			});
		}, delayBetweenGestures);
	};
	_simulateRandomGesture(waitThenGo);
};

window.stopSimulatingGestures = () => {
	if (window.simulatingGestures) {
		clearTimeout(gestureTimeoutID);
		clearTimeout(periodicGesturesTimeoutID);
		window.simulatingGestures = false;
		$status_text.default();
	}
};

})();
