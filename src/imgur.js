var $imgur_window;

function show_imgur_uploader(blob){
	if($imgur_window){
		$imgur_window.close();
	}
	$imgur_window = $FormWindow().title("Upload To Imgur").addClass("dialogue-window");
	
	var $preview_image_area = $(E("div")).appendTo($imgur_window.$main);//.html("<label style='display: block'>Preview:</label>");
	var $imgur_url_area = $(E("div")).appendTo($imgur_window.$main);
	var $imgur_status = $(E("div")).appendTo($imgur_window.$main);
	
	// TODO: maybe make this preview small but zoomable to full size?
	// (starting small (max-width: 100%) and toggling to either scrollable or fullscreen)
	// it should be clear that it's not going to upload a downsized version of your image
	var $preview_image = $(E("img")).appendTo($preview_image_area);
	$preview_image.attr({src: URL.createObjectURL(blob)});
	// $preview_image.css({maxWidth: "100%", maxHeight: "400px"});
	$preview_image_area.css({
		maxWidth: "90vw",
		maxHeight: "70vh",
		overflow: "auto",
		marginBottom: "0.5em",
	});
	$preview_image.on("load", function(){
		$imgur_window.css({width: "auto"});
		$imgur_window.center();
	});

	var $upload_button = $imgur_window.$Button("Upload", function(){

		$preview_image_area.remove();
		$upload_button.remove();
		$cancel_button.remove(); // TODO: allow canceling upload request

		$imgur_window.width(300);
		$imgur_window.center();

		var $progress = $(E("progress")).appendTo($imgur_window.$main);
		var $progress_percent = $(E("span")).appendTo($imgur_window.$main).css({
			width: "2.3em",
			display: "inline-block",
			textAlign: "center",
		});

		var form_data = new FormData();
		form_data.append('image', blob);

		// send HTTP request to the Imgur image upload API
		$.ajax({
			type: "POST",
			url: "https://api.imgur.com/3/image",
			headers: {
				"Authorization": "Client-ID 203da2f300125a1",
			},
			dataType: 'json', // of what's expected from the server, NOT what we're sending
			data: form_data, // what we're sending
			processData: false, // don't try to process the form data (avoid "Illegal invocation")
			contentType: false, // don't send an incorrect Content-Type header please (avoid 500 error from Imgur)
			xhr: function() {
				var myXhr = $.ajaxSettings.xhr();
				if(myXhr.upload){
					myXhr.upload.addEventListener('progress', function(event){
						if(event.lengthComputable){
							var progress_value = event.loaded / event.total;
							var percentage_text = Math.floor(progress_value * 100) + "%";
							$progress.val(progress_value);
							$progress_percent.text(percentage_text);
						}
					}, false);
				}
				return myXhr;
			},
			beforeSend: function(){
				$imgur_status.text("Uploading...");
			},
			success: function(data){
				$progress.add($progress_percent).remove();
				if(!data.success){
					$imgur_status.text("Failed to upload image :(");
					return;
				}
				var url = data.data.link;
				$imgur_status.text("");

				var $imgur_url = $(E("a")).attr({id: "imgur-url", target: "_blank"});

				$imgur_url.text(url);
				$imgur_url.attr('href', url);
				$imgur_url_area.append(
					"<label>URL: </label>"
				).append($imgur_url);
				// TODO: a button to copy the URL directly (to the clipboard)
				
				var $delete_button = $imgur_window.$Button("Delete", function(){
					$.ajax({
						type: "DELETE",
						url: "https://api.imgur.com/3/image/" + data.data.deletehash,
						headers: {
							"Authorization": "Client-ID 203da2f300125a1",
						},
						dataType: 'json', // of what's expected from the server
						beforeSend: function(){
							$imgur_status.text("Deleting...");
						},
						success: function(data){
							$delete_button.remove();
							if(data.success){
								$imgur_url_area.remove();
								$imgur_status.text("Deleted successfully");
							}else{
								$imgur_status.text("Failed to delete image :(");
							}
						},
						error: function(error){
							$imgur_status.text("Error deleting image :(");
						},
					});
				});
				var $okay_button = $imgur_window.$Button("OK", function(){
					$imgur_window.close();
				});
			},
			error: function(error){
				$progress.add($progress_percent).remove();
				$imgur_status.text("Error uploading image :(");
			},
		});
	});
	var $cancel_button = $imgur_window.$Button("Cancel", function(){
		$imgur_window.close();
	});
	$imgur_window.width(300);
	$imgur_window.center();
}
