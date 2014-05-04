
function $Window(){
	var $w = $(E("div")).addClass("jspaint-window").appendTo("body");
	$w.$titlebar = $(E("div")).addClass("jspaint-window-titlebar").appendTo($w);
	$w.$title = $(E("span")).addClass("jspaint-window-title").appendTo($w.$titlebar);
	$w.$x = $(E("button")).addClass("jspaint-window-close-button").appendTo($w.$titlebar);
	$w.$content = $(E("div")).addClass("jspaint-window-content").appendTo($w);
	
	$w.$x.on("click", function(){
		$w.close();
	});
	
	$w.$Button = function(text, handler){
		$w.$content.append(
			$(E("button"))
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
		$w.remove();
	};
	
	$w.css({
		position: "absolute",
		right: 50,
		top: 50
	});
	
	return $w;
}
