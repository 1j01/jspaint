chrome.app.runtime.onLaunched.addListener(function(launch_data) {
	function open_image(entry) {
		chrome.app.window.create('index.html', {
			bounds: {
				width: 800,
				height: 600,
				left: 100,
				top: 100,
			},
			minWidth: 275,
			minHeight: 400,
		},
		function(window) {
			window.contentWindow.file_entry = entry;
		});
	}

	if (launch_data && launch_data.items && launch_data.items.length > 0) {
		launch_data.items.map((item) => open_image(item.entry));
	} else {
		open_image();
	}
});
