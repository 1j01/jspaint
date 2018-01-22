(function() {
	/* global window, document, $ */
	var default_theme = "classic.css";
	var theme_storage_key = "jspaint theme";

	try {
		var current_theme = localStorage[theme_storage_key];
	} catch(e) {
	}

	current_theme = current_theme || default_theme;

	var theme_link = create_element("link", {
		"rel" : "stylesheet",
		"type" : "text/css",
		"href" : href_for(current_theme),
		"id" : "theme-link"
	});

	var theme_style = create_element("style", {});

	document.head.appendChild(theme_link);

	window.set_theme = function(theme) {
		current_theme = theme;

		var can_probably_refresh_to_switch = true;

		try {
			localStorage[theme_storage_key] = theme;
		} catch(e) {
			can_probably_refresh_to_switch = false;
		}

		fetch_theme_css(theme, can_probably_refresh_to_switch)
		.then(function(css) {
			replace_existing_theme_with_loaded_css(
				theme_link,
				theme_style,
				css
			);
		});
	};

	window.get_theme = function() {
		return current_theme;
	};

	function href_for(theme) {
		return "styles/themes/" + theme;
	}

	function create_element(name, attributes) {
		var element = document.createElement(name);

		for (var attribute_name in attributes) {
			element.setAttribute(attribute_name, attributes[attribute_name]);
		}

		return element;
	}

	function fetch_theme_css(theme, can_probably_refresh_to_switch) {
		var error_message = "Failed to load theme.";

		if (can_probably_refresh_to_switch) {
			error_message += " You can probably reload the app to finish switching themes.";
		}

		return fetch(href_for(theme))
			.catch(function(error_thrown) {
				show_error_message(error_message, error_thrown);
			})
			.then(function(response) {
				return response.text();
			});
	}

	function replace_existing_theme_with_loaded_css(theme_link, theme_style, css) {
		if (theme_link.parentElement) {
			theme_link.parentElement.removeChild(theme_link);
		}

		theme_style.textContent = css;

		document.head.appendChild(theme_style);

		$(window).triggerHandler("theme-load");
	}
})();
