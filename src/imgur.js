var $imgur_window;

function upload_to_imgur(){
	if($imgur_window){
		$imgur_window.close();
	}
	$imgur_window = $FormWindow().title("Upload To Imgur").addClass("dialogue-window");
	$imgur_window.$main.html(
		"<label>URL: </label>" +
		"<label id='imgur-description'>Click to upload</label>" +
		"<a id='imgur-url' href='' target='_blank'></a>"
	);

	var $imgur_url = $imgur_window.$main.find("#imgur-url");
	var $imgur_description = $imgur_window.$main.find("#imgur-description");

	$imgur_window.$Button("Upload", function(){
		// base64 encoding to send to imgur api
		var base64 = canvas.toDataURL().split(",")[1];
		var payload = {
			image: base64,
		};

		// send ajax call to the imgur image upload api
		$.ajax({
			type: "POST",
			url: "https://api.imgur.com/3/image",
			headers: {
				"Authorization":"Client-ID 203da2f300125a1",
			},
			dataType: 'json',
			data: payload,
			beforeSend: function(){
				$imgur_description.text("Loading...");
			},
			success: function(data){
				var url = data.data.link;
				$imgur_description.text("");
				$imgur_url.text(url);
				$imgur_url.attr('href', url);
			},
			error: function(error){
				$imgur_description.text("Error uploading image :(");
			},
		})
	});
	$imgur_window.$Button("Cancel", function(){
		$imgur_window.close();
	});
	$imgur_window.width(300);
	$imgur_window.center();
}
