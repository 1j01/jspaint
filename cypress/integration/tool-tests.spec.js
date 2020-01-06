/// <reference types="Cypress" />

context('tool tests', () => {
	beforeEach(() => {
		cy.visit('/')
		cy.setResolution([800, 500]);
		cy.window().should('have.property', 'get_tool_by_name'); // wait for app to be loaded
	});

	const simulateGesture = (win, {start, end, shift, shiftToggleChance=0.01, secondary, secondaryToggleChance, target}) => {
		target = target || win.$(".main-canvas")[0];
		let startWithinRect = target.getBoundingClientRect();
		let canvasAreaRect = win.$(".canvas-area")[0].getBoundingClientRect();
	
		let startMinX = Math.max(startWithinRect.left, canvasAreaRect.left);
		let startMaxX = Math.min(startWithinRect.right, canvasAreaRect.right);
		let startMinY = Math.max(startWithinRect.top, canvasAreaRect.top);
		let startMaxY = Math.min(startWithinRect.bottom, canvasAreaRect.bottom);
		let startPointX = startMinX + start.x * (startMaxX - startMinX);
		let startPointY = startMinY + start.y * (startMaxY - startMinY);
		let endPointX = startMinX + end.x * (startMaxX - startMinX);
		let endPointY = startMinY + end.y * (startMaxY - startMinY);
	
		const $cursor = win.$(`<img src="images/cursors/default.png" class="user-cursor"/>`);
		$cursor.css({
			position: "absolute",
			left: 0,
			top: 0,
			opacity: 0,
			zIndex: 5, // @#: z-index
			pointerEvents: "none",
			transition: "opacity 0.5s",
		});
		$cursor.appendTo(".jspaint");
		let triggerMouseEvent = (type, point) => {
			
			const clientX = point.x;
			const clientY = point.y;
			// const el_over = win.document.elementFromPoint(clientX, clientY);
			const do_nothing = false;//!type.match(/move/) && (!el_over || !el_over.closest(".canvas-area"));
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
	
			let event = new win.$.Event(type, {
				view: window,
				bubbles: true,
				cancelable: true,
				clientX,
				clientY,
				screenX: clientX,
				screenY: clientY,
				offsetX: point.x,
				offsetY: point.y,
				button: secondary ? 2 : 0,
				buttons: secondary ? 2 : 1,
				shiftKey: shift,
			});
			win.$(target).trigger(event);
		};
	
		let t = 0;
		const stepsInGesture = 3;
		let pointForTime = (t) => {
			return {
				x: startPointX + (endPointX - startPointX) * t,
				y: startPointY + (endPointY - startPointY) * Math.pow(t, 0.3),
			};
		};
		
		return new Promise((resolve)=> {
			triggerMouseEvent("pointerenter", pointForTime(t)); // so dynamic cursors follow the simulation cursor
			triggerMouseEvent("pointerdown", pointForTime(t));
			let move = () => {
				t += 1 / stepsInGesture;
				// if (seededRandom() < shiftToggleChance) {
				// 	shift = !shift;
				// }
				// if (seededRandom() < secondaryToggleChance) {
				// 	secondary = !secondary;
				// }
				if (t > 1) {
					triggerMouseEvent("pointerup", pointForTime(t));
					
					$cursor.remove();
		
					resolve();
				} else {
					triggerMouseEvent("pointermove", pointForTime(t));
					/*gestureTimeoutID =*/ setTimeout(move, 10);
				}
			};
			triggerMouseEvent("pointerleave", pointForTime(t));
			move();
		});
	};

	// const gesture = (points)=> {
	// 	const options = {secondary: false, shift: false};
	// 	// @TODO: while loop
	// 	trigger("pointerenter", points[0].x, points[0].y, options);
	// 	trigger("pointerdown", points[0].x, points[0].y, options);
	// 	let i = 0;
	// 	for (; i < points.length; i++) {
	// 		trigger("pointermove", points[i].x, points[i].y, options);
	// 	}
	// 	i--;
	// 	trigger("pointerup", points[i].x, points[i].y, options);
	// };

	// it('brush tool', () => {
	// 	cy.get(".tool[title='Brush']").click();
	// 	// gesture([{x: 50, y: 50}, {x: 100, y: 100}]);
	// 	cy.get(":nth-child(21) > input").rightclick();
	// 	cy.window().then({timeout: 8000}, async (win)=> {
	// 		for (let secondary=0; secondary<=1; secondary++) {
	// 			for (let b=0; b<12; b++) {
	// 				win.$(`.chooser > :nth-child(${b+1})`).click();
	// 				const start = {x: 0.05 + b*0.05, y: 0.1 + 0.1*secondary};
	// 				const end = {x: start.x + 0.04, y: start.y + 0.04};
	// 				await simulateGesture(win, {shift: false, secondary: !!secondary, start, end});
	// 			}
	// 		}
	// 	});
	// 	cy.matchImageSnapshot();
	// });

	["Brush", "Pencil", "Rectangle", "Rounded Rectangle", "Ellipse", "Line"].forEach((toolName)=> {
		it(`${toolName.toLowerCase()} tool`, () => {
			cy.get(`.tool[title='${toolName}']`).click();
			// gesture([{x: 50, y: 50}, {x: 100, y: 100}]);
			cy.get(":nth-child(22) > input").rightclick();
			cy.window().then({timeout: 60000}, async (win)=> {
				for (let row=0; row<4; row++) {
					const secondary = !!(row % 2);
					const increaseSize = row >= 2;
					const $options = win.$(`.chooser > *`);
					for (let o=0; o<$options.length; o++) {
						$options[o].click();
						if (increaseSize && (o === 0 || toolName==="Brush" || toolName==="Line")) {
							for (let i = 0; i < 5; i++) {
								win.$('body').trigger(new win.$.Event("keydown", {key: "NumpadPlus", keyCode: 107, which: 107}));
							}
						}
						const start = {x: 0.05 + o*0.05, y: 0.1 + 0.1*row};
						const end = {x: start.x + 0.04, y: start.y + 0.04};
						await simulateGesture(win, {shift: false, secondary: !!secondary, start, end});
					}
				}
			});
			cy.get(".main-canvas").matchImageSnapshot();
		});
	});
});
