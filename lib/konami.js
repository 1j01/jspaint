
var Konami = {};

(function() {
	/**
	 * Creates an event handler responding to the specified sequence.
	 * @param {number[]} keySequence
	 * @param {function()} actionCallback
	 * @return {function(Event)}
	 */
	var sequence = function(sequence, action) {
		var index = 0;

		/**
		 * Event handler
		 * @param {Event} event
		 */
		return function(e) {
			var pressedKey = e.keyCode || e.which;
			
			var matchedKey = pressedKey === sequence[index];
			// if it didn't match, reset and try matching against the first key
			if (!matchedKey) {
				index = 0;
				matchedKey = pressedKey === sequence[index];
			}
			
			if (matchedKey) {
				index += 1;
				if (index === sequence.length) {
					// fire action
					action();
	
					// reset when sequence completed
					index = 0;
				}
			}
			
		};
	};

	/**
	 * Creates an event handler responding to the Konami Code.
	 * @param {function()} action completed sequence callback
	 * @return {function(Event)}
	 */
	Konami.code = function(action) {
		return sequence([38, 38, 40, 40, 37, 39, 37, 39, 66, 65], action);
	};

}());
