
var $help_window;

function show_help(){
	if($help_window){
		$help_window.close();
	}
	$help_window = $Window().title("Paint Help"); // "Help Topics" // "Windows Help"
	$help_window.addClass("help-window");
	// $toolbar = $(E("div")).addClass("toolbar");
	// $help_window.$content.append($toolbar);
	
	$iframe = $(E("iframe"));
	$contents = $(E("ul")).addClass("contents");
	$help_window.$content.append($contents, $iframe);
	$help_window.$content.css({width: 800, height: 600});
	$iframe.attr({name: "help-frame", src: "help/default.html"});
	$iframe.css({backgroundColor: "white"});
	$help_window.center();
	
	var parse_object = function($object){
		// parse an $(<object>) to an object
		var object = {};
		$object.children("param").each(function(i, param){
			object[$(param).attr("name")] = $(param).attr("value");
		});
		return object;
	};
	
	var $last_expanded;
	
	var $Item = function(text){
		var $item = $(E("div")).addClass("item").text(text);
		$item.on("mousedown", function(){
			$contents.find(".item").removeClass("selected");
			$item.addClass("selected");
		});
		$item.on("click", function(){
			var $li = $item.parent();
			if($li.is(".folder")){
				if($last_expanded){
					$last_expanded.not($li).removeClass("expanded");
				}
				$li.toggleClass("expanded");
				$last_expanded = $li;
			}
		});
		return $item;
	};
	
	var $default_item_li = $(E("li")).addClass("page");
	$default_item_li.append($Item("Welcome to Help").click(function(e){
		$iframe.attr({src: "help/default.html"});
	}));
	$contents.append($default_item_li);
	
	$.get("help/mspaint.hhc", function(hhc){
		$($.parseHTML(hhc)).filter("ul").children().each(function(i, li){
			
			var object = parse_object($(li).children("object"));
			
			var $folder_li = $(E("li")).addClass("folder");
			$folder_li.append($Item(object.Name));
			$contents.append($folder_li);
			
			var $folder_items_ul = $(E("ul"));
			$folder_li.append($folder_items_ul);
			
			$(li).children("ul").children().each(function(i, li){
				var object = parse_object($(li).children("object"));
				var $item_li = $(E("li")).addClass("page");
				$item_li.append($Item(object.Name).click(function(e){
					$iframe.attr({src: "help/" + object.Local});
				}));
				$folder_items_ul.append($item_li);
			});
		});
	});
	
	// @TODO: keyboard accessability
	// $help_window.on("keydown", function(e){
	// 	switch(e.keyCode){
	// 		case 37:
	// 			show_error_message("MOVE IT");
	// 			break;
	// 	}
	// });
}
