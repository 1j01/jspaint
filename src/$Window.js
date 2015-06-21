
$Window.Z_INDEX = 5;

function $Window($component){
	var $w = $(E("div")).addClass("jspaint-window").appendTo("body");
	$w.$titlebar = $(E("div")).addClass("jspaint-window-titlebar").appendTo($w);
	$w.$title = $(E("span")).addClass("jspaint-window-title").appendTo($w.$titlebar);
	$w.$x = $(E("button")).addClass("jspaint-window-close-button jspaint-window-button jspaint-button").appendTo($w.$titlebar);
	$w.$content = $(E("div")).addClass("jspaint-window-content").appendTo($w);
	
	if($component){
		$w.addClass("jspaint-component-window");
	}
	
	$w.attr("touch-action", "none");
	
	$w.$x.on("click", function(){
		$w.close();
	});
	$w.$x.on("mousedown", function(e){
		e.preventDefault();
		e.stopPropagation();
	});
	
	$w.css({
		position: "absolute",
		zIndex: $Window.Z_INDEX++
	});
	$w.on("mousedown", function(){
		$w.css({
			zIndex: $Window.Z_INDEX++
		});
	});
	
	$w.on("keydown", function(e){
		if(e.ctrlKey || e.altKey || e.shiftKey){
			return;
		}
		var $buttons = $w.$content.find("button.jspaint-button");
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
			left: Math.max(0, Math.min(innerWidth - $w.width(), $w[0].getBoundingClientRect().left)),
			top: Math.max(0, Math.min(innerHeight - $w.height(), $w[0].getBoundingClientRect().top)),
		});
	};
	
	$w.center = function(){
		$w.css({
			left: (innerWidth - $w.width()) / 2,
			top: (innerHeight - $w.height()) / 2,
		});
		$w.applyBounds();
	};
	
	
	$G.on("resize", $w.applyBounds);
	
	var mx, my;
	var drag = function(e){
		$w.css({
			left: e.clientX - mx,
			top: e.clientY - my,
		});
	};
	$w.$titlebar.on("mousedown", function(e){
		mx = e.clientX - $w[0].getBoundingClientRect().left;
		my = e.clientY - $w[0].getBoundingClientRect().top;
		$G.on("mousemove", drag);
	});
	$G.on("mouseup", function(e){
		$G.off("mousemove", drag);
	});
	$w.$titlebar.on("dblclick", function(e){
		if($component){
			$component.dock();
		}
	});
	
	$w.$Button = function(text, handler){
		var $b = $(E("button"))
			.appendTo($w.$content)
			.addClass("jspaint-dialogue-button")
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
		if(title){
			$w.$title.text(title);
			return $w;
		}else{
			return $w.$title.text();
		}
	};
	$w.close = function(){
		var e = $.Event("close");
		$w.trigger(e);
		if(e.isDefaultPrevented()){
			return;
		}
		if($component){
			$component.detach();
		}
		$w.remove();
		$w.closed = true;
	};
	$w.closed = false;
	
	if(!$component){
		$w.center();
	}
	
	return $w;
}

function $FormWindow(title){
	var $w = new $Window();
	
	$w.title(title);
	$w.$form = $form = $(E("form")).appendTo($w.$content);
	$w.$main = $(E("div")).appendTo($w.$form);
	$w.$buttons = $(E("div")).appendTo($w.$form).addClass("jspaint-button-group");
	
	$w.$Button = function(label, action){
		var $b = $(E("button")).appendTo($w.$buttons).text(label);
		$b.on("click", function(e){
			// prevent the form from submitting
			// @TODO: instead, prevent the form's submit event
			e.preventDefault();
			
			action();
		});
		
		// this should really not be needed @TODO
		$b.addClass("jspaint-button jspaint-dialogue-button");
		
		$b.on("mousedown", function(){
			$b.focus();
		});
		
		return $b;
	};
	
	return $w;
};
