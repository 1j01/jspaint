
function $ToolBox(tools, is_extras){
	const $tb = $(E("div")).addClass("tool-box");
	const $tools = $(E("div")).addClass("tools");
	const $tool_options = $(E("div")).addClass("tool-options");
	
	let showing_tooltips = false;
	$tools.on("pointerleave", () => {
		showing_tooltips = false;
		$status_text.default();
	});
	
	const $buttons = $($.map(tools, (tool, i) => {
		const $b = $(E("div")).addClass("tool");
		$b.appendTo($tools);
		tool.$button = $b;
		
		$b.attr("title", tool.name);
		
		const $icon = $(E("span"));
		$icon.appendTo($b);
		const bx = -i*16;
		const update_css = ()=> {
			const theme_folder = `images/${get_theme().replace(/\.css/, "")}`;
			$icon.css({
				display: "block",
				position: "absolute",
				left: 4,
				top: 4,
				width: 16,
				height: 16,
				backgroundImage: `url(${theme_folder}/tools.png)`,
				backgroundPosition: `${bx}px 0px`,
			});
		};
		update_css();
		$G.on("theme-load", update_css);
		
		$b.on("click", e => {
			if (e.shiftKey || e.ctrlKey) {
				select_tool(tool, true);
				return;
			}
			if(selected_tool === tool && tool.deselect){
				select_tools(return_to_tools);
			}else{
				select_tool(tool);
			}
		});
		
		$b.on("pointerenter", () => {
			const show_tooltip = () => {
				showing_tooltips = true;
				$status_text.text(tool.description);
			};
			if(showing_tooltips){
				show_tooltip();
			}else{
				const tid = setTimeout(show_tooltip, 300);
				$b.on("pointerleave", () => {
					clearTimeout(tid);
				});
			}
		});
		
		return $b[0];
	}));
	
	const $c = $Component(is_extras ? "Extra Tools" : "Tools", "tall", $tools.add($tool_options));
	$c.appendTo($left);
	$c.update_selected_tool = () => {
		$buttons.removeClass("selected");
		selected_tools.forEach((selected_tool)=> {
			selected_tool.$button.addClass("selected");
		});
		$tool_options.children().detach();
		$tool_options.append(selected_tool.$options);
		$tool_options.children().trigger("update");
		$canvas.css({
			cursor: make_css_cursor(...selected_tool.cursor),
		});
	};
	$c.update_selected_tool();
	return $c;
}
