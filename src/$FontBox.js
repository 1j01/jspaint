
function $FontBox(){
	var $fb = $(E("div")).addClass("font-box");
	
	var $family = $(E("select"));
	var $size = $(E("input")).attr({
		type: "number",
		min: 8,
		max: 72,
		value: font.size,
	});
	var $button_group = $(E("span"));
	var $bold = $Toggle(0, "bold");
	var $italic = $Toggle(1, "italic");
	var $underline = $Toggle(2, "underline");
	var $vertical = $Toggle(3, "vertical");
	
	$button_group.append($bold, $italic, $underline, $vertical);
	$fb.append($family, $size, $button_group);
	
	var update_font = function(){
		font.size = Number($size.val());
		font.family = $family.val();
		$G.trigger("option-changed");
	};
	
	FontDetective.each(function(font){
		var $option = $(E("option"));
		$option.val(font).text(font.name);
		$family.append($option);
	});
	
	$family.val(font.family);
	
	$family.on("change", update_font);
	$size.on("change", update_font);
	
	var $w = $Window();
	$w.title("Fonts");
	$w.$content.append($fb);
	$w.center();
	return $w;
	
	
	function $Toggle(xi, thing){
		var $button = $(E("button"));
		var $image = $(E("span")).appendTo($button);
		$button.css({
			width: 23,
			height: 22
		});
		$image.css({
			display: "block",
			width: 16,
			height: 16,
			marginLeft: 2,
			backgroundImage: "url(images/text-tools.png)",
			backgroundPosition: xi*-16 + "px 0px"
		});
		$button.on("click", function(){
			$button.toggleClass("selected");
			font[thing] = $button.hasClass("selected");
			update_font();
		});
		if(font[thing]){
			$button.addClass("selected");
		}
		return $button;
	}
}
