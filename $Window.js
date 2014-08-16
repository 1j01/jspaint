
function $Window($component){
	var $w = $(E("div")).addClass("jspaint-window").appendTo("body");
	$w.$titlebar = $(E("div")).addClass("jspaint-window-titlebar").appendTo($w);
	$w.$title = $(E("span")).addClass("jspaint-window-title").appendTo($w.$titlebar);
	$w.$x = $(E("button")).addClass("jspaint-window-close-button jspaint-window-button jspaint-button").appendTo($w.$titlebar);
	$w.$content = $(E("div")).addClass("jspaint-window-content").appendTo($w);
	
	if($component){
		$w.addClass("jspaint-component-window");
	}
	
	$w.closed = false;
	$w.$x.on("click", function(){
		$w.close();
		$w.closed = true;
	});
	$w.$x.on("mousedown", function(e){
		e.preventDefault();
		e.stopPropagation();
	});
	
	$w.css({position: "absolute"});
	
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
	
	
	$(window).on("resize", $w.applyBounds);
	
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
	
	$w.$Button = function(text, handler){
		$w.$content.append(
			$(E("button"))
			.addClass("jspaint-dialogue-button")
			.text(text)
			.on("click", function(){
				handler();
				$w.close();
			})
		);
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
		if($component){
			$component.detach();
		}
		$w.remove();
	};
	
	if(!$component){
		$w.center();
	}
	
	return $w;
}
