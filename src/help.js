
var $help_window;

function show_help(){
	if($help_window){
		$help_window.close();
	}
	// $help_window = $Window().title("Windows Help");
	$help_window = $Window().title("Help Topics");
	$help_window.addClass("help-window");
	// $toolbar = $(E("div")).addClass("toolbar");
	// $help_window.$content.append($toolbar);
	
	$iframe = $(E("iframe"));
	$contents = $(E("ul")).addClass("contents");
	$help_window.$content.append($contents, $iframe);
	$help_window.$content.css({width: 800, height: 600});
	$iframe.attr({name: "help-frame", src: "help/default.htm"});
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
	
	var $default_item_li = $(E("li")).addClass("default page");
	$default_item_li.text("Welcome to Help").click(function(e){
		$iframe.attr({src: "help/default.htm"});
	});
	$contents.append($default_item_li);
		
	$.get("help/mspaint.hhc", function(hhc){
		$($.parseHTML(hhc)).filter("ul").children().each(function(i, li){
			
			var object = parse_object($(li).children("object"));
			
			var $folder_li = $(E("li")).addClass("folder");
			$folder_li.text(object.Name);
			$contents.append($folder_li);
			
			$folder_li.on("click", function(e){
				if($folder_li.is(e.target)){
					$folder_li.toggleClass("expanded");
				}
			});
			
			var $folder_items_ul = $(E("ul"));
			$folder_li.append($folder_items_ul);
			
			$(li).children("ul").children().each(function(i, li){
				var object = parse_object($(li).children("object"));
				var $item_li = $(E("li")).addClass("page");
				$item_li.text(object.Name).click(function(e){
					$iframe.attr({src: "help/" + object.Local});
				});
				$folder_items_ul.append($item_li);
			});
		});
	});
}
