// @ts-check

// @TODO: maybe replace this module with localforage or similar
// (but need to address asynchronous concerns if doing that)

/** @type {LocalStore} */
const localStore = {
	/**
	 * See overrides in interface LocalStore.
	 * @param {string | string[] | Record<string, string>} key_or_keys_or_pairs
	 * @param {((error: Error, value_or_values?: string) => void) | ((error: Error, value_or_values?: Record<string, string>) => void)} callback
	 */
	get(key_or_keys_or_pairs, callback) {
		let obj;
		try {
			if (typeof key_or_keys_or_pairs === "string") {
				const key = key_or_keys_or_pairs;
				const item = localStorage.getItem(key);
				if (item) {
					obj = JSON.parse(item);
				}
			} else {
				obj = {};
				if (Array.isArray(key_or_keys_or_pairs)) {
					const keys = key_or_keys_or_pairs;
					for (let i = 0, len = keys.length; i < len; i++) {
						const key = keys[i];
						const item = localStorage.getItem(key);
						if (item) {
							obj[key] = JSON.parse(item);
						}
					}
				} else {
					const keys_obj = key_or_keys_or_pairs;
					for (const key in keys_obj) {
						let defaultValue = keys_obj[key];
						const item = localStorage.getItem(key);
						if (item) {
							obj[key] = JSON.parse(item);
						} else {
							obj[key] = defaultValue;
						}
					}
				}
			}
		} catch (error) {
			callback(error);
			return;
		}
		callback(null, obj);
	},
	/**
	 * See overrides in interface LocalStore.
	 * @param {string | Record<string, string>} key_or_pairs
	 * @param {string | ((error: Error) => void)} value_or_callback
	 * @param {(error: Error) => void} [callback]
	 */
	set(key_or_pairs, value_or_callback, callback) {
		let to_set = {};
		if (typeof key_or_pairs === "string") {
			to_set = {
				[key_or_pairs]: value_or_callback,
			};
		} else if (Array.isArray(key_or_pairs)) {
			throw new TypeError("Cannot set an array of keys (to what?)");
		} else {
			to_set = key_or_pairs;
			callback = /** @type {(error: Error) => void} */ (value_or_callback);
		}
		for (const key in to_set) {
			const value = to_set[key];
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch (error) {
				error.quotaExceeded = error.code === 22 || error.name === "NS_ERROR_DOM_QUOTA_REACHED" || error.number === -2147024882;
				callback(error);
				return;
			}
		}
		return callback(null);
	},
};

export { localStore };

