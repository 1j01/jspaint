
let $help_window;

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
	$help_window.css({width: 800, height: 600});
	$iframe.attr({name: "help-frame", src: "help/default.html"});
	$iframe.css({backgroundColor: "white"});
	$help_window.center();
	
	const parse_object_params = $object => {
		// parse an $(<object>) to a plain object of key value pairs
		const object = {};
		for (const param of $object.children("param").get()) {
			object[param.name] = param.value;
		}
		return object;
	};
	
	let $last_expanded;
	
	const $Item = text => {
		const $item = $(E("div")).addClass("item").text(text);
		$item.on("mousedown", () => {
			$contents.find(".item").removeClass("selected");
			$item.addClass("selected");
		});
		$item.on("click", () => {
			const $li = $item.parent();
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
	
	const $default_item_li = $(E("li")).addClass("page");
	$default_item_li.append($Item("Welcome to Help").on("click", ()=> {
		$iframe.attr({src: "help/default.html"});
	}));
	$contents.append($default_item_li);
	
	$.get("help/mspaint.hhc", hhc => {
		$($.parseHTML(hhc)).filter("ul").children().get().forEach((li) => {
			
			const object = parse_object_params($(li).children("object"));
			
			const $folder_li = $(E("li")).addClass("folder");
			$folder_li.append($Item(object.Name));
			$contents.append($folder_li);
			
			const $folder_items_ul = $(E("ul"));
			$folder_li.append($folder_items_ul);
			
			$(li).children("ul").children().get().forEach((li) => {
				const object = parse_object_params($(li).children("object"));
				const $item_li = $(E("li")).addClass("page");
				$item_li.append($Item(object.Name).on("click", ()=> {
					$iframe.attr({src: `help/${object.Local}`});
				}));
				$folder_items_ul.append($item_li);
			});
		});
	});
	
	// @TODO: keyboard accessability
	// $help_window.on("keydown", (e)=> {
	// 	switch(e.keyCode){
	// 		case 37:
	// 			show_error_message("MOVE IT");
	// 			break;
	// 	}
	// });
}
