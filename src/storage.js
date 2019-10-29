// TODO: remove cruft from being compiled from CoffeeScript
// or maybe replace this module with localforage actually

((() => {
  var isArray, localStore;

  isArray = Array.isArray || (a => {
    return ("" + a) !== a && {}.toString.call(a) === "[object Array]";
  });

  localStore = {
    get: function(key, callback) {
      var defaultValue, err, i, item, len, obj, keys, keys_obj;
      try {
        if (typeof key === "string") {
          item = localStorage.getItem(key);
          if (item) {
            obj = JSON.parse(item);
          }
        } else {
          obj = {};
          if (isArray(key)) {
            keys = key;
            for (i = 0, len = keys.length; i < len; i++) {
              key = keys[i];
              item = localStorage.getItem(key);
              if (item) {
                obj[key] = JSON.parse(item);
              }
            }
          } else {
            keys_obj = key;
            for (key in keys_obj) {
              defaultValue = keys_obj[key];
              item = localStorage.getItem(key);
              if (item) {
                obj[key] = JSON.parse(item);
              } else {
                obj[key] = defaultValue;
              }
            }
          }
        }
      } catch (_error) {
        err = _error;
        callback(err);
        return;
      }
      callback(null, obj);
    },
    set: function(key, value, callback) {
      var err, to_set;
      to_set = {};
      if (typeof key === "string") {
        to_set = {
          [key]: value
        };
      } else if (isArray(key)) {
        throw new TypeError("Cannot set an array of keys (to what?)");
      } else {
        to_set = key, callback = value;
      }
      for (key in to_set) {
        value = to_set[key];
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (_error) {
          err = _error;
          err.quotaExceeded = err.code === 22 || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.number === -2147024882;
          callback(err);
          return;
        }
      }
      return callback(null);
    }
  };

  window.storage = localStore;

})).call(this);
