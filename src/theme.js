(function() {
	var default_theme = "classic.css";
	var theme_storage_key = "jspaint theme";
	var href_for = function(theme) {
		return "styles/themes/" + theme;
	};
	
	var current_theme;
	try {
		current_theme = localStorage[theme_storage_key] || default_theme;
	} catch (error) {
		current_theme = default_theme;
	}

	var iid;
	function wait_for_theme_loaded(theme, callback) {
		clearInterval(iid);
		iid = setInterval(function() {
			var theme_loaded =
				getComputedStyle(document.documentElement)
					.getPropertyValue("--theme-loaded")
					.replace(/['"]+/g, "").trim();
			if (theme_loaded === theme) {
				clearInterval(iid);
				callback();
			}
		}, 15);
	}

	var theme_link = document.createElement("link");
	theme_link.rel = "stylesheet";
	theme_link.type = "text/css";
	theme_link.href = href_for(current_theme);
	theme_link.id = "theme-link";
	document.head.appendChild(theme_link);

	window.get_theme = function() {
		return current_theme;
	};

	window.set_theme = function(theme) {
		current_theme = theme;

		try {
			localStorage[theme_storage_key] = theme;
		// eslint-disable-next-line no-empty
		} catch(error) {}

		$(window).on("theme-load", ()=> {
			$(window).trigger("option-changed"); // not really, but get the tool options area for transparency to update
			$(window).trigger("resize"); // not exactly, but get dynamic cursor to update its offset
		});

		wait_for_theme_loaded(theme, function(){
			$(window).triggerHandler("theme-load");
		});
		theme_link.href = href_for(theme);
		$(window).triggerHandler("theme-load");
	};
})();
