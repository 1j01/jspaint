
$Window.Z_INDEX = 50; // dynamically incrementing z-index

function $ToolWindow($component){
	const $w = $(E("div")).addClass("window tool-window").appendTo("body");
	$w.$titlebar = $(E("div")).addClass("window-titlebar").appendTo($w);
	$w.$title = $(E("span")).addClass("window-title").appendTo($w.$titlebar);
	$w.$x = $(E("button")).addClass("window-close-button window-button").appendTo($w.$titlebar);
	$w.$content = $(E("div")).addClass("window-content").appendTo($w);
	
	if($component){
		$w.addClass("component-window");
	}
	
	$w.css("touch-action", "none");
	
	$w.$x.on("click", () => {
		$w.close();
	});
	$w.$x.on("mousedown selectstart", e => {
		e.preventDefault();
	});
	
	// @TODO: prevent selection *outside* of the window *via* the window

	$w.css({
		position: "absolute",
		zIndex: $Window.Z_INDEX++
	});
	// var focused = false;
	var last_focused_control;
	$w.on("pointerdown refocus-window", (event) => {
		$w.css({
			zIndex: $Window.Z_INDEX++
		});
		// Test cases where it should refocus the last focused control in the window:
		// - Click in the blank space of the window
		// - Click on the window title bar
		// - Close a second window, focusing the first window
		// - Clicking on a control in the window should focus it, by way of updating last_focused_control
		// - Eye gaze mode dwell click (simulated click)
		// It should NOT refocus when:
		// - (Clicking on a control in a different window)
		// - Trying to select text! @FIXME

		// Wait for other pointerdown handlers and default behavior, and focusin events.
		// Set focus to the last focused control, which should be updated if a click just occurred.
		requestAnimationFrame(()=> {
			// focused = true;
			if (last_focused_control) {
				last_focused_control.focus();
			}
		});
	});
	// Assumption: no control exists in the window before, this "focusin" handler is set up,
	// so any element.focus() will be after and trigger this handler.
	$w.on("focusin", ()=> {
		// focused = true;
		if (document.activeElement && $.contains($w[0], document.activeElement)) {
			last_focused_control = document.activeElement;
		}
	});
	// $w.on("focusout", ()=> {
	// 	requestAnimationFrame(()=> {
	// 		if (!document.activeElement || !$.contains($w[0], document.activeElement)) {
	// 			focused = false;
	// 		}
	// 	});
	// });
	
	$w.on("keydown", e => {
		if(e.ctrlKey || e.altKey || e.metaKey){
			return;
		}
		const $buttons = $w.$content.find("button");
		const $focused = $(document.activeElement);
		const focused_index = $buttons.index($focused);
		switch(e.keyCode){
			case 40: // Down
			case 39: // Right
				if($focused.is("button") && !e.shiftKey){
					if(focused_index < $buttons.length - 1){
						$buttons[focused_index + 1].focus();
						e.preventDefault();
					}
				}
				break;
			case 38: // Up
			case 37: // Left
				if($focused.is("button") && !e.shiftKey){
					if(focused_index > 0){
						$buttons[focused_index - 1].focus();
						e.preventDefault();
					}
				}
				break;
			case 32: // Space
			case 13: // Enter (doesn't actually work in chrome because the button gets clicked immediately)
				if($focused.is("button") && !e.shiftKey){
					$focused.addClass("pressed");
					const release = () => {
						$focused.removeClass("pressed");
						$focused.off("focusout", release);
						$(window).off("keyup", keyup);
					};
					const keyup = e => {
						if(e.keyCode === 32 || e.keyCode === 13){
							release();
						}
					};
					$focused.on("focusout", release);
					$(window).on("keyup", keyup);
				}
				break;
			case 9: { // Tab
				// wrap around when tabbing through controls in a window
				// @#: focusables
				let $controls = $w.$content.find("input, textarea, select, button, object, a[href], [tabIndex='0'], details summary").filter(":enabled, summary, a").filter(":visible");
				// const $controls = $w.$content.find(":tabbable"); // https://api.jqueryui.com/tabbable-selector/
				// Radio buttons should be treated as a group with one tabstop.
				// If there's no selected ("checked") radio, it should still visit the group,
				// but it should skip all unselected radios in that group if there is a selected radio in that group.
				const radios = {}; // best radio found so far, per group
				const toSkip = [];
				for (const el of $controls) {
					if (el.nodeName.toLowerCase() === "input" && el.type === "radio") {
						if (radios[el.name]) {
							if (el.checked) {
								toSkip.push(radios[el.name]);
								radios[el.name] = el;
							} else {
								toSkip.push(el);
							}
						} else {
							radios[el.name] = el;
						}
					}
				}
				$controls = $controls.not(toSkip);
				// debug viz:
				// $controls.css({boxShadow: "0 0 2px 2px green"});
				// $(toSkip).css({boxShadow: "0 0 2px 2px gray"})
				if ($controls.length > 0) {
					const focused_control_index = $controls.index($focused);
					if (e.shiftKey) {
						if(focused_control_index === 0){
							e.preventDefault();
							$controls[$controls.length - 1].focus();
						}
					} else {
						if(focused_control_index === $controls.length - 1){
							e.preventDefault();
							$controls[0].focus();
						}
					}
				}
				break;
			}
			case 27: // Esc
				$w.close();
				break;
		}
	});
	
	$w.applyBounds = () => {
		$w.css({
			left: Math.max(0, Math.min(innerWidth - $w.outerWidth(), $w[0].getBoundingClientRect().left)),
			top: Math.max(0, Math.min(innerHeight - $w.outerHeight(), $w[0].getBoundingClientRect().top)),
		});
	};
	
	$w.bringTitleBarOnScreen = () => {
		// Try to make the titlebar always accessible
		const min_horizontal_pixels_on_screen = 40; // enough for space past a close button
		$w.css({
			left: Math.max(
				min_horizontal_pixels_on_screen - $w.outerWidth(),
				Math.min(
					innerWidth - min_horizontal_pixels_on_screen,
					$w[0].getBoundingClientRect().left
				)
			),
			top: Math.max(0, Math.min(
				innerHeight - $w.$titlebar.outerHeight() - 5,
				$w[0].getBoundingClientRect().top
			)),
		});
	};
	
	$w.center = () => {
		$w.css({
			left: (innerWidth - $w.outerWidth()) / 2,
			top: (innerHeight - $w.outerHeight()) / 2,
		});
		$w.applyBounds();
	};
	
	
	$G.on("resize", $w.bringTitleBarOnScreen);
	
	let drag_offset_x, drag_offset_y;
	const drag = e => {
		$w.css({
			left: e.clientX - drag_offset_x,
			top: e.clientY - drag_offset_y,
		});
	};
	$w.$titlebar.css("touch-action", "none");
	$w.$titlebar.on("mousedown selectstart", e => {
		e.preventDefault();
	});
	$w.$titlebar.on("pointerdown", e => {
		if(!$w.$titlebar.is(e.target)){
			return; // don't drag via buttons
		}
		// if (e.isDefaultPrevented()) { // doesn't work because of event listener order
		// 	return; // allow custom drag behavior of component windows (Tools / Colors)
		// }
		const customEvent = $.Event("window-drag-start");
		$w.trigger(customEvent); 
		if(customEvent.isDefaultPrevented()){
			return; // allow custom drag behavior of component windows (Tools / Colors)
		}

		drag_offset_x = e.clientX - $w[0].getBoundingClientRect().left;
		drag_offset_y = e.clientY - $w[0].getBoundingClientRect().top;
		$G.on("pointermove", drag);
		$("body").addClass("dragging");
		const stop_drag = ()=> {
			// $w.applyBounds(); // Windows doesn't really try to keep windows on screen
			// but you also can't really drag off of the desktop, whereas here you can drag to way outside the web page.
			$w.bringTitleBarOnScreen();

			$G.off("pointermove", drag);
			$G.off("pointerup pointercancel", stop_drag);
			$("body").removeClass("dragging");
		};
		$G.on("pointerup pointercancel", stop_drag);
	});
	$w.$titlebar.on("dblclick", ()=> {
		if($component){
			$component.dock();
		}
	});
	
	$w.$Button = (text, handler) => {
		const $b = $(E("button"))
			.appendTo($w.$content)
			.text(text)
			.on("click", () => {
				if(handler){
					handler();
				}
				$w.close();
			});
		return $b;
	};
	$w.title = title => {
		if(title){
			$w.$title.text(title);
			return $w;
		}else{
			return $w.$title.text();
		}
	};
	$w.close = () => {
		const e = $.Event("close");
		$w.trigger(e);
		if(e.isDefaultPrevented()){
			return;
		}
		if($component){
			$component.detach();
		}
		$w.remove();
		$w.closed = true;
		// Focus next-topmost window
		$(
			$(".window:visible").toArray().sort((a, b)=> b.style.zIndex - a.style.zIndex)[0]
		).triggerHandler("refocus-window");
	};
	$w.closed = false;
	
	const scale_for_eye_gaze_mode_and_center = ()=> {
		if (!$w.is(".edit-colors-window, .storage-manager, .attributes-window, .flip-and-rotate, .stretch-and-skew")) {
			return;
		}
		const c = $w.$content[0];
		const t = $w.$titlebar[0];
		let scale = 1;
		$w.$content.css({
			transform: `scale(${scale})`,
			transformOrigin: "0 0",
			marginRight: "",
			marginBottom: "",
		});
		if (document.body.classList.contains("eye-gaze-mode")) {
			scale = Math.min(
				(innerWidth) / c.offsetWidth,
				(innerHeight - t.offsetHeight) / c.offsetHeight
			);
			$w.$content.css({
				transform: `scale(${scale})`,
				transformOrigin: "0 0",
				marginRight: c.scrollWidth * (scale - 1),
			});
			// This is separate to prevent content going off the bottom of the window
			// in case the layout changes due to text wrapping.
			$w.$content.css({
				marginBottom: c.scrollHeight * (scale - 1),
			});
			$w.center();
		}
		// for testing (WARNING: can cause rapid flashing, which can cause seizures):
		// requestAnimationFrame(scale_for_eye_gaze_mode_and_center);
	};

	if(!$component){
		$w.center();

		const scale_for_eye_gaze_mode_and_center_next_frame = ()=> {
			requestAnimationFrame(scale_for_eye_gaze_mode_and_center);
		};
		const on_close = ()=> {
			$w.off("close", on_close);
			$G.off("eye-gaze-mode-toggled resize", scale_for_eye_gaze_mode_and_center_next_frame);
		};
		$w.on("close", on_close);
		$G.on("eye-gaze-mode-toggled resize", scale_for_eye_gaze_mode_and_center_next_frame);

		scale_for_eye_gaze_mode_and_center_next_frame();
	}
	
	return $w;
}

function $FormToolWindow(title){
	const $w = new $ToolWindow();
	
	$w.title(title);
	$w.$form = $(E("form")).appendTo($w.$content);
	$w.$main = $(E("div")).appendTo($w.$form);
	$w.$buttons = $(E("div")).appendTo($w.$form).addClass("button-group");
	
	$w.$Button = (label, action) => {
		const $b = $(E("button")).appendTo($w.$buttons).text(label);
		$b.on("click", e => {
			// prevent the form from submitting
			// @TODO: instead prevent submit event
			e.preventDefault();
			
			action();
		});
		
		$b.on("pointerdown", () => {
			$b[0].focus();
		});
		
		return $b;
	};
	
	return $w;
}
