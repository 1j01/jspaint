(() => {
	const default_theme = "classic.css";
	const theme_storage_key = "jspaint theme";
	const href_for = theme => `styles/themes/${theme}`;
	
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

	let grinch_button;
	let current_theme;
	try {
		const grinch = localStorage.grinch === "true";
		const is_december = new Date().getMonth() === 11;
		if (is_december && !grinch) {
			current_theme = "winter.css"; // overriding theme preference until you disable the seasonal theme
			wait_for_theme_loaded(current_theme, () => { // could just wait for DOM to load, but theme is needed for the button styling
				make_grinch_button();
			});
		} else {
			current_theme = localStorage[theme_storage_key] || default_theme;
		}
	} catch (error) {
		console.error(error);
		current_theme = default_theme;
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
			localStorage.grinch = "true"; // any theme change disables seasonal theme (unless of course you select the seasonal theme)
			grinch_button?.remove();
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

	function make_grinch_button() {
		const button = document.createElement("button");
		button.ariaLabel = "Disable seasonal theme";
		button.className = "grinch-button";
		button.onclick = () => {
			let new_theme;
			try {
				localStorage.grinch = "true";
				new_theme = localStorage[theme_storage_key] || default_theme;
				// eslint-disable-next-line no-empty
			} catch (error) { }
			if (new_theme === "winter.css") {
				new_theme = default_theme;
			}
			set_theme(new_theme);
			button.remove();
		};
		document.body.appendChild(button);
		grinch_button = button;
	}
})();
