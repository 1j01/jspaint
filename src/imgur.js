var $imgur_window;

function show_imgur_uploader(){
	if($imgur_window){
		$imgur_window.close();
	}
	$imgur_window = $FormWindow().title("Upload To Imgur").addClass("dialogue-window");
	$imgur_window.$main.html(
		"<label>URL: </label>" +
		"<label id='imgur-description'>Click to upload</label>" +
		"<a id='imgur-url' href='#' target='_blank'></a>"
	);
	// TODO: a button to copy the URL directly (to the clipboard)

	var $imgur_url = $imgur_window.$main.find("#imgur-url");
	var $imgur_description = $imgur_window.$main.find("#imgur-description");

	// deselect early so its more obvious perhaps, or obvious why it would deselect
	// and more similar to the File > Save options anyway
	deselect();
	// TODO: maybe capture the image after deselecting and display it in the window
	// which would work well for GIFs as well, passing in a blob to upload
	// (TODO: add an option to upload rendered GIFs)
	
	// TODO: prevent uploading a ton of times at once by holding down enter
	// by reworking the UI
	$imgur_window.$Button("Upload", function(){
		// (don't assume a selection won't be made between opening the dialogue and uploading)
		// include the selection in the saved image (by deselecting)
		deselect();

		canvas.toBlob(function(blob){
			sanity_check_blob(blob, function(){

				var form_data = new FormData();
				form_data.append('image', blob);

				var $progress = $(E("progress")).appendTo($imgur_window.$main);
				var $progress_percent = $(E("span")).appendTo($imgur_window.$main).css({
					width: "2.3em",
					display: "inline-block",
					textAlign: "center",
				});

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
						$imgur_description.text("Loading...");
					},
					success: function(data){
						$progress.add($progress_percent).remove();
						if(!data.success){
							$imgur_description.text("Failed to upload image :(");
							return;
						}
						var url = data.data.link;
						$imgur_description.text("");
						$imgur_url.text(url);
						$imgur_url.attr('href', url);

						$imgur_window.$Button("Delete", function(){
							$.ajax({
								type: "DELETE",
								url: "https://api.imgur.com/3/image/" + data.data.deletehash,
								headers: {
									"Authorization": "Client-ID 203da2f300125a1",
								},
								dataType: 'json', // of what's expected from the server
								beforeSend: function(){
									$imgur_description.text("Loading...");
								},
								success: function(data){
									if(data.success){
										$imgur_url.text('');
										$imgur_url.attr('href', '#');
										$imgur_description.text("Deleted successfully");
									}else{
										$imgur_description.text("Failed to delete image :(");
									}
								},
								error: function(error){
									$imgur_description.text("Error deleting image :(");
								},
							});
						});
					},
					error: function(error){
						$progress.add($progress_percent).remove();
						$imgur_description.text("Error uploading image :(");
					},
				})
			});
		});
	});
	$imgur_window.$Button("Cancel", function(){
		$imgur_window.close();
	});
	$imgur_window.width(300);
	$imgur_window.center();
}
