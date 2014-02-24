
var app = {};

app.open = function(){
	var color1 = "black";
	var color2 = "white";
	var color3 = "transparent";
	
	var tools = [{
		name: "Free-Form Select"
	},{
		name: "Select"
	},{
		name: "Eraser/Color Eraser"
	},{
		name: "Fill With Color"
	},{
		name: "Pick Color"
	},{
		name: "Magnifier"
	},{
		name: "Pencil"
	},{
		name: "Brush"
	},{
		name: "Airbrush"
	},{
		name: "Text"
	},{
		name: "Line"
	},{
		name: "Curve"
	},{
		name: "Rectangle"
	},{
		name: "Polygon"
	},{
		name: "Ellipse"
	},{
		name: "Rounded Rectangle"
	}];
	
	var selected_tool = tools[6];
	
	
	var $main = $(".jspaint-main");
	
	var $H = $(".jspaint-horizontal");
	var $V = $(".jspaint-vertical");
	var $top = $("<c-area>").prependTo($V);
	var $bottom = $("<c-area>").appendTo($V);
	var $left = $("<c-area>").prependTo($H);
	var $right = $("<c-area>").appendTo($H);
	
	var $toolbox = $ToolBox();
	var $colorbox = $ColorBox();
	
	function $ToolBox(){
		var $tb = $Component("Tools", "place-vertically");
		$tb.addClass("jspaint-tool-box");
		var $tools = $("<div class='jspaint-tools'>");
		var $tool_options = $("<div class='jspaint-tool-options'>");
		
		$tb.append($tools, $tool_options);
		
		var $buttons;
		$.each(tools, function(i, tool){
			var $b = $("<button class='jspaint-tool'>");
			$b.appendTo($tools);
			
			$b.attr("title", tool.name);
			if(tool === selected_tool){
				$b.addClass("selected");
			}
			
			var $icon = $("<span/>");
			$icon.appendTo($b);
			var bx = (i%2)*24;
			var by = ((i/2)|0)*25;
			$icon.css({
				display: "block",
				width: "100%",
				height: "100%",
				backgroundImage: "url(mspaint-toolbar.png)",
				backgroundPositionX: bx,
				backgroundPositionY: -by,
			});
			
			$b.on("click", function(){
				$buttons.removeClass("selected");
				$b.addClass("selected");
			});
		});
		$buttons = $(".jspaint-tool");
		
		return $tb;
	}
	function $ColorBox(){
		var $cb = $Component("Colors", "place-horizontally");
		$cb.addClass("jspaint-color-box");
		$cb.html('<img src="mspaint-palette.png">');
		return $cb;
	}
	function $Component(name, orientation){
		//a draggable widget that can be undocked into a window
		var $c = $("<div>").addClass("jspaint-component");
		$c.appendTo({
			"place-vertically": $left,
			"place-horizontally": $bottom,
		}[orientation]);
		return $c;
	}
};

$(function(){
	app.open();
});