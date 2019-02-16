// TODO: remove "ref" cruft from being compiled from CoffeeScript
// or maybe replace this module with localforage actually

(function() {
  var isArray, localStore, ref, ref1;

  isArray = (ref = Array.isArray) != null ? ref : function(a) {
    return ("" + a) !== a && {}.toString.call(a) === "[object Array]";
  };

  localStore = {
    get: function(key, callback) {
      var defaultValue, err, i, item, len, obj, ref1, ref2;
      try {
        if (typeof key === "string") {
          item = localStorage.getItem(key);
          if (item) {
            obj = JSON.parse(item);
          }
        } else {
          obj = {};
          if (isArray(arguments[0])) {
            ref1 = arguments[0];
            for (i = 0, len = ref1.length; i < len; i++) {
              key = ref1[i];
              item = localStorage.getItem(key);
              if (item) {
                obj[key] = JSON.parse(item);
              }
            }
          } else {
            ref2 = arguments[0];
            for (key in ref2) {
              defaultValue = ref2[key];
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
      var err, obj1, to_set;
      to_set = {};
      if (typeof arguments[0] === "string") {
        to_set = (
          obj1 = {},
          obj1["" + key] = value,
          obj1
        );
      } else if (isArray(arguments[0])) {
        throw new TypeError("Cannot set an array of keys (to what?)");
      } else {
        to_set = arguments[0], callback = arguments[1];
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

}).call(this);
