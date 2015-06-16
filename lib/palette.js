!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Palette=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var Color, LoadingErrors, P, Palette, RandomColor, RandomPalette, load_palette, options,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Palette = require("./Palette");

Color = require("./Color");

RandomColor = (function(superClass) {
  extend(RandomColor, superClass);

  function RandomColor() {
    this.randomize();
  }

  RandomColor.prototype.randomize = function() {
    this.h = Math.random() * 360;
    this.s = Math.random() * 100;
    return this.l = Math.random() * 100;
  };

  RandomColor.prototype.toString = function() {
    this.randomize();
    return "hsl(" + this.h + ", " + this.s + "%, " + this.l + "%)";
  };

  RandomColor.prototype.is = function() {
    return false;
  };

  return RandomColor;

})(Color);

RandomPalette = (function(superClass) {
  extend(RandomPalette, superClass);

  function RandomPalette() {
    var i, j, ref;
    RandomPalette.__super__.constructor.call(this);
    this.loaded_as = "Completely Random Colors™";
    this.loaded_as_clause = "(.crc sjf(Df09sjdfksdlfmnm ';';";
    this.confidence = 0;
    this.finalize();
    for (i = j = 0, ref = Math.random() * 15 + 5; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      this.push(new RandomColor());
    }
  }

  return RandomPalette;

})(Palette);

LoadingErrors = (function(superClass) {
  extend(LoadingErrors, superClass);

  function LoadingErrors(errors1) {
    var error;
    this.errors = errors1;
    this.message = "Some errors were encountered when loading:" + (function() {
      var j, len, ref, results;
      ref = this.errors;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        error = ref[j];
        results.push("\n\t" + error.message);
      }
      return results;
    }).call(this);
  }

  return LoadingErrors;

})(Error);

load_palette = function(o, callback) {
  var e, err, errors, exts_pretty, j, k, len, len1, msg, palette, palette_loaders, pl;
  palette_loaders = [
    {
      name: "Paint Shop Pro palette",
      exts: ["pal", "psppalette"],
      load: require("./loaders/PaintShopPro")
    }, {
      name: "RIFF PAL",
      exts: ["pal"],
      load: require("./loaders/RIFF")
    }, {
      name: "ColorSchemer palette",
      exts: ["cs"],
      load: require("./loaders/ColorSchemer")
    }, {
      name: "Paint.NET palette",
      exts: ["txt", "pdn"],
      load: require("./loaders/Paint.NET")
    }, {
      name: "GIMP palette",
      exts: ["gpl", "gimp", "colors"],
      load: require("./loaders/GIMP")
    }, {
      name: "hey look some colors",
      exts: ["txt", "html", "css", "xml", "svg", "etc"],
      load: require("./loaders/Generic")
    }, {
      name: "Houndstooth Palette Locellate",
      exts: ["hpl"],
      load: require("./loaders/HPL")
    }, {
      name: "StarCraft palette",
      exts: ["pal"],
      load: require("./loaders/StarCraft")
    }, {
      name: "StarCraft terrain palette",
      exts: ["wpe"],
      load: require("./loaders/StarCraftPadded")
    }
  ];
  for (j = 0, len = palette_loaders.length; j < len; j++) {
    pl = palette_loaders[j];
    pl.matches_ext = pl.exts.indexOf(o.file_ext) !== -1;
  }
  palette_loaders.sort(function(pl1, pl2) {
    return pl2.matches_ext - pl1.matches_ext;
  });
  errors = [];
  for (k = 0, len1 = palette_loaders.length; k < len1; k++) {
    pl = palette_loaders[k];
    try {
      palette = pl.load(o);
      if (palette.length === 0) {
        palette = null;
        throw new Error("no colors returned");
      }
    } catch (_error) {
      e = _error;
      msg = "failed to load " + o.file_name + " as " + pl.name + ": " + e.message;
      if (pl.matches_ext && !e.message.match(/not a/i)) {
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.error === "function") {
            console.error(msg);
          }
        }
      } else {
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.warn === "function") {
            console.warn(msg);
          }
        }
      }
      err = new Error(msg);
      err.error = e;
      errors.push(err);
    }
    if (palette) {
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.info === "function") {
          console.info("loaded " + o.file_name + " as " + pl.name);
        }
      }
      palette.confidence = pl.matches_ext ? 0.9 : 0.01;
      palette.loaded_as = pl.name;
      exts_pretty = "(." + (pl.exts.join(", .")) + ")";
      if (pl.matches_ext) {
        palette.loaded_as_clause = exts_pretty;
      } else {
        palette.loaded_as_clause = " for some reason";
      }
      palette.finalize();
      callback(null, palette);
      return;
    }
  }
  callback(new LoadingErrors(errors));
};

options = function(o) {
  var ref, ref1, ref2, ref3, ref4, ref5;
  if (o == null) {
    o = {};
  }
  if (typeof o === "string" || o instanceof String) {
    o = {
      file_name: o
    };
  }
  if ((typeof File !== "undefined" && File !== null) && o instanceof File) {
    o = {
      file: o
    };
  }
  if (o.min_colors == null) {
    o.min_colors = (ref = o.minColors) != null ? ref : 2;
  }
  if (o.max_colors == null) {
    o.max_colors = (ref1 = o.maxColors) != null ? ref1 : 256;
  }
  if (o.file_name == null) {
    o.file_name = (ref2 = (ref3 = o.fileName) != null ? ref3 : o.fname) != null ? ref2 : (ref4 = o.file) != null ? ref4.name : void 0;
  }
  if (o.file_ext == null) {
    o.file_ext = (ref5 = o.fileExt) != null ? ref5 : ("" + o.file_name).split(".").pop();
  }
  o.file_ext = ("" + o.file_ext).toLowerCase();
  return o;
};

Palette.load = function(o, callback) {
  var fr, fs;
  if (!o) {
    throw new Error("Parameters required: Palette.load(options, function callback(err, palette){})");
  }
  if (!callback) {
    throw new Error("Callback required: Palette.load(options, function callback(err, palette){})");
  }
  o = options(o);
  if (o.data) {
    return load_palette(o, callback);
  } else if ((typeof File !== "undefined" && File !== null) && o.file instanceof File) {
    fr = new FileReader;
    fr.onload = function() {
      o.data = fr.result;
      return load_palette(o, callback);
    };
    return fr.readAsBinaryString(o.file);
  } else if (typeof global !== "undefined" && global !== null) {
    fs = require("fs");
    return fs.readFile(o.file_name, function(err, data) {
      if (err) {
        return callback(err);
      } else {
        o.data = data.toString("binary");
        return load_palette(o, callback);
      }
    });
  } else {
    return callback(new Error("Could not load. The File API may not be supported."));
  }
};

Palette.gimme = function(o, callback) {
  o = options(o);
  return Palette.load(o, function(err, palette) {
    return callback(null, palette != null ? palette : new RandomPalette);
  });
};

P = module.exports = Palette;

P.Color = Color;

P.Palette = Palette;

P.RandomColor = RandomColor;

P.RandomPalette = RandomPalette;



}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./Color":3,"./Palette":4,"./loaders/ColorSchemer":5,"./loaders/GIMP":6,"./loaders/Generic":7,"./loaders/HPL":8,"./loaders/Paint.NET":9,"./loaders/PaintShopPro":10,"./loaders/RIFF":11,"./loaders/StarCraft":12,"./loaders/StarCraftPadded":13,"fs":"fs"}],2:[function(require,module,exports){

/*
BinaryReader

Modified by Isaiah Odhner
@TODO: use jDataView + jBinary instead

Refactored by Vjeux <vjeuxx@gmail.com>
http://blog.vjeux.com/2010/javascript/javascript-binary-reader.html

Original
+ Jonas Raoni Soares Silva
@ http://jsfromhell.com/classes/binary-parser [rev. #1]
 */
var BinaryReader;

