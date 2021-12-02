(() => {
	const default_theme = "classic.css";
	const theme_storage_key = "jspaint theme";
	const disable_seasonal_theme_key = "jspaint disable seasonal theme";
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
		const grinch = localStorage[disable_seasonal_theme_key] === "true";
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
			localStorage[disable_seasonal_theme_key] = "true"; // any theme change disables seasonal theme (unless of course you select the seasonal theme)
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
		let clicked = false;
		let smile = 0;
		let momentum = 0;
		let smile_target = 0;
		let anim_id;
		const num_frames = 38;
		const frame_width = 100;
		button.onclick = () => {
			if (smile === smile_target) {
				steal_christmas();
			}
			clicked = true;
		};
		button.onmouseleave = () => {
			smile_target = clicked ? 1 : 0;
			animate();
		};
		button.onmouseenter = () => {
			smile_target = 1;
			momentum = Math.max(momentum, 0.02); // for the immediacy of the hover effect
			animate();
		};
		function animate() {
			cancelAnimationFrame(anim_id);
			smile += momentum * 0.5;
			momentum *= 0.9; // set to 0.99 to test smile getting stuck (should be fixed)
			if (smile_target) {
				momentum += 0.001;
			} else {
				if (smile < 0.4) {
					momentum -= 0.0005; // slowing down the last bit of un-smiling (feels more natural; I wish there were more frames though)
				} else {
					momentum -= 0.001;
				}
			}
			if (smile > 1) {
				smile = 1;
				momentum = 0;
				if (clicked) {
					steal_christmas();
				}
			} else if (smile < 0) {
				smile = 0;
				momentum = 0;
			}
			if (smile !== smile_target) {
				anim_id = requestAnimationFrame(animate);
			}
			button.style.backgroundPosition = `${-Math.floor(smile * (num_frames - 1)) * frame_width}px 0px`;
		}
		function steal_christmas() {
			let new_theme;
			try {
				localStorage[disable_seasonal_theme_key] = "true";
				new_theme = localStorage[theme_storage_key] || default_theme;
				// eslint-disable-next-line no-empty
			} catch (error) { }
			if (new_theme === "winter.css") {
				new_theme = default_theme;
			}
			set_theme(new_theme);
			button.remove();
		}
		document.body.appendChild(button);
		grinch_button = button;
	}
})();
