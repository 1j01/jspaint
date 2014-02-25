
var app = {};

app.open = function(){
	
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
	
	var palette = [
		"#000000","#787878","#790300","#757A01","#007902","#007778","#0A0078","#7B0077","#767A38","#003637","#286FFE","#083178","#4C00FE","#783B00",
		"#FFFFFF","#BBBBBB","#FF0E00","#FAFF08","#00FF0B","#00FEFF","#3400FE","#FF00FE","#FBFF7A","#00FF7B","#76FEFF","#8270FE","#FF0677","#FF7D36",
	];
	
	var selected_tool = tools[6];
	var previous_tool = selected_tool;
	
	var color1 = "black";
	var color2 = "white";
	var color3 = "transparent";
	
	
	
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
		var $cb = $("<div>").addClass("jspaint-color-box");
		$cb.addClass("jspaint-color-box");
		
		var $current_colors = $("<div>").addClass("jspaint-current-colors");
		var $palette = $("<div>").addClass("jspaint-palette");
		
		$cb.append($current_colors, $palette);
		
		var $color1 = $("<div class='jspaint-color-selection'>");
		var $color2 = $("<div class='jspaint-color-selection'>");
		$current_colors.append($color1, $color2);
		
		$current_colors.css({
			position: "relative",
		});
		$color1.css({
			position: "absolute",
			zIndex: 1,
			left: 2,
			top: 4,
		});
		$color2.css({
			position: "absolute",
			right: 3,
			bottom: 3,
		});
		
		$.each(palette, function(i, color){
			var $b = $("<button class='jspaint-color-button'>");
			$b.appendTo($palette);
			
			$b.css({background:color});
			
			$b.on("mousedown", function(e){
				e.preventDefault();
				if(e.ctrlKey){
					color3 = color;
				}else if(e.button === 0){
					color1 = color;
				}else if(e.button === 2){
					color2 = color;
				}
				update_colors();
			});
		});
		update_colors();
		
		return $Component("Colors", "wide", $cb);
		
		function update_colors(){
			if(color3 !== "transparent"){
				$current_colors.css({background:color3});
			}
			$color1.css({background:color1});
			$color2.css({background:color2});
		}
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
		
		var ox, oy, w, h, pos, pos_axis;
		var dragging = false;
		var $dock_to;
		var $ghost;
		$c.on("mousedown",function(e){
			if(e.button !== 0) return;
			
			var rect = $c[0].getBoundingClientRect();
			w = ((rect.width/2)|0)*2+1;//make sure these dimensions are odd numbers
			h = ((rect.height/2)|0)*2+1;
			ox = $c.position().left - e.clientX;
			oy = $c.position().top - e.clientY;
			dragging = true;
			
			if(!$ghost){
				$ghost = $("<div class='jspaint-component-ghost dock'>");
				$ghost.css({
					position: "absolute",
					display: "block",
					width: w,
					height: h,
					left: e.clientX + ox,
					top: e.clientY + oy
				});
				$ghost.appendTo("body");
			}
			
			e.preventDefault();
		});
		$el.on("mousedown",function(e){
			return false;
		});
		$(window).on("mousemove",function(e){
			if(!dragging) return;
			
			$ghost.css({
				left: e.clientX + ox,
				top: e.clientY + oy,
			});
			
			$dock_to = null;
			
			var ghost = $ghost[0].getBoundingClientRect();
			var q = 5;
			if(orientation === "tall"){
				pos_axis = "top";
				if(ghost.left-q < $left[0].getBoundingClientRect().right){
					$dock_to = $left;
				}
				if(ghost.right+q > $right[0].getBoundingClientRect().left){
					$dock_to = $right;
				}
			}else{
				pos_axis = "left";
				if(ghost.top-q < $top[0].getBoundingClientRect().bottom){
					$dock_to = $top;
				}
				if(ghost.bottom+q > $bottom[0].getBoundingClientRect().top){
					$dock_to = $bottom;
				}
			}
			pos = ghost[pos_axis];
			
			if($dock_to){
				$ghost.addClass("dock");
			}else{
				$ghost.removeClass("dock");
			}
			
			e.preventDefault();
		});
		$(window).on("mouseup",function(e){
			if(!dragging) return;
			dragging = false;
			
			if($dock_to){
				$dock_to.append($c);
				
				pos = Math.max(pos, 0);
				if(pos_axis === "top"){
					pos = Math.min(pos, $dock_to.height() - $ghost.height());
				}else{
					pos = Math.min(pos, $dock_to.width() - $ghost.width());
				}
				
				$c.css("position", "relative");
				$c.css(pos_axis, pos);
			}else{
				console.log("------");
			}
			
			$ghost && $ghost.remove(), $ghost = null;
		});
		return $c;
	}
};

$(function(){
	app.open();
	$("body").on("contextmenu",function(e){
		return false;
	});
	$("body").on("mousedown",function(e){
		e.preventDefault();
	});
});