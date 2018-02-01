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

			window.contentWindow.document.addEventListener('click', function(event) {
				let anchor = event.target;

				if (is_anchor(anchor) && is_external_link(anchor.href)) {
					set_anchor_target_to_open_new_tab(anchor);
				}
			});
		});
	}

	if (launch_data && launch_data.items && launch_data.items.length > 0) {
		launch_data.items.map((item) => open_image(item.entry));
	} else {
		open_image();
	}
});

/**
 * @param {HTMLElement} anchor
 * @return string
 */
function is_anchor(anchor) {
	return anchor.nodeName === 'A';
}

/**
 * @param {string} href
 * @return {boolean}
 */
function is_external_link(href) {
	return href.match(/(http|https):\/\//);
}

/**
 * @param {HTMLElement} anchor
 */
function set_anchor_target_to_open_new_tab(anchor) {
	anchor.target = '_blank';
}