module.exports = BinaryReader = (function() {
  function BinaryReader(data) {
    this._buffer = data;
    this._pos = 0;
  }

  BinaryReader.prototype.readByte = function() {
    var ch;
    this._checkSize(8);
    ch = this._buffer.charCodeAt(this._pos) & 0xff;
    this._pos += 1;
    return ch & 0xff;
  };

  BinaryReader.prototype.readUnicodeString = function() {
    var i, j, length, ref, str;
    length = this.readUInt16();
    console.log({
      length: length
    });
    this._checkSize(length * 16);
    str = "";
    for (i = j = 0, ref = length; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      str += String.fromCharCode(this._buffer.substr(this._pos, 1) | (this._buffer.substr(this._pos + 1, 1) << 8));
      this._pos += 2;
    }
    return str;
  };

  BinaryReader.prototype.readInt8 = function() {
    return this._decodeInt(8, true);
  };

  BinaryReader.prototype.readUInt8 = function() {
    return this._decodeInt(8, false);
  };

  BinaryReader.prototype.readInt16 = function() {
    return this._decodeInt(16, true);
  };

  BinaryReader.prototype.readUInt16 = function() {
    return this._decodeInt(16, false);
  };

  BinaryReader.prototype.readInt32 = function() {
    return this._decodeInt(32, true);
  };

  BinaryReader.prototype.readUInt32 = function() {
    return this._decodeInt(32, false);
  };

  BinaryReader.prototype.readFloat = function() {
    return this._decodeFloat(23, 8);
  };

  BinaryReader.prototype.readDouble = function() {
    return this._decodeFloat(52, 11);
  };

  BinaryReader.prototype.readChar = function() {
    return this.readString(1);
  };

  BinaryReader.prototype.readString = function(length) {
    var result;
    this._checkSize(length * 8);
    result = this._buffer.substr(this._pos, length);
    this._pos += length;
    return result;
  };

  BinaryReader.prototype.seek = function(pos) {
    this._pos = pos;
    return this._checkSize(0);
  };

  BinaryReader.prototype.getPosition = function() {
    return this._pos;
  };

  BinaryReader.prototype.getSize = function() {
    return this._buffer.length;
  };

  BinaryReader.prototype._decodeFloat = function(precisionBits, exponentBits){
		var length = precisionBits + exponentBits + 1;
		var size = length >> 3;
		this._checkSize(length);

		var bias = Math.pow(2, exponentBits - 1) - 1;
		var signal = this._readBits(precisionBits + exponentBits, 1, size);
		var exponent = this._readBits(precisionBits, exponentBits, size);
		var significand = 0;
		var divisor = 2;
		var curByte = 0; //length + (-precisionBits >> 3) - 1;
		do {
			var byteValue = this._readByte(++curByte, size);
			var startBit = precisionBits % 8 || 8;
			var mask = 1 << startBit;
			while (mask >>= 1) {
				if (byteValue & mask) {
					significand += 1 / divisor;
				}
				divisor *= 2;
			}
		} while (precisionBits -= startBit);

		this._pos += size;

		return exponent == (bias << 1) + 1 ? significand ? NaN : signal ? -Infinity : +Infinity
			: (1 + signal * -2) * (exponent || significand ? !exponent ? Math.pow(2, -bias + 1) * significand
			: Math.pow(2, exponent - bias) * (1 + significand) : 0);
	};

  BinaryReader.prototype._decodeInt = function(bits, signed){
		var x = this._readBits(0, bits, bits / 8), max = Math.pow(2, bits);
		var result = signed && x >= max / 2 ? x - max : x;

		this._pos += bits / 8;
		return result;
	};

  BinaryReader.prototype._shl = function (a, b){
		for (++b; --b; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1);
		return a;
	};

  BinaryReader.prototype._readByte = function (i, size) {
		return this._buffer.charCodeAt(this._pos + size - i - 1) & 0xff;
	};

  BinaryReader.prototype._readBits = function (start, length, size) {
		var offsetLeft = (start + length) % 8;
		var offsetRight = start % 8;
		var curByte = size - (start >> 3) - 1;
		var lastByte = size + (-(start + length) >> 3);
		var diff = curByte - lastByte;

		var sum = (this._readByte(curByte, size) >> offsetRight) & ((1 << (diff ? 8 - offsetRight : length)) - 1);

		if (diff && offsetLeft) {
			sum += (this._readByte(lastByte++, size) & ((1 << offsetLeft) - 1)) << (diff-- << 3) - offsetRight; 
		}

		while (diff) {
			sum += this._shl(this._readByte(lastByte++, size), (diff-- << 3) - offsetRight);
		}

		return sum;
	};

  BinaryReader.prototype._checkSize = function(neededBits) {
    if (this._pos + Math.ceil(neededBits / 8) > this._buffer.length) {
      throw new Error("Index out of bound");
    }
  };

  return BinaryReader;

})();



},{}],3:[function(require,module,exports){
var Color;

module.exports = Color = (function() {
  function Color(arg) {
    var _, c, i, j, k, len, len1, m, powed, ref, ref1, rgb, white, xyz, y;
    this.r = arg.r, this.g = arg.g, this.b = arg.b, this.h = arg.h, this.s = arg.s, this.v = arg.v, this.l = arg.l, c = arg.c, m = arg.m, y = arg.y, k = arg.k, this.name = arg.name;
    if ((this.r != null) && (this.g != null) && (this.b != null)) {

    } else if ((this.h != null) && (this.s != null)) {
      if (this.v != null) {
        this.l = (2 - this.s / 100) * this.v / 2;
        this.s = this.s * this.v / (this.l < 50 ? this.l * 2 : 200 - this.l * 2);
        if (isNaN(this.s)) {
          this.s = 0;
        }
      } else if (this.l != null) {

      } else {
        throw new Error("Hue, saturation, and...? (either lightness or value)");
      }
    } else if ((c != null) && (m != null) && (y != null) && (k != null)) {
      c /= 100;
      m /= 100;
      y /= 100;
      k /= 100;
      this.r = 255 * (1 - Math.min(1, c * (1 - k) + k));
      this.g = 255 * (1 - Math.min(1, m * (1 - k) + k));
      this.b = 255 * (1 - Math.min(1, y * (1 - k) + k));
    } else {
      if ((this.l != null) && (this.a != null) && (this.b != null)) {
        white = {
          x: 95.047,
          y: 100.000,
          z: 108.883
        };
        xyz = {
          y: (raw.l + 16) / 116,
          x: raw.a / 500 + xyz.y,
          z: xyz.y - raw.b / 200
        };
        ref = "xyz";
        for (i = 0, len = ref.length; i < len; i++) {
          _ = ref[i];
          powed = Math.pow(xyz[_], 3);
          if (powed > 0.008856) {
            xyz[_] = powed;
          } else {
            xyz[_] = (xyz[_] - 16 / 116) / 7.787;
          }
        }
      }
      if ((this.x != null) && (this.y != null) && (this.z != null)) {
        xyz = {
          x: raw.x / 100,
          y: raw.y / 100,
          z: raw.z / 100
        };
        rgb = {
          r: xyz.x * 3.2406 + xyz.y * -1.5372 + xyz.z * -0.4986,
          g: xyz.x * -0.9689 + xyz.y * 1.8758 + xyz.z * 0.0415,
          b: xyz.x * 0.0557 + xyz.y * -0.2040 + xyz.z * 1.0570
        };
        ref1 = "rgb";
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          _ = ref1[j];
          if (rgb[_] < 0) {
            rgb[_] = 0;
          }
          if (rgb[_] > 0.0031308) {
            rgb[_] = 1.055 * Math.pow(rgb[_], 1 / 2.4) - 0.055;
          } else {
            rgb[_] *= 12.92;
          }
        }
      } else {
        throw new Error("Color constructor must be called with {r,g,b} or {h,s,v} or {h,s,l} or {c,m,y,k} or {x,y,z} or {l,a,b}");
      }
    }
  }

  Color.prototype.toString = function() {
    if (this.r != null) {
      if (this.a != null) {
        return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")";
      } else {
        return "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
      }
    } else if (this.h != null) {
      if (this.a != null) {
        return "hsla(" + this.h + ", " + this.s + "%, " + this.l + "%, " + this.a + ")";
      } else {
        return "hsl(" + this.h + ", " + this.s + "%, " + this.l + "%)";
      }
    }
  };

  Color.prototype.is = function(color) {
    return ("" + this) === ("" + color);
  };

  return Color;

})();



},{}],4:[function(require,module,exports){
var Color, Palette,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Color = require("./Color");

module.exports = Palette = (function(superClass) {
  extend(Palette, superClass);

  function Palette() {
    Palette.__super__.constructor.call(this);
    this.with_duplicates = this;
  }

  Palette.prototype.add = function(o) {
    var color, i, len1, new_color;
    new_color = new Color(o);
    if (this.with_duplicates === this) {
      this.with_duplicates = new Palette();
    }
    this.with_duplicates.push(new_color);
    for (i = 0, len1 = this.length; i < len1; i++) {
      color = this[i];
      if (color.is(new_color)) {
        new_color.is_duplicate = true;
        return;
      }
    }
    return this.push(new_color);
  };

  Palette.prototype.finalize = function() {
    if (!this.n_columns) {
      this.guess_dimensions();
    }
    if (this.with_duplicates) {
      return this.with_duplicates.guess_dimensions();
    }
  };

  Palette.prototype.guess_dimensions = function() {
    var candidate_dimensions, cd, i, j, len, len1, n_columns, n_rows, ref, results, squarest;
    len = this.length;
    candidate_dimensions = [];
    for (n_columns = i = 0, ref = len; 0 <= ref ? i <= ref : i >= ref; n_columns = 0 <= ref ? ++i : --i) {
      n_rows = len / n_columns;
      if (n_rows === Math.round(n_rows)) {
        candidate_dimensions.push([n_rows, n_columns]);
      }
    }
    squarest = [0, 3495093];
    results = [];
    for (j = 0, len1 = candidate_dimensions.length; j < len1; j++) {
      cd = candidate_dimensions[j];
      if (Math.abs(cd[0] - cd[1]) < Math.abs(squarest[0] - squarest[1])) {
        results.push(squarest = cd);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  return Palette;

})(Array);



},{"./Color":3}],5:[function(require,module,exports){
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function(arg) {
  var br, data, i, length, palette, version;
  data = arg.data;
  palette = new Palette();
  br = new BinaryReader(data);
  version = br.readUInt16();
  length = br.readUInt16();
  i = 0;
  while (i < length) {
    br.seek(8 + i * 26);
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte()
    });
    i += 1;
  }
  return palette;
};



},{"../BinaryReader":2,"../Palette":4}],6:[function(require,module,exports){
var Palette;

Palette = require("../Palette");

module.exports = function(arg) {
  var data, i, line, lines, m, palette, r_g_b_name;
  data = arg.data;
  lines = data.split(/[\n\r]+/m);
  if (lines[0] !== "GIMP Palette") {
    throw new Error("Not a GIMP Palette");
  }
  palette = new Palette();
  i = 1;
  while ((i += 1) < lines.length) {
    line = lines[i];
    if (line.match(/^#/) || line === "") {
      continue;
    }
    m = line.match(/Name:\s*(.*)/);
    if (m) {
      palette.name = m[1];
      continue;
    }
    m = line.match(/Columns:\s*(.*)/);
    if (m) {
      palette.n_columns = Number(m[1]);
      palette.has_dimensions = true;
      continue;
    }
    r_g_b_name = line.match(/^\s*([0-9]+)\s+([0-9]+)\s+([0-9]+)(?:\s+(.*))?$/);
    if (!r_g_b_name) {
      throw new Error("Line " + i + " doesn't match pattern r_g_b_name");
    }
    palette.add({
      r: r_g_b_name[1],
      g: r_g_b_name[2],
      b: r_g_b_name[3],
      name: r_g_b_name[4]
    });
  }
  return palette;
};



},{"../Palette":4}],7:[function(require,module,exports){
var Palette;

Palette = require("../Palette");

module.exports = function(arg) {
  var data, hex, i, len, most_colors, n, palette, palette_hsl, palette_hsla, palette_rgb, palette_rgba, palette_xRGB, palette_xRRGGBB, palettes;
  data = arg.data;
  palettes = [palette_xRRGGBB = new Palette(), palette_xRGB = new Palette(), palette_rgb = new Palette(), palette_hsl = new Palette(), palette_hsla = new Palette(), palette_rgba = new Palette()];
  hex = function(x) {
    return parseInt(x, 16);
  };
  data.replace(/\#([0-9A-F]{2})?([0-9A-F]{3})([0-9A-F]{3})?(?![0-9A-F])/gim, function(m, $0, $1, $2) {
    var alpha, xRGB;
    alpha = hex($0);
    if ($2) {
      xRGB = $1 + $2;
      return palette_xRRGGBB.add({
        r: hex(xRGB[0] + xRGB[1]),
        g: hex(xRGB[2] + xRGB[3]),
        b: hex(xRGB[4] + xRGB[5]),
        a: alpha
      });
    } else {
      xRGB = $1;
      return palette_xRGB.add({
        r: hex(xRGB[0] + xRGB[0]),
        g: hex(xRGB[1] + xRGB[1]),
        b: hex(xRGB[2] + xRGB[2]),
        a: alpha
      });
    }
  });
  data.replace(/rgb\(\s*([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3})\s*\)/gim, function(m) {
    return palette_rgb.add({
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3])
    });
  });
  data.replace(/rgba\(\s*([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3}|0\.[0-9]+)\s*\)/gim, function(m) {
    return palette_rgb.add({
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
      a: Number(m[4])
    });
  });
  data.replace(/hsl\(\s*([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3})\s*\)/gim, function(m) {
    return palette_rgb.add({
      h: Number(m[1]),
      s: Number(m[2]),
      l: Number(m[3])
    });
  });
  most_colors = [];
  for (i = 0, len = palettes.length; i < len; i++) {
    palette = palettes[i];
    if (palette.length >= most_colors.length) {
      most_colors = palette;
    }
  }
  n = most_colors.length;
  if (n < 4) {
    throw new Error(["No colors found", "Only one color found", "Only a couple colors found", "Only a few colors found"][n] + (" (" + n + ")"));
  }
  return most_colors;
};



},{"../Palette":4}],8:[function(require,module,exports){
var Palette;

Palette = require("../Palette");

module.exports = function(arg) {
  var data, i, j, len, line, lines, palette, rgb;
  data = arg.data;
  lines = data.split(/[\n\r]+/m);
  if (lines[0] !== "Palette") {
    throw new Error("Not an HPL palette");
  }
  if (!lines[1].match(/Version [34]\.0/)) {
    throw new Error("Unsupported HPL version");
  }
  palette = new Palette();
  for (i = j = 0, len = lines.length; j < len; i = ++j) {
    line = lines[i];
    if (line.match(/.+ .* .+/)) {
      rgb = line.split(" ");
      palette.add({
        r: rgb[0],
        g: rgb[1],
        b: rgb[2]
      });
    }
  }
  return palette;
};



},{"../Palette":4}],9:[function(require,module,exports){
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function(arg) {
  var data, hex, i, len, line, m, palette, ref;
  data = arg.data;
  palette = new Palette();
  hex = function(x) {
    return parseInt(x, 16);
  };
  ref = data.split(/[\n\r]+/m);
  for (i = 0, len = ref.length; i < len; i++) {
    line = ref[i];
    m = line.match(/^([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i);
    if (m) {
      palette.add({
        a: hex(m[1]),
        r: hex(m[2]),
        g: hex(m[3]),
        b: hex(m[4])
      });
    }
  }
  return palette;
};



},{"../BinaryReader":2,"../Palette":4}],10:[function(require,module,exports){
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function(arg) {
  var data, i, j, len, line, lines, palette, rgb;
  data = arg.data;
  lines = data.split(/[\n\r]+/m);
  if (lines[0] !== "JASC-PAL") {
    throw new Error("Not a JASC-PAL");
  }
  if (lines[1] !== "0100") {
    throw new Error("Unknown JASC-PAL version");
  }
  if (lines[2] !== "256") {
    "that's ok";
  }
  palette = new Palette();
  for (i = j = 0, len = lines.length; j < len; i = ++j) {
    line = lines[i];
    if (line !== "" && i > 2) {
      rgb = line.split(" ");
      palette.add({
        r: rgb[0],
        g: rgb[1],
        b: rgb[2]
      });
    }
  }
  return palette;
};



},{"../BinaryReader":2,"../Palette":4}],11:[function(require,module,exports){
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function(arg) {
  var br, chunkSize, chunkType, data, dataSize, i, palNumEntries, palVersion, palette, riff, type;
  data = arg.data;
  br = new BinaryReader(data);
  riff = br.readString(4);
  dataSize = br.readUInt32();
  type = br.readString(4);
  if (riff !== "RIFF") {
    throw new Error("RIFF header not found; not a RIFF PAL file");
  }
  if (type !== "PAL ") {
    throw new Error("RIFF header says this isn't a PAL file,\nmore of a sort of " + ((type + "").trim()) + " file");
  }
  chunkType = br.readString(4);
  chunkSize = br.readUInt32();
  palVersion = br.readUInt16();
  palNumEntries = br.readUInt16();
  if (chunkType !== "data") {
    throw new Error("Data chunk not found (...'" + chunkType + "'?)");
  }
  if (palVersion !== 0x0300) {
    throw new Error("Unsupported PAL file version: 0x" + (palVersion.toString(16)));
  }
  palette = new Palette();
  i = 0;
  while ((i += 1) < palNumEntries - 1) {
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte(),
      _: br.readByte()
    });
  }
  return palette;
};



},{"../BinaryReader":2,"../Palette":4}],12:[function(require,module,exports){
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function(arg) {
  var br, data, i, j, palette;
  data = arg.data;
  palette = new Palette();
  br = new BinaryReader(data);
  for (i = j = 0; j < 255; i = ++j) {
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte()
    });
  }
  return palette;
};



},{"../BinaryReader":2,"../Palette":4}],13:[function(require,module,exports){
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function(arg) {
  var br, data, i, j, palette;
  data = arg.data;
  palette = new Palette();
  br = new BinaryReader(data);
  for (i = j = 0; j < 255; i = ++j) {
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte(),
      _: br.readByte()
    });
  }
  palette.n_columns = 16;
  return palette;
};



},{"../BinaryReader":2,"../Palette":4}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzpcXFVzZXJzXFxJc2FpYWhcXCEhUHJvamVjdHNcXHBhbGV0dGUuanNcXHNyY1xcbWFpbi5jb2ZmZWUiLCJDOlxcVXNlcnNcXElzYWlhaFxcISFQcm9qZWN0c1xccGFsZXR0ZS5qc1xcc3JjXFxCaW5hcnlSZWFkZXIuY29mZmVlIiwiQzpcXFVzZXJzXFxJc2FpYWhcXCEhUHJvamVjdHNcXHBhbGV0dGUuanNcXHNyY1xcQ29sb3IuY29mZmVlIiwiQzpcXFVzZXJzXFxJc2FpYWhcXCEhUHJvamVjdHNcXHBhbGV0dGUuanNcXHNyY1xcUGFsZXR0ZS5jb2ZmZWUiLCJDOlxcVXNlcnNcXElzYWlhaFxcISFQcm9qZWN0c1xccGFsZXR0ZS5qc1xcc3JjXFxsb2FkZXJzXFxDb2xvclNjaGVtZXIuY29mZmVlIiwiQzpcXFVzZXJzXFxJc2FpYWhcXCEhUHJvamVjdHNcXHBhbGV0dGUuanNcXHNyY1xcbG9hZGVyc1xcR0lNUC5jb2ZmZWUiLCJDOlxcVXNlcnNcXElzYWlhaFxcISFQcm9qZWN0c1xccGFsZXR0ZS5qc1xcc3JjXFxsb2FkZXJzXFxHZW5lcmljLmNvZmZlZSIsIkM6XFxVc2Vyc1xcSXNhaWFoXFwhIVByb2plY3RzXFxwYWxldHRlLmpzXFxzcmNcXGxvYWRlcnNcXEhQTC5jb2ZmZWUiLCJDOlxcVXNlcnNcXElzYWlhaFxcISFQcm9qZWN0c1xccGFsZXR0ZS5qc1xcc3JjXFxsb2FkZXJzXFxQYWludC5ORVQuY29mZmVlIiwiQzpcXFVzZXJzXFxJc2FpYWhcXCEhUHJvamVjdHNcXHBhbGV0dGUuanNcXHNyY1xcbG9hZGVyc1xcUGFpbnRTaG9wUHJvLmNvZmZlZSIsIkM6XFxVc2Vyc1xcSXNhaWFoXFwhIVByb2plY3RzXFxwYWxldHRlLmpzXFxzcmNcXGxvYWRlcnNcXFJJRkYuY29mZmVlIiwiQzpcXFVzZXJzXFxJc2FpYWhcXCEhUHJvamVjdHNcXHBhbGV0dGUuanNcXHNyY1xcbG9hZGVyc1xcU3RhckNyYWZ0LmNvZmZlZSIsIkM6XFxVc2Vyc1xcSXNhaWFoXFwhIVByb2plY3RzXFxwYWxldHRlLmpzXFxzcmNcXGxvYWRlcnNcXFN0YXJDcmFmdFBhZGRlZC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQ0EsSUFBQSxtRkFBQTtFQUFBOzZCQUFBOztBQUFBLE9BQUEsR0FBVSxPQUFBLENBQVEsV0FBUixDQUFWLENBQUE7O0FBQUEsS0FDQSxHQUFRLE9BQUEsQ0FBUSxTQUFSLENBRFIsQ0FBQTs7QUFBQTtBQUlDLGlDQUFBLENBQUE7O0FBQWEsRUFBQSxxQkFBQSxHQUFBO0FBQ1osSUFBQSxJQUFDLENBQUEsU0FBRCxDQUFBLENBQUEsQ0FEWTtFQUFBLENBQWI7O0FBQUEsd0JBR0EsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNWLElBQUEsSUFBQyxDQUFBLENBQUQsR0FBSyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBZ0IsR0FBckIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLENBQUQsR0FBSyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBZ0IsR0FEckIsQ0FBQTtXQUVBLElBQUMsQ0FBQSxDQUFELEdBQUssSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFBLEdBQWdCLElBSFg7RUFBQSxDQUhYLENBQUE7O0FBQUEsd0JBUUEsUUFBQSxHQUFVLFNBQUEsR0FBQTtBQUNULElBQUEsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFBLENBQUE7V0FDQSxNQUFBLEdBQU8sSUFBQyxDQUFBLENBQVIsR0FBVSxJQUFWLEdBQWMsSUFBQyxDQUFBLENBQWYsR0FBaUIsS0FBakIsR0FBc0IsSUFBQyxDQUFBLENBQXZCLEdBQXlCLEtBRmhCO0VBQUEsQ0FSVixDQUFBOztBQUFBLHdCQVlBLEVBQUEsR0FBSSxTQUFBLEdBQUE7V0FBRyxNQUFIO0VBQUEsQ0FaSixDQUFBOztxQkFBQTs7R0FEeUIsTUFIMUIsQ0FBQTs7QUFBQTtBQW1C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QUgsQ0FBQSxDQUFIO0FBQUEsTUFDQSxDQUFBLEVBQUcsRUFBRSxDQUFDLFFBQUgsQ0FBQSxDQURIO0FBQUEsTUFFQSxDQUFBLEVBQUcsRUFBRSxDQUFDLFFBQUgsQ0FBQSxDQUZIO0FBQUEsTUFHQSxDQUFBLEVBQUcsRUFBRSxDQUFDLFFBQUgsQ0FBQSxDQUhIO0tBREQsQ0FBQSxDQUREO0FBQUEsR0FIQTtBQUFBLEVBVUEsT0FBTyxDQUFDLFNBQVIsR0FBb0IsRUFWcEIsQ0FBQTtTQVdBLFFBYmdCO0FBQUEsQ0FIakIsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuL1BhbGV0dGVcIlxyXG5Db2xvciA9IHJlcXVpcmUgXCIuL0NvbG9yXCJcclxuXHJcbmNsYXNzIFJhbmRvbUNvbG9yIGV4dGVuZHMgQ29sb3JcclxuXHRjb25zdHJ1Y3RvcjogLT5cclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFxyXG5cdHJhbmRvbWl6ZTogLT5cclxuXHRcdEBoID0gTWF0aC5yYW5kb20oKSAqIDM2MFxyXG5cdFx0QHMgPSBNYXRoLnJhbmRvbSgpICogMTAwXHJcblx0XHRAbCA9IE1hdGgucmFuZG9tKCkgKiAxMDBcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdEByYW5kb21pemUoKVxyXG5cdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IC0+IG5vXHJcblxyXG5jbGFzcyBSYW5kb21QYWxldHRlIGV4dGVuZHMgUGFsZXR0ZVxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QGxvYWRlZF9hcyA9IFwiQ29tcGxldGVseSBSYW5kb20gQ29sb3Jz4oSiXCJcclxuXHRcdEBsb2FkZWRfYXNfY2xhdXNlID0gXCIoLmNyYyBzamYoRGYwOXNqZGZrc2RsZm1ubSAnOyc7XCJcclxuXHRcdEBjb25maWRlbmNlID0gMFxyXG5cdFx0QGZpbmFsaXplKClcclxuXHRcdGZvciBpIGluIFswLi5NYXRoLnJhbmRvbSgpKjE1KzVdXHJcblx0XHRcdEBwdXNoIG5ldyBSYW5kb21Db2xvcigpXHJcblxyXG5jbGFzcyBMb2FkaW5nRXJyb3JzIGV4dGVuZHMgRXJyb3JcclxuXHRjb25zdHJ1Y3RvcjogKEBlcnJvcnMpLT5cclxuXHRcdEBtZXNzYWdlID0gXCJTb21lIGVycm9ycyB3ZXJlIGVuY291bnRlcmVkIHdoZW4gbG9hZGluZzpcIiArXHJcblx0XHRcdGZvciBlcnJvciBpbiBAZXJyb3JzXHJcblx0XHRcdFx0XCJcXG5cXHRcIiArIGVycm9yLm1lc3NhZ2VcclxuXHJcbmxvYWRfcGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdFxyXG5cdHBhbGV0dGVfbG9hZGVycyA9IFtcclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludCBTaG9wIFBybyBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wicGFsXCIsIFwicHNwcGFsZXR0ZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50U2hvcFByb1wiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiUklGRiBQQUxcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9SSUZGXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJDb2xvclNjaGVtZXIgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImNzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ29sb3JTY2hlbWVyXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJQYWludC5ORVQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInR4dFwiLCBcInBkblwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1BhaW50Lk5FVFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiR0lNUCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiZ3BsXCIsIFwiZ2ltcFwiLCBcImNvbG9yc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0dJTVBcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcImhleSBsb29rIHNvbWUgY29sb3JzXCJcclxuXHRcdFx0ZXh0czogW1widHh0XCIsIFwiaHRtbFwiLCBcImNzc1wiLCBcInhtbFwiLCBcInN2Z1wiLCBcImV0Y1wiXVxyXG5cdFx0XHQjIEBUT0RPOiByZW5hbWUgdGhpcyB0byBcIkNTU1wiIChpdCdzIG5vdCB2ZXJ5IFwiZ2VuZXJpY1wiKVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0dlbmVyaWNcIlxyXG5cdFx0fVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBDb2xvciBTd2F0Y2hcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjb1wiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclN3YXRjaFwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgVGFibGVcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjdFwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclRhYmxlXCJcclxuXHRcdCMgfVxyXG5cdFx0IyB7XHJcblx0XHQjIFx0bmFtZTogXCJBZG9iZSBTd2F0Y2ggRXhjaGFuZ2VcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFzZVwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVTd2F0Y2hFeGNoYW5nZVwiXHJcblx0XHQjIH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgQ29sb3IgQm9va1wiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNiXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yQm9va1wiXHJcblx0XHQjIH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJIb3VuZHN0b290aCBQYWxldHRlIExvY2VsbGF0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImhwbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0hQTFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU3RhckNyYWZ0IHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TdGFyQ3JhZnRcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlN0YXJDcmFmdCB0ZXJyYWluIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJ3cGVcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TdGFyQ3JhZnRQYWRkZWRcIlxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkF1dG9DQUQgQ29sb3IgQm9va1wiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNiXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BdXRvQ0FEQ29sb3JCb29rXCJcclxuXHRcdCMgfVxyXG5cdFx0XHJcblx0XHQjIHtcclxuXHRcdCMgXHQjIChzYW1lIGFzIFBhaW50IFNob3AgUHJvIHBhbGV0dGU/KVxyXG5cdFx0IyBcdG5hbWU6IFwiQ29yZWxEUkFXIHBhbGV0dGVcIlxyXG5cdFx0IyBcdGV4dHM6IFtcInBhbFwiLCBcImNwbFwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ29yZWxEUkFXXCJcclxuXHRcdCMgfVxyXG5cdF1cclxuXHRcclxuXHQjIGZpbmQgcGFsZXR0ZSBsb2FkZXJzIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRmb3IgcGwgaW4gcGFsZXR0ZV9sb2FkZXJzXHJcblx0XHRwbC5tYXRjaGVzX2V4dCA9IHBsLmV4dHMuaW5kZXhPZihvLmZpbGVfZXh0KSBpc250IC0xXHJcblx0XHJcblx0IyBtb3ZlIHBhbGV0dGUgbG9hZGVycyB0byB0aGUgYmVnaW5uaW5nIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRwYWxldHRlX2xvYWRlcnMuc29ydCAocGwxLCBwbDIpLT5cclxuXHRcdHBsMi5tYXRjaGVzX2V4dCAtIHBsMS5tYXRjaGVzX2V4dFxyXG5cdFxyXG5cdCMgdHJ5IGxvYWRpbmcgc3R1ZmZcclxuXHRlcnJvcnMgPSBbXVxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdFxyXG5cdFx0dHJ5XHJcblx0XHRcdHBhbGV0dGUgPSBwbC5sb2FkKG8pXHJcblx0XHRcdGlmIHBhbGV0dGUubGVuZ3RoIGlzIDBcclxuXHRcdFx0XHRwYWxldHRlID0gbnVsbFxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIm5vIGNvbG9ycyByZXR1cm5lZFwiXHJcblx0XHRjYXRjaCBlXHJcblx0XHRcdG1zZyA9IFwiZmFpbGVkIHRvIGxvYWQgI3tvLmZpbGVfbmFtZX0gYXMgI3twbC5uYW1lfTogI3tlLm1lc3NhZ2V9XCJcclxuXHRcdFx0aWYgcGwubWF0Y2hlc19leHQgYW5kIG5vdCBlLm1lc3NhZ2UubWF0Y2goL25vdCBhL2kpXHJcblx0XHRcdFx0Y29uc29sZT8uZXJyb3I/IG1zZ1xyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0Y29uc29sZT8ud2Fybj8gbXNnXHJcblx0XHRcdFxyXG5cdFx0XHRlcnIgPSBuZXcgRXJyb3IgbXNnXHJcblx0XHRcdGVyci5lcnJvciA9IGVcclxuXHRcdFx0ZXJyb3JzLnB1c2ggZXJyXHJcblx0XHRcclxuXHRcdGlmIHBhbGV0dGVcclxuXHRcdFx0Y29uc29sZT8uaW5mbz8gXCJsb2FkZWQgI3tvLmZpbGVfbmFtZX0gYXMgI3twbC5uYW1lfVwiXHJcblx0XHRcdHBhbGV0dGUuY29uZmlkZW5jZSA9IGlmIHBsLm1hdGNoZXNfZXh0IHRoZW4gMC45IGVsc2UgMC4wMVxyXG5cdFx0XHRwYWxldHRlLmxvYWRlZF9hcyA9IHBsLm5hbWVcclxuXHRcdFx0ZXh0c19wcmV0dHkgPSBcIiguI3twbC5leHRzLmpvaW4oXCIsIC5cIil9KVwiXHJcblx0XHRcdFxyXG5cdFx0XHRpZiBwbC5tYXRjaGVzX2V4dFxyXG5cdFx0XHRcdHBhbGV0dGUubG9hZGVkX2FzX2NsYXVzZSA9IGV4dHNfcHJldHR5XHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRwYWxldHRlLmxvYWRlZF9hc19jbGF1c2UgPSBcIiBmb3Igc29tZSByZWFzb25cIlxyXG5cdFx0XHRcclxuXHRcdFx0cGFsZXR0ZS5maW5hbGl6ZSgpXHJcblx0XHRcdGNhbGxiYWNrKG51bGwsIHBhbGV0dGUpXHJcblx0XHRcdHJldHVyblxyXG5cdFxyXG5cdGNhbGxiYWNrKG5ldyBMb2FkaW5nRXJyb3JzKGVycm9ycykpXHJcblx0cmV0dXJuXHJcblxyXG5vcHRpb25zID0gKG8gPSB7fSktPlxyXG5cdGlmIHR5cGVvZiBvIGlzIFwic3RyaW5nXCIgb3IgbyBpbnN0YW5jZW9mIFN0cmluZ1xyXG5cdFx0byA9IGZpbGVfbmFtZTogb1xyXG5cdGlmIEZpbGU/IGFuZCBvIGluc3RhbmNlb2YgRmlsZVxyXG5cdFx0byA9IGZpbGU6IG9cclxuXHRcclxuXHRvLm1pbl9jb2xvcnMgPz0gby5taW5Db2xvcnMgPyAyXHJcblx0by5tYXhfY29sb3JzID89IG8ubWF4Q29sb3JzID8gMjU2XHJcblx0by5maWxlX25hbWUgPz0gby5maWxlTmFtZSA/IG8uZm5hbWUgPyBvLmZpbGU/Lm5hbWVcclxuXHRvLmZpbGVfZXh0ID89IG8uZmlsZUV4dCA/IFwiI3tvLmZpbGVfbmFtZX1cIi5zcGxpdChcIi5cIikucG9wKClcclxuXHRvLmZpbGVfZXh0ID0gKFwiI3tvLmZpbGVfZXh0fVwiKS50b0xvd2VyQ2FzZSgpXHJcblx0b1xyXG5cdFxyXG5cclxuIyBHZXQgcGFsZXR0ZSBmcm9tIGEgZmlsZVxyXG5QYWxldHRlLmxvYWQgPSAobywgY2FsbGJhY2spLT5cclxuXHRpZiBub3Qgb1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiUGFyYW1ldGVycyByZXF1aXJlZDogUGFsZXR0ZS5sb2FkKG9wdGlvbnMsIGZ1bmN0aW9uIGNhbGxiYWNrKGVyciwgcGFsZXR0ZSl7fSlcIlxyXG5cdGlmIG5vdCBjYWxsYmFja1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiQ2FsbGJhY2sgcmVxdWlyZWQ6IFBhbGV0dGUubG9hZChvcHRpb25zLCBmdW5jdGlvbiBjYWxsYmFjayhlcnIsIHBhbGV0dGUpe30pXCJcclxuXHRcclxuXHRvID0gb3B0aW9ucyBvXHJcblx0XHJcblx0aWYgby5kYXRhXHJcblx0XHRsb2FkX3BhbGV0dGUobywgY2FsbGJhY2spXHJcblx0ZWxzZSBpZiBGaWxlPyBhbmQgby5maWxlIGluc3RhbmNlb2YgRmlsZVxyXG5cdFx0ZnIgPSBuZXcgRmlsZVJlYWRlclxyXG5cdFx0ZnIub25sb2FkID0gLT5cclxuXHRcdFx0by5kYXRhID0gZnIucmVzdWx0XHJcblx0XHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRcdGZyLnJlYWRBc0JpbmFyeVN0cmluZyBvLmZpbGVcclxuXHRlbHNlIGlmIGdsb2JhbD9cclxuXHRcdFxyXG5cdFx0ZnMgPSByZXF1aXJlIFwiZnNcIlxyXG5cdFx0ZnMucmVhZEZpbGUgby5maWxlX25hbWUsIChlcnIsIGRhdGEpLT5cclxuXHRcdFx0aWYgZXJyXHJcblx0XHRcdFx0Y2FsbGJhY2soZXJyKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0by5kYXRhID0gZGF0YS50b1N0cmluZyhcImJpbmFyeVwiKVxyXG5cdFx0XHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlXHJcblx0XHRjYWxsYmFjayhuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZC4gVGhlIEZpbGUgQVBJIG1heSBub3QgYmUgc3VwcG9ydGVkLlwiKSlcclxuXHJcblxyXG4jIEdldCBhIHBhbGV0dGUgZnJvbSBhIGZpbGUgb3IgYnkgYW55IG1lYW5zIG5lc3Nlc2FyeVxyXG4jIChhcyBpbiBmYWxsIGJhY2sgdG8gY29tcGxldGVseSByYW5kb20gZGF0YSlcclxuUGFsZXR0ZS5naW1tZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdG8gPSBvcHRpb25zIG9cclxuXHRcclxuXHRQYWxldHRlLmxvYWQgbywgKGVyciwgcGFsZXR0ZSktPlxyXG5cdFx0Y2FsbGJhY2sobnVsbCwgcGFsZXR0ZSA/IG5ldyBSYW5kb21QYWxldHRlKVxyXG5cclxuIyBFeHBvcnRzXHJcblAgPSBtb2R1bGUuZXhwb3J0cyA9IFBhbGV0dGVcclxuUC5Db2xvciA9IENvbG9yXHJcblAuUGFsZXR0ZSA9IFBhbGV0dGVcclxuUC5SYW5kb21Db2xvciA9IFJhbmRvbUNvbG9yXHJcblAuUmFuZG9tUGFsZXR0ZSA9IFJhbmRvbVBhbGV0dGVcclxuIyBQLkxvYWRpbmdFcnJvcnMgPSBMb2FkaW5nRXJyb3JzXHJcbiIsIlxyXG4jIyNcclxuQmluYXJ5UmVhZGVyXHJcblxyXG5Nb2RpZmllZCBieSBJc2FpYWggT2RobmVyXHJcbkBUT0RPOiB1c2UgakRhdGFWaWV3ICsgakJpbmFyeSBpbnN0ZWFkXHJcblxyXG5SZWZhY3RvcmVkIGJ5IFZqZXV4IDx2amV1eHhAZ21haWwuY29tPlxyXG5odHRwOi8vYmxvZy52amV1eC5jb20vMjAxMC9qYXZhc2NyaXB0L2phdmFzY3JpcHQtYmluYXJ5LXJlYWRlci5odG1sXHJcblxyXG5PcmlnaW5hbFxyXG4rIEpvbmFzIFJhb25pIFNvYXJlcyBTaWx2YVxyXG5AIGh0dHA6Ly9qc2Zyb21oZWxsLmNvbS9jbGFzc2VzL2JpbmFyeS1wYXJzZXIgW3Jldi4gIzFdXHJcbiMjI1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBCaW5hcnlSZWFkZXJcclxuXHRjb25zdHJ1Y3RvcjogKGRhdGEpLT5cclxuXHRcdEBfYnVmZmVyID0gZGF0YVxyXG5cdFx0QF9wb3MgPSAwXHJcblxyXG5cdCMgUHVibGljIChjdXN0b20pXHJcblx0XHJcblx0cmVhZEJ5dGU6IC0+XHJcblx0XHRAX2NoZWNrU2l6ZSg4KVxyXG5cdFx0Y2ggPSB0aGlzLl9idWZmZXIuY2hhckNvZGVBdChAX3BvcykgJiAweGZmXHJcblx0XHRAX3BvcyArPSAxXHJcblx0XHRjaCAmIDB4ZmZcclxuXHRcclxuXHRyZWFkVW5pY29kZVN0cmluZzogLT5cclxuXHRcdGxlbmd0aCA9IEByZWFkVUludDE2KClcclxuXHRcdGNvbnNvbGUubG9nIHtsZW5ndGh9XHJcblx0XHRAX2NoZWNrU2l6ZShsZW5ndGggKiAxNilcclxuXHRcdHN0ciA9IFwiXCJcclxuXHRcdGZvciBpIGluIFswLi5sZW5ndGhdXHJcblx0XHRcdHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKEBfYnVmZmVyLnN1YnN0cihAX3BvcywgMSkgfCAoQF9idWZmZXIuc3Vic3RyKEBfcG9zKzEsIDEpIDw8IDgpKVxyXG5cdFx0XHRAX3BvcyArPSAyXHJcblx0XHRzdHJcclxuXHRcclxuXHQjIFB1YmxpY1xyXG5cdFxyXG5cdHJlYWRJbnQ4OiAtPiBAX2RlY29kZUludCg4LCB0cnVlKVxyXG5cdHJlYWRVSW50ODogLT4gQF9kZWNvZGVJbnQoOCwgZmFsc2UpXHJcblx0cmVhZEludDE2OiAtPiBAX2RlY29kZUludCgxNiwgdHJ1ZSlcclxuXHRyZWFkVUludDE2OiAtPiBAX2RlY29kZUludCgxNiwgZmFsc2UpXHJcblx0cmVhZEludDMyOiAtPiBAX2RlY29kZUludCgzMiwgdHJ1ZSlcclxuXHRyZWFkVUludDMyOiAtPiBAX2RlY29kZUludCgzMiwgZmFsc2UpXHJcblxyXG5cdHJlYWRGbG9hdDogLT4gQF9kZWNvZGVGbG9hdCgyMywgOClcclxuXHRyZWFkRG91YmxlOiAtPiBAX2RlY29kZUZsb2F0KDUyLCAxMSlcclxuXHRcclxuXHRyZWFkQ2hhcjogLT4gQHJlYWRTdHJpbmcoMSlcclxuXHRyZWFkU3RyaW5nOiAobGVuZ3RoKS0+XHJcblx0XHRAX2NoZWNrU2l6ZShsZW5ndGggKiA4KVxyXG5cdFx0cmVzdWx0ID0gQF9idWZmZXIuc3Vic3RyKEBfcG9zLCBsZW5ndGgpXHJcblx0XHRAX3BvcyArPSBsZW5ndGhcclxuXHRcdHJlc3VsdFxyXG5cclxuXHRzZWVrOiAocG9zKS0+XHJcblx0XHRAX3BvcyA9IHBvc1xyXG5cdFx0QF9jaGVja1NpemUoMClcclxuXHRcclxuXHRnZXRQb3NpdGlvbjogLT4gQF9wb3NcclxuXHRcclxuXHRnZXRTaXplOiAtPiBAX2J1ZmZlci5sZW5ndGhcclxuXHRcclxuXHJcblxyXG5cdCMgUHJpdmF0ZVxyXG5cdFxyXG5cdF9kZWNvZGVGbG9hdDogYGZ1bmN0aW9uKHByZWNpc2lvbkJpdHMsIGV4cG9uZW50Qml0cyl7XHJcblx0XHR2YXIgbGVuZ3RoID0gcHJlY2lzaW9uQml0cyArIGV4cG9uZW50Qml0cyArIDE7XHJcblx0XHR2YXIgc2l6ZSA9IGxlbmd0aCA+PiAzO1xyXG5cdFx0dGhpcy5fY2hlY2tTaXplKGxlbmd0aCk7XHJcblxyXG5cdFx0dmFyIGJpYXMgPSBNYXRoLnBvdygyLCBleHBvbmVudEJpdHMgLSAxKSAtIDE7XHJcblx0XHR2YXIgc2lnbmFsID0gdGhpcy5fcmVhZEJpdHMocHJlY2lzaW9uQml0cyArIGV4cG9uZW50Qml0cywgMSwgc2l6ZSk7XHJcblx0XHR2YXIgZXhwb25lbnQgPSB0aGlzLl9yZWFkQml0cyhwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMsIHNpemUpO1xyXG5cdFx0dmFyIHNpZ25pZmljYW5kID0gMDtcclxuXHRcdHZhciBkaXZpc29yID0gMjtcclxuXHRcdHZhciBjdXJCeXRlID0gMDsgLy9sZW5ndGggKyAoLXByZWNpc2lvbkJpdHMgPj4gMykgLSAxO1xyXG5cdFx0ZG8ge1xyXG5cdFx0XHR2YXIgYnl0ZVZhbHVlID0gdGhpcy5fcmVhZEJ5dGUoKytjdXJCeXRlLCBzaXplKTtcclxuXHRcdFx0dmFyIHN0YXJ0Qml0ID0gcHJlY2lzaW9uQml0cyAlIDggfHwgODtcclxuXHRcdFx0dmFyIG1hc2sgPSAxIDw8IHN0YXJ0Qml0O1xyXG5cdFx0XHR3aGlsZSAobWFzayA+Pj0gMSkge1xyXG5cdFx0XHRcdGlmIChieXRlVmFsdWUgJiBtYXNrKSB7XHJcblx0XHRcdFx0XHRzaWduaWZpY2FuZCArPSAxIC8gZGl2aXNvcjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGl2aXNvciAqPSAyO1xyXG5cdFx0XHR9XHJcblx0XHR9IHdoaWxlIChwcmVjaXNpb25CaXRzIC09IHN0YXJ0Qml0KTtcclxuXHJcblx0XHR0aGlzLl9wb3MgKz0gc2l6ZTtcclxuXHJcblx0XHRyZXR1cm4gZXhwb25lbnQgPT0gKGJpYXMgPDwgMSkgKyAxID8gc2lnbmlmaWNhbmQgPyBOYU4gOiBzaWduYWwgPyAtSW5maW5pdHkgOiArSW5maW5pdHlcclxuXHRcdFx0OiAoMSArIHNpZ25hbCAqIC0yKSAqIChleHBvbmVudCB8fCBzaWduaWZpY2FuZCA/ICFleHBvbmVudCA/IE1hdGgucG93KDIsIC1iaWFzICsgMSkgKiBzaWduaWZpY2FuZFxyXG5cdFx0XHQ6IE1hdGgucG93KDIsIGV4cG9uZW50IC0gYmlhcykgKiAoMSArIHNpZ25pZmljYW5kKSA6IDApO1xyXG5cdH1gXHJcblxyXG5cdF9kZWNvZGVJbnQ6IGBmdW5jdGlvbihiaXRzLCBzaWduZWQpe1xyXG5cdFx0dmFyIHggPSB0aGlzLl9yZWFkQml0cygwLCBiaXRzLCBiaXRzIC8gOCksIG1heCA9IE1hdGgucG93KDIsIGJpdHMpO1xyXG5cdFx0dmFyIHJlc3VsdCA9IHNpZ25lZCAmJiB4ID49IG1heCAvIDIgPyB4IC0gbWF4IDogeDtcclxuXHJcblx0XHR0aGlzLl9wb3MgKz0gYml0cyAvIDg7XHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH1gXHJcblxyXG5cdCNzaGwgZml4OiBIZW5yaSBUb3JnZW1hbmUgfjE5OTYgKGNvbXByZXNzZWQgYnkgSm9uYXMgUmFvbmkpXHJcblx0X3NobDogYGZ1bmN0aW9uIChhLCBiKXtcclxuXHRcdGZvciAoKytiOyAtLWI7IGEgPSAoKGEgJT0gMHg3ZmZmZmZmZiArIDEpICYgMHg0MDAwMDAwMCkgPT0gMHg0MDAwMDAwMCA/IGEgKiAyIDogKGEgLSAweDQwMDAwMDAwKSAqIDIgKyAweDdmZmZmZmZmICsgMSk7XHJcblx0XHRyZXR1cm4gYTtcclxuXHR9YFxyXG5cdFxyXG5cdF9yZWFkQnl0ZTogYGZ1bmN0aW9uIChpLCBzaXplKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fYnVmZmVyLmNoYXJDb2RlQXQodGhpcy5fcG9zICsgc2l6ZSAtIGkgLSAxKSAmIDB4ZmY7XHJcblx0fWBcclxuXHJcblx0X3JlYWRCaXRzOiBgZnVuY3Rpb24gKHN0YXJ0LCBsZW5ndGgsIHNpemUpIHtcclxuXHRcdHZhciBvZmZzZXRMZWZ0ID0gKHN0YXJ0ICsgbGVuZ3RoKSAlIDg7XHJcblx0XHR2YXIgb2Zmc2V0UmlnaHQgPSBzdGFydCAlIDg7XHJcblx0XHR2YXIgY3VyQnl0ZSA9IHNpemUgLSAoc3RhcnQgPj4gMykgLSAxO1xyXG5cdFx0dmFyIGxhc3RCeXRlID0gc2l6ZSArICgtKHN0YXJ0ICsgbGVuZ3RoKSA+PiAzKTtcclxuXHRcdHZhciBkaWZmID0gY3VyQnl0ZSAtIGxhc3RCeXRlO1xyXG5cclxuXHRcdHZhciBzdW0gPSAodGhpcy5fcmVhZEJ5dGUoY3VyQnl0ZSwgc2l6ZSkgPj4gb2Zmc2V0UmlnaHQpICYgKCgxIDw8IChkaWZmID8gOCAtIG9mZnNldFJpZ2h0IDogbGVuZ3RoKSkgLSAxKTtcclxuXHJcblx0XHRpZiAoZGlmZiAmJiBvZmZzZXRMZWZ0KSB7XHJcblx0XHRcdHN1bSArPSAodGhpcy5fcmVhZEJ5dGUobGFzdEJ5dGUrKywgc2l6ZSkgJiAoKDEgPDwgb2Zmc2V0TGVmdCkgLSAxKSkgPDwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0OyBcclxuXHRcdH1cclxuXHJcblx0XHR3aGlsZSAoZGlmZikge1xyXG5cdFx0XHRzdW0gKz0gdGhpcy5fc2hsKHRoaXMuX3JlYWRCeXRlKGxhc3RCeXRlKyssIHNpemUpLCAoZGlmZi0tIDw8IDMpIC0gb2Zmc2V0UmlnaHQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBzdW07XHJcblx0fWBcclxuXHJcblx0X2NoZWNrU2l6ZTogKG5lZWRlZEJpdHMpLT5cclxuXHRcdGlmIEBfcG9zICsgTWF0aC5jZWlsKG5lZWRlZEJpdHMgLyA4KSA+IEBfYnVmZmVyLmxlbmd0aFxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJJbmRleCBvdXQgb2YgYm91bmRcIlxyXG5cclxuIiwiXHJcbm1vZHVsZS5leHBvcnRzID1cclxuY2xhc3MgQ29sb3JcclxuXHQjIEBUT0RPOiBkb24ndCBhc3NpZ24ge0ByLCBAZywgQGIsIEBoLCBAcywgQHYsIEBsfSByaWdodCBhd2F5XHJcblx0IyAobW9yZSBvZiBhIHRvLWRvbid0LCByZWFsbHkpXHJcblx0Y29uc3RydWN0b3I6ICh7XHJcblx0XHRAciwgQGcsIEBiLFxyXG5cdFx0QGgsIEBzLCBAdiwgQGwsXHJcblx0XHRjLCBtLCB5LCBrLFxyXG5cdFx0QG5hbWVcclxuXHR9KS0+XHJcblx0XHRpZiBAcj8gYW5kIEBnPyBhbmQgQGI/XHJcblx0XHRcdCMgUmVkIEdyZWVuIEJsdWVcclxuXHRcdGVsc2UgaWYgQGg/IGFuZCBAcz9cclxuXHRcdFx0IyBDeWxpbmRyaWNhbCBDb2xvciBTcGFjZVxyXG5cdFx0XHRpZiBAdj9cclxuXHRcdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIFZhbHVlXHJcblx0XHRcdFx0QGwgPSAoMiAtIEBzIC8gMTAwKSAqIEB2IC8gMlxyXG5cdFx0XHRcdEBzID0gQHMgKiBAdiAvIChpZiBAbCA8IDUwIHRoZW4gQGwgKiAyIGVsc2UgMjAwIC0gQGwgKiAyKVxyXG5cdFx0XHRcdEBzID0gMCBpZiBpc05hTiBAc1xyXG5cdFx0XHRlbHNlIGlmIEBsP1xyXG5cdFx0XHRcdCMgSHVlIFNhdHVyYXRpb24gTGlnaHRuZXNzXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJIdWUsIHNhdHVyYXRpb24sIGFuZC4uLj8gKGVpdGhlciBsaWdodG5lc3Mgb3IgdmFsdWUpXCJcclxuXHRcdGVsc2UgaWYgYz8gYW5kIG0/IGFuZCB5PyBhbmQgaz9cclxuXHRcdFx0IyBDeWFuIE1hZ2VudGEgWWVsbG93IGJsYWNLXHJcblx0XHRcdCMgVU5URVNURURcclxuXHRcdFx0YyAvPSAxMDBcclxuXHRcdFx0bSAvPSAxMDBcclxuXHRcdFx0eSAvPSAxMDBcclxuXHRcdFx0ayAvPSAxMDBcclxuXHRcdFx0XHJcblx0XHRcdEByID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCBjICogKDEgLSBrKSArIGspKVxyXG5cdFx0XHRAZyA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgbSAqICgxIC0gaykgKyBrKSlcclxuXHRcdFx0QGIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIHkgKiAoMSAtIGspICsgaykpXHJcblx0XHRlbHNlXHJcblx0XHRcdCMgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURURcclxuXHRcdFx0aWYgQGw/IGFuZCBAYT8gYW5kIEBiP1xyXG5cdFx0XHRcdHdoaXRlID1cclxuXHRcdFx0XHRcdHg6IDk1LjA0N1xyXG5cdFx0XHRcdFx0eTogMTAwLjAwMFxyXG5cdFx0XHRcdFx0ejogMTA4Ljg4M1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHh5eiA9IFxyXG5cdFx0XHRcdFx0eTogKHJhdy5sICsgMTYpIC8gMTE2XHJcblx0XHRcdFx0XHR4OiByYXcuYSAvIDUwMCArIHh5ei55XHJcblx0XHRcdFx0XHR6OiB4eXoueSAtIHJhdy5iIC8gMjAwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Zm9yIF8gaW4gXCJ4eXpcIlxyXG5cdFx0XHRcdFx0cG93ZWQgPSBNYXRoLnBvdyh4eXpbX10sIDMpXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHBvd2VkID4gMC4wMDg4NTZcclxuXHRcdFx0XHRcdFx0eHl6W19dID0gcG93ZWRcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0eHl6W19dID0gKHh5eltfXSAtIDE2IC8gMTE2KSAvIDcuNzg3XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdCN4eXpbX10gPSBfcm91bmQoeHl6W19dICogd2hpdGVbX10pXHJcblx0XHRcdFx0XHJcblx0XHRcdCMgVU5URVNURUQgVU5URVNURUQgVU5URVNURUQgVU5URVNURURcclxuXHRcdFx0aWYgQHg/IGFuZCBAeT8gYW5kIEB6P1xyXG5cdFx0XHRcdHh5eiA9XHJcblx0XHRcdFx0XHR4OiByYXcueCAvIDEwMFxyXG5cdFx0XHRcdFx0eTogcmF3LnkgLyAxMDBcclxuXHRcdFx0XHRcdHo6IHJhdy56IC8gMTAwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0cmdiID1cclxuXHRcdFx0XHRcdHI6IHh5ei54ICogMy4yNDA2ICsgeHl6LnkgKiAtMS41MzcyICsgeHl6LnogKiAtMC40OTg2XHJcblx0XHRcdFx0XHRnOiB4eXoueCAqIC0wLjk2ODkgKyB4eXoueSAqIDEuODc1OCArIHh5ei56ICogMC4wNDE1XHJcblx0XHRcdFx0XHRiOiB4eXoueCAqIDAuMDU1NyArIHh5ei55ICogLTAuMjA0MCArIHh5ei56ICogMS4wNTcwXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Zm9yIF8gaW4gXCJyZ2JcIlxyXG5cdFx0XHRcdFx0I3JnYltfXSA9IF9yb3VuZChyZ2JbX10pXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHJnYltfXSA8IDBcclxuXHRcdFx0XHRcdFx0cmdiW19dID0gMFxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiByZ2JbX10gPiAwLjAwMzEzMDhcclxuXHRcdFx0XHRcdFx0cmdiW19dID0gMS4wNTUgKiBNYXRoLnBvdyhyZ2JbX10sICgxIC8gMi40KSkgLSAwLjA1NVxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gKj0gMTIuOTJcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQjcmdiW19dID0gTWF0aC5yb3VuZChyZ2JbX10gKiAyNTUpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDb2xvciBjb25zdHJ1Y3RvciBtdXN0IGJlIGNhbGxlZCB3aXRoIHtyLGcsYn0gb3Ige2gscyx2fSBvciB7aCxzLGx9IG9yIHtjLG0seSxrfSBvciB7eCx5LHp9IG9yIHtsLGEsYn1cIlxyXG5cdFx0XHJcblx0XHJcblx0dG9TdHJpbmc6IC0+XHJcblx0XHRpZiBAcj9cclxuXHRcdFx0IyBSZWQgR3JlZW4gQmx1ZVxyXG5cdFx0XHRpZiBAYT8gIyBBbHBoYVxyXG5cdFx0XHRcdFwicmdiYSgje0ByfSwgI3tAZ30sICN7QGJ9LCAje0BhfSlcIlxyXG5cdFx0XHRlbHNlICMgT3BhcXVlXHJcblx0XHRcdFx0XCJyZ2IoI3tAcn0sICN7QGd9LCAje0BifSlcIlxyXG5cdFx0ZWxzZSBpZiBAaD9cclxuXHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBMaWdodG5lc3NcclxuXHRcdFx0IyAoQXNzdW1lIGg6MC0zNjAsIHM6MC0xMDAsIGw6MC0xMDApXHJcblx0XHRcdGlmIEBhPyAjIEFscGhhXHJcblx0XHRcdFx0XCJoc2xhKCN7QGh9LCAje0BzfSUsICN7QGx9JSwgI3tAYX0pXCJcclxuXHRcdFx0ZWxzZSAjIE9wYXF1ZVxyXG5cdFx0XHRcdFwiaHNsKCN7QGh9LCAje0BzfSUsICN7QGx9JSlcIlxyXG5cdFxyXG5cdGlzOiAoY29sb3IpLT5cclxuXHRcdFwiI3tAfVwiIGlzIFwiI3tjb2xvcn1cIlxyXG4iLCJcclxuQ29sb3IgPSByZXF1aXJlIFwiLi9Db2xvclwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIFBhbGV0dGUgZXh0ZW5kcyBBcnJheVxyXG5cdFxyXG5cdGNvbnN0cnVjdG9yOiAtPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QHdpdGhfZHVwbGljYXRlcyA9IEBcclxuXHRcdFxyXG5cdGFkZDogKG8pLT5cclxuXHRcdG5ld19jb2xvciA9IG5ldyBDb2xvcihvKVxyXG5cdFx0XHJcblx0XHRpZiBAd2l0aF9kdXBsaWNhdGVzIGlzIEBcclxuXHRcdFx0QHdpdGhfZHVwbGljYXRlcyA9IG5ldyBQYWxldHRlKClcclxuXHRcdFxyXG5cdFx0QHdpdGhfZHVwbGljYXRlcy5wdXNoIG5ld19jb2xvclxyXG5cdFx0XHJcblx0XHRmb3IgY29sb3IgaW4gQFxyXG5cdFx0XHRpZiBjb2xvci5pcyBuZXdfY29sb3JcclxuXHRcdFx0XHRuZXdfY29sb3IuaXNfZHVwbGljYXRlID0gdHJ1ZVxyXG5cdFx0XHRcdHJldHVyblxyXG5cdFx0XHJcblx0XHRAcHVzaCBuZXdfY29sb3JcclxuXHRcclxuXHRmaW5hbGl6ZTogLT5cclxuXHRcdGlmIG5vdCBAbl9jb2x1bW5zXHJcblx0XHRcdEBndWVzc19kaW1lbnNpb25zKClcclxuXHRcdGlmIEB3aXRoX2R1cGxpY2F0ZXNcclxuXHRcdFx0QHdpdGhfZHVwbGljYXRlcy5ndWVzc19kaW1lbnNpb25zKClcclxuXHRcdFxyXG5cdGd1ZXNzX2RpbWVuc2lvbnM6IC0+XHJcblx0XHRsZW4gPSBAbGVuZ3RoXHJcblx0XHRjYW5kaWRhdGVfZGltZW5zaW9ucyA9IFtdXHJcblx0XHRmb3Igbl9jb2x1bW5zIGluIFswLi5sZW5dXHJcblx0XHRcdG5fcm93cyA9IGxlbiAvIG5fY29sdW1uc1xyXG5cdFx0XHRpZiBuX3Jvd3MgaXMgTWF0aC5yb3VuZCBuX3Jvd3NcclxuXHRcdFx0XHRjYW5kaWRhdGVfZGltZW5zaW9ucy5wdXNoIFtuX3Jvd3MsIG5fY29sdW1uc11cclxuXHRcdFxyXG5cdFx0c3F1YXJlc3QgPSBbMCwgMzQ5NTA5M11cclxuXHRcdGZvciBjZCBpbiBjYW5kaWRhdGVfZGltZW5zaW9uc1xyXG5cdFx0XHRpZiBNYXRoLmFicyhjZFswXSAtIGNkWzFdKSA8IE1hdGguYWJzKHNxdWFyZXN0WzBdIC0gc3F1YXJlc3RbMV0pXHJcblx0XHRcdFx0c3F1YXJlc3QgPSBjZFxyXG5cdFx0XHJcblx0XHQjQG5fY29sdW1ucyA9IHNxdWFyZXN0WzFdXHJcbiIsIlxyXG4jIExvYWQgYSBDb2xvclNjaGVtZXIgcGFsZXR0ZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdHZlcnNpb24gPSBici5yZWFkVUludDE2KCkgIyBvciBzb21ldGhpbmdcclxuXHRsZW5ndGggPSBici5yZWFkVUludDE2KClcclxuXHRpID0gMFxyXG5cdHdoaWxlIGkgPCBsZW5ndGhcclxuXHRcdGJyLnNlZWsoOCArIGkgKiAyNilcclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRpICs9IDFcclxuXHJcblx0cGFsZXR0ZVxyXG5cclxuIiwiXHJcbiMgTG9hZCBhIEdJTVAgcGFsZXR0ZVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIkdJTVAgUGFsZXR0ZVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSBHSU1QIFBhbGV0dGVcIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0aSA9IDFcclxuXHR3aGlsZSAoaSArPSAxKSA8IGxpbmVzLmxlbmd0aFxyXG5cdFx0bGluZSA9IGxpbmVzW2ldXHJcblx0XHRcclxuXHRcdGlmIGxpbmUubWF0Y2goL14jLykgb3IgbGluZSBpcyBcIlwiIHRoZW4gY29udGludWVcclxuXHRcdFxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL05hbWU6XFxzKiguKikvKVxyXG5cdFx0aWYgbVxyXG5cdFx0XHRwYWxldHRlLm5hbWUgPSBtWzFdXHJcblx0XHRcdGNvbnRpbnVlXHJcblx0XHRtID0gbGluZS5tYXRjaCgvQ29sdW1uczpcXHMqKC4qKS8pXHJcblx0XHRpZiBtXHJcblx0XHRcdHBhbGV0dGUubl9jb2x1bW5zID0gTnVtYmVyKG1bMV0pXHJcblx0XHRcdHBhbGV0dGUuaGFzX2RpbWVuc2lvbnMgPSB5ZXNcclxuXHRcdFx0Y29udGludWVcclxuXHRcdFxyXG5cdFx0cl9nX2JfbmFtZSA9IGxpbmUubWF0Y2goL15cXHMqKFswLTldKylcXHMrKFswLTldKylcXHMrKFswLTldKykoPzpcXHMrKC4qKSk/JC8pXHJcblx0XHRpZiBub3Qgcl9nX2JfbmFtZVxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJMaW5lICN7aX0gZG9lc24ndCBtYXRjaCBwYXR0ZXJuIHJfZ19iX25hbWVcIlxyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiByX2dfYl9uYW1lWzFdXHJcblx0XHRcdGc6IHJfZ19iX25hbWVbMl1cclxuXHRcdFx0Yjogcl9nX2JfbmFtZVszXVxyXG5cdFx0XHRuYW1lOiByX2dfYl9uYW1lWzRdXHJcblx0XHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIERldGVjdCBDU1MgY29sb3JzIChleGNlcHQgbmFtZWQgY29sb3JzKVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGVzID0gW1xyXG5cdFx0cGFsZXR0ZV94UlJHR0JCID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV94UkdCID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9yZ2IgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hzbCA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfaHNsYSA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfcmdiYSA9IG5ldyBQYWxldHRlKClcclxuXHRdXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0ZGF0YS5yZXBsYWNlIC8vL1xyXG5cdFx0XFwjICMgaGFzaHRhZyAjICMvXHJcblx0XHQoWzAtOUEtRl17Mn0pPyAjIGFscGhhXHJcblx0XHQoWzAtOUEtRl17M30pICMgdGhyZWUgZGlnaXRzICgjQTBDKVxyXG5cdFx0KFswLTlBLUZdezN9KT8gIyBzaXggZGlnaXRzICgjQUEwMENDKVxyXG5cdFx0XHJcblx0XHQoPyFbMC05QS1GXSkgIyAoYW5kIG5vIG1vcmUhKVxyXG5cdC8vL2dpbSwgKG0sICQwLCAkMSwgJDIpLT5cclxuXHRcdFxyXG5cdFx0YWxwaGEgPSBoZXggJDBcclxuXHRcdFxyXG5cdFx0aWYgJDJcclxuXHRcdFx0eFJHQiA9ICQxICsgJDJcclxuXHRcdFx0cGFsZXR0ZV94UlJHR0JCLmFkZFxyXG5cdFx0XHRcdHI6IGhleCB4UkdCWzBdICsgeFJHQlsxXVxyXG5cdFx0XHRcdGc6IGhleCB4UkdCWzJdICsgeFJHQlszXVxyXG5cdFx0XHRcdGI6IGhleCB4UkdCWzRdICsgeFJHQls1XVxyXG5cdFx0XHRcdGE6IGFscGhhXHJcblx0XHRlbHNlXHJcblx0XHRcdHhSR0IgPSAkMVxyXG5cdFx0XHRwYWxldHRlX3hSR0IuYWRkXHJcblx0XHRcdFx0cjogaGV4IHhSR0JbMF0gKyB4UkdCWzBdXHJcblx0XHRcdFx0ZzogaGV4IHhSR0JbMV0gKyB4UkdCWzFdXHJcblx0XHRcdFx0YjogaGV4IHhSR0JbMl0gKyB4UkdCWzJdXHJcblx0XHRcdFx0YTogYWxwaGFcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyByZWRcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgZ3JlZW5cclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgYmx1ZVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyIG1bMV1cclxuXHRcdFx0ZzogTnVtYmVyIG1bMl1cclxuXHRcdFx0YjogTnVtYmVyIG1bM11cclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JhXFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgcmVkXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGdyZWVuXHJcblx0XHQsXHRcXHMqXHJcblx0XHRcdChbMC05XXsxLDN9KSAjIGJsdWVcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM318MFxcLlswLTldKykgIyBhbHBoYVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyIG1bMV1cclxuXHRcdFx0ZzogTnVtYmVyIG1bMl1cclxuXHRcdFx0YjogTnVtYmVyIG1bM11cclxuXHRcdFx0YTogTnVtYmVyIG1bNF1cclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRoc2xcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyBodWVcclxuXHRcdCxcdFxccypcclxuXHRcdFx0KFswLTldezEsM30pICMgc2F0dXJhdGlvblxyXG5cdFx0LFx0XFxzKlxyXG5cdFx0XHQoWzAtOV17MSwzfSkgIyB2YWx1ZVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChtKS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0aDogTnVtYmVyIG1bMV1cclxuXHRcdFx0czogTnVtYmVyIG1bMl1cclxuXHRcdFx0bDogTnVtYmVyIG1bM11cclxuXHRcclxuXHRtb3N0X2NvbG9ycyA9IFtdXHJcblx0Zm9yIHBhbGV0dGUgaW4gcGFsZXR0ZXNcclxuXHRcdGlmIHBhbGV0dGUubGVuZ3RoID49IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdFx0XHRtb3N0X2NvbG9ycyA9IHBhbGV0dGVcclxuXHRcclxuXHRuID0gbW9zdF9jb2xvcnMubGVuZ3RoXHJcblx0aWYgbiA8IDRcclxuXHRcdHRocm93IG5ldyBFcnJvcihbXHJcblx0XHRcdFwiTm8gY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IG9uZSBjb2xvciBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBhIGNvdXBsZSBjb2xvcnMgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBmZXcgY29sb3JzIGZvdW5kXCJcclxuXHRcdF1bbl0gKyBcIiAoI3tufSlcIilcclxuXHRcclxuXHRtb3N0X2NvbG9yc1xyXG4iLCJcclxuIyBXaGF0IGRvZXMgSFBMIHN0YW5kIGZvcj9cclxuIyBIb3dkeSwgUGFsZXR0ZSBMb3ZlcnMhXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRpZiBsaW5lc1swXSBpc250IFwiUGFsZXR0ZVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYW4gSFBMIHBhbGV0dGVcIlxyXG5cdGlmIG5vdCBsaW5lc1sxXS5tYXRjaCAvVmVyc2lvbiBbMzRdXFwuMC9cclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIEhQTCB2ZXJzaW9uXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lLm1hdGNoIC8uKyAuKiAuKy9cclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBQYWludC5ORVQgcGFsZXR0ZSBmaWxlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHJcblx0aGV4ID0gKHgpLT4gcGFyc2VJbnQoeCwgMTYpXHJcblx0XHJcblx0Zm9yIGxpbmUgaW4gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0XHRtID0gbGluZS5tYXRjaCgvXihbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkkL2kpXHJcblx0XHRpZiBtIHRoZW4gcGFsZXR0ZS5hZGRcclxuXHRcdFx0YTogaGV4IG1bMV1cclxuXHRcdFx0cjogaGV4IG1bMl1cclxuXHRcdFx0ZzogaGV4IG1bM11cclxuXHRcdFx0YjogaGV4IG1bNF1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBKQVNDIFBBTCBmaWxlIChQYWludCBTaG9wIFBybyBwYWxldHRlIGZpbGUpXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIkpBU0MtUEFMXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhIEpBU0MtUEFMXCJcclxuXHRpZiBsaW5lc1sxXSBpc250IFwiMDEwMFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIEpBU0MtUEFMIHZlcnNpb25cIlxyXG5cdGlmIGxpbmVzWzJdIGlzbnQgXCIyNTZcIlxyXG5cdFx0XCJ0aGF0J3Mgb2tcIlxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0I25fY29sb3JzID0gTnVtYmVyKGxpbmVzWzJdKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lIGlzbnQgXCJcIiBhbmQgaSA+IDJcclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBSZXNvdXJjZSBJbnRlcmNoYW5nZSBGaWxlIEZvcm1hdCBQQUwgZmlsZVxyXG5cclxuIyBwb3J0ZWQgZnJvbSBDIyBjb2RlIGF0IGh0dHA6Ly93b3JtczJkLmluZm8vUGFsZXR0ZV9maWxlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdCMgUklGRiBoZWFkZXJcclxuXHRyaWZmID0gYnIucmVhZFN0cmluZyg0KSAjIFwiUklGRlwiXHJcblx0ZGF0YVNpemUgPSBici5yZWFkVUludDMyKClcclxuXHR0eXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiUEFMIFwiXHJcblx0XHJcblx0aWYgcmlmZiBpc250IFwiUklGRlwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJSSUZGIGhlYWRlciBub3QgZm91bmQ7IG5vdCBhIFJJRkYgUEFMIGZpbGVcIlxyXG5cdFxyXG5cdGlmIHR5cGUgaXNudCBcIlBBTCBcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiXCJcIlxyXG5cdFx0XHRSSUZGIGhlYWRlciBzYXlzIHRoaXMgaXNuJ3QgYSBQQUwgZmlsZSxcclxuXHRcdFx0bW9yZSBvZiBhIHNvcnQgb2YgI3soKHR5cGUrXCJcIikudHJpbSgpKX0gZmlsZVxyXG5cdFx0XCJcIlwiXHJcblx0XHJcblx0IyBEYXRhIGNodW5rXHJcblx0Y2h1bmtUeXBlID0gYnIucmVhZFN0cmluZyg0KSAjIFwiZGF0YVwiXHJcblx0Y2h1bmtTaXplID0gYnIucmVhZFVJbnQzMigpXHJcblx0cGFsVmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIDB4MDMwMFxyXG5cdHBhbE51bUVudHJpZXMgPSBici5yZWFkVUludDE2KClcclxuXHRcclxuXHRcclxuXHRpZiBjaHVua1R5cGUgaXNudCBcImRhdGFcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiRGF0YSBjaHVuayBub3QgZm91bmQgKC4uLicje2NodW5rVHlwZX0nPylcIlxyXG5cdFxyXG5cdGlmIHBhbFZlcnNpb24gaXNudCAweDAzMDBcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlVuc3VwcG9ydGVkIFBBTCBmaWxlIHZlcnNpb246IDB4I3twYWxWZXJzaW9uLnRvU3RyaW5nKDE2KX1cIlxyXG5cdFxyXG5cdCMgQ29sb3JzXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRpID0gMFxyXG5cdHdoaWxlIChpICs9IDEpIDwgcGFsTnVtRW50cmllcyAtIDFcclxuXHRcdFxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0XzogYnIucmVhZEJ5dGUoKSAjIFwiZmxhZ3NcIiwgYWx3YXlzIDB4MDBcclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIFBBTCAoU3RhckNyYWZ0IHJhdyBwYWxldHRlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdGZvciBpIGluIFswLi4uMjU1XVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0Izogbm8gcGFkZGluZ1xyXG5cdFxyXG5cdCM/IHBhbGV0dGUubl9jb2x1bW5zID0gMTZcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIFdQRSAoU3RhckNyYWZ0IHBhZGRlZCByYXcgcGFsZXR0ZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHRmb3IgaSBpbiBbMC4uLjI1NV1cclxuXHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdHI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0ZzogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRiOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdF86IGJyLnJlYWRCeXRlKCkgIyBwYWRkaW5nXHJcblx0XHJcblx0cGFsZXR0ZS5uX2NvbHVtbnMgPSAxNlxyXG5cdHBhbGV0dGVcclxuIl19
