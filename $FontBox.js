
function $FontBox(){
	var $fb = $(E("div")).addClass("jspaint-font-box");
	
	var $select_font = $(E("select"));
	var $select_size = $(E("input")).attr({type: "number", min: 8, max: 72, value: 14});
	var $button_group = $(E("span"));
	var $bold = $(E("button"));
	var $italic = $(E("button"));
	var $underline = $(E("button"));
	var $vertical = $(E("button")).prop("disabled", "disabled");
	
	$button_group.append($bold, $italic, $underline, $vertical);
	$fb.append($select_font, $select_size, $button_group);
	
	$select_font.on("change", function(){
		$G.trigger("option-changed");
	});
	$select_size.on("change", function(){
		$G.trigger("option-changed");
	});
	
	var $w = $Window();
	$w.title("Fonts");
	$w.$content.append($fb);
	$w.center();
	return $w;
}
