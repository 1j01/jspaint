/* eslint-disable no-useless-concat */
/* eslint-disable no-alert */

// Use only ES5 syntax for this script!
// (I would enforce this but I wasn't able to get it working with ESLint.)

// Set up basic global error handling, which we can override later in error-handling-enhanced.js

var isIE = /MSIE \d|Trident.*rv:/.test(navigator.userAgent);

window.onerror = function (msg, url, lineNo, columnNo, _error) {
	if (isIE) {
		return false; // Don't need alerts postponing the "not supported" message.
	}
	var string = msg.toLowerCase();
	var substring = "script error";
	if (string.indexOf(substring) > -1) {
		alert("Script Error: See Browser Console for Detail");
	} else {
		// try {
		// 	// try-catch in case of circular references or old browsers without JSON.stringify
		// 	error = JSON.stringify(error);
		// } catch (e) {}
		alert("Internal application error: " + msg + "\n\n" + "URL: " + url + "\n" + "Line: " + lineNo + "\n" + "Column: " + columnNo);
	}
	return false;
};

window.onunhandledrejection = function (event) {
	if (isIE) {
		return false; // Don't need alerts postponing the "not supported" message.
	}
	alert("Unhandled Rejection: " + event.reason);
};

// Show a message for old Internet Explorer.
if (isIE) {
	var html =
		"<style>" +
		"	body { text-align: center; font-family: sans-serif; }" +
		"	hr { width: 180px; }" +
		"	.logo { position: relative; top: 3px; }" +
		"</style>" +
		'<div className="not-supported">' +
		'	<h1><img src="images/icons/32x32.png" class="logo"> JS Paint</h1>' +
		"	<h2>Internet Explorer is not supported!</h2>" +
		'	<p className="not-supported-details">' +
		"		Try " +
		'		<a href="https://www.mozilla.org/firefox/">Firefox</a>, ' +
		'		<a href="https://www.google.com/chrome/">Chrome</a>, ' +
		"		or " +
		'		<a href="https://www.microsoft.com/edge/">Edge</a>.' +
		"	</p>" +
		"	<hr>" +
		"	<p>" +
		'		<a href="about.html">More about JS Paint</a>' +
		"	</p>" +
		"</div>";
	// Wait for body to exist.
	var interval = setInterval(function () {
		if (document.body) {
			clearInterval(interval);
			document.body.innerHTML = html;
		}
	}, 100);
}
