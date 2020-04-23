
function $ToolBox(tools, is_extras){
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
		const update_css = ()=> {
			const theme_folder = `images/${get_theme().replace(/\.css/, "")}`;
			const use_svg =
				(get_theme() === "classic.css" &&
					(window.devicePixelRatio >= 3 || (window.devicePixelRatio % 1) !== 0)
				) ||
				$("body").hasClass("eye-gaze-mode")
			$icon.css({
				display: "block",
				position: "absolute",
				left: 4,
				top: 4,
				width: 16,
				height: 16,
				backgroundImage: use_svg ? `url(images/classic/tools.svg)` : `url(${theme_folder}/tools.png)`,
				backgroundPosition: `${(use_svg ? -(i*2+1) : -i)*16}px ${use_svg * -16}px`,
			});
		};
		update_css();
		$G.on("theme-load resize", update_css);
		
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

	if (is_extras) {
		$c.height(80);
	}

	return $c;
}
