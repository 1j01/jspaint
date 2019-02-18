(function() {
	/* global window, document, $ */
	var default_theme = "classic.css";
	var theme_storage_key = "jspaint theme";
	var current_theme;
	try {
		current_theme = localStorage[theme_storage_key] || default_theme;
	} catch (error) {
		current_theme = default_theme;
	}

	var theme_link = document.createElement("link");
	theme_link.rel = "stylesheet";
	theme_link.type = "text/css";
	theme_link.href = href_for(current_theme);
	theme_link.id = "theme-link";
	document.head.appendChild(theme_link);

	var theme_style = document.createElement("style");

	window.set_theme = set_theme;
	window.get_theme = get_theme;

	/**
	 * @return {string}
	 */
	function get_theme() {
		return current_theme;
	}

	/**
	 * @param {string} theme
	 * @return {Promise}
	 */
	function set_theme(theme) {
		current_theme = theme;

		var can_probably_refresh_to_switch = true;

		try {
			localStorage[theme_storage_key] = theme;
		} catch(error) {
			can_probably_refresh_to_switch = false;
		}
	
		return (
			fetch(href_for(theme))
			.catch(function(error) {
				var error_message = "Failed to load theme.";

				if (can_probably_refresh_to_switch) {
					error_message += " You can probably reload the app to finish switching themes.";
				}

				show_error_message(error_message, error);
			})
			.then(function(response) {
				// FIXME: catch and then are both called on error
				// this then gets an error because response is undefined
				return response.text();
			})
			.then(function(css) {
				replace_existing_theme_with_loaded_css(
					theme_link,
					theme_style,
					css
				);
			})
		);
	}

	/**
	 * @param {string} theme
	 * @return {string}
	 */
	function href_for(theme) {
		return "styles/themes/" + theme;
	}

	/**
	 * @param {HTMLElement} theme_link
	 * @param {HTMLElement} theme_style
	 * @param {string} css_content
	 */
	function replace_existing_theme_with_loaded_css(
		theme_link,
		theme_style,
		css_content
	) {
		if (theme_link.parentElement) {
			theme_link.parentElement.removeChild(theme_link);
		}

		theme_style.textContent = css_content;

		document.head.appendChild(theme_style);

		$(window).triggerHandler("theme-load");
	}
})();
