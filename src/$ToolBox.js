
function $ToolBox(tools, is_extras){
	var $tb = $(E("div")).addClass("tool-box");
	var $tools = $(E("div")).addClass("tools");
	var $tool_options = $(E("div")).addClass("tool-options");
	
	var showing_tooltips = false;
	$tools.on("pointerleave", function(){
		showing_tooltips = false;
		$status_text.default();
	});
	
	var $buttons = $($.map(tools, function(tool, i){
		var $b = $(E("div")).addClass("tool");
		$b.appendTo($tools);
		tool.$button = $b;
		
		$b.attr("title", tool.name);
		
		var $icon = $(E("span"));
		$icon.appendTo($b);
		var bx = (i%2)*24;
		var by = (~~(i/2))*25;
		$icon.css({
			display: "block",
			position: "absolute",
			left: 0,
			top: 0,
			width: 24,
			height: 24,
			backgroundImage: "url(images/toolbar-icons.png)",
			backgroundPosition: bx + "px " + -by + "px",
		});
		
		$b.on("click", function(){
			if(selected_tool === tool && tool.deselect){
				select_tool(previous_tool);
			}else{
				select_tool(tool);
			}
		});
		
		$b.on("pointerenter", function(){
			var show_tooltip = function(){
				showing_tooltips = true;
				$status_text.text(tool.description);
			};
			if(showing_tooltips){
				show_tooltip();
			}else{
				var tid = setTimeout(show_tooltip, 300);
				$b.on("pointerleave", function(){
					clearTimeout(tid);
				});
			}
		});
		
		return $b[0];
	}));
	
	var $c = $Component(is_extras ? "Extra Tools" : "Tools", "tall", $tools.add($tool_options));
	$c.update_selected_tool = function(){
		$buttons.removeClass("selected");
		selected_tool.$button.addClass("selected");
		$tool_options.children().detach();
		$tool_options.append(selected_tool.$options);
		$tool_options.children().trigger("update");
		$canvas.css({
			cursor: Cursor(selected_tool.cursor),
		});
	};
	$c.update_selected_tool();
	return $c;
}
