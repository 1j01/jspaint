(function(exports) {

// TODO: E\("([a-z]+)"\) -> "<$1>" or get rid of jQuery as a dependency
function E(t){
	return document.createElement(t);
}

var $G = $(window);


$Window.Z_INDEX = 5;

function $Window(options){
	options = options || {};
	
	var $w = $(E("div")).addClass("window os-window").appendTo("body");
	$w.$titlebar = $(E("div")).addClass("window-titlebar").appendTo($w);
	$w.$title_area = $(E("div")).addClass("window-title-area").appendTo($w.$titlebar);
	$w.$title = $(E("span")).addClass("window-title").appendTo($w.$title_area);
	$w.$minimize = $(E("button")).addClass("window-minimize-button window-button").appendTo($w.$titlebar);
	$w.$maximize = $(E("button")).addClass("window-maximize-button window-button").appendTo($w.$titlebar);
	$w.$x = $(E("button")).addClass("window-close-button window-button").appendTo($w.$titlebar);
	$w.$content = $(E("div")).addClass("window-content").appendTo($w);
	
	var $component = options.$component;
	if(options.icon){
		$w.icon_name = options.icon;
		$w.$icon = $Icon(options.icon, TITLEBAR_ICON_SIZE).prependTo($w.$titlebar);
	}
	if($component){
		$w.addClass("component-window");
	}

	const $eventTarget = $({});
	const makeSimpleListenable = (name)=> {
		return (callback)=> {
			const fn = ()=> {
				callback();
			};
			$eventTarget.on(name, fn);
			const dispose = ()=> {
				$eventTarget.off(name, fn);
			};
			return dispose;
		};
	};
	$w.onFocus = makeSimpleListenable("focus");
	$w.onBlur = makeSimpleListenable("blur");
	$w.onClosed = makeSimpleListenable("closed");

	$w.focus = ()=> {
		if (window.focusedWindow === $w) {
			return;
		}
		window.focusedWindow && focusedWindow.blur();
		$w.bringToFront();
		$w.addClass("focused");
		window.focusedWindow = $w;
		$eventTarget.triggerHandler("focus");
	};
	$w.blur = ()=> {
		if (window.focusedWindow !== $w) {
			return;
		}
		$w.removeClass("focused");
		// TODO: document.activeElement && document.activeElement.blur()?
		$eventTarget.triggerHandler("blur");

		window.focusedWindow = null;
	};

	$w.on("focusin pointerdown", function(e){
		$w.focus();
	});
	$G.on("pointerdown", (e)=> {
		if (
			e.target.closest(".os-window") !== $w[0] &&
			!e.target.closest(".taskbar")
		) {
			$w.blur();
		}
	});

	$w.attr("touch-action", "none");
	
	$w.$x.on("click", function(){
		$w.close();
	});

	$w.minimize = function() {
		if ($w.is(":visible")) {
			const $task = this.task.$task;
			const before_rect = $w.$titlebar[0].getBoundingClientRect();
			const after_rect = $task[0].getBoundingClientRect();
			$w.animateTitlebar(before_rect, after_rect, ()=> {
				$w.hide();
				$w.blur();
			});
		}
	};
	$w.unminimize = function() {
		if ($w.is(":hidden")) {
			const $task = this.task.$task;
			const before_rect = $task[0].getBoundingClientRect();
			$w.show();
			const after_rect = $w.$titlebar[0].getBoundingClientRect();
			$w.hide();
			$w.animateTitlebar(before_rect, after_rect, ()=> {
				$w.show();
				$w.bringToFront();
				$w.focus();
			});
		}
	};

	let before_maximize;
	$w.$maximize.on("click", function(){

		const instantly_maximize = ()=> {
			before_maximize = {
				position: $w.css("position"),
				left: $w.css("left"),
				top: $w.css("top"),
				width: $w.css("width"),
				height: $w.css("height"),
			};
			
			$w.addClass("maximized");
			const $taskbar = $(".taskbar");
			const scrollbar_width = window.innerWidth - $(window).width();
			const scrollbar_height = window.innerHeight - $(window).height();
			const taskbar_height = $taskbar.length ? $taskbar.height() + 1 : 0;
			$w.css({
				position: "fixed",
				top: 0,
				left: 0,
				width: `calc(100vw - ${scrollbar_width}px)`,
				height: `calc(100vh - ${scrollbar_height}px - ${taskbar_height}px)`,
			});
		};
		const instantly_unmaximize = ()=> {
			$w.removeClass("maximized");
			$w.css({width: "", height: ""});
			if (before_maximize) {
				$w.css({
					position: before_maximize.position,
					left: before_maximize.left,
					top: before_maximize.top,
					width: before_maximize.width,
					height: before_maximize.height,
				});
			}
		};

		const before_rect = $w.$titlebar[0].getBoundingClientRect();
		let after_rect;
		$w.css("transform", "");
		if ($w.hasClass("maximized")) {
			instantly_unmaximize();
			after_rect = $w.$titlebar[0].getBoundingClientRect();
			instantly_maximize();
		} else {
			instantly_maximize();
			after_rect = $w.$titlebar[0].getBoundingClientRect();
			instantly_unmaximize();
		}
		$w.animateTitlebar(before_rect, after_rect, ()=> {
			if ($w.hasClass("maximized")) {
				instantly_unmaximize();
			} else {
				instantly_maximize();
			}
		});
	});
	$w.$minimize.on("click", function(){
		$w.minimize();
	});
	$w.$title_area.on("mousedown selectstart", ".window-button", function(e){
		e.preventDefault();
	});
	$w.$title_area.on("dblclick", ()=> {
		$w.$maximize.triggerHandler("click");
	});
	
	$w.css({
		position: "absolute",
		zIndex: $Window.Z_INDEX++
	});
	$w.bringToFront = function(){
		$w.css({
			zIndex: $Window.Z_INDEX++
		});
	};
	$w.on("pointerdown", function(){
		$w.bringToFront();
	});
	
	$w.on("keydown", function(e){
		if(e.ctrlKey || e.altKey || e.shiftKey){
			return;
		}
		var $buttons = $w.$content.find("button");
		var $focused = $(document.activeElement);
		var focused_index = $buttons.index($focused);
		// console.log(e.keyCode);
		switch(e.keyCode){
			case 40: // Down
			case 39: // Right
				if($focused.is("button")){
					if(focused_index < $buttons.length - 1){
						$buttons.get(focused_index + 1).focus();
						e.preventDefault();
					}
				}
				break;
			case 38: // Up
			case 37: // Left
				if($focused.is("button")){
					if(focused_index > 0){
						$buttons.get(focused_index - 1).focus();
						e.preventDefault();
					}
				}
				break;
			case 32: // Space
			case 13: // Enter (doesn't actually work in chrome because the button gets clicked immediately)
				if($focused.is("button")){
					$focused.addClass("pressed");
					var release = function(){
						$focused.removeClass("pressed");
						$focused.off("focusout", release);
						$(window).off("keyup", keyup);
					};
					var keyup = function(e){
						if(e.keyCode === 32 || e.keyCode === 13){
							release();
						}
					};
					$focused.on("focusout", release);
					$(window).on("keyup", keyup);
				}
				break;
			case 9: // Tab
				// wrap around when tabbing through controls in a window
				var $controls = $w.$content.find("input, textarea, select, button, a");
				var focused_control_index = $controls.index($focused);
				if(focused_control_index === $controls.length - 1){
					e.preventDefault();
					$controls[0].focus();
				}
				break;
			case 27: // Esc
				$w.close();
				break;
		}
	});
	// @TODO: restore last focused controls when clicking/mousing down on the window
	
	$w.applyBounds = function(){
		$w.css({
			left: Math.max(0, Math.min(document.body.scrollWidth - $w.width(), $w.position().left)),
			top: Math.max(0, Math.min(document.body.scrollHeight - $w.height(), $w.position().top)),
		});
	};
	
	$w.center = function(){
		$w.css({
			left: (innerWidth - $w.width()) / 2 + window.scrollX,
			top: (innerHeight - $w.height()) / 2 + window.scrollY,
		});
		$w.applyBounds();
	};
	
	
	$G.on("resize", $w.applyBounds);
	
	var drag_offset_x, drag_offset_y;
	var mouse_x, mouse_y;
	var update_drag = function(e){
		mouse_x = e.clientX != null ? e.clientX : mouse_x;
		mouse_y = e.clientY != null ? e.clientY : mouse_y;
		$w.css({
			left: mouse_x + scrollX - drag_offset_x,
			top: mouse_y + scrollY - drag_offset_y,
		});
	};
	$w.$titlebar.attr("touch-action", "none");
	$w.$titlebar.on("mousedown selectstart", function(e){
		e.preventDefault();
	});
	$w.$titlebar.on("pointerdown", function(e){
		if($(e.target).is("button")){
			return;
		}
		if ($w.hasClass("maximized")) {
			return;
		}
		drag_offset_x = e.clientX + scrollX - $w.position().left;
		drag_offset_y = e.clientY + scrollY - $w.position().top;
		$G.on("pointermove", update_drag);
		$G.on("scroll", update_drag);
		$("body").addClass("dragging"); // for when mouse goes over an iframe
	});
	$G.on("pointerup", function(e){
		$G.off("pointermove", update_drag);
		$G.off("scroll", update_drag);
		$("body").removeClass("dragging");
		$w.applyBounds();
	});
	$w.$titlebar.on("dblclick", function(e){
		if($component){
			$component.dock();
		}
	});
	
	$w.$Button = function(text, handler){
		var $b = $(E("button"))
			.appendTo($w.$content)
			.text(text)
			.on("click", function(){
				if(handler){
					handler();
				}
				$w.close();
			});
		return $b;
	};
	$w.title = function(title){
		if(title !== undefined){
			$w.$title.text(title);
			if ($w.task) {
				$w.task.updateTitle();
			}
			return $w;
		}else{
			return $w.$title.text();
		}
	};
	$w.getTitle = function() {
		return $w.title();
	};
	$w.getIconName = function() {
		return $w.icon_name;
	};
	$w.setIconByID = function(icon_name){
		// $w.$icon.attr("src", getIconPath(icon_name));
		var old_$icon = $w.$icon;
		$w.$icon = $Icon(icon_name, TITLEBAR_ICON_SIZE);
		old_$icon.replaceWith($w.$icon);
		$w.icon_name = icon_name;
		$w.task.updateIcon();
		return $w;
	};
	$w.animateTitlebar = function(from, to, callback=()=>{}) {
		const $eye_leader = $w.$titlebar.clone(true);
		$eye_leader.find("button").remove();
		$eye_leader.appendTo("body");
		const durationMS = 200; // TODO: how long?
		const duration = `${durationMS}ms`;
		$eye_leader.css({
			transition: `left ${duration} linear, top ${duration} linear, width ${duration} linear, height ${duration} linear`,
			position: "fixed",
			zIndex: 10000000,
			pointerEvents: "none",
			left: from.left,
			top: from.top,
			width: from.width,
			height: from.height,
		});
		setTimeout(()=> {
			$eye_leader.css({
				left: to.left,
				top: to.top,
				width: to.width,
				height: to.height,
			});
		}, 5);
		const tid = setTimeout(()=> {
			$eye_leader.remove();
			callback();
		}, durationMS * 1.2);
		$eye_leader.on("transitionend animationcancel", ()=> {
			$eye_leader.remove();
			clearTimeout(tid);
			callback();
		});
	};
	$w.close = function(force){
		if(!force){
			var e = $.Event("close");
			$w.trigger(e);
			if(e.isDefaultPrevented()){
				return;
			}
		}
		if($component){
			$component.detach();
		}
		$w.remove();
		$w.closed = true;
		$eventTarget.triggerHandler("closed");
		// $w.trigger("closed");
		// TODO: change usages of "close" to "closed" where appropriate
		// and probably rename the "close" event
	};
	$w.closed = false;
	
	if(options.title){
		$w.title(options.title);
	}
	
	if(!$component){
		$w.center();
	}
	
	// mustHaveMethods($w, windowInterfaceMethods);
	
	return $w;
}

function $FormWindow(title){
	var $w = new $Window();
	
	$w.title(title);
	$w.$form = $(E("form")).appendTo($w.$content);
	$w.$main = $(E("div")).appendTo($w.$form);
	$w.$buttons = $(E("div")).appendTo($w.$form).addClass("button-group");
	
	$w.$Button = function(label, action){
		var $b = $(E("button")).appendTo($w.$buttons).text(label);
		$b.on("click", function(e){
			// prevent the form from submitting
			// @TODO: instead, prevent the form's submit event
			e.preventDefault();
			
			action();
		});
		
		$b.on("pointerdown", function(){
			$b.focus();
		});
		
		return $b;
	};

	return $w;
}

exports.$Window = $Window;
exports.$FormWindow = $FormWindow;

})(window);
