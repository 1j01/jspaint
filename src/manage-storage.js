
var $storage_manager;
var $quota_exceeded_window;
var ignoring_quota_exceeded = false;

function storage_quota_exceeded(){
	if($quota_exceeded_window){
		$quota_exceeded_window.close();
		$quota_exceeded_window = null;
	}
	if(ignoring_quota_exceeded){
		return;
	}
	var $w = $FormWindow().title("Storage Error").addClass("dialogue-window");
	$w.$main.html(
		"<p>JS Paint stores images as you work on them so that if you " +
		"close your browser or tab or reload the page " +
		"your images are usually safe.</p>" +
		"<p>However, it has run out of space to do so.</p>" +
		"<p>You can still save the current image with <b>File > Save</b>. " +
		"You should save frequently, or free up enough space to keep the image safe.</p>"
	);
	$w.$Button("View and manage storage", function(){
		$w.close();
		ignoring_quota_exceeded = false;
		manage_storage();
	});
	$w.$Button("Ignore", function(){
		$w.close();
		ignoring_quota_exceeded = true;
	});
	$w.width(500);
	$w.center();
	$quota_exceeded_window = $w;
}

function manage_storage(){
	if($storage_manager){
		$storage_manager.close();
	}
	$storage_manager = $FormWindow().title("Manage Storage").addClass("storage-manager dialogue-window");
	// @TODO: remove all button (with confirmation)
	var $table = $(E("table")).appendTo($storage_manager.$main);
	var $message = $(E("p")).appendTo($storage_manager.$main).html(
		"Any images you've saved to your computer with <b>File > Save</b> will not be affected."
	);
	$storage_manager.$Button("Close", function(){
		$storage_manager.close();
	});
	
	var addRow = function(k, imgSrc){
		var $tr = $(E("tr")).appendTo($table);
		
		var $img = $(E("img")).attr({src: imgSrc});
		var $remove = $(E("button")).text("Remove").addClass("remove-button");
		var href = "#" + k.replace("image#", "local:");
		var $open_link = $(E("a")).attr({href: href, target: "_blank"}).text("Open");
		var $thumbnail_open_link = $(E("a")).attr({href: href, target: "_blank"}).addClass("thumbnail-container");
		$thumbnail_open_link.append($img);
		$(E("td")).append($thumbnail_open_link).appendTo($tr);
		$(E("td")).append($open_link).appendTo($tr);
		$(E("td")).append($remove).appendTo($tr);
		
		$remove.click(function(){
			localStorage.removeItem(k);
			$tr.remove();
			if($table.find("tr").length == 0){
				$message.html("<p>All clear!</p>");
			}
		});
	};
	
	// @TODO: handle localStorage unavailable
	for(var k in localStorage){
		if(k.match(/^image#/)){
			var v = localStorage[k];
			addRow(k, v[0] === '"' ? JSON.parse(v) : v);
		}
	}
	if($table.find("tr").length == 0){
		$message.html("<p>All clear!</p>");
	}
	$storage_manager.width(450);
	$storage_manager.center();
}
