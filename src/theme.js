(() => {
	const default_theme = "classic.css";
	const theme_storage_key = "jspaint theme";
	const href_for = theme => `styles/themes/${theme}`;
	
	let current_theme;
	try {
		current_theme = localStorage[theme_storage_key] || default_theme;
	} catch (error) {
		current_theme = default_theme;
	}

	let iid;
	function wait_for_theme_loaded(theme, callback) {
		clearInterval(iid);
		iid = setInterval(() => {
			const theme_loaded =
				getComputedStyle(document.documentElement)
					.getPropertyValue("--theme-loaded")
					.replace(/['"]+/g, "").trim();
			if (theme_loaded === theme) {
				clearInterval(iid);
				callback();
			}
		}, 15);
	}

	const theme_link = document.createElement("link");
	theme_link.rel = "stylesheet";
	theme_link.type = "text/css";
	theme_link.href = href_for(current_theme);
	theme_link.id = "theme-link";
	document.head.appendChild(theme_link);

	window.get_theme = () => current_theme;

	window.set_theme = theme => {
		current_theme = theme;

		try {
			localStorage[theme_storage_key] = theme;
		// eslint-disable-next-line no-empty
		} catch(error) {}

		const signal_theme_load = ()=> {
			$(window).triggerHandler("theme-load");
			$(window).trigger("resize"); // not exactly, but get dynamic cursor to update its offset
		};

		wait_for_theme_loaded(theme, signal_theme_load);
		theme_link.href = href_for(theme);
		signal_theme_load();
	};
})();
