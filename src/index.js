(function(){
	var default_theme = "classic.css";
	var theme_storage_key = "jspaint theme";

	var href_for = function(theme){
		return "styles/themes/" + theme;
	};
	try{
		var current_theme = localStorage[theme_storage_key];
	}catch(e){}

	current_theme = current_theme || default_theme;

	document.head.appendChild(create_element('link', {
        'rel': 'stylesheet',
        'type': 'text/css',
        'href': href_for(current_theme),
        'id': 'theme-link'
    }));

	var theme_link = document.getElementById("theme-link");
	var theme_style = document.createElement("style");

	self.set_theme = function(theme){
		current_theme = theme;
		var can_probably_refresh_to_switch = true;
		try{
			localStorage[theme_storage_key] = theme;
		}catch(e){
			can_probably_refresh_to_switch = false;
		}
		fetch(href_for(theme))
		.catch(function(err){
			show_error_message(
				"Failed to load theme." +
				(can_probably_refresh_to_switch ? " You can probably reload the app to finish switching themes." : ""),
				err
			);
		})
		// I'm gonna tell a funny joke, just wait..
		.then(function(response) {
			// Q: Why is this a separate step?
			// A: Because response.text() returns a Promise!
			// XD: 😂😂😂 WHO DID THIS 😂😂😂😂 XD
			return response.text();
		})
		.then(function(css) {
			if(theme_link){
				theme_link.parentElement.removeChild(theme_link);
				theme_link = null;
			}
			theme_style.textContent = css;
			document.head.appendChild(theme_style);
			$(window).triggerHandler("theme-load");
		});
	};
	self.get_theme = function(){
		return current_theme;
	};

	function create_element(name, attributes) {
	    var element = document.createElement(name);

	    for (var attribute_name in attributes) {
	        element.setAttribute(attribute_name, attributes[attribute_name]);
	    }

	    return element;
	}
})();