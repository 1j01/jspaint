
function $FontBox(){
	const $fb = $(E("div")).addClass("font-box");
	
	const $family = $(E("select")).addClass("inset-deep");
	const $size = $(E("input")).addClass("inset-deep").attr({
		type: "number",
		min: 8,
		max: 72,
		value: text_tool_font.size,
	}).css({
		maxWidth: 50,
	});
	const $button_group = $(E("span")).addClass("text-toolbar-button-group");
	const $bold = $Toggle(0, "bold");
	const $italic = $Toggle(1, "italic");
	const $underline = $Toggle(2, "underline");
	const $vertical = $Toggle(3, "vertical");
	$vertical.attr("disabled", true);

	$button_group.append($bold, $italic, $underline, $vertical);
	$fb.append($family, $size, $button_group);
	
	const update_font = () => {
		text_tool_font.size = Number($size.val());
		text_tool_font.family = $family.val();
		$G.trigger("option-changed");
	};
	
	FontDetective.each(font => {
		const $option = $(E("option"));
		$option.val(font).text(font.name);
		$family.append($option);
		if (!text_tool_font.family) {
			update_font();
		}
	});
	
	if (text_tool_font.family) {
		$family.val(text_tool_font.family);
	}

	$family.on("change", update_font);
	$size.on("change", update_font);
	
	const $w = $ToolWindow();
	$w.title(localize("Fonts"));
	$w.$content.append($fb);
	$w.center();
	return $w;
	
	
	function $Toggle(xi, thing){
		// const $button = $(E("button")).addClass("toggle").attr({
		// 	"aria-pressed": false,
		// 	"aria-label": localize(thing), // thing is really for programmatic use only, @TODO: label
		// });
		const $button = $(E("button")).addClass("toggle").attr("aria-pressed", false);
		const $icon = $(E("span")).addClass("icon").appendTo($button);
		$button.css({
			width: 23,
			height: 22,
			padding: 0,
			display: "inline-flex",
			alignContent: "center",
			alignItems: "center",
			justifyContent: "center",
		});
		$icon.css({
			flex: "0 0 auto",
			display: "block",
			width: 16,
			height: 16,
			"--icon-index": xi,
		});
		$button.on("click", () => {
			$button.toggleClass("selected");
			text_tool_font[thing] = $button.hasClass("selected");
			$button.attr("aria-pressed", $button.hasClass("selected"));
			update_font();
		});
		if(text_tool_font[thing]){
			$button.addClass("selected").attr("aria-pressed", true);
		}
		return $button;
	}
}
