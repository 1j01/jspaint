chrome.app.runtime.onLaunched.addListener(function(launchData){
	if(launchData && launchData.items && launchData.items.length){
		for(var i=0; i<launchData.items.length; i++){
			var entry = launchData.items[i].entry;
			open(entry);
		}
	}else{
		open();
	}
	function open(entry){
		chrome.app.window.create('index.html', {
			bounds: {
				width: 800,
				height: 600,
				left: 100,
				top: 100
			},
			minWidth: 275,
			minHeight: 400
		},
		function(win){
			win.contentWindow.file_entry = entry;
		});
	}
});