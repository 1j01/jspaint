
var app = {};

app.open = function(){
	var color1 = "black";
	var color2 = "white";
	var color3 = "transparent";
	
	var tools = [{
		name: "Free-Form Select",
		description: "Selects a free-form part of the picture to move, copy, or edit.",
	},{
		name: "Select",
		description: "Selects a rectangular part of the picture to move, copy, or edit.",
	},{
		name: "Eraser/Color Eraser",
		description: "Erases a portion of the picture, using the selected eraser shape.",
	},{
		name: "Fill With Color",
		description: "Fills an area with the selected drawing color.",
	},{
		name: "Pick Color",
		description: "Picks up a color from the picture for drawing.",
	},{
		name: "Magnifier",
		description: "Changes the magnification.",
	},{
		name: "Pencil",
		description: "Draws a free-form line one pixel wide.",
	},{
		name: "Brush",
		description: "Draws using a brush with the selected shape and size.",
	},{
		name: "Airbrush",
		description: "Draws using an airbrush of the selected size.",
	},{
		name: "Text",
		description: "Inserts text into the picture.",
	},{
		name: "Line",
		description: "Draws a straight line with the selected line width.",
	},{
		name: "Curve",
		description: "Draws a curved line with the selected line width.",
	},{
		name: "Rectangle",
		description: "Draws a rectangle with the selected fill style.",
	},{
		name: "Polygon",
		description: "Draws a polygon with the selected fill style.",
	},{
		name: "Ellipse",
		description: "Draws an ellipse with the selected fill style.",
	},{
		name: "Rounded Rectangle",
		description: "Draws a rounded rectangle with the selected fill style.",
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
		var $tb = $("<div>").addClass("jspaint-tool-box");
		var $tools = $("<div class='jspaint-tools'>");
		var $tool_options = $("<div class='jspaint-tool-options'>");
		
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
		$buttons = $tools.find(".jspaint-tool");
		
		return $Component("Tools", "tall", $tools.add($tool_options));
	}
	function $ColorBox(){
		var $cb = $("<div>").addClass("jspaint-tool-box");
		$cb.addClass("jspaint-color-box");
		$cb.html('<img src="mspaint-palette.png">');
		
		return $Component("Colors", "wide", $cb);
	}
	function $Component(name, orientation, $el){
		//a draggable widget that can be undocked into a window
		var $c = $("<div>").addClass("jspaint-component");
		$c.addClass("jspaint-"+name+"-component");
		$c.append($el);
		$c.appendTo({
			tall: $left,
			wide: $bottom,
		}[orientation]);
		
		var ox=0, oy=0, x=0, y=0, dragging = false;
		var w=0, h=0, $ghost=null;
		$c.on("mousedown",function(e){
			w = $c.width();
			h = $c.height();
			ox = $c.position().left - e.clientX;
			oy = $c.position().top - e.clientY;
			dragging = true;
			e.preventDefault();
		});
		$el.on("mousedown",function(e){
			return false;
		});
		$(window).on("mousemove",function(e){
			if(!dragging)return;
			x = e.clientX + ox;
			y = e.clientY + oy;
			
			if(!$ghost){
				$ghost = $("<div class='jspaint-component-ghost'>");
				$ghost.css({
					position: "absolute",
					display: "block",
					width: w,
					height: h,
					border: "1px dotted black"
				});
				$ghost.appendTo("body");
			}
			$ghost.css({
				left: x,
				top: y
			});
			e.preventDefault();
		});
		$(window).on("mouseup",function(e){
			dragging = false;
			$ghost && $ghost.remove(), $ghost = null;
		});
		return $c;
	}
};

$(function(){
	app.open();
});