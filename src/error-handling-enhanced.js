// Use only ES5 syntax for this script, as it's meant to handle old IE.

// Note that this can't simply be merged with the other onerror handler with a try/catch,
// because showMessageBox is async, and could throw an error before dependencies are met (or if there was an error in the error handling),
// and try doesn't catch errors in async code. It would need to be awaited.
// And making show_error_message return a promise might cause subtle problems due to the pattern of `return show_error_message()`.
var old_onerror = window.onerror;
window.onerror = function (message, source, lineno, colno, error) {
	try {
		// Some errors don't give an error object, like "ResizeObserver loop limit exceeded"
		show_error_message(localize("Internal application error."), error || message);
	} catch (e) {
		old_onerror(message, source, lineno, colno, error);
	}
};

window.onunhandledrejection = function (event) {
	show_error_message(localize("Internal application error.") + "\nUnhandled Rejection.", event.reason);
};

if (/MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
	document.write(
		'<style>body { text-align: center; }</style>' +
		'<div className="not-supported">' +
		'	<h1 className="not-supported-header">Internet Explorer is not supported!</h1>' +
		'	<p className="not-supported-details">Try Chrome, Firefox, or Edge.</p>' +
		'</div>'
	);
}
