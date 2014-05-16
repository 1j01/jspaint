
function $ToolBox(){
	var $tb = $(E("div")).addClass("jspaint-tool-box");
	var $tools = $(E("div")).addClass("jspaint-tools");
	var $tool_options = $(E("div")).addClass("jspaint-tool-options");
	
	var showing_tooltips = false;
	$tools.on("mouseleave", function(){
		showing_tooltips = false;
		$status_text.default();
	});
	
	var $buttons;
	$.each(tools, function(i, tool){
		var $b = $(E("button")).addClass("jspaint-tool");
		$b.appendTo($tools);
		tool.$button = $b;
		
		$b.attr("title", tool.name);
		
		var $icon = $(E("span"));
		$icon.appendTo($b);
		var bx = (i%2)*24;
		var by = (~~(i/2))*25;
		$icon.css({
			display: "block",
			width: "100%",
			height: "100%",
			backgroundImage: "url(images/toolbar-icons.png)",
			backgroundPosition: bx + "px " + -by + "px",
		});
		
		$b.on("click", function(){
			if(selected_tool === tool && tool.deselect){
				selected_tool = previous_tool;
			}else{
				if(!tool.deselect){
					previous_tool = tool;
				}
				selected_tool = tool;
			}
			$c.update_selected_tool();
		});
		
		$b.on("mouseenter", function(){
			var show_tooltip = function(){
				showing_tooltips = true;
				$status_text.text(tool.description);
			};
			if(showing_tooltips){
				show_tooltip();
			}else{
				var tid = setTimeout(show_tooltip, 300);
				$b.on("mouseleave", function(){
					clearTimeout(tid);
				});
			}
		});
	});
	$buttons = $tools.find("button");
	
	var $c = $Component("Tools", "tall", $tools.add($tool_options));
	$c.update_selected_tool = function(){
		$buttons.removeClass("selected");
		selected_tool.$button.addClass("selected");
		$tool_options.empty().append(selected_tool.$options);
		$canvas.css({
			cursor: Cursor(selected_tool.cursor)
		});
		deselect();
	};
	$c.update_selected_tool();
	return $c;
}
