(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AnyPalette = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
  class BinaryReader {
    constructor(data) {
      this._buffer = data;
      this._pos = 0;
    }

    // Public (custom)
    readByte() {
      var ch;
      this._checkSize(8);
      ch = this._buffer.charCodeAt(this._pos) & 0xff;
      this._pos += 1;
      return ch & 0xff;
    }

    readUnicodeString() {
      var i, j, length, ref, str;
      length = this.readUInt16();
      // console.log {length}
      this._checkSize(length * 16);
      str = "";
      for (i = j = 0, ref = length; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
        str += String.fromCharCode(this._buffer.substr(this._pos, 1) | (this._buffer.substr(this._pos + 1, 1) << 8));
        this._pos += 2;
      }
      return str;
    }

    
      // Public
    readInt8() {
      return this._decodeInt(8, true);
    }

    readUInt8() {
      return this._decodeInt(8, false);
    }

    readInt16() {
      return this._decodeInt(16, true);
    }

    readUInt16() {
      return this._decodeInt(16, false);
    }

    readInt32() {
      return this._decodeInt(32, true);
    }

    readUInt32() {
      return this._decodeInt(32, false);
    }

    readFloat() {
      return this._decodeFloat(23, 8);
    }

    readDouble() {
      return this._decodeFloat(52, 11);
    }

    readChar() {
      return this.readString(1);
    }

    readString(length) {
      var result;
      this._checkSize(length * 8);
      result = this._buffer.substr(this._pos, length);
      this._pos += length;
      return result;
    }

    seek(pos) {
      this._pos = pos;
      return this._checkSize(0);
    }

    getPosition() {
      return this._pos;
    }

    getSize() {
      return this._buffer.length;
    }

    _checkSize(neededBits) {
      if (this._pos + Math.ceil(neededBits / 8) > this._buffer.length) {
        throw new Error("Index out of bound");
      }
    }

  };

  
  // Private
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

  //shl fix: Henri Torgemane ~1996 (compressed by Jonas Raoni)
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

  return BinaryReader;

}).call(this);


},{}],2:[function(require,module,exports){
// color value ranges:
// a: 0 to 1
// r/g/b: 0 to 255
// h: 0 to 360
// s/l: 0 to 100
// c/m/y/k: 0 to 100
var Color;

module.exports = Color = class Color {
  constructor(options) {
    var _, c, e, i, j, k, len, len1, m, powed, ref, ref1, rgb, white, xyz, y;
    // @TODO: don't assign all of {@r, @g, @b, @h, @s, @v, @l} right away
    // only assign the properties that are used
    // also maybe always have @r @g @b (or @red @green @blue) but still stringify to hsl() if hsl or hsv given
    // TODO: expect numbers or convert to numbers
    ({r: this.r, g: this.g, b: this.b, h: this.h, s: this.s, v: this.v, l: this.l, c, m, y, k, name: this.name} = options);
    if ((this.r != null) && (this.g != null) && (this.b != null)) {

    // Red Green Blue
    // (no conversions needed here)
    } else if ((this.h != null) && (this.s != null)) {
      // Cylindrical Color Space
      if (this.v != null) {
        // Hue Saturation Value
        this.l = (2 - this.s / 100) * this.v / 2;
        this.s = this.s * this.v / (this.l < 50 ? this.l * 2 : 200 - this.l * 2);
        if (isNaN(this.s)) {
          this.s = 0;
        }
      } else if (this.l != null) {

      } else {
        // TODO: improve error message (especially if @b given)
        // Hue Saturation Lightness
        // (no conversions needed here)
        throw new Error("Hue, saturation, and...? (either lightness or value)");
      }
    // TODO: maybe convert to @r @g @b here
    } else if ((c != null) && (m != null) && (y != null) && (k != null)) {
      // Cyan Magenta Yellow blacK
      // UNTESTED
      c /= 100;
      m /= 100;
      y /= 100;
      k /= 100;
      this.r = 255 * (1 - Math.min(1, c * (1 - k) + k));
      this.g = 255 * (1 - Math.min(1, m * (1 - k) + k));
      this.b = 255 * (1 - Math.min(1, y * (1 - k) + k));
    } else {
      // UNTESTED UNTESTED UNTESTED UNTESTED UNTESTED UNTESTED
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
      
      //xyz[_] = _round(xyz[_] * white[_])

      // UNTESTED UNTESTED UNTESTED UNTESTED
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
          //rgb[_] = _round(rgb[_])
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
        
        //rgb[_] = Math.round(rgb[_] * 255)
        throw new Error(`Color constructor must be called with {r,g,b} or {h,s,v} or {h,s,l} or {c,m,y,k} or {x,y,z} or {l,a,b}, ${(function() {
          try {
            return `got ${JSON.stringify(options)}`;
          } catch (error) {
            e = error;
            return "got something that couldn't be displayed with JSON.stringify for this error message";
          }
        })()}`);
      }
    }
  }

  toString() {
    if (this.r != null) {
      // Red Green Blue
      if (this.a != null) {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
      } else {
        return `rgb(${this.r}, ${this.g}, ${this.b})`; // Alpha
      }
    } else if (this.h != null) {
      // Hue Saturation Lightness
      // (Assume h:0-360, s:0-100, l:0-100)
      if (this.a != null) {
        return `hsla(${this.h}, ${this.s}%, ${this.l}%, ${this.a})`;
      } else {
        return `hsl(${this.h}, ${this.s}%, ${this.l}%)`; // Alpha
      }
    }
  }

  is(color) {
    // compare as strings
    return `${this}` === `${color}`;
  }

};


},{}],3:[function(require,module,exports){
var Color, Palette;

Color = require("./Color");

module.exports = Palette = class Palette extends Array {
  constructor(...args) {
    super(...args);
  }

  add(o) {
    var new_color;
    new_color = new Color(o);
    return this.push(new_color);
  }

  finalize() {
    var i, i_color, j, j_color, k, ref, results;
    // TODO: get this working properly and enable
    // if not @numberOfColumns
    // 	@guess_dimensions()
    if (!this.parentPaletteWithoutDuplicates) {
      this.withDuplicates = new Palette();
      this.withDuplicates.parentPaletteWithoutDuplicates = this;
      for (i = k = 0, ref = this.length; (0 <= ref ? k < ref : k > ref); i = 0 <= ref ? ++k : --k) {
        this.withDuplicates[i] = this[i];
      }
      this.withDuplicates.numberOfColumns = this.numberOfColumns;
      this.withDuplicates.geometrySpecifiedByFile = this.geometrySpecifiedByFile;
      this.withDuplicates.finalize();
      // in-place uniquify
      i = 0;
      results = [];
      while (i < this.length) {
        i_color = this[i];
        j = i + 1;
        while (j < this.length) {
          j_color = this[j];
          if (i_color.is(j_color)) {
            this.splice(j, 1);
            j -= 1;
          }
          j += 1;
        }
        results.push(i += 1);
      }
      return results;
    }
  }

};

/*
guess_dimensions: ->
 * TODO: get this working properly and enable

	len = @length
	candidate_dimensions = []
	for numberOfColumns in [0..len]
		n_rows = len / numberOfColumns
		if n_rows is Math.round n_rows
			candidate_dimensions.push [n_rows, numberOfColumns]

	squarest = [0, 3495093]
	for cd in candidate_dimensions
		if Math.abs(cd[0] - cd[1]) < Math.abs(squarest[0] - squarest[1])
			squarest = cd

	@numberOfColumns = squarest[1]
 */


},{"./Color":2}],4:[function(require,module,exports){
// Load an Adobe Color Table file (.act)
/*
"There is no version number written in the file.
The file is 768 or 772 bytes long and contains 256 RGB colors.
The first color in the table is index zero.
There are three bytes per color in the order red, green, blue.
If the file is 772 bytes long there are 4 additional bytes remaining.
	Two bytes for the number of colors to use.
	Two bytes for the color index with the transparency color to use."

https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/#50577411_pgfId-1070626
*/
var BinaryReader, Palette, load_adobe_color_table;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = load_adobe_color_table = function({data, fileExt}) {
  var br, i, palette, ref;
  palette = new Palette();
  br = new BinaryReader(data);
  if (!(((ref = br.getSize()) === 768 || ref === 772) || fileExt === "act")) { // because "Fireworks can read ACT files bigger than 768 bytes"
    throw new Error(`file size must be 768 or 772 bytes (saw ${br.getSize()}), OR file extension must be '.act' (saw '.${fileExt}')`);
  }
  i = 0;
  while (i < 255) {
    palette.add({
      r: br.readUInt8(),
      g: br.readUInt8(),
      b: br.readUInt8()
    });
    i += 1;
  }
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],5:[function(require,module,exports){
// Detect CSS colors (except named colors)
var Palette;

Palette = require("../Palette");

// TODO: detect names via structures like CSS variables, JSON object keys/values, comments
// TODO: use all colors regardless of format, within a detected structure, or maybe always
module.exports = function({data}) {
  var char, hex, i, j, len, len1, most_colors, n, n_control_characters, palette, palette_hex_long, palette_hex_short, palette_hsl, palette_hsla, palette_rgb, palette_rgba, palettes;
  n_control_characters = 0;
  for (i = 0, len = data.length; i < len; i++) {
    char = data[i];
    if (char === "\x00" || char === "\x01" || char === "\x02" || char === "\x03" || char === "\x04" || char === "\x05" || char === "\x06" || char === "\x07" || char === "\x08" || char === "\x0B" || char === "\x0C" || char === "\x0E" || char === "\x0F" || char === "\x10" || char === "\x11" || char === "\x12" || char === "\x13" || char === "\x14" || char === "\x15" || char === "\x16" || char === "\x17" || char === "\x18" || char === "\x19" || char === "\x1A" || char === "\x1B" || char === "\x1C" || char === "\x1D" || char === "\x1E" || char === "\x1F" || char === "\x7F") {
      n_control_characters++;
    }
  }
  if (n_control_characters > 5) {
    throw new Error("looks like a binary file");
  }
  palettes = [palette_hex_long = new Palette(), palette_hex_short = new Palette(), palette_rgb = new Palette(), palette_hsl = new Palette(), palette_hsla = new Palette(), palette_rgba = new Palette()];
  hex = function(x) {
    return parseInt(x, 16);
  };
  data.replace(/\#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{4}|[0-9A-F]{8})(?![0-9A-F])/gim, function(m, $1) { // hashtag # #/
    // three hex-digits (#A0C)
    // six hex-digits (#AA00CC)
    // with alpha, four hex-digits (#A0CF)
    // with alpha, eight hex-digits (#AA00CCFF)
    // (and no more!)
    if ($1.length > 4) {
      return palette_hex_long.add({
        r: hex($1[0] + $1[1]),
        g: hex($1[2] + $1[3]),
        b: hex($1[4] + $1[5]),
        a: $1.length === 8 ? hex($1[6] + $1[7]) : 1
      });
    } else {
      return palette_hex_short.add({
        r: hex($1[0] + $1[0]),
        g: hex($1[1] + $1[1]),
        b: hex($1[2] + $1[2]),
        a: $1.length === 4 ? hex($1[3] + $1[3]) : 1
      });
    }
  });
  data.replace(/rgb\(\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*\)/gim, function(_m, r_val, r_unit, g_val, g_unit, b_val, b_unit) { // red
    // green
    // blue
    return palette_rgb.add({
      r: Number(r_val) * (r_unit === "%" ? 255 / 100 : 1),
      g: Number(g_val) * (g_unit === "%" ? 255 / 100 : 1),
      b: Number(b_val) * (b_unit === "%" ? 255 / 100 : 1)
    });
  });
  data.replace(/rgba?\(\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\/)\s*([0-9]*\.?[0-9]+)(%?)\s*\)/gim, function(_m, r_val, r_unit, g_val, g_unit, b_val, b_unit, a_val, a_unit) { // red
    // green
    // blue
    // alpha
    return palette_rgba.add({
      r: Number(r_val) * (r_unit === "%" ? 255 / 100 : 1),
      g: Number(g_val) * (g_unit === "%" ? 255 / 100 : 1),
      b: Number(b_val) * (b_unit === "%" ? 255 / 100 : 1),
      a: Number(a_val) * (a_unit === "%" ? 1 / 100 : 1)
    });
  });
  data.replace(/hsl\(\s*([0-9]*\.?[0-9]+)(deg|rad|turn|)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*\)/gim, function(_m, h_val, h_unit, s_val, s_unit, l_val, l_unit) { // hue
    // saturation
    // value
    return palette_hsl.add({
      h: Number(h_val) * (h_unit === "rad" ? 180 / Math.PI : h_unit === "turn" ? 360 : 1),
      s: Number(s_val) * (s_unit === "%" ? 1 : 100),
      l: Number(l_val) * (l_unit === "%" ? 1 : 100)
    });
  });
  data.replace(/hsla?\(\s*([0-9]*\.?[0-9]+)(deg|rad|turn|)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\s)\s*([0-9]*\.?[0-9]+)(%?)\s*(?:,|\/)\s*([0-9]*\.?[0-9]+)(%?)\s*\)/gim, function(_m, h_val, h_unit, s_val, s_unit, l_val, l_unit, a_val, a_unit) { // hue
    // saturation
    // value
    // alpha
    return palette_hsla.add({
      h: Number(h_val) * (h_unit === "rad" ? 180 / Math.PI : h_unit === "turn" ? 360 : 1),
      s: Number(s_val) * (s_unit === "%" ? 1 : 100),
      l: Number(l_val) * (l_unit === "%" ? 1 : 100),
      a: Number(a_val) * (a_unit === "%" ? 1 / 100 : 1)
    });
  });
  most_colors = [];
  for (j = 0, len1 = palettes.length; j < len1; j++) {
    palette = palettes[j];
    if (palette.length >= most_colors.length) {
      most_colors = palette;
    }
  }
  n = most_colors.length;
  if (n < 4) {
    throw new Error(["No colors found", "Only one color found", "Only a couple colors found", "Only a few colors found"][n] + ` (${n})`);
  }
  return most_colors;
};


},{"../Palette":3}],6:[function(require,module,exports){
// Load a ColorSchemer palette
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data, fileExt}) {
  var br, i, length, palette, version;
  if (fileExt !== "cs") {
    throw new Error(`ColorSchemer loader is only enabled when file extension is '.cs' (saw '.${fileExt}' instead)`);
  }
  palette = new Palette();
  br = new BinaryReader(data);
  version = br.readUInt16(); // or something
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


},{"../BinaryReader":1,"../Palette":3}],7:[function(require,module,exports){
// Load a GIMP palette
var Palette, parse_gimp_or_kde_rgb_palette;

Palette = require("../Palette");

parse_gimp_or_kde_rgb_palette = function(data, format_name) {
  var i, line, lines, m, palette, r_g_b_name;
  lines = data.split(/[\n\r]+/m);
  if (lines[0] !== format_name) {
    throw new Error(`Not a ${format_name}`);
  }
  palette = new Palette();
  i = 0;
  // starts at i = 1 because the increment happens at the start of the loop
  while ((i += 1) < lines.length) {
    line = lines[i];
    if (line[0] === "#" || line === "") {
      continue;
    }
    // TODO: handle non-start-of-line comments? where's the spec?
    m = line.match(/Name:\s*(.*)/);
    if (m) {
      palette.name = m[1];
      continue;
    }
    m = line.match(/Columns:\s*(.*)/);
    if (m) {
      palette.numberOfColumns = Number(m[1]);
      // TODO: handle 0 as not specified? where's the spec at, yo?
      palette.geometrySpecifiedByFile = true;
      continue;
    }
    
    // TODO: replace \s with [\ \t] (spaces or tabs)
    // it can't match \n because it's already split on that, but still
    // TODO: handle line with no name but space on the end
    r_g_b_name = line.match(/^\s*([0-9]+)\s+([0-9]+)\s+([0-9]+)(?:\s+(.*))?$/); // "at the beginning of the line,"
    // "give or take some spaces,"
    // match 3 groups of numbers separated by spaces
    // red
    // green
    // blue
    // optionally a name
    // "and that should be the end of the line"
    if (!r_g_b_name) {
      throw new Error(`Line ${i} doesn't match pattern ${r_g_b_name}`);
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

module.exports = function({data}) {
  return parse_gimp_or_kde_rgb_palette(data, "GIMP Palette");
};

module.exports.parse_gimp_or_kde_rgb_palette = parse_gimp_or_kde_rgb_palette;


},{"../Palette":3}],8:[function(require,module,exports){
// Load an Allaire Homesite / Macromedia ColdFusion palette (.hpl)
var Palette;

Palette = require("../Palette");

module.exports = function({data}) {
  var i, j, len, line, lines, palette, rgb;
  lines = data.split(/[\n\r]+/m);
  if (lines[0] !== "Palette") {
    throw new Error("Not a Homesite palette");
  }
  if (!lines[1].match(/Version [34]\.0/)) {
    throw new Error("Unsupported Homesite palette version");
  }
  palette = new Palette();
  for (i = j = 0, len = lines.length; j < len; i = ++j) {
    line = lines[i];
    if (line.match(/.+ .+ .+/)) {
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


},{"../Palette":3}],9:[function(require,module,exports){
var parse_gimp_or_kde_rgb_palette;

({parse_gimp_or_kde_rgb_palette} = require("./GIMP"));

module.exports = function({data}) {
  return parse_gimp_or_kde_rgb_palette(data, "KDE RGB Palette");
};


},{"./GIMP":7}],10:[function(require,module,exports){
// Load a Paint.NET palette file
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var hex, i, len, line, m, palette, ref;
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


},{"../BinaryReader":1,"../Palette":3}],11:[function(require,module,exports){
// Load a JASC PAL file (Paint Shop Pro palette file)
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var i, j, len, line, lines, palette, rgb;
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
//n_colors = Number(lines[2])
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


},{"../BinaryReader":1,"../Palette":3}],12:[function(require,module,exports){
// Load a Resource Interchange File Format PAL file

// ported from C# code at https://worms2d.info/Palette_file
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var br, chunkSize, chunkType, dataSize, i, palNumEntries, palVersion, palette, riff, type;
  br = new BinaryReader(data);
  
  // RIFF header
  riff = br.readString(4); // "RIFF"
  dataSize = br.readUInt32();
  type = br.readString(4); // "PAL "
  if (riff !== "RIFF") {
    throw new Error("RIFF header not found; not a RIFF PAL file");
  }
  if (type !== "PAL ") {
    throw new Error(`RIFF header says this isn't a PAL file,
more of a sort of ${(type + "").trim()} file`);
  }
  
  // Data chunk
  chunkType = br.readString(4); // "data"
  chunkSize = br.readUInt32();
  palVersion = br.readUInt16(); // 0x0300
  palNumEntries = br.readUInt16();
  if (chunkType !== "data") {
    throw new Error(`Data chunk not found (...'${chunkType}'?)`);
  }
  if (palVersion !== 0x0300) {
    throw new Error(`Unsupported PAL file format version: 0x${palVersion.toString(16)}`);
  }
  
  // Colors
  palette = new Palette();
  i = 0;
  while ((i += 1) < palNumEntries - 1) {
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte(),
      _: br.readByte() // "flags", always 0x00
    });
  }
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],13:[function(require,module,exports){
// Load sK1 palettes
// These files are actually pythonic, but let's just try to parse them in a basic, non-general way
var Palette;

Palette = require("../Palette");

module.exports = function({data}) {
  var _, args_str, fn_name, fns, i, len, line, lines, match, n, palette;
  lines = data.split(/[\n\r]+/m);
  palette = new Palette();
  fns = {
    set_name: function(name) {
      return palette.name = name;
    },
    add_comments: function(line) {
      if (palette.description == null) {
        palette.description = "";
      }
      return palette.description += line + "\n";
    },
    set_columns: function(columns_str) {
      return palette.numberOfColumns = parseInt(columns_str);
    },
    color: function(color_def_str) {
      var alpha, color_def, color_type, components, name;
      color_def = JSON.parse(color_def_str.replace(/\bu(['"])/g, "$1").replace(/'/g, '"'));
      [color_type, components, alpha, name] = color_def;
      switch (color_type) {
        case "RGB":
          return palette.add({
            r: components[0] * 255,
            g: components[1] * 255,
            b: components[2] * 255,
            a: alpha
          });
        case "Grayscale":
          return palette.add({
            r: components[0] * 255,
            g: components[0] * 255,
            b: components[0] * 255,
            a: alpha
          });
        case "CMYK":
          return palette.add({
            c: components[0] * 100,
            m: components[1] * 100,
            y: components[2] * 100,
            k: components[3] * 100,
            a: alpha
          });
        case "HSL":
          return palette.add({
            h: components[0] * 360,
            s: components[1] * 100,
            l: components[2] * 100,
            a: alpha
          });
      }
    }
  };
  for (i = 0, len = lines.length; i < len; i++) {
    line = lines[i];
    match = line.match(/([\w_]+)\((.*)\)/);
    if (match) {
      [_, fn_name, args_str] = match;
      if (typeof fns[fn_name] === "function") {
        fns[fn_name](args_str);
      }
    }
  }
  n = palette.length;
  if (n < 2) {
    throw new Error(["No colors found", "Only one color found"][n] + ` (${n})`);
  }
  return palette;
};


},{"../Palette":3}],14:[function(require,module,exports){
// Load a Skencil palette (.spl) ("Sketch RGBPalette")
// (not related to .sketchpalette Sketch App palette format)
var Palette;

Palette = require("../Palette");

module.exports = function({data}) {
  var i, line, lines, palette, r_g_b_name;
  lines = data.split(/[\n\r]+/m);
  palette = new Palette();
  i = 1;
  while ((i += 1) < lines.length) {
    line = lines[i];
    if (line[0] === "#" || line === "") {
      continue;
    }
    // TODO: handle non-start-of-line comments? where's the spec?

    // TODO: replace \s with [\ \t] (spaces or tabs)
    // it can't match \n because it's already split on that, but still
    // TODO: handle line with no name but space on the end
    r_g_b_name = line.match(/^\s*([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)(?:\s+(.*))?$/); // at the beginning of the line,
    // perhaps with some leading spaces
    // match 3 groups of numbers separated by spaces
    // red
    // green
    // blue
    // optionally a name
    // "and that should be the end of the line"
    if (!r_g_b_name) {
      throw new Error(`Line ${i} doesn't match pattern ${r_g_b_name}`);
    }
    palette.add({
      r: r_g_b_name[1] * 255,
      g: r_g_b_name[2] * 255,
      b: r_g_b_name[3] * 255,
      name: r_g_b_name[4]
    });
  }
  return palette;
};


},{"../Palette":3}],15:[function(require,module,exports){
// PAL (StarCraft raw palette)
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var br, i, j, palette;
  palette = new Palette();
  br = new BinaryReader(data);
  if (br.getSize() !== 768) {
    throw new Error(`Wrong file size, must be ${768} bytes long (not ${br.getSize()})`);
  }
  for (i = j = 0; j < 255; i = ++j) {
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte()
    });
  }
  //: no padding

  //? palette.numberOfColumns = 16
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],16:[function(require,module,exports){
// WPE (StarCraft padded raw palette)
var BinaryReader, Palette;

BinaryReader = require("../BinaryReader");

Palette = require("../Palette");

module.exports = function({data}) {
  var br, i, j, palette;
  palette = new Palette();
  br = new BinaryReader(data);
  if (br.getSize() !== 1024) {
    throw new Error(`Wrong file size, must be ${1024} bytes long (not ${br.getSize()})`);
  }
  for (i = j = 0; j < 255; i = ++j) {
    palette.add({
      r: br.readByte(),
      g: br.readByte(),
      b: br.readByte(),
      _: br.readByte() // padding
    });
  }
  palette.numberOfColumns = 16;
  return palette;
};


},{"../BinaryReader":1,"../Palette":3}],17:[function(require,module,exports){
// Load a Sketch App JSON palette (.sketchpalette)
// (not related to .spl Sketch RGB palette format)

// based on https://github.com/andrewfiorillo/sketch-palettes/blob/5b6bfa6eb25cb3244a9e6a226df259e8fb31fc2c/Sketch%20Palettes.sketchplugin/Contents/Sketch/sketchPalettes.js
var Palette, parse_css_hex_color, version;

Palette = require("../Palette");

version = 1.4;

// TODO: DRY with CSS.coffee
parse_css_hex_color = function(hex_color) {
  var $0, $1, hex, match;
  hex = function(x) {
    return parseInt(x, 16);
  };
  match = hex_color.match(/\#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{4}|[0-9A-F]{8})(?![0-9A-F])/gim); // hashtag # #/
  // three hex-digits (#A0C)
  // six hex-digits (#AA00CC)
  // with alpha, four hex-digits (#A0CF)
  // with alpha, eight hex-digits (#AA00CCFF)
  // (and no more!)
  [$0, $1] = match;
  if ($1.length > 4) {
    return {
      r: hex($1[0] + $1[1]),
      g: hex($1[2] + $1[3]),
      b: hex($1[4] + $1[5]),
      a: $1.length === 8 ? hex($1[6] + $1[7]) : 1
    };
  } else {
    return {
      r: hex($1[0] + $1[0]),
      g: hex($1[1] + $1[1]),
      b: hex($1[2] + $1[2]),
      a: $1.length === 4 ? hex($1[3] + $1[3]) : 1
    };
  }
};

module.exports = function({data}) {
  var colorAssets, colorDefinitions, color_definition, compatibleVersion, gradientAssets, gradientDefinitions, hex_color, i, imageDefinitions, images, j, len, len1, palette, paletteContents, ref, ref1, ref2;
  if (!data.match(/^\s*{/)) {
    throw new Error("not sketchpalette JSON");
  }
  paletteContents = JSON.parse(data);
  compatibleVersion = paletteContents.compatibleVersion;
  // Check for presets in file, else set to empty array
  colorDefinitions = (ref = paletteContents.colors) != null ? ref : [];
  gradientDefinitions = (ref1 = paletteContents.gradients) != null ? ref1 : [];
  imageDefinitions = (ref2 = paletteContents.images) != null ? ref2 : [];
  colorAssets = [];
  gradientAssets = [];
  images = [];
  palette = new Palette();
  // Check if plugin is out of date and incompatible with a newer palette version
  if (compatibleVersion && compatibleVersion > version) {
    throw new Error(`Can't handle compatibleVersion of ${compatibleVersion}.`);
    return;
  }
  // Check for older hex code palette version
  if (!compatibleVersion || compatibleVersion < 1.4) {
// Convert hex colors
    for (i = 0, len = colorDefinitions.length; i < len; i++) {
      hex_color = colorDefinitions[i];
      palette.add(parse_css_hex_color(hex_color));
    }
  } else {
    // Color Fills: convert rgba colors
    if (colorDefinitions.length > 0) {
      for (j = 0, len1 = colorDefinitions.length; j < len1; j++) {
        color_definition = colorDefinitions[j];
        palette.add({
          r: color_definition.red * 255,
          g: color_definition.green * 255,
          b: color_definition.blue * 255,
          a: color_definition.alpha * 255,
          name: color_definition.name
        });
      }
    }
  }
  // # Pattern Fills: convert base64 strings to MSImageData objects
  // if imageDefinitions.length > 0
  // 	for i in [0..imageDefinitions.length]
  // 		nsdata = NSData.alloc().initWithBase64EncodedString_options(imageDefinitions[i].data, 0)
  // 		nsimage = NSImage.alloc().initWithData(nsdata)
  // 		# msimage = MSImageData.alloc().initWithImageConvertingColorSpace(nsimage)
  // 		msimage = MSImageData.alloc().initWithImage(nsimage)
  // 		images.push(msimage)

  // # Gradient Fills: build MSGradientStop and MSGradient objects
  // if gradientDefinitions.length > 0
  // 	for i in [0..gradientDefinitions.length]
  // 		# Create gradient stops
  // 		gradient = gradientDefinitions[i]
  // 		stops = []
  // 		for j in [0..gradient.stops]
  // 			color = MSColor.colorWithRed_green_blue_alpha(
  // 				gradient.stops[j].color.red,
  // 				gradient.stops[j].color.green,
  // 				gradient.stops[j].color.blue,
  // 				gradient.stops[j].color.alpha
  // 			)
  // 			stops.push(MSGradientStop.stopWithPosition_color_(gradient.stops[j].position, color))

  // 		# Create gradient object and set basic properties
  // 		msgradient = MSGradient.new()
  // 		msgradient.setGradientType(gradient.gradientType)
  // 		# msgradient.shouldSmoothenOpacity = gradient.shouldSmoothenOpacity
  // 		msgradient.elipseLength = gradient.elipseLength
  // 		msgradient.setStops(stops)

  // 		# Parse From and To values into arrays e.g.: from: "{0.1,-0.43}" => fromValue = [0.1, -0.43]
  // 		fromValue = gradient.from.slice(1,-1).split(",")
  // 		toValue = gradient.to.slice(1,-1).split(",")

  // 		# Set CGPoint objects as From and To values
  // 		msgradient.setFrom({ x: fromValue[0], y: fromValue[1] })
  // 		msgradient.setTo({ x: toValue[0], y: toValue[1] })

  // 		gradientName = gradientDefinitions[i].name ? gradientDefinitions[i].name : null
  // 		gradientAssets.push(MSGradientAsset.alloc().initWithAsset_name(msgradient, gradientName))
  return palette;
};


},{"../Palette":3}],18:[function(require,module,exports){
// Load tabular RGB values
var Palette;

Palette = require("../Palette");

module.exports = function({data}) {
  var csv_palette, i, j, len, len1, line, lines, most_colors, n, palette, palettes, ssv_palette, try_parse_line;
  lines = data.split(/[\n\r]+/m);
  palettes = [csv_palette = new Palette(), ssv_palette = new Palette()];
  try_parse_line = function(line, palette, regexp) {
    var match;
    match = line.match(regexp);
    if (match) {
      return palette.add({
        r: match[1],
        g: match[2],
        b: match[3]
      });
    }
  };
  for (i = 0, len = lines.length; i < len; i++) {
    line = lines[i];
    try_parse_line(line, csv_palette, /([0-9]*\.?[0-9]+),\s*([0-9]*\.?[0-9]+),\s*([0-9]*\.?[0-9]+)/);
    try_parse_line(line, ssv_palette, /([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)/);
  }
  most_colors = [];
  for (j = 0, len1 = palettes.length; j < len1; j++) {
    palette = palettes[j];
    if (palette.length >= most_colors.length) {
      most_colors = palette;
    }
  }
  n = most_colors.length;
  if (n < 4) {
    throw new Error(["No colors found", "Only one color found", "Only a couple colors found", "Only a few colors found"][n] + ` (${n})`);
  }
  if (most_colors.every(function(color) {
    return color.r <= 1 && color.g <= 1 && color.b <= 1;
  })) {
    most_colors.forEach(function(color) {
      color.r *= 255;
      color.g *= 255;
      return color.b *= 255;
    });
  }
  return most_colors;
};


},{"../Palette":3}],19:[function(require,module,exports){
// Load Windows .theme and .themepack files, and KDE .colors color schemes

var Palette = require("../Palette");

function parseINIString(data){
	var regex = {
		section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
		param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
		comment: /^\s*;.*$/
	};
	var value = {};
	var lines = data.split(/[\r\n]+/);
	var section = null;
	lines.forEach(function(line){
		if(regex.comment.test(line)){
			return;
		}else if(regex.param.test(line)){
			var match = line.match(regex.param);
			if(section){
				value[section][match[1]] = match[2];
			}else{
				value[match[1]] = match[2];
			}
		}else if(regex.section.test(line)){
			var match = line.match(regex.section);
			value[match[1]] = {};
			section = match[1];
		}else if(line.length == 0 && section){
			section = null;
		};
	});
	return value;
}

function parseThemeFileString(themeIni) {
	// .theme is a renamed .ini text file
	// .themepack is a renamed .cab file, and parsing it as .ini seems to work well enough for the most part, as the .ini data appears in plain,
	// but it may not if compression is enabled for the .cab file
	var theme = parseINIString(themeIni);
	var colors = theme["Control Panel\\Colors"];
	if (!colors) {
		throw new Error("Invalid theme file, no [Control Panel\\Colors] section");
	}
	var palette = new Palette();
	for (var k in colors) {
		// for .themepack file support, just ignore bad keys that were parsed
		if (!k.match(/\W/)) {
			var components = colors[k].split(" ");
			if (components.length === 3) {
				for (var i = 0; i < components.length; i++) {
					components[i] = parseInt(components[i], 10);
				}
				if (components.every((component)=> isFinite(component))) {
					palette.add({
						r: components[0],
						g: components[1],
						b: components[2],
						name: k,
					});
				}
			}
		}
	}

	return palette;
}

module.exports = ({data})=> {
	return parseThemeFileString(data);
};

},{"../Palette":3}],20:[function(require,module,exports){
var AnyPalette, Color, LoadingErrors, Palette, RandomColor, RandomPalette, load_palette, normalize_options;

Palette = require("./Palette");

Color = require("./Color");

RandomColor = class RandomColor extends Color {
  constructor() {
    super();
    this.randomize();
  }

  randomize() {
    this.h = Math.random() * 360;
    this.s = Math.random() * 100;
    return this.l = Math.random() * 100;
  }

  toString() {
    this.randomize();
    return `hsl(${this.h}, ${this.s}%, ${this.l}%)`;
  }

  is() {
    return false;
  }

};

RandomPalette = class RandomPalette extends Palette {
  constructor() {
    var i, j, ref;
    super();
    this.loader = {
      name: "Completely Random Colors™",
      fileExtensions: [],
      fileExtensionsPretty: "(.crc sjf(Df09sjdfksdlfmnm ';';"
    };
    this.matchedLoaderFileExtensions = false;
    this.confidence = 0;
    this.finalize();
    for (i = j = 0, ref = Math.random() * 15 + 5; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
      this.push(new RandomColor());
    }
  }

};

LoadingErrors = class LoadingErrors extends Error {
  constructor(errors1) {
    var error;
    super();
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

};

load_palette = function(o, callback) {
  var e, err, errors, exts_pretty, j, k, len, len1, msg, palette, palette_loaders, pl;
  palette_loaders = [
    {
      name: "Paint Shop Pro palette",
      exts: ["pal",
    "psppalette"],
      load: require("./loaders/PaintShopPro")
    },
    {
      name: "RIFF PAL",
      exts: ["pal"],
      load: require("./loaders/RIFF")
    },
    {
      name: "ColorSchemer palette",
      exts: ["cs"],
      load: require("./loaders/ColorSchemer")
    },
    {
      name: "Paint.NET palette",
      exts: ["txt"],
      load: require("./loaders/Paint.NET")
    },
    {
      name: "GIMP palette",
      exts: ["gpl",
    "gimp",
    "colors"],
      load: require("./loaders/GIMP")
    },
    {
      name: "KolourPaint palette",
      exts: ["colors"],
      load: require("./loaders/KolourPaint")
    },
    {
      name: "Skencil palette",
      exts: ["spl"],
      load: require("./loaders/SPL")
    },
    {
      name: "Sketch palette",
      exts: ["sketchpalette"],
      load: require("./loaders/sketchpalette")
    },
    {
      name: "sK1 palette",
      exts: ["skp"],
      load: require("./loaders/SKP")
    },
    {
      name: "CSS colors",
      exts: ["css",
    "scss",
    "sass",
    "less",
    "styl",
    "html",
    "htm",
    "svg",
    "js",
    "ts",
    "xml",
    "txt"],
      load: require("./loaders/CSS")
    },
    {
      name: "Windows desktop theme",
      exts: ["theme",
    "themepack"],
      load: require("./loaders/theme")
    },
    {
      // {
      // 	name: "KDE desktop theme"
      // 	exts: ["colors"]
      // 	load: require "./loaders/theme"
      // }
      // {
      // 	name: "Adobe Color Swatch"
      // 	exts: ["aco"]
      // 	load: require "./loaders/AdobeColorSwatch"
      // }
      name: "Adobe Color Table",
      exts: ["act"],
      load: require("./loaders/AdobeColorTable")
    },
    {
      // {
      // 	name: "Adobe Swatch Exchange"
      // 	exts: ["ase"]
      // 	load: require "./loaders/AdobeSwatchExchange"
      // }
      // {
      // 	name: "Adobe Color Book"
      // 	exts: ["acb"]
      // 	load: require "./loaders/AdobeColorBook"
      // }
      name: "Homesite palette",
      exts: ["hpl"],
      load: require("./loaders/Homesite")
    },
    {
      name: "StarCraft palette",
      exts: ["pal"],
      load: require("./loaders/StarCraft")
    },
    {
      name: "StarCraft terrain palette",
      exts: ["wpe"],
      load: require("./loaders/StarCraftPadded")
    },
    {
      
      // {
      // 	name: "AutoCAD Color Book"
      // 	exts: ["acb"]
      // 	load: require "./loaders/AutoCADColorBook"
      // }

      // {
      // 	# (same as Paint Shop Pro palette?)
      // 	name: "CorelDRAW palette"
      // 	exts: ["pal", "cpl"]
      // 	load: require "./loaders/CorelDRAW"
      // }
      name: "tabular colors",
      exts: ["csv",
    "tsv",
    "txt"],
      load: require("./loaders/tabular")
    }
  ];

  // find palette loaders that use this file extension
  for (j = 0, len = palette_loaders.length; j < len; j++) {
    pl = palette_loaders[j];
    pl.matches_ext = pl.exts.indexOf(o.fileExt) !== -1;
  }
  
  // move palette loaders to the beginning that use this file extension
  palette_loaders.sort(function(pl1, pl2) {
    return pl2.matches_ext - pl1.matches_ext;
  });
  
  // try loading stuff
  errors = [];
  for (k = 0, len1 = palette_loaders.length; k < len1; k++) {
    pl = palette_loaders[k];
    try {
      palette = pl.load(o);
      if (palette.length === 0) {
        palette = null;
        throw new Error("no colors returned");
      }
    } catch (error1) {
      e = error1;
      msg = `failed to load ${o.fileName} as ${pl.name}: ${e.message}`;
      // if pl.matches_ext and not e.message.match(/not a/i)
      // 	console?.error? msg
      // else
      // 	console?.warn? msg

      // TODO: maybe this shouldn't be an Error object, just a {message, error} object
      // or {friendlyMessage, error}
      err = new Error(msg);
      err.error = e;
      errors.push(err);
    }
    if (palette) {
      // console?.info? "loaded #{o.fileName} as #{pl.name}"
      palette.confidence = pl.matches_ext ? 0.9 : 0.01;
      exts_pretty = `.${pl.exts.join(", .")}`;
      
      // TODO: probably rename loader -> format when 2-way data flow (read/write) is supported
      // TODO: maybe make this a 3rd (and fourth?) argument to the callback
      palette.loader = {
        name: pl.name,
        fileExtensions: pl.exts,
        fileExtensionsPretty: exts_pretty
      };
      palette.matchedLoaderFileExtensions = pl.matches_ext;
      palette.finalize();
      callback(null, palette);
      return;
    }
  }
  callback(new LoadingErrors(errors));
};

normalize_options = function(o = {}) {
  var ref, ref1;
  if (typeof o === "string" || o instanceof String) {
    o = {
      filePath: o
    };
  }
  if ((typeof File !== "undefined" && File !== null) && o instanceof File) {
    o = {
      file: o
    };
  }
  
  // o.minColors ?= 2
  // o.maxColors ?= 256
  if (o.fileName == null) {
    o.fileName = (ref = (ref1 = o.file) != null ? ref1.name : void 0) != null ? ref : (o.filePath ? require("path").basename(o.filePath) : void 0);
  }
  if (o.fileExt == null) {
    o.fileExt = `${o.fileName}`.split(".").pop();
  }
  o.fileExt = `${o.fileExt}`.toLowerCase();
  return o;
};

AnyPalette = {Color, Palette, RandomColor, RandomPalette};

// Get palette from a file
// LoadingErrors
AnyPalette.loadPalette = function(o, callback) {
  var fr, fs;
  if (!o) {
    throw new TypeError("parameters required: AnyPalette.loadPalette(options, function callback(error, palette){})");
  }
  if (!callback) {
    throw new TypeError("callback required: AnyPalette.loadPalette(options, function callback(error, palette){})");
  }
  o = normalize_options(o);
  if (o.data) {
    return load_palette(o, callback);
  } else if (o.file) {
    if (!(o.file instanceof File)) {
      throw new TypeError("options.file was passed but it is not a File");
    }
    fr = new FileReader();
    fr.onerror = function() {
      return callback(fr.error);
    };
    fr.onload = function() {
      o.data = fr.result;
      return load_palette(o, callback);
    };
    return fr.readAsBinaryString(o.file);
  } else if (o.filePath != null) {
    fs = require("fs");
    return fs.readFile(o.filePath, function(error, data) {
      if (error) {
        return callback(error);
      } else {
        o.data = data.toString("binary");
        return load_palette(o, callback);
      }
    });
  } else {
    throw new TypeError("either options.data or options.file or options.filePath must be passed");
  }
};

// Get a palette from a file or by any means necessary
// (as in fall back to completely random data)
AnyPalette.gimmeAPalette = function(o, callback) {
  o = normalize_options(o);
  return AnyPalette.loadPalette(o, function(err, palette) {
    return callback(null, palette != null ? palette : new RandomPalette());
  });
};

// Exports
module.exports = AnyPalette;


},{"./Color":2,"./Palette":3,"./loaders/AdobeColorTable":4,"./loaders/CSS":5,"./loaders/ColorSchemer":6,"./loaders/GIMP":7,"./loaders/Homesite":8,"./loaders/KolourPaint":9,"./loaders/Paint.NET":10,"./loaders/PaintShopPro":11,"./loaders/RIFF":12,"./loaders/SKP":13,"./loaders/SPL":14,"./loaders/StarCraft":15,"./loaders/StarCraftPadded":16,"./loaders/sketchpalette":17,"./loaders/tabular":18,"./loaders/theme":19,"fs":"fs","path":"path"}]},{},[20])(20)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQmluYXJ5UmVhZGVyLmNvZmZlZSIsInNyYy9Db2xvci5jb2ZmZWUiLCJzcmMvUGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy9BZG9iZUNvbG9yVGFibGUuY29mZmVlIiwic3JjL2xvYWRlcnMvQ1NTLmNvZmZlZSIsInNyYy9sb2FkZXJzL0NvbG9yU2NoZW1lci5jb2ZmZWUiLCJzcmMvbG9hZGVycy9HSU1QLmNvZmZlZSIsInNyYy9sb2FkZXJzL0hvbWVzaXRlLmNvZmZlZSIsInNyYy9sb2FkZXJzL0tvbG91clBhaW50LmNvZmZlZSIsInNyYy9sb2FkZXJzL1BhaW50Lk5FVC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9QYWludFNob3BQcm8uY29mZmVlIiwic3JjL2xvYWRlcnMvUklGRi5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TS1AuY29mZmVlIiwic3JjL2xvYWRlcnMvU1BMLmNvZmZlZSIsInNyYy9sb2FkZXJzL1N0YXJDcmFmdC5jb2ZmZWUiLCJzcmMvbG9hZGVycy9TdGFyQ3JhZnRQYWRkZWQuY29mZmVlIiwic3JjL2xvYWRlcnMvc2tldGNocGFsZXR0ZS5jb2ZmZWUiLCJzcmMvbG9hZGVycy90YWJ1bGFyLmNvZmZlZSIsInNyYy9sb2FkZXJzL3RoZW1lLmpzIiwic3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDYUk7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFBOztBQUVGLE1BQU0sQ0FBQyxPQUFQLEdBQ007RUFBTixNQUFBLGFBQUE7SUFDQSxXQUFhLENBQUMsSUFBRCxDQUFBO01BQ1osSUFBQyxDQUFBLE9BQUQsR0FBVztNQUNYLElBQUMsQ0FBQSxJQUFELEdBQVE7SUFGSSxDQUFkOzs7SUFNQyxRQUFVLENBQUEsQ0FBQTtBQUNYLFVBQUE7TUFBRSxJQUFDLENBQUEsVUFBRCxDQUFZLENBQVo7TUFDQSxFQUFBLEdBQUssSUFBSSxDQUFDLE9B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QUcsa0JBQUg7SUFDSixFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7V0FDTCxFQUFFLENBQUMsUUFBSCxDQUFZLENBQUMsQ0FBQyxRQUFkLEVBQXdCLFFBQUEsQ0FBQyxLQUFELEVBQVEsSUFBUixDQUFBO01BQ3ZCLElBQUcsS0FBSDtlQUNDLFFBQUEsQ0FBUyxLQUFULEVBREQ7T0FBQSxNQUFBO1FBR0MsQ0FBQyxDQUFDLElBQUYsR0FBUyxJQUFJLENBQUMsUUFBTCxDQUFjLFFBQWQ7ZUFDVCxZQUFBLENBQWEsQ0FBYixFQUFnQixRQUFoQixFQUpEOztJQUR1QixDQUF4QixFQUZJO0dBQUEsTUFBQTtJQVNKLE1BQU0sSUFBSSxTQUFKLENBQWMsd0VBQWQsRUFURjs7QUFwQm9CLEVBck8xQjs7OztBQXVRQyxVQUFVLENBQUMsYUFBWCxHQUEyQixRQUFBLENBQUMsQ0FBRCxFQUFJLFFBQUosQ0FBQTtFQUMzQixDQUFBLEdBQUksaUJBQUEsQ0FBa0IsQ0FBbEI7U0FFSixVQUFVLENBQUMsV0FBWCxDQUF1QixDQUF2QixFQUEwQixRQUFBLENBQUMsR0FBRCxFQUFNLE9BQU4sQ0FBQTtXQUN6QixRQUFBLENBQVMsSUFBVCxvQkFBZSxVQUFVLElBQUksYUFBSixDQUFBLENBQXpCO0VBRHlCLENBQTFCO0FBSDJCLEVBdlE1Qjs7O0FBOFFDLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXHJcbiMjI1xyXG5CaW5hcnlSZWFkZXJcclxuXHJcbk1vZGlmaWVkIGJ5IElzYWlhaCBPZGhuZXJcclxuQFRPRE86IHVzZSBqRGF0YVZpZXcgKyBqQmluYXJ5IGluc3RlYWRcclxuXHJcblJlZmFjdG9yZWQgYnkgVmpldXggPHZqZXV4eEBnbWFpbC5jb20+XHJcbmh0dHA6Ly9ibG9nLnZqZXV4LmNvbS8yMDEwL2phdmFzY3JpcHQvamF2YXNjcmlwdC1iaW5hcnktcmVhZGVyLmh0bWxcclxuXHJcbk9yaWdpbmFsXHJcbisgSm9uYXMgUmFvbmkgU29hcmVzIFNpbHZhXHJcbkAgaHR0cDovL2pzZnJvbWhlbGwuY29tL2NsYXNzZXMvYmluYXJ5LXBhcnNlciBbcmV2LiAjMV1cclxuIyMjXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIEJpbmFyeVJlYWRlclxyXG5cdGNvbnN0cnVjdG9yOiAoZGF0YSktPlxyXG5cdFx0QF9idWZmZXIgPSBkYXRhXHJcblx0XHRAX3BvcyA9IDBcclxuXHJcblx0IyBQdWJsaWMgKGN1c3RvbSlcclxuXHRcclxuXHRyZWFkQnl0ZTogLT5cclxuXHRcdEBfY2hlY2tTaXplKDgpXHJcblx0XHRjaCA9IHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KEBfcG9zKSAmIDB4ZmZcclxuXHRcdEBfcG9zICs9IDFcclxuXHRcdGNoICYgMHhmZlxyXG5cdFxyXG5cdHJlYWRVbmljb2RlU3RyaW5nOiAtPlxyXG5cdFx0bGVuZ3RoID0gQHJlYWRVSW50MTYoKVxyXG5cdFx0IyBjb25zb2xlLmxvZyB7bGVuZ3RofVxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogMTYpXHJcblx0XHRzdHIgPSBcIlwiXHJcblx0XHRmb3IgaSBpbiBbMC4ubGVuZ3RoXVxyXG5cdFx0XHRzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShAX2J1ZmZlci5zdWJzdHIoQF9wb3MsIDEpIHwgKEBfYnVmZmVyLnN1YnN0cihAX3BvcysxLCAxKSA8PCA4KSlcclxuXHRcdFx0QF9wb3MgKz0gMlxyXG5cdFx0c3RyXHJcblx0XHJcblx0IyBQdWJsaWNcclxuXHRcclxuXHRyZWFkSW50ODogLT4gQF9kZWNvZGVJbnQoOCwgdHJ1ZSlcclxuXHRyZWFkVUludDg6IC0+IEBfZGVjb2RlSW50KDgsIGZhbHNlKVxyXG5cdHJlYWRJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIHRydWUpXHJcblx0cmVhZFVJbnQxNjogLT4gQF9kZWNvZGVJbnQoMTYsIGZhbHNlKVxyXG5cdHJlYWRJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIHRydWUpXHJcblx0cmVhZFVJbnQzMjogLT4gQF9kZWNvZGVJbnQoMzIsIGZhbHNlKVxyXG5cclxuXHRyZWFkRmxvYXQ6IC0+IEBfZGVjb2RlRmxvYXQoMjMsIDgpXHJcblx0cmVhZERvdWJsZTogLT4gQF9kZWNvZGVGbG9hdCg1MiwgMTEpXHJcblx0XHJcblx0cmVhZENoYXI6IC0+IEByZWFkU3RyaW5nKDEpXHJcblx0cmVhZFN0cmluZzogKGxlbmd0aCktPlxyXG5cdFx0QF9jaGVja1NpemUobGVuZ3RoICogOClcclxuXHRcdHJlc3VsdCA9IEBfYnVmZmVyLnN1YnN0cihAX3BvcywgbGVuZ3RoKVxyXG5cdFx0QF9wb3MgKz0gbGVuZ3RoXHJcblx0XHRyZXN1bHRcclxuXHJcblx0c2VlazogKHBvcyktPlxyXG5cdFx0QF9wb3MgPSBwb3NcclxuXHRcdEBfY2hlY2tTaXplKDApXHJcblx0XHJcblx0Z2V0UG9zaXRpb246IC0+IEBfcG9zXHJcblx0XHJcblx0Z2V0U2l6ZTogLT4gQF9idWZmZXIubGVuZ3RoXHJcblx0XHJcblxyXG5cclxuXHQjIFByaXZhdGVcclxuXHRcclxuXHRfZGVjb2RlRmxvYXQ6IGBmdW5jdGlvbihwcmVjaXNpb25CaXRzLCBleHBvbmVudEJpdHMpe1xyXG5cdFx0dmFyIGxlbmd0aCA9IHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMgKyAxO1xyXG5cdFx0dmFyIHNpemUgPSBsZW5ndGggPj4gMztcclxuXHRcdHRoaXMuX2NoZWNrU2l6ZShsZW5ndGgpO1xyXG5cclxuXHRcdHZhciBiaWFzID0gTWF0aC5wb3coMiwgZXhwb25lbnRCaXRzIC0gMSkgLSAxO1xyXG5cdFx0dmFyIHNpZ25hbCA9IHRoaXMuX3JlYWRCaXRzKHByZWNpc2lvbkJpdHMgKyBleHBvbmVudEJpdHMsIDEsIHNpemUpO1xyXG5cdFx0dmFyIGV4cG9uZW50ID0gdGhpcy5fcmVhZEJpdHMocHJlY2lzaW9uQml0cywgZXhwb25lbnRCaXRzLCBzaXplKTtcclxuXHRcdHZhciBzaWduaWZpY2FuZCA9IDA7XHJcblx0XHR2YXIgZGl2aXNvciA9IDI7XHJcblx0XHR2YXIgY3VyQnl0ZSA9IDA7IC8vbGVuZ3RoICsgKC1wcmVjaXNpb25CaXRzID4+IDMpIC0gMTtcclxuXHRcdGRvIHtcclxuXHRcdFx0dmFyIGJ5dGVWYWx1ZSA9IHRoaXMuX3JlYWRCeXRlKCsrY3VyQnl0ZSwgc2l6ZSk7XHJcblx0XHRcdHZhciBzdGFydEJpdCA9IHByZWNpc2lvbkJpdHMgJSA4IHx8IDg7XHJcblx0XHRcdHZhciBtYXNrID0gMSA8PCBzdGFydEJpdDtcclxuXHRcdFx0d2hpbGUgKG1hc2sgPj49IDEpIHtcclxuXHRcdFx0XHRpZiAoYnl0ZVZhbHVlICYgbWFzaykge1xyXG5cdFx0XHRcdFx0c2lnbmlmaWNhbmQgKz0gMSAvIGRpdmlzb3I7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRpdmlzb3IgKj0gMjtcclxuXHRcdFx0fVxyXG5cdFx0fSB3aGlsZSAocHJlY2lzaW9uQml0cyAtPSBzdGFydEJpdCk7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IHNpemU7XHJcblxyXG5cdFx0cmV0dXJuIGV4cG9uZW50ID09IChiaWFzIDw8IDEpICsgMSA/IHNpZ25pZmljYW5kID8gTmFOIDogc2lnbmFsID8gLUluZmluaXR5IDogK0luZmluaXR5XHJcblx0XHRcdDogKDEgKyBzaWduYWwgKiAtMikgKiAoZXhwb25lbnQgfHwgc2lnbmlmaWNhbmQgPyAhZXhwb25lbnQgPyBNYXRoLnBvdygyLCAtYmlhcyArIDEpICogc2lnbmlmaWNhbmRcclxuXHRcdFx0OiBNYXRoLnBvdygyLCBleHBvbmVudCAtIGJpYXMpICogKDEgKyBzaWduaWZpY2FuZCkgOiAwKTtcclxuXHR9YFxyXG5cclxuXHRfZGVjb2RlSW50OiBgZnVuY3Rpb24oYml0cywgc2lnbmVkKXtcclxuXHRcdHZhciB4ID0gdGhpcy5fcmVhZEJpdHMoMCwgYml0cywgYml0cyAvIDgpLCBtYXggPSBNYXRoLnBvdygyLCBiaXRzKTtcclxuXHRcdHZhciByZXN1bHQgPSBzaWduZWQgJiYgeCA+PSBtYXggLyAyID8geCAtIG1heCA6IHg7XHJcblxyXG5cdFx0dGhpcy5fcG9zICs9IGJpdHMgLyA4O1xyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9YFxyXG5cclxuXHQjc2hsIGZpeDogSGVucmkgVG9yZ2VtYW5lIH4xOTk2IChjb21wcmVzc2VkIGJ5IEpvbmFzIFJhb25pKVxyXG5cdF9zaGw6IGBmdW5jdGlvbiAoYSwgYil7XHJcblx0XHRmb3IgKCsrYjsgLS1iOyBhID0gKChhICU9IDB4N2ZmZmZmZmYgKyAxKSAmIDB4NDAwMDAwMDApID09IDB4NDAwMDAwMDAgPyBhICogMiA6IChhIC0gMHg0MDAwMDAwMCkgKiAyICsgMHg3ZmZmZmZmZiArIDEpO1xyXG5cdFx0cmV0dXJuIGE7XHJcblx0fWBcclxuXHRcclxuXHRfcmVhZEJ5dGU6IGBmdW5jdGlvbiAoaSwgc2l6ZSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2J1ZmZlci5jaGFyQ29kZUF0KHRoaXMuX3BvcyArIHNpemUgLSBpIC0gMSkgJiAweGZmO1xyXG5cdH1gXHJcblxyXG5cdF9yZWFkQml0czogYGZ1bmN0aW9uIChzdGFydCwgbGVuZ3RoLCBzaXplKSB7XHJcblx0XHR2YXIgb2Zmc2V0TGVmdCA9IChzdGFydCArIGxlbmd0aCkgJSA4O1xyXG5cdFx0dmFyIG9mZnNldFJpZ2h0ID0gc3RhcnQgJSA4O1xyXG5cdFx0dmFyIGN1ckJ5dGUgPSBzaXplIC0gKHN0YXJ0ID4+IDMpIC0gMTtcclxuXHRcdHZhciBsYXN0Qnl0ZSA9IHNpemUgKyAoLShzdGFydCArIGxlbmd0aCkgPj4gMyk7XHJcblx0XHR2YXIgZGlmZiA9IGN1ckJ5dGUgLSBsYXN0Qnl0ZTtcclxuXHJcblx0XHR2YXIgc3VtID0gKHRoaXMuX3JlYWRCeXRlKGN1ckJ5dGUsIHNpemUpID4+IG9mZnNldFJpZ2h0KSAmICgoMSA8PCAoZGlmZiA/IDggLSBvZmZzZXRSaWdodCA6IGxlbmd0aCkpIC0gMSk7XHJcblxyXG5cdFx0aWYgKGRpZmYgJiYgb2Zmc2V0TGVmdCkge1xyXG5cdFx0XHRzdW0gKz0gKHRoaXMuX3JlYWRCeXRlKGxhc3RCeXRlKyssIHNpemUpICYgKCgxIDw8IG9mZnNldExlZnQpIC0gMSkpIDw8IChkaWZmLS0gPDwgMykgLSBvZmZzZXRSaWdodDsgXHJcblx0XHR9XHJcblxyXG5cdFx0d2hpbGUgKGRpZmYpIHtcclxuXHRcdFx0c3VtICs9IHRoaXMuX3NobCh0aGlzLl9yZWFkQnl0ZShsYXN0Qnl0ZSsrLCBzaXplKSwgKGRpZmYtLSA8PCAzKSAtIG9mZnNldFJpZ2h0KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gc3VtO1xyXG5cdH1gXHJcblxyXG5cdF9jaGVja1NpemU6IChuZWVkZWRCaXRzKS0+XHJcblx0XHRpZiBAX3BvcyArIE1hdGguY2VpbChuZWVkZWRCaXRzIC8gOCkgPiBAX2J1ZmZlci5sZW5ndGhcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiSW5kZXggb3V0IG9mIGJvdW5kXCJcclxuXHJcbiIsIlxyXG4jIGNvbG9yIHZhbHVlIHJhbmdlczpcclxuIyBhOiAwIHRvIDFcclxuIyByL2cvYjogMCB0byAyNTVcclxuIyBoOiAwIHRvIDM2MFxyXG4jIHMvbDogMCB0byAxMDBcclxuIyBjL20veS9rOiAwIHRvIDEwMFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5jbGFzcyBDb2xvclxyXG5cdGNvbnN0cnVjdG9yOiAob3B0aW9ucyktPlxyXG5cdFx0IyBAVE9ETzogZG9uJ3QgYXNzaWduIGFsbCBvZiB7QHIsIEBnLCBAYiwgQGgsIEBzLCBAdiwgQGx9IHJpZ2h0IGF3YXlcclxuXHRcdCMgb25seSBhc3NpZ24gdGhlIHByb3BlcnRpZXMgdGhhdCBhcmUgdXNlZFxyXG5cdFx0IyBhbHNvIG1heWJlIGFsd2F5cyBoYXZlIEByIEBnIEBiIChvciBAcmVkIEBncmVlbiBAYmx1ZSkgYnV0IHN0aWxsIHN0cmluZ2lmeSB0byBoc2woKSBpZiBoc2wgb3IgaHN2IGdpdmVuXHJcblx0XHQjIFRPRE86IGV4cGVjdCBudW1iZXJzIG9yIGNvbnZlcnQgdG8gbnVtYmVyc1xyXG5cdFx0e1xyXG5cdFx0XHRAciwgQGcsIEBiLFxyXG5cdFx0XHRAaCwgQHMsIEB2LCBAbCxcclxuXHRcdFx0YywgbSwgeSwgayxcclxuXHRcdFx0QG5hbWVcclxuXHRcdH0gPSBvcHRpb25zXHJcblxyXG5cdFx0aWYgQHI/IGFuZCBAZz8gYW5kIEBiP1xyXG5cdFx0XHQjIFJlZCBHcmVlbiBCbHVlXHJcblx0XHRcdCMgKG5vIGNvbnZlcnNpb25zIG5lZWRlZCBoZXJlKVxyXG5cdFx0ZWxzZSBpZiBAaD8gYW5kIEBzP1xyXG5cdFx0XHQjIEN5bGluZHJpY2FsIENvbG9yIFNwYWNlXHJcblx0XHRcdGlmIEB2P1xyXG5cdFx0XHRcdCMgSHVlIFNhdHVyYXRpb24gVmFsdWVcclxuXHRcdFx0XHRAbCA9ICgyIC0gQHMgLyAxMDApICogQHYgLyAyXHJcblx0XHRcdFx0QHMgPSBAcyAqIEB2IC8gKGlmIEBsIDwgNTAgdGhlbiBAbCAqIDIgZWxzZSAyMDAgLSBAbCAqIDIpXHJcblx0XHRcdFx0QHMgPSAwIGlmIGlzTmFOIEBzXHJcblx0XHRcdGVsc2UgaWYgQGw/XHJcblx0XHRcdFx0IyBIdWUgU2F0dXJhdGlvbiBMaWdodG5lc3NcclxuXHRcdFx0XHQjIChubyBjb252ZXJzaW9ucyBuZWVkZWQgaGVyZSlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdCMgVE9ETzogaW1wcm92ZSBlcnJvciBtZXNzYWdlIChlc3BlY2lhbGx5IGlmIEBiIGdpdmVuKVxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIkh1ZSwgc2F0dXJhdGlvbiwgYW5kLi4uPyAoZWl0aGVyIGxpZ2h0bmVzcyBvciB2YWx1ZSlcIlxyXG5cdFx0XHQjIFRPRE86IG1heWJlIGNvbnZlcnQgdG8gQHIgQGcgQGIgaGVyZVxyXG5cdFx0ZWxzZSBpZiBjPyBhbmQgbT8gYW5kIHk/IGFuZCBrP1xyXG5cdFx0XHQjIEN5YW4gTWFnZW50YSBZZWxsb3cgYmxhY0tcclxuXHRcdFx0IyBVTlRFU1RFRFxyXG5cdFx0XHRjIC89IDEwMFxyXG5cdFx0XHRtIC89IDEwMFxyXG5cdFx0XHR5IC89IDEwMFxyXG5cdFx0XHRrIC89IDEwMFxyXG5cdFx0XHRcclxuXHRcdFx0QHIgPSAyNTUgKiAoMSAtIE1hdGgubWluKDEsIGMgKiAoMSAtIGspICsgaykpXHJcblx0XHRcdEBnID0gMjU1ICogKDEgLSBNYXRoLm1pbigxLCBtICogKDEgLSBrKSArIGspKVxyXG5cdFx0XHRAYiA9IDI1NSAqICgxIC0gTWF0aC5taW4oMSwgeSAqICgxIC0gaykgKyBrKSlcclxuXHRcdGVsc2VcclxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxyXG5cdFx0XHRpZiBAbD8gYW5kIEBhPyBhbmQgQGI/XHJcblx0XHRcdFx0d2hpdGUgPVxyXG5cdFx0XHRcdFx0eDogOTUuMDQ3XHJcblx0XHRcdFx0XHR5OiAxMDAuMDAwXHJcblx0XHRcdFx0XHR6OiAxMDguODgzXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0eHl6ID0gXHJcblx0XHRcdFx0XHR5OiAocmF3LmwgKyAxNikgLyAxMTZcclxuXHRcdFx0XHRcdHg6IHJhdy5hIC8gNTAwICsgeHl6LnlcclxuXHRcdFx0XHRcdHo6IHh5ei55IC0gcmF3LmIgLyAyMDBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRmb3IgXyBpbiBcInh5elwiXHJcblx0XHRcdFx0XHRwb3dlZCA9IE1hdGgucG93KHh5eltfXSwgMylcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcG93ZWQgPiAwLjAwODg1NlxyXG5cdFx0XHRcdFx0XHR4eXpbX10gPSBwb3dlZFxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHR4eXpbX10gPSAoeHl6W19dIC0gMTYgLyAxMTYpIC8gNy43ODdcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0I3h5eltfXSA9IF9yb3VuZCh4eXpbX10gKiB3aGl0ZVtfXSlcclxuXHRcdFx0XHRcclxuXHRcdFx0IyBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRCBVTlRFU1RFRFxyXG5cdFx0XHRpZiBAeD8gYW5kIEB5PyBhbmQgQHo/XHJcblx0XHRcdFx0eHl6ID1cclxuXHRcdFx0XHRcdHg6IHJhdy54IC8gMTAwXHJcblx0XHRcdFx0XHR5OiByYXcueSAvIDEwMFxyXG5cdFx0XHRcdFx0ejogcmF3LnogLyAxMDBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRyZ2IgPVxyXG5cdFx0XHRcdFx0cjogeHl6LnggKiAzLjI0MDYgKyB4eXoueSAqIC0xLjUzNzIgKyB4eXoueiAqIC0wLjQ5ODZcclxuXHRcdFx0XHRcdGc6IHh5ei54ICogLTAuOTY4OSArIHh5ei55ICogMS44NzU4ICsgeHl6LnogKiAwLjA0MTVcclxuXHRcdFx0XHRcdGI6IHh5ei54ICogMC4wNTU3ICsgeHl6LnkgKiAtMC4yMDQwICsgeHl6LnogKiAxLjA1NzBcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRmb3IgXyBpbiBcInJnYlwiXHJcblx0XHRcdFx0XHQjcmdiW19dID0gX3JvdW5kKHJnYltfXSlcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYgcmdiW19dIDwgMFxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAwXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGlmIHJnYltfXSA+IDAuMDAzMTMwOFxyXG5cdFx0XHRcdFx0XHRyZ2JbX10gPSAxLjA1NSAqIE1hdGgucG93KHJnYltfXSwgKDEgLyAyLjQpKSAtIDAuMDU1XHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHJnYltfXSAqPSAxMi45MlxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdCNyZ2JbX10gPSBNYXRoLnJvdW5kKHJnYltfXSAqIDI1NSlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIkNvbG9yIGNvbnN0cnVjdG9yIG11c3QgYmUgY2FsbGVkIHdpdGgge3IsZyxifSBvciB7aCxzLHZ9IG9yIHtoLHMsbH0gb3Ige2MsbSx5LGt9IG9yIHt4LHksen0gb3Ige2wsYSxifSxcclxuXHRcdFx0XHRcdCN7XHJcblx0XHRcdFx0XHRcdHRyeVxyXG5cdFx0XHRcdFx0XHRcdFwiZ290ICN7SlNPTi5zdHJpbmdpZnkob3B0aW9ucyl9XCJcclxuXHRcdFx0XHRcdFx0Y2F0Y2ggZVxyXG5cdFx0XHRcdFx0XHRcdFwiZ290IHNvbWV0aGluZyB0aGF0IGNvdWxkbid0IGJlIGRpc3BsYXllZCB3aXRoIEpTT04uc3RyaW5naWZ5IGZvciB0aGlzIGVycm9yIG1lc3NhZ2VcIlxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFwiXHJcblx0XHRcclxuXHRcclxuXHR0b1N0cmluZzogLT5cclxuXHRcdGlmIEByP1xyXG5cdFx0XHQjIFJlZCBHcmVlbiBCbHVlXHJcblx0XHRcdGlmIEBhPyAjIEFscGhhXHJcblx0XHRcdFx0XCJyZ2JhKCN7QHJ9LCAje0BnfSwgI3tAYn0sICN7QGF9KVwiXHJcblx0XHRcdGVsc2UgIyBPcGFxdWVcclxuXHRcdFx0XHRcInJnYigje0ByfSwgI3tAZ30sICN7QGJ9KVwiXHJcblx0XHRlbHNlIGlmIEBoP1xyXG5cdFx0XHQjIEh1ZSBTYXR1cmF0aW9uIExpZ2h0bmVzc1xyXG5cdFx0XHQjIChBc3N1bWUgaDowLTM2MCwgczowLTEwMCwgbDowLTEwMClcclxuXHRcdFx0aWYgQGE/ICMgQWxwaGFcclxuXHRcdFx0XHRcImhzbGEoI3tAaH0sICN7QHN9JSwgI3tAbH0lLCAje0BhfSlcIlxyXG5cdFx0XHRlbHNlICMgT3BhcXVlXHJcblx0XHRcdFx0XCJoc2woI3tAaH0sICN7QHN9JSwgI3tAbH0lKVwiXHJcblx0XHJcblx0aXM6IChjb2xvciktPlxyXG5cdFx0IyBjb21wYXJlIGFzIHN0cmluZ3NcclxuXHRcdFwiI3tAfVwiIGlzIFwiI3tjb2xvcn1cIlxyXG4iLCJcclxuQ29sb3IgPSByZXF1aXJlIFwiLi9Db2xvclwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9XHJcbmNsYXNzIFBhbGV0dGUgZXh0ZW5kcyBBcnJheVxyXG5cdFxyXG5cdGNvbnN0cnVjdG9yOiAoYXJncy4uLiktPlxyXG5cdFx0c3VwZXIoYXJncy4uLilcclxuXHRcclxuXHRhZGQ6IChvKS0+XHJcblx0XHRuZXdfY29sb3IgPSBuZXcgQ29sb3IobylcclxuXHRcdEBwdXNoIG5ld19jb2xvclxyXG5cdFxyXG5cdGZpbmFsaXplOiAtPlxyXG5cdFx0IyBUT0RPOiBnZXQgdGhpcyB3b3JraW5nIHByb3Blcmx5IGFuZCBlbmFibGVcclxuXHRcdCMgaWYgbm90IEBudW1iZXJPZkNvbHVtbnNcclxuXHRcdCMgXHRAZ3Vlc3NfZGltZW5zaW9ucygpXHJcblx0XHR1bmxlc3MgQHBhcmVudFBhbGV0dGVXaXRob3V0RHVwbGljYXRlc1xyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMgPSBuZXcgUGFsZXR0ZVxyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXMucGFyZW50UGFsZXR0ZVdpdGhvdXREdXBsaWNhdGVzID0gQFxyXG5cdFx0XHRAd2l0aER1cGxpY2F0ZXNbaV0gPSBAW2ldIGZvciBpIGluIFswLi4uQGxlbmd0aF1cclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzLm51bWJlck9mQ29sdW1ucyA9IEBudW1iZXJPZkNvbHVtbnNcclxuXHRcdFx0QHdpdGhEdXBsaWNhdGVzLmdlb21ldHJ5U3BlY2lmaWVkQnlGaWxlID0gQGdlb21ldHJ5U3BlY2lmaWVkQnlGaWxlXHJcblx0XHRcdEB3aXRoRHVwbGljYXRlcy5maW5hbGl6ZSgpXHJcblxyXG5cdFx0XHQjIGluLXBsYWNlIHVuaXF1aWZ5XHJcblx0XHRcdGkgPSAwXHJcblx0XHRcdHdoaWxlIGkgPCBAbGVuZ3RoXHJcblx0XHRcdFx0aV9jb2xvciA9IEBbaV1cclxuXHRcdFx0XHRqID0gaSArIDFcclxuXHRcdFx0XHR3aGlsZSBqIDwgQGxlbmd0aFxyXG5cdFx0XHRcdFx0al9jb2xvciA9IEBbal1cclxuXHRcdFx0XHRcdGlmIGlfY29sb3IuaXMgal9jb2xvclxyXG5cdFx0XHRcdFx0XHRALnNwbGljZShqLCAxKVxyXG5cdFx0XHRcdFx0XHRqIC09IDFcclxuXHRcdFx0XHRcdGogKz0gMVxyXG5cdFx0XHRcdGkgKz0gMVxyXG5cclxuXHQjIyNcclxuXHRndWVzc19kaW1lbnNpb25zOiAtPlxyXG5cdFx0IyBUT0RPOiBnZXQgdGhpcyB3b3JraW5nIHByb3Blcmx5IGFuZCBlbmFibGVcclxuXHJcblx0XHRsZW4gPSBAbGVuZ3RoXHJcblx0XHRjYW5kaWRhdGVfZGltZW5zaW9ucyA9IFtdXHJcblx0XHRmb3IgbnVtYmVyT2ZDb2x1bW5zIGluIFswLi5sZW5dXHJcblx0XHRcdG5fcm93cyA9IGxlbiAvIG51bWJlck9mQ29sdW1uc1xyXG5cdFx0XHRpZiBuX3Jvd3MgaXMgTWF0aC5yb3VuZCBuX3Jvd3NcclxuXHRcdFx0XHRjYW5kaWRhdGVfZGltZW5zaW9ucy5wdXNoIFtuX3Jvd3MsIG51bWJlck9mQ29sdW1uc11cclxuXHRcdFxyXG5cdFx0c3F1YXJlc3QgPSBbMCwgMzQ5NTA5M11cclxuXHRcdGZvciBjZCBpbiBjYW5kaWRhdGVfZGltZW5zaW9uc1xyXG5cdFx0XHRpZiBNYXRoLmFicyhjZFswXSAtIGNkWzFdKSA8IE1hdGguYWJzKHNxdWFyZXN0WzBdIC0gc3F1YXJlc3RbMV0pXHJcblx0XHRcdFx0c3F1YXJlc3QgPSBjZFxyXG5cdFx0XHJcblx0XHRAbnVtYmVyT2ZDb2x1bW5zID0gc3F1YXJlc3RbMV1cclxuXHQjIyNcclxuIiwiIyBMb2FkIGFuIEFkb2JlIENvbG9yIFRhYmxlIGZpbGUgKC5hY3QpXHJcblxyXG4jIyNcclxuXCJUaGVyZSBpcyBubyB2ZXJzaW9uIG51bWJlciB3cml0dGVuIGluIHRoZSBmaWxlLlxyXG5UaGUgZmlsZSBpcyA3Njggb3IgNzcyIGJ5dGVzIGxvbmcgYW5kIGNvbnRhaW5zIDI1NiBSR0IgY29sb3JzLlxyXG5UaGUgZmlyc3QgY29sb3IgaW4gdGhlIHRhYmxlIGlzIGluZGV4IHplcm8uXHJcblRoZXJlIGFyZSB0aHJlZSBieXRlcyBwZXIgY29sb3IgaW4gdGhlIG9yZGVyIHJlZCwgZ3JlZW4sIGJsdWUuXHJcbklmIHRoZSBmaWxlIGlzIDc3MiBieXRlcyBsb25nIHRoZXJlIGFyZSA0IGFkZGl0aW9uYWwgYnl0ZXMgcmVtYWluaW5nLlxyXG5cdFR3byBieXRlcyBmb3IgdGhlIG51bWJlciBvZiBjb2xvcnMgdG8gdXNlLlxyXG5cdFR3byBieXRlcyBmb3IgdGhlIGNvbG9yIGluZGV4IHdpdGggdGhlIHRyYW5zcGFyZW5jeSBjb2xvciB0byB1c2UuXCJcclxuXHJcbmh0dHBzOi8vd3d3LmFkb2JlLmNvbS9kZXZuZXQtYXBwcy9waG90b3Nob3AvZmlsZWZvcm1hdGFzaHRtbC8jNTA1Nzc0MTFfcGdmSWQtMTA3MDYyNlxyXG4jIyNcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG5sb2FkX2Fkb2JlX2NvbG9yX3RhYmxlID0gKHtkYXRhLCBmaWxlRXh0fSktPlxyXG5cclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGJyID0gbmV3IEJpbmFyeVJlYWRlcihkYXRhKVxyXG5cdFxyXG5cdHVubGVzcyAoXHJcblx0XHRici5nZXRTaXplKCkgaW4gWzc2OCwgNzcyXSBvclxyXG5cdFx0ZmlsZUV4dCBpcyBcImFjdFwiICMgYmVjYXVzZSBcIkZpcmV3b3JrcyBjYW4gcmVhZCBBQ1QgZmlsZXMgYmlnZ2VyIHRoYW4gNzY4IGJ5dGVzXCJcclxuXHQpXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJmaWxlIHNpemUgbXVzdCBiZSA3Njggb3IgNzcyIGJ5dGVzIChzYXcgI3tici5nZXRTaXplKCl9KSwgT1IgZmlsZSBleHRlbnNpb24gbXVzdCBiZSAnLmFjdCcgKHNhdyAnLiN7ZmlsZUV4dH0nKVwiXHJcblx0XHJcblx0aSA9IDBcclxuXHR3aGlsZSBpIDwgMjU1XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkVUludDgoKVxyXG5cdFx0XHRnOiBici5yZWFkVUludDgoKVxyXG5cdFx0XHRiOiBici5yZWFkVUludDgoKVxyXG5cdFx0aSArPSAxXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBEZXRlY3QgQ1NTIGNvbG9ycyAoZXhjZXB0IG5hbWVkIGNvbG9ycylcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG4jIFRPRE86IGRldGVjdCBuYW1lcyB2aWEgc3RydWN0dXJlcyBsaWtlIENTUyB2YXJpYWJsZXMsIEpTT04gb2JqZWN0IGtleXMvdmFsdWVzLCBjb21tZW50c1xyXG4jIFRPRE86IHVzZSBhbGwgY29sb3JzIHJlZ2FyZGxlc3Mgb2YgZm9ybWF0LCB3aXRoaW4gYSBkZXRlY3RlZCBzdHJ1Y3R1cmUsIG9yIG1heWJlIGFsd2F5c1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0bl9jb250cm9sX2NoYXJhY3RlcnMgPSAwXHJcblx0Zm9yIGNoYXIgaW4gZGF0YVxyXG5cdFx0aWYgY2hhciBpbiBbXHJcblx0XHRcdFwiXFx4MDBcIiwgXCJcXHgwMVwiLCBcIlxceDAyXCIsIFwiXFx4MDNcIiwgXCJcXHgwNFwiLCBcIlxceDA1XCIsIFwiXFx4MDZcIiwgXCJcXHgwN1wiLCBcIlxceDA4XCJcclxuXHRcdFx0XCJcXHgwQlwiLCBcIlxceDBDXCJcclxuXHRcdFx0XCJcXHgwRVwiLCBcIlxceDBGXCIsIFwiXFx4MTBcIiwgXCJcXHgxMVwiLCBcIlxceDEyXCIsIFwiXFx4MTNcIiwgXCJcXHgxNFwiLCBcIlxceDE1XCIsIFwiXFx4MTZcIiwgXCJcXHgxN1wiLCBcIlxceDE4XCIsIFwiXFx4MTlcIiwgXCJcXHgxQVwiLCBcIlxceDFCXCIsIFwiXFx4MUNcIiwgXCJcXHgxRFwiLCBcIlxceDFFXCIsIFwiXFx4MUZcIiwgXCJcXHg3RlwiXHJcblx0XHRdXHJcblx0XHRcdG5fY29udHJvbF9jaGFyYWN0ZXJzKytcclxuXHRpZiBuX2NvbnRyb2xfY2hhcmFjdGVycyA+IDVcclxuXHRcdHRocm93IG5ldyBFcnJvcihcImxvb2tzIGxpa2UgYSBiaW5hcnkgZmlsZVwiKVxyXG5cclxuXHRwYWxldHRlcyA9IFtcclxuXHRcdHBhbGV0dGVfaGV4X2xvbmcgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hleF9zaG9ydCA9IG5ldyBQYWxldHRlKClcclxuXHRcdHBhbGV0dGVfcmdiID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0cGFsZXR0ZV9oc2wgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX2hzbGEgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XHRwYWxldHRlX3JnYmEgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XVxyXG5cdFxyXG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdFxcIyAjIGhhc2h0YWcgIyAjL1xyXG5cdFx0KFxyXG5cdFx0XHRbMC05QS1GXXszfSAjIHRocmVlIGhleC1kaWdpdHMgKCNBMEMpXHJcblx0XHRcdHxcclxuXHRcdFx0WzAtOUEtRl17Nn0gIyBzaXggaGV4LWRpZ2l0cyAoI0FBMDBDQylcclxuXHRcdFx0fFxyXG5cdFx0XHRbMC05QS1GXXs0fSAjIHdpdGggYWxwaGEsIGZvdXIgaGV4LWRpZ2l0cyAoI0EwQ0YpXHJcblx0XHRcdHxcclxuXHRcdFx0WzAtOUEtRl17OH0gIyB3aXRoIGFscGhhLCBlaWdodCBoZXgtZGlnaXRzICgjQUEwMENDRkYpXHJcblx0XHQpXHJcblx0XHQoPyFbMC05QS1GXSkgIyAoYW5kIG5vIG1vcmUhKVxyXG5cdC8vL2dpbSwgKG0sICQxKS0+XHJcblx0XHRpZiAkMS5sZW5ndGggPiA0XHJcblx0XHRcdHBhbGV0dGVfaGV4X2xvbmcuYWRkXHJcblx0XHRcdFx0cjogaGV4ICQxWzBdICsgJDFbMV1cclxuXHRcdFx0XHRnOiBoZXggJDFbMl0gKyAkMVszXVxyXG5cdFx0XHRcdGI6IGhleCAkMVs0XSArICQxWzVdXHJcblx0XHRcdFx0YTogaWYgJDEubGVuZ3RoIGlzIDggdGhlbiBoZXggJDFbNl0gKyAkMVs3XSBlbHNlIDFcclxuXHRcdGVsc2VcclxuXHRcdFx0cGFsZXR0ZV9oZXhfc2hvcnQuYWRkXHJcblx0XHRcdFx0cjogaGV4ICQxWzBdICsgJDFbMF1cclxuXHRcdFx0XHRnOiBoZXggJDFbMV0gKyAkMVsxXVxyXG5cdFx0XHRcdGI6IGhleCAkMVsyXSArICQxWzJdXHJcblx0XHRcdFx0YTogaWYgJDEubGVuZ3RoIGlzIDQgdGhlbiBoZXggJDFbM10gKyAkMVszXSBlbHNlIDFcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JcXChcclxuXHRcdFx0XFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyByZWRcclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgZ3JlZW5cclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgYmx1ZVxyXG5cdFx0XHQoJT8pXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKF9tLCByX3ZhbCwgcl91bml0LCBnX3ZhbCwgZ191bml0LCBiX3ZhbCwgYl91bml0KS0+XHJcblx0XHRwYWxldHRlX3JnYi5hZGRcclxuXHRcdFx0cjogTnVtYmVyKHJfdmFsKSAqIChpZiByX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcclxuXHRcdFx0ZzogTnVtYmVyKGdfdmFsKSAqIChpZiBnX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcclxuXHRcdFx0YjogTnVtYmVyKGJfdmFsKSAqIChpZiBiX3VuaXQgaXMgXCIlXCIgdGhlbiAyNTUvMTAwIGVsc2UgMSlcclxuXHRcclxuXHRkYXRhLnJlcGxhY2UgLy8vXHJcblx0XHRyZ2JhP1xcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHJlZFxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBncmVlblxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBibHVlXHJcblx0XHRcdCglPylcclxuXHRcdFxccyooPzosfC8pXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBhbHBoYVxyXG5cdFx0XHQoJT8pXHJcblx0XHRcdFxccypcclxuXHRcdFxcKVxyXG5cdC8vL2dpbSwgKF9tLCByX3ZhbCwgcl91bml0LCBnX3ZhbCwgZ191bml0LCBiX3ZhbCwgYl91bml0LCBhX3ZhbCwgYV91bml0KS0+XHJcblx0XHRwYWxldHRlX3JnYmEuYWRkXHJcblx0XHRcdHI6IE51bWJlcihyX3ZhbCkgKiAoaWYgcl91bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHRcdGc6IE51bWJlcihnX3ZhbCkgKiAoaWYgZ191bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHRcdGI6IE51bWJlcihiX3ZhbCkgKiAoaWYgYl91bml0IGlzIFwiJVwiIHRoZW4gMjU1LzEwMCBlbHNlIDEpXHJcblx0XHRcdGE6IE51bWJlcihhX3ZhbCkgKiAoaWYgYV91bml0IGlzIFwiJVwiIHRoZW4gMS8xMDAgZWxzZSAxKVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdGhzbFxcKFxyXG5cdFx0XHRcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIGh1ZVxyXG5cdFx0XHQoZGVnfHJhZHx0dXJufClcclxuXHRcdFxccyooPzosfFxccylcXHMqXHJcblx0XHRcdChbMC05XSpcXC4/WzAtOV0rKSAjIHNhdHVyYXRpb25cclxuXHRcdFx0KCU/KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgdmFsdWVcclxuXHRcdFx0KCU/KVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChfbSwgaF92YWwsIGhfdW5pdCwgc192YWwsIHNfdW5pdCwgbF92YWwsIGxfdW5pdCktPlxyXG5cdFx0cGFsZXR0ZV9oc2wuYWRkXHJcblx0XHRcdGg6IE51bWJlcihoX3ZhbCkgKiAoaWYgaF91bml0IGlzIFwicmFkXCIgdGhlbiAxODAvTWF0aC5QSSBlbHNlIGlmIGhfdW5pdCBpcyBcInR1cm5cIiB0aGVuIDM2MCBlbHNlIDEpXHJcblx0XHRcdHM6IE51bWJlcihzX3ZhbCkgKiAoaWYgc191bml0IGlzIFwiJVwiIHRoZW4gMSBlbHNlIDEwMClcclxuXHRcdFx0bDogTnVtYmVyKGxfdmFsKSAqIChpZiBsX3VuaXQgaXMgXCIlXCIgdGhlbiAxIGVsc2UgMTAwKVxyXG5cdFxyXG5cdGRhdGEucmVwbGFjZSAvLy9cclxuXHRcdGhzbGE/XFwoXHJcblx0XHRcdFxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgaHVlXHJcblx0XHRcdChkZWd8cmFkfHR1cm58KVxyXG5cdFx0XFxzKig/Oix8XFxzKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgc2F0dXJhdGlvblxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHxcXHMpXFxzKlxyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyB2YWx1ZVxyXG5cdFx0XHQoJT8pXHJcblx0XHRcXHMqKD86LHwvKVxccypcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgYWxwaGFcclxuXHRcdFx0KCU/KVxyXG5cdFx0XHRcXHMqXHJcblx0XHRcXClcclxuXHQvLy9naW0sIChfbSwgaF92YWwsIGhfdW5pdCwgc192YWwsIHNfdW5pdCwgbF92YWwsIGxfdW5pdCwgYV92YWwsIGFfdW5pdCktPlxyXG5cdFx0cGFsZXR0ZV9oc2xhLmFkZFxyXG5cdFx0XHRoOiBOdW1iZXIoaF92YWwpICogKGlmIGhfdW5pdCBpcyBcInJhZFwiIHRoZW4gMTgwL01hdGguUEkgZWxzZSBpZiBoX3VuaXQgaXMgXCJ0dXJuXCIgdGhlbiAzNjAgZWxzZSAxKVxyXG5cdFx0XHRzOiBOdW1iZXIoc192YWwpICogKGlmIHNfdW5pdCBpcyBcIiVcIiB0aGVuIDEgZWxzZSAxMDApXHJcblx0XHRcdGw6IE51bWJlcihsX3ZhbCkgKiAoaWYgbF91bml0IGlzIFwiJVwiIHRoZW4gMSBlbHNlIDEwMClcclxuXHRcdFx0YTogTnVtYmVyKGFfdmFsKSAqIChpZiBhX3VuaXQgaXMgXCIlXCIgdGhlbiAxLzEwMCBlbHNlIDEpXHJcblx0XHJcblx0bW9zdF9jb2xvcnMgPSBbXVxyXG5cdGZvciBwYWxldHRlIGluIHBhbGV0dGVzXHJcblx0XHRpZiBwYWxldHRlLmxlbmd0aCA+PSBtb3N0X2NvbG9ycy5sZW5ndGhcclxuXHRcdFx0bW9zdF9jb2xvcnMgPSBwYWxldHRlXHJcblx0XHJcblx0biA9IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdGlmIG4gPCA0XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoW1xyXG5cdFx0XHRcIk5vIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBvbmUgY29sb3IgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBjb3VwbGUgY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IGEgZmV3IGNvbG9ycyBmb3VuZFwiXHJcblx0XHRdW25dICsgXCIgKCN7bn0pXCIpXHJcblx0XHJcblx0bW9zdF9jb2xvcnNcclxuIiwiXHJcbiMgTG9hZCBhIENvbG9yU2NoZW1lciBwYWxldHRlXHJcblxyXG5CaW5hcnlSZWFkZXIgPSByZXF1aXJlIFwiLi4vQmluYXJ5UmVhZGVyXCJcclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhLCBmaWxlRXh0fSktPlxyXG5cclxuXHRpZiBmaWxlRXh0IGlzbnQgXCJjc1wiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJDb2xvclNjaGVtZXIgbG9hZGVyIGlzIG9ubHkgZW5hYmxlZCB3aGVuIGZpbGUgZXh0ZW5zaW9uIGlzICcuY3MnIChzYXcgJy4je2ZpbGVFeHR9JyBpbnN0ZWFkKVwiKVxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0dmVyc2lvbiA9IGJyLnJlYWRVSW50MTYoKSAjIG9yIHNvbWV0aGluZ1xyXG5cdGxlbmd0aCA9IGJyLnJlYWRVSW50MTYoKVxyXG5cdGkgPSAwXHJcblx0d2hpbGUgaSA8IGxlbmd0aFxyXG5cdFx0YnIuc2Vlayg4ICsgaSAqIDI2KVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdGkgKz0gMVxyXG5cclxuXHRwYWxldHRlXHJcblxyXG4iLCJcclxuIyBMb2FkIGEgR0lNUCBwYWxldHRlXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxucGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGUgPSAoZGF0YSwgZm9ybWF0X25hbWUpLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgZm9ybWF0X25hbWVcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIk5vdCBhICN7Zm9ybWF0X25hbWV9XCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdGkgPSAwXHJcblx0IyBzdGFydHMgYXQgaSA9IDEgYmVjYXVzZSB0aGUgaW5jcmVtZW50IGhhcHBlbnMgYXQgdGhlIHN0YXJ0IG9mIHRoZSBsb29wXHJcblx0d2hpbGUgKGkgKz0gMSkgPCBsaW5lcy5sZW5ndGhcclxuXHRcdGxpbmUgPSBsaW5lc1tpXVxyXG5cdFx0XHJcblx0XHRpZiBsaW5lWzBdIGlzIFwiI1wiIG9yIGxpbmUgaXMgXCJcIiB0aGVuIGNvbnRpbnVlXHJcblx0XHQjIFRPRE86IGhhbmRsZSBub24tc3RhcnQtb2YtbGluZSBjb21tZW50cz8gd2hlcmUncyB0aGUgc3BlYz9cclxuXHRcdFxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL05hbWU6XFxzKiguKikvKVxyXG5cdFx0aWYgbVxyXG5cdFx0XHRwYWxldHRlLm5hbWUgPSBtWzFdXHJcblx0XHRcdGNvbnRpbnVlXHJcblx0XHRtID0gbGluZS5tYXRjaCgvQ29sdW1uczpcXHMqKC4qKS8pXHJcblx0XHRpZiBtXHJcblx0XHRcdHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gTnVtYmVyKG1bMV0pXHJcblx0XHRcdCMgVE9ETzogaGFuZGxlIDAgYXMgbm90IHNwZWNpZmllZD8gd2hlcmUncyB0aGUgc3BlYyBhdCwgeW8/XHJcblx0XHRcdHBhbGV0dGUuZ2VvbWV0cnlTcGVjaWZpZWRCeUZpbGUgPSB5ZXNcclxuXHRcdFx0Y29udGludWVcclxuXHRcdFxyXG5cdFx0IyBUT0RPOiByZXBsYWNlIFxccyB3aXRoIFtcXCBcXHRdIChzcGFjZXMgb3IgdGFicylcclxuXHRcdCMgaXQgY2FuJ3QgbWF0Y2ggXFxuIGJlY2F1c2UgaXQncyBhbHJlYWR5IHNwbGl0IG9uIHRoYXQsIGJ1dCBzdGlsbFxyXG5cdFx0IyBUT0RPOiBoYW5kbGUgbGluZSB3aXRoIG5vIG5hbWUgYnV0IHNwYWNlIG9uIHRoZSBlbmRcclxuXHRcdHJfZ19iX25hbWUgPSBsaW5lLm1hdGNoKC8vL1xyXG5cdFx0XHReICMgXCJhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lLFwiXHJcblx0XHRcdFxccyogIyBcImdpdmUgb3IgdGFrZSBzb21lIHNwYWNlcyxcIlxyXG5cdFx0XHQjIG1hdGNoIDMgZ3JvdXBzIG9mIG51bWJlcnMgc2VwYXJhdGVkIGJ5IHNwYWNlc1xyXG5cdFx0XHQoWzAtOV0rKSAjIHJlZFxyXG5cdFx0XHRcXHMrXHJcblx0XHRcdChbMC05XSspICMgZ3JlZW5cclxuXHRcdFx0XFxzK1xyXG5cdFx0XHQoWzAtOV0rKSAjIGJsdWVcclxuXHRcdFx0KD86XHJcblx0XHRcdFx0XFxzK1xyXG5cdFx0XHRcdCguKikgIyBvcHRpb25hbGx5IGEgbmFtZVxyXG5cdFx0XHQpP1xyXG5cdFx0XHQkICMgXCJhbmQgdGhhdCBzaG91bGQgYmUgdGhlIGVuZCBvZiB0aGUgbGluZVwiXHJcblx0XHQvLy8pXHJcblx0XHRpZiBub3Qgcl9nX2JfbmFtZVxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJMaW5lICN7aX0gZG9lc24ndCBtYXRjaCBwYXR0ZXJuICN7cl9nX2JfbmFtZX1cIiAjIFRPRE86IGJldHRlciBtZXNzYWdlP1xyXG5cdFx0XHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiByX2dfYl9uYW1lWzFdXHJcblx0XHRcdGc6IHJfZ19iX25hbWVbMl1cclxuXHRcdFx0Yjogcl9nX2JfbmFtZVszXVxyXG5cdFx0XHRuYW1lOiByX2dfYl9uYW1lWzRdXHJcblx0XHRcclxuXHRwYWxldHRlXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRwYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZShkYXRhLCBcIkdJTVAgUGFsZXR0ZVwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMucGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGUgPSBwYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZVxyXG4iLCIjIExvYWQgYW4gQWxsYWlyZSBIb21lc2l0ZSAvIE1hY3JvbWVkaWEgQ29sZEZ1c2lvbiBwYWxldHRlICguaHBsKVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblx0aWYgbGluZXNbMF0gaXNudCBcIlBhbGV0dGVcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiTm90IGEgSG9tZXNpdGUgcGFsZXR0ZVwiXHJcblx0aWYgbm90IGxpbmVzWzFdLm1hdGNoIC9WZXJzaW9uIFszNF1cXC4wL1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5zdXBwb3J0ZWQgSG9tZXNpdGUgcGFsZXR0ZSB2ZXJzaW9uXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFxyXG5cdGZvciBsaW5lLCBpIGluIGxpbmVzXHJcblx0XHRpZiBsaW5lLm1hdGNoIC8uKyAuKyAuKy9cclxuXHRcdFx0cmdiID0gbGluZS5zcGxpdChcIiBcIilcclxuXHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRyOiByZ2JbMF1cclxuXHRcdFx0XHRnOiByZ2JbMV1cclxuXHRcdFx0XHRiOiByZ2JbMl1cclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIlxyXG57cGFyc2VfZ2ltcF9vcl9rZGVfcmdiX3BhbGV0dGV9ID0gcmVxdWlyZSBcIi4vR0lNUFwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRwYXJzZV9naW1wX29yX2tkZV9yZ2JfcGFsZXR0ZShkYXRhLCBcIktERSBSR0IgUGFsZXR0ZVwiKVxyXG4iLCJcclxuIyBMb2FkIGEgUGFpbnQuTkVUIHBhbGV0dGUgZmlsZVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFxyXG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxyXG5cdFxyXG5cdGZvciBsaW5lIGluIGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdFx0bSA9IGxpbmUubWF0Y2goL14oWzAtOUEtRl17Mn0pKFswLTlBLUZdezJ9KShbMC05QS1GXXsyfSkoWzAtOUEtRl17Mn0pJC9pKVxyXG5cdFx0aWYgbSB0aGVuIHBhbGV0dGUuYWRkXHJcblx0XHRcdGE6IGhleCBtWzFdXHJcblx0XHRcdHI6IGhleCBtWzJdXHJcblx0XHRcdGc6IGhleCBtWzNdXHJcblx0XHRcdGI6IGhleCBtWzRdXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgSkFTQyBQQUwgZmlsZSAoUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZSBmaWxlKVxyXG5cclxuQmluYXJ5UmVhZGVyID0gcmVxdWlyZSBcIi4uL0JpbmFyeVJlYWRlclwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdGlmIGxpbmVzWzBdIGlzbnQgXCJKQVNDLVBBTFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJOb3QgYSBKQVNDLVBBTFwiXHJcblx0aWYgbGluZXNbMV0gaXNudCBcIjAxMDBcIlxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBKQVNDLVBBTCB2ZXJzaW9uXCJcclxuXHRpZiBsaW5lc1syXSBpc250IFwiMjU2XCJcclxuXHRcdFwidGhhdCdzIG9rXCJcclxuXHRcclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdCNuX2NvbG9ycyA9IE51bWJlcihsaW5lc1syXSlcclxuXHRcclxuXHRmb3IgbGluZSwgaSBpbiBsaW5lc1xyXG5cdFx0aWYgbGluZSBpc250IFwiXCIgYW5kIGkgPiAyXHJcblx0XHRcdHJnYiA9IGxpbmUuc3BsaXQoXCIgXCIpXHJcblx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0cjogcmdiWzBdXHJcblx0XHRcdFx0ZzogcmdiWzFdXHJcblx0XHRcdFx0YjogcmdiWzJdXHJcblx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBMb2FkIGEgUmVzb3VyY2UgSW50ZXJjaGFuZ2UgRmlsZSBGb3JtYXQgUEFMIGZpbGVcclxuXHJcbiMgcG9ydGVkIGZyb20gQyMgY29kZSBhdCBodHRwczovL3dvcm1zMmQuaW5mby9QYWxldHRlX2ZpbGVcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0YnIgPSBuZXcgQmluYXJ5UmVhZGVyKGRhdGEpXHJcblx0XHJcblx0IyBSSUZGIGhlYWRlclxyXG5cdHJpZmYgPSBici5yZWFkU3RyaW5nKDQpICMgXCJSSUZGXCJcclxuXHRkYXRhU2l6ZSA9IGJyLnJlYWRVSW50MzIoKVxyXG5cdHR5cGUgPSBici5yZWFkU3RyaW5nKDQpICMgXCJQQUwgXCJcclxuXHRcclxuXHRpZiByaWZmIGlzbnQgXCJSSUZGXCJcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIlJJRkYgaGVhZGVyIG5vdCBmb3VuZDsgbm90IGEgUklGRiBQQUwgZmlsZVwiXHJcblx0XHJcblx0aWYgdHlwZSBpc250IFwiUEFMIFwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJcIlwiXHJcblx0XHRcdFJJRkYgaGVhZGVyIHNheXMgdGhpcyBpc24ndCBhIFBBTCBmaWxlLFxyXG5cdFx0XHRtb3JlIG9mIGEgc29ydCBvZiAjeygodHlwZStcIlwiKS50cmltKCkpfSBmaWxlXHJcblx0XHRcIlwiXCJcclxuXHRcclxuXHQjIERhdGEgY2h1bmtcclxuXHRjaHVua1R5cGUgPSBici5yZWFkU3RyaW5nKDQpICMgXCJkYXRhXCJcclxuXHRjaHVua1NpemUgPSBici5yZWFkVUludDMyKClcclxuXHRwYWxWZXJzaW9uID0gYnIucmVhZFVJbnQxNigpICMgMHgwMzAwXHJcblx0cGFsTnVtRW50cmllcyA9IGJyLnJlYWRVSW50MTYoKVxyXG5cdFxyXG5cdFxyXG5cdGlmIGNodW5rVHlwZSBpc250IFwiZGF0YVwiXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJEYXRhIGNodW5rIG5vdCBmb3VuZCAoLi4uJyN7Y2h1bmtUeXBlfSc/KVwiXHJcblx0XHJcblx0aWYgcGFsVmVyc2lvbiBpc250IDB4MDMwMFxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwiVW5zdXBwb3J0ZWQgUEFMIGZpbGUgZm9ybWF0IHZlcnNpb246IDB4I3twYWxWZXJzaW9uLnRvU3RyaW5nKDE2KX1cIlxyXG5cdFxyXG5cdCMgQ29sb3JzXHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRpID0gMFxyXG5cdHdoaWxlIChpICs9IDEpIDwgcGFsTnVtRW50cmllcyAtIDFcclxuXHRcdFxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0XzogYnIucmVhZEJ5dGUoKSAjIFwiZmxhZ3NcIiwgYWx3YXlzIDB4MDBcclxuXHRcclxuXHRwYWxldHRlXHJcbiIsIiMgTG9hZCBzSzEgcGFsZXR0ZXNcclxuIyBUaGVzZSBmaWxlcyBhcmUgYWN0dWFsbHkgcHl0aG9uaWMsIGJ1dCBsZXQncyBqdXN0IHRyeSB0byBwYXJzZSB0aGVtIGluIGEgYmFzaWMsIG5vbi1nZW5lcmFsIHdheVxyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcblxccl0rL20pXHJcblxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZVxyXG5cclxuXHRmbnMgPVxyXG5cdFx0c2V0X25hbWU6IChuYW1lKS0+IHBhbGV0dGUubmFtZSA9IG5hbWVcclxuXHRcdGFkZF9jb21tZW50czogKGxpbmUpLT5cclxuXHRcdFx0cGFsZXR0ZS5kZXNjcmlwdGlvbiA/PSBcIlwiXHJcblx0XHRcdHBhbGV0dGUuZGVzY3JpcHRpb24gKz0gbGluZSArIFwiXFxuXCJcclxuXHRcdHNldF9jb2x1bW5zOiAoY29sdW1uc19zdHIpLT5cclxuXHRcdFx0cGFsZXR0ZS5udW1iZXJPZkNvbHVtbnMgPSBwYXJzZUludChjb2x1bW5zX3N0cilcclxuXHRcdGNvbG9yOiAoY29sb3JfZGVmX3N0ciktPlxyXG5cdFx0XHRjb2xvcl9kZWYgPSBKU09OLnBhcnNlKGNvbG9yX2RlZl9zdHIucmVwbGFjZSgvXFxidShbJ1wiXSkvZywgXCIkMVwiKS5yZXBsYWNlKC8nL2csICdcIicpKVxyXG5cdFx0XHRbY29sb3JfdHlwZSwgY29tcG9uZW50cywgYWxwaGEsIG5hbWVdID0gY29sb3JfZGVmXHJcblx0XHRcdHN3aXRjaCBjb2xvcl90eXBlXHJcblx0XHRcdFx0d2hlbiBcIlJHQlwiXHJcblx0XHRcdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdFx0XHRyOiBjb21wb25lbnRzWzBdICogMjU1XHJcblx0XHRcdFx0XHRcdGc6IGNvbXBvbmVudHNbMV0gKiAyNTVcclxuXHRcdFx0XHRcdFx0YjogY29tcG9uZW50c1syXSAqIDI1NVxyXG5cdFx0XHRcdFx0XHRhOiBhbHBoYVxyXG5cdFx0XHRcdHdoZW4gXCJHcmF5c2NhbGVcIlxyXG5cdFx0XHRcdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0XHRcdFx0cjogY29tcG9uZW50c1swXSAqIDI1NVxyXG5cdFx0XHRcdFx0XHRnOiBjb21wb25lbnRzWzBdICogMjU1XHJcblx0XHRcdFx0XHRcdGI6IGNvbXBvbmVudHNbMF0gKiAyNTVcclxuXHRcdFx0XHRcdFx0YTogYWxwaGFcclxuXHRcdFx0XHR3aGVuIFwiQ01ZS1wiXHJcblx0XHRcdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdFx0XHRjOiBjb21wb25lbnRzWzBdICogMTAwXHJcblx0XHRcdFx0XHRcdG06IGNvbXBvbmVudHNbMV0gKiAxMDBcclxuXHRcdFx0XHRcdFx0eTogY29tcG9uZW50c1syXSAqIDEwMFxyXG5cdFx0XHRcdFx0XHRrOiBjb21wb25lbnRzWzNdICogMTAwXHJcblx0XHRcdFx0XHRcdGE6IGFscGhhXHJcblx0XHRcdFx0d2hlbiBcIkhTTFwiXHJcblx0XHRcdFx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRcdFx0XHRoOiBjb21wb25lbnRzWzBdICogMzYwXHJcblx0XHRcdFx0XHRcdHM6IGNvbXBvbmVudHNbMV0gKiAxMDBcclxuXHRcdFx0XHRcdFx0bDogY29tcG9uZW50c1syXSAqIDEwMFxyXG5cdFx0XHRcdFx0XHRhOiBhbHBoYVxyXG5cdFxyXG5cdGZvciBsaW5lIGluIGxpbmVzXHJcblx0XHRtYXRjaCA9IGxpbmUubWF0Y2goLyhbXFx3X10rKVxcKCguKilcXCkvKVxyXG5cdFx0aWYgbWF0Y2hcclxuXHRcdFx0W18sIGZuX25hbWUsIGFyZ3Nfc3RyXSA9IG1hdGNoXHJcblx0XHRcdGZuc1tmbl9uYW1lXT8oYXJnc19zdHIpXHJcblxyXG5cdG4gPSBwYWxldHRlLmxlbmd0aFxyXG5cdGlmIG4gPCAyXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoW1xyXG5cdFx0XHRcIk5vIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBvbmUgY29sb3IgZm91bmRcIlxyXG5cdFx0XVtuXSArIFwiICgje259KVwiKVxyXG5cdFxyXG5cdHBhbGV0dGVcclxuIiwiXHJcbiMgTG9hZCBhIFNrZW5jaWwgcGFsZXR0ZSAoLnNwbCkgKFwiU2tldGNoIFJHQlBhbGV0dGVcIilcclxuIyAobm90IHJlbGF0ZWQgdG8gLnNrZXRjaHBhbGV0dGUgU2tldGNoIEFwcCBwYWxldHRlIGZvcm1hdClcclxuXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vUGFsZXR0ZVwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pLT5cclxuXHRsaW5lcyA9IGRhdGEuc3BsaXQoL1tcXG5cXHJdKy9tKVxyXG5cdFxyXG5cdHBhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0aSA9IDFcclxuXHR3aGlsZSAoaSArPSAxKSA8IGxpbmVzLmxlbmd0aFxyXG5cdFx0bGluZSA9IGxpbmVzW2ldXHJcblx0XHRcclxuXHRcdGlmIGxpbmVbMF0gaXMgXCIjXCIgb3IgbGluZSBpcyBcIlwiIHRoZW4gY29udGludWVcclxuXHRcdCMgVE9ETzogaGFuZGxlIG5vbi1zdGFydC1vZi1saW5lIGNvbW1lbnRzPyB3aGVyZSdzIHRoZSBzcGVjP1xyXG5cdFx0XHJcblx0XHQjIFRPRE86IHJlcGxhY2UgXFxzIHdpdGggW1xcIFxcdF0gKHNwYWNlcyBvciB0YWJzKVxyXG5cdFx0IyBpdCBjYW4ndCBtYXRjaCBcXG4gYmVjYXVzZSBpdCdzIGFscmVhZHkgc3BsaXQgb24gdGhhdCwgYnV0IHN0aWxsXHJcblx0XHQjIFRPRE86IGhhbmRsZSBsaW5lIHdpdGggbm8gbmFtZSBidXQgc3BhY2Ugb24gdGhlIGVuZFxyXG5cdFx0cl9nX2JfbmFtZSA9IGxpbmUubWF0Y2goLy8vXHJcblx0XHRcdF4gIyBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lLFxyXG5cdFx0XHRcXHMqICMgcGVyaGFwcyB3aXRoIHNvbWUgbGVhZGluZyBzcGFjZXNcclxuXHRcdFx0IyBtYXRjaCAzIGdyb3VwcyBvZiBudW1iZXJzIHNlcGFyYXRlZCBieSBzcGFjZXNcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgcmVkXHJcblx0XHRcdFxccytcclxuXHRcdFx0KFswLTldKlxcLj9bMC05XSspICMgZ3JlZW5cclxuXHRcdFx0XFxzK1xyXG5cdFx0XHQoWzAtOV0qXFwuP1swLTldKykgIyBibHVlXHJcblx0XHRcdCg/OlxyXG5cdFx0XHRcdFxccytcclxuXHRcdFx0XHQoLiopICMgb3B0aW9uYWxseSBhIG5hbWVcclxuXHRcdFx0KT9cclxuXHRcdFx0JCAjIFwiYW5kIHRoYXQgc2hvdWxkIGJlIHRoZSBlbmQgb2YgdGhlIGxpbmVcIlxyXG5cdFx0Ly8vKVxyXG5cdFx0aWYgbm90IHJfZ19iX25hbWVcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiTGluZSAje2l9IGRvZXNuJ3QgbWF0Y2ggcGF0dGVybiAje3JfZ19iX25hbWV9XCIgIyBUT0RPOiBiZXR0ZXIgbWVzc2FnZT9cclxuXHRcdFxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogcl9nX2JfbmFtZVsxXSAqIDI1NVxyXG5cdFx0XHRnOiByX2dfYl9uYW1lWzJdICogMjU1XHJcblx0XHRcdGI6IHJfZ19iX25hbWVbM10gKiAyNTVcclxuXHRcdFx0bmFtZTogcl9nX2JfbmFtZVs0XVxyXG5cdFx0XHJcblx0cGFsZXR0ZVxyXG4iLCJcclxuIyBQQUwgKFN0YXJDcmFmdCByYXcgcGFsZXR0ZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHRpZiBici5nZXRTaXplKCkgaXNudCA3NjhcclxuXHRcdHRocm93IG5ldyBFcnJvciBcIldyb25nIGZpbGUgc2l6ZSwgbXVzdCBiZSAjezc2OH0gYnl0ZXMgbG9uZyAobm90ICN7YnIuZ2V0U2l6ZSgpfSlcIlxyXG5cdFxyXG5cdGZvciBpIGluIFswLi4uMjU1XVxyXG5cdFx0cGFsZXR0ZS5hZGRcclxuXHRcdFx0cjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRnOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGI6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0Izogbm8gcGFkZGluZ1xyXG5cdFxyXG5cdCM/IHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gMTZcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIFdQRSAoU3RhckNyYWZ0IHBhZGRlZCByYXcgcGFsZXR0ZSlcclxuXHJcbkJpbmFyeVJlYWRlciA9IHJlcXVpcmUgXCIuLi9CaW5hcnlSZWFkZXJcIlxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0XHJcblx0cGFsZXR0ZSA9IG5ldyBQYWxldHRlKClcclxuXHRiciA9IG5ldyBCaW5hcnlSZWFkZXIoZGF0YSlcclxuXHRcclxuXHRpZiBici5nZXRTaXplKCkgaXNudCAxMDI0XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IgXCJXcm9uZyBmaWxlIHNpemUsIG11c3QgYmUgI3sxMDI0fSBieXRlcyBsb25nIChub3QgI3tici5nZXRTaXplKCl9KVwiXHJcblx0XHJcblx0Zm9yIGkgaW4gWzAuLi4yNTVdXHJcblx0XHRwYWxldHRlLmFkZFxyXG5cdFx0XHRyOiBici5yZWFkQnl0ZSgpXHJcblx0XHRcdGc6IGJyLnJlYWRCeXRlKClcclxuXHRcdFx0YjogYnIucmVhZEJ5dGUoKVxyXG5cdFx0XHRfOiBici5yZWFkQnl0ZSgpICMgcGFkZGluZ1xyXG5cdFxyXG5cdHBhbGV0dGUubnVtYmVyT2ZDb2x1bW5zID0gMTZcclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgYSBTa2V0Y2ggQXBwIEpTT04gcGFsZXR0ZSAoLnNrZXRjaHBhbGV0dGUpXHJcbiMgKG5vdCByZWxhdGVkIHRvIC5zcGwgU2tldGNoIFJHQiBwYWxldHRlIGZvcm1hdClcclxuXHJcbiMgYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2FuZHJld2Zpb3JpbGxvL3NrZXRjaC1wYWxldHRlcy9ibG9iLzViNmJmYTZlYjI1Y2IzMjQ0YTllNmEyMjZkZjI1OWU4ZmIzMWZjMmMvU2tldGNoJTIwUGFsZXR0ZXMuc2tldGNocGx1Z2luL0NvbnRlbnRzL1NrZXRjaC9za2V0Y2hQYWxldHRlcy5qc1xyXG5cclxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9QYWxldHRlXCJcclxuXHJcbnZlcnNpb24gPSAxLjRcclxuXHJcbiMgVE9ETzogRFJZIHdpdGggQ1NTLmNvZmZlZVxyXG5wYXJzZV9jc3NfaGV4X2NvbG9yID0gKGhleF9jb2xvciktPlxyXG5cdGhleCA9ICh4KS0+IHBhcnNlSW50KHgsIDE2KVxyXG5cdFxyXG5cdG1hdGNoID0gaGV4X2NvbG9yLm1hdGNoKC8vL1xyXG5cdFx0XFwjICMgaGFzaHRhZyAjICMvXHJcblx0XHQoXHJcblx0XHRcdFswLTlBLUZdezN9ICMgdGhyZWUgaGV4LWRpZ2l0cyAoI0EwQylcclxuXHRcdFx0fFxyXG5cdFx0XHRbMC05QS1GXXs2fSAjIHNpeCBoZXgtZGlnaXRzICgjQUEwMENDKVxyXG5cdFx0XHR8XHJcblx0XHRcdFswLTlBLUZdezR9ICMgd2l0aCBhbHBoYSwgZm91ciBoZXgtZGlnaXRzICgjQTBDRilcclxuXHRcdFx0fFxyXG5cdFx0XHRbMC05QS1GXXs4fSAjIHdpdGggYWxwaGEsIGVpZ2h0IGhleC1kaWdpdHMgKCNBQTAwQ0NGRilcclxuXHRcdClcclxuXHRcdCg/IVswLTlBLUZdKSAjIChhbmQgbm8gbW9yZSEpXHJcblx0Ly8vZ2ltKVxyXG5cclxuXHRbJDAsICQxXSA9IG1hdGNoXHJcblxyXG5cdGlmICQxLmxlbmd0aCA+IDRcclxuXHRcdHI6IGhleCAkMVswXSArICQxWzFdXHJcblx0XHRnOiBoZXggJDFbMl0gKyAkMVszXVxyXG5cdFx0YjogaGV4ICQxWzRdICsgJDFbNV1cclxuXHRcdGE6IGlmICQxLmxlbmd0aCBpcyA4IHRoZW4gaGV4ICQxWzZdICsgJDFbN10gZWxzZSAxXHJcblx0ZWxzZVxyXG5cdFx0cjogaGV4ICQxWzBdICsgJDFbMF1cclxuXHRcdGc6IGhleCAkMVsxXSArICQxWzFdXHJcblx0XHRiOiBoZXggJDFbMl0gKyAkMVsyXVxyXG5cdFx0YTogaWYgJDEubGVuZ3RoIGlzIDQgdGhlbiBoZXggJDFbM10gKyAkMVszXSBlbHNlIDFcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHtkYXRhfSktPlxyXG5cdGlmIG5vdCBkYXRhLm1hdGNoKC9eXFxzKnsvKVxyXG5cdFx0dGhyb3cgbmV3IEVycm9yIFwibm90IHNrZXRjaHBhbGV0dGUgSlNPTlwiXHJcblx0cGFsZXR0ZUNvbnRlbnRzID0gSlNPTi5wYXJzZShkYXRhKVxyXG5cclxuXHRjb21wYXRpYmxlVmVyc2lvbiA9IHBhbGV0dGVDb250ZW50cy5jb21wYXRpYmxlVmVyc2lvblxyXG5cclxuXHQjIENoZWNrIGZvciBwcmVzZXRzIGluIGZpbGUsIGVsc2Ugc2V0IHRvIGVtcHR5IGFycmF5XHJcblx0Y29sb3JEZWZpbml0aW9ucyA9IHBhbGV0dGVDb250ZW50cy5jb2xvcnMgPyBbXVxyXG5cdGdyYWRpZW50RGVmaW5pdGlvbnMgPSBwYWxldHRlQ29udGVudHMuZ3JhZGllbnRzID8gW11cclxuXHRpbWFnZURlZmluaXRpb25zID0gcGFsZXR0ZUNvbnRlbnRzLmltYWdlcyA/IFtdXHJcblx0Y29sb3JBc3NldHMgPSBbXVxyXG5cdGdyYWRpZW50QXNzZXRzID0gW11cclxuXHRpbWFnZXMgPSBbXVxyXG5cclxuXHRwYWxldHRlID0gbmV3IFBhbGV0dGVcclxuXHJcblx0IyBDaGVjayBpZiBwbHVnaW4gaXMgb3V0IG9mIGRhdGUgYW5kIGluY29tcGF0aWJsZSB3aXRoIGEgbmV3ZXIgcGFsZXR0ZSB2ZXJzaW9uXHJcblx0aWYgY29tcGF0aWJsZVZlcnNpb24gYW5kIGNvbXBhdGlibGVWZXJzaW9uID4gdmVyc2lvblxyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgaGFuZGxlIGNvbXBhdGlibGVWZXJzaW9uIG9mICN7Y29tcGF0aWJsZVZlcnNpb259LlwiKVxyXG5cdFx0cmV0dXJuXHJcblxyXG5cdCMgQ2hlY2sgZm9yIG9sZGVyIGhleCBjb2RlIHBhbGV0dGUgdmVyc2lvblxyXG5cdGlmIG5vdCBjb21wYXRpYmxlVmVyc2lvbiBvciBjb21wYXRpYmxlVmVyc2lvbiA8IDEuNFxyXG5cdFx0IyBDb252ZXJ0IGhleCBjb2xvcnNcclxuXHRcdGZvciBoZXhfY29sb3IgaW4gY29sb3JEZWZpbml0aW9uc1xyXG5cdFx0XHRwYWxldHRlLmFkZChwYXJzZV9jc3NfaGV4X2NvbG9yKGhleF9jb2xvcikpXHJcblx0ZWxzZVxyXG5cdFx0IyBDb2xvciBGaWxsczogY29udmVydCByZ2JhIGNvbG9yc1xyXG5cdFx0aWYgY29sb3JEZWZpbml0aW9ucy5sZW5ndGggPiAwXHJcblx0XHRcdGZvciBjb2xvcl9kZWZpbml0aW9uIGluIGNvbG9yRGVmaW5pdGlvbnNcclxuXHRcdFx0XHRwYWxldHRlLmFkZChcclxuXHRcdFx0XHRcdHI6IGNvbG9yX2RlZmluaXRpb24ucmVkICogMjU1XHJcblx0XHRcdFx0XHRnOiBjb2xvcl9kZWZpbml0aW9uLmdyZWVuICogMjU1XHJcblx0XHRcdFx0XHRiOiBjb2xvcl9kZWZpbml0aW9uLmJsdWUgKiAyNTVcclxuXHRcdFx0XHRcdGE6IGNvbG9yX2RlZmluaXRpb24uYWxwaGEgKiAyNTVcclxuXHRcdFx0XHRcdG5hbWU6IGNvbG9yX2RlZmluaXRpb24ubmFtZVxyXG5cdFx0XHRcdClcclxuXHJcblx0XHQjICMgUGF0dGVybiBGaWxsczogY29udmVydCBiYXNlNjQgc3RyaW5ncyB0byBNU0ltYWdlRGF0YSBvYmplY3RzXHJcblx0XHQjIGlmIGltYWdlRGVmaW5pdGlvbnMubGVuZ3RoID4gMFxyXG5cdFx0IyBcdGZvciBpIGluIFswLi5pbWFnZURlZmluaXRpb25zLmxlbmd0aF1cclxuXHRcdCMgXHRcdG5zZGF0YSA9IE5TRGF0YS5hbGxvYygpLmluaXRXaXRoQmFzZTY0RW5jb2RlZFN0cmluZ19vcHRpb25zKGltYWdlRGVmaW5pdGlvbnNbaV0uZGF0YSwgMClcclxuXHRcdCMgXHRcdG5zaW1hZ2UgPSBOU0ltYWdlLmFsbG9jKCkuaW5pdFdpdGhEYXRhKG5zZGF0YSlcclxuXHRcdCMgXHRcdCMgbXNpbWFnZSA9IE1TSW1hZ2VEYXRhLmFsbG9jKCkuaW5pdFdpdGhJbWFnZUNvbnZlcnRpbmdDb2xvclNwYWNlKG5zaW1hZ2UpXHJcblx0XHQjIFx0XHRtc2ltYWdlID0gTVNJbWFnZURhdGEuYWxsb2MoKS5pbml0V2l0aEltYWdlKG5zaW1hZ2UpXHJcblx0XHQjIFx0XHRpbWFnZXMucHVzaChtc2ltYWdlKVxyXG5cclxuXHRcdCMgIyBHcmFkaWVudCBGaWxsczogYnVpbGQgTVNHcmFkaWVudFN0b3AgYW5kIE1TR3JhZGllbnQgb2JqZWN0c1xyXG5cdFx0IyBpZiBncmFkaWVudERlZmluaXRpb25zLmxlbmd0aCA+IDBcclxuXHRcdCMgXHRmb3IgaSBpbiBbMC4uZ3JhZGllbnREZWZpbml0aW9ucy5sZW5ndGhdXHJcblx0XHQjIFx0XHQjIENyZWF0ZSBncmFkaWVudCBzdG9wc1xyXG5cdFx0IyBcdFx0Z3JhZGllbnQgPSBncmFkaWVudERlZmluaXRpb25zW2ldXHJcblx0XHQjIFx0XHRzdG9wcyA9IFtdXHJcblx0XHQjIFx0XHRmb3IgaiBpbiBbMC4uZ3JhZGllbnQuc3RvcHNdXHJcblx0XHQjIFx0XHRcdGNvbG9yID0gTVNDb2xvci5jb2xvcldpdGhSZWRfZ3JlZW5fYmx1ZV9hbHBoYShcclxuXHRcdCMgXHRcdFx0XHRncmFkaWVudC5zdG9wc1tqXS5jb2xvci5yZWQsXHJcblx0XHQjIFx0XHRcdFx0Z3JhZGllbnQuc3RvcHNbal0uY29sb3IuZ3JlZW4sXHJcblx0XHQjIFx0XHRcdFx0Z3JhZGllbnQuc3RvcHNbal0uY29sb3IuYmx1ZSxcclxuXHRcdCMgXHRcdFx0XHRncmFkaWVudC5zdG9wc1tqXS5jb2xvci5hbHBoYVxyXG5cdFx0IyBcdFx0XHQpXHJcblx0XHQjIFx0XHRcdHN0b3BzLnB1c2goTVNHcmFkaWVudFN0b3Auc3RvcFdpdGhQb3NpdGlvbl9jb2xvcl8oZ3JhZGllbnQuc3RvcHNbal0ucG9zaXRpb24sIGNvbG9yKSlcclxuXHJcblx0XHQjIFx0XHQjIENyZWF0ZSBncmFkaWVudCBvYmplY3QgYW5kIHNldCBiYXNpYyBwcm9wZXJ0aWVzXHJcblx0XHQjIFx0XHRtc2dyYWRpZW50ID0gTVNHcmFkaWVudC5uZXcoKVxyXG5cdFx0IyBcdFx0bXNncmFkaWVudC5zZXRHcmFkaWVudFR5cGUoZ3JhZGllbnQuZ3JhZGllbnRUeXBlKVxyXG5cdFx0IyBcdFx0IyBtc2dyYWRpZW50LnNob3VsZFNtb290aGVuT3BhY2l0eSA9IGdyYWRpZW50LnNob3VsZFNtb290aGVuT3BhY2l0eVxyXG5cdFx0IyBcdFx0bXNncmFkaWVudC5lbGlwc2VMZW5ndGggPSBncmFkaWVudC5lbGlwc2VMZW5ndGhcclxuXHRcdCMgXHRcdG1zZ3JhZGllbnQuc2V0U3RvcHMoc3RvcHMpXHJcblxyXG5cdFx0IyBcdFx0IyBQYXJzZSBGcm9tIGFuZCBUbyB2YWx1ZXMgaW50byBhcnJheXMgZS5nLjogZnJvbTogXCJ7MC4xLC0wLjQzfVwiID0+IGZyb21WYWx1ZSA9IFswLjEsIC0wLjQzXVxyXG5cdFx0IyBcdFx0ZnJvbVZhbHVlID0gZ3JhZGllbnQuZnJvbS5zbGljZSgxLC0xKS5zcGxpdChcIixcIilcclxuXHRcdCMgXHRcdHRvVmFsdWUgPSBncmFkaWVudC50by5zbGljZSgxLC0xKS5zcGxpdChcIixcIilcclxuXHJcblx0XHQjIFx0XHQjIFNldCBDR1BvaW50IG9iamVjdHMgYXMgRnJvbSBhbmQgVG8gdmFsdWVzXHJcblx0XHQjIFx0XHRtc2dyYWRpZW50LnNldEZyb20oeyB4OiBmcm9tVmFsdWVbMF0sIHk6IGZyb21WYWx1ZVsxXSB9KVxyXG5cdFx0IyBcdFx0bXNncmFkaWVudC5zZXRUbyh7IHg6IHRvVmFsdWVbMF0sIHk6IHRvVmFsdWVbMV0gfSlcclxuXHJcblx0XHQjIFx0XHRncmFkaWVudE5hbWUgPSBncmFkaWVudERlZmluaXRpb25zW2ldLm5hbWUgPyBncmFkaWVudERlZmluaXRpb25zW2ldLm5hbWUgOiBudWxsXHJcblx0XHQjIFx0XHRncmFkaWVudEFzc2V0cy5wdXNoKE1TR3JhZGllbnRBc3NldC5hbGxvYygpLmluaXRXaXRoQXNzZXRfbmFtZShtc2dyYWRpZW50LCBncmFkaWVudE5hbWUpKVxyXG5cclxuXHRwYWxldHRlXHJcbiIsIlxyXG4jIExvYWQgdGFidWxhciBSR0IgdmFsdWVzXHJcblxyXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1BhbGV0dGVcIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoe2RhdGF9KS0+XHJcblx0bGluZXMgPSBkYXRhLnNwbGl0KC9bXFxuXFxyXSsvbSlcclxuXHRwYWxldHRlcyA9IFtcclxuXHRcdGNzdl9wYWxldHRlID0gbmV3IFBhbGV0dGUoKVxyXG5cdFx0c3N2X3BhbGV0dGUgPSBuZXcgUGFsZXR0ZSgpXHJcblx0XVxyXG5cdHRyeV9wYXJzZV9saW5lID0gKGxpbmUsIHBhbGV0dGUsIHJlZ2V4cCktPlxyXG5cdFx0bWF0Y2ggPSBsaW5lLm1hdGNoKHJlZ2V4cClcclxuXHRcdGlmIG1hdGNoXHJcblx0XHRcdHBhbGV0dGUuYWRkXHJcblx0XHRcdFx0cjogbWF0Y2hbMV1cclxuXHRcdFx0XHRnOiBtYXRjaFsyXVxyXG5cdFx0XHRcdGI6IG1hdGNoWzNdXHJcblx0Zm9yIGxpbmUgaW4gbGluZXNcclxuXHRcdHRyeV9wYXJzZV9saW5lIGxpbmUsIGNzdl9wYWxldHRlLCAvKFswLTldKlxcLj9bMC05XSspLFxccyooWzAtOV0qXFwuP1swLTldKyksXFxzKihbMC05XSpcXC4/WzAtOV0rKS9cclxuXHRcdHRyeV9wYXJzZV9saW5lIGxpbmUsIHNzdl9wYWxldHRlLCAvKFswLTldKlxcLj9bMC05XSspXFxzKyhbMC05XSpcXC4/WzAtOV0rKVxccysoWzAtOV0qXFwuP1swLTldKykvXHJcblx0XHJcblx0bW9zdF9jb2xvcnMgPSBbXVxyXG5cdGZvciBwYWxldHRlIGluIHBhbGV0dGVzXHJcblx0XHRpZiBwYWxldHRlLmxlbmd0aCA+PSBtb3N0X2NvbG9ycy5sZW5ndGhcclxuXHRcdFx0bW9zdF9jb2xvcnMgPSBwYWxldHRlXHJcblx0XHJcblx0biA9IG1vc3RfY29sb3JzLmxlbmd0aFxyXG5cdGlmIG4gPCA0XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoW1xyXG5cdFx0XHRcIk5vIGNvbG9ycyBmb3VuZFwiXHJcblx0XHRcdFwiT25seSBvbmUgY29sb3IgZm91bmRcIlxyXG5cdFx0XHRcIk9ubHkgYSBjb3VwbGUgY29sb3JzIGZvdW5kXCJcclxuXHRcdFx0XCJPbmx5IGEgZmV3IGNvbG9ycyBmb3VuZFwiXHJcblx0XHRdW25dICsgXCIgKCN7bn0pXCIpXHJcblx0XHJcblx0aWYgbW9zdF9jb2xvcnMuZXZlcnkoKGNvbG9yKS0+IGNvbG9yLnIgPD0gMSBhbmQgY29sb3IuZyA8PSAxIGFuZCBjb2xvci5iIDw9IDEpXHJcblx0XHRtb3N0X2NvbG9ycy5mb3JFYWNoIChjb2xvciktPlxyXG5cdFx0XHRjb2xvci5yICo9IDI1NVxyXG5cdFx0XHRjb2xvci5nICo9IDI1NVxyXG5cdFx0XHRjb2xvci5iICo9IDI1NVxyXG5cclxuXHRtb3N0X2NvbG9yc1xyXG4iLCIvLyBMb2FkIFdpbmRvd3MgLnRoZW1lIGFuZCAudGhlbWVwYWNrIGZpbGVzLCBhbmQgS0RFIC5jb2xvcnMgY29sb3Igc2NoZW1lc1xyXG5cclxudmFyIFBhbGV0dGUgPSByZXF1aXJlKFwiLi4vUGFsZXR0ZVwiKTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlSU5JU3RyaW5nKGRhdGEpe1xyXG5cdHZhciByZWdleCA9IHtcclxuXHRcdHNlY3Rpb246IC9eXFxzKlxcW1xccyooW15cXF1dKilcXHMqXFxdXFxzKiQvLFxyXG5cdFx0cGFyYW06IC9eXFxzKihbXj1dKz8pXFxzKj1cXHMqKC4qPylcXHMqJC8sXHJcblx0XHRjb21tZW50OiAvXlxccyo7LiokL1xyXG5cdH07XHJcblx0dmFyIHZhbHVlID0ge307XHJcblx0dmFyIGxpbmVzID0gZGF0YS5zcGxpdCgvW1xcclxcbl0rLyk7XHJcblx0dmFyIHNlY3Rpb24gPSBudWxsO1xyXG5cdGxpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZSl7XHJcblx0XHRpZihyZWdleC5jb21tZW50LnRlc3QobGluZSkpe1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9ZWxzZSBpZihyZWdleC5wYXJhbS50ZXN0KGxpbmUpKXtcclxuXHRcdFx0dmFyIG1hdGNoID0gbGluZS5tYXRjaChyZWdleC5wYXJhbSk7XHJcblx0XHRcdGlmKHNlY3Rpb24pe1xyXG5cdFx0XHRcdHZhbHVlW3NlY3Rpb25dW21hdGNoWzFdXSA9IG1hdGNoWzJdO1xyXG5cdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHR2YWx1ZVttYXRjaFsxXV0gPSBtYXRjaFsyXTtcclxuXHRcdFx0fVxyXG5cdFx0fWVsc2UgaWYocmVnZXguc2VjdGlvbi50ZXN0KGxpbmUpKXtcclxuXHRcdFx0dmFyIG1hdGNoID0gbGluZS5tYXRjaChyZWdleC5zZWN0aW9uKTtcclxuXHRcdFx0dmFsdWVbbWF0Y2hbMV1dID0ge307XHJcblx0XHRcdHNlY3Rpb24gPSBtYXRjaFsxXTtcclxuXHRcdH1lbHNlIGlmKGxpbmUubGVuZ3RoID09IDAgJiYgc2VjdGlvbil7XHJcblx0XHRcdHNlY3Rpb24gPSBudWxsO1xyXG5cdFx0fTtcclxuXHR9KTtcclxuXHRyZXR1cm4gdmFsdWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlVGhlbWVGaWxlU3RyaW5nKHRoZW1lSW5pKSB7XHJcblx0Ly8gLnRoZW1lIGlzIGEgcmVuYW1lZCAuaW5pIHRleHQgZmlsZVxyXG5cdC8vIC50aGVtZXBhY2sgaXMgYSByZW5hbWVkIC5jYWIgZmlsZSwgYW5kIHBhcnNpbmcgaXQgYXMgLmluaSBzZWVtcyB0byB3b3JrIHdlbGwgZW5vdWdoIGZvciB0aGUgbW9zdCBwYXJ0LCBhcyB0aGUgLmluaSBkYXRhIGFwcGVhcnMgaW4gcGxhaW4sXHJcblx0Ly8gYnV0IGl0IG1heSBub3QgaWYgY29tcHJlc3Npb24gaXMgZW5hYmxlZCBmb3IgdGhlIC5jYWIgZmlsZVxyXG5cdHZhciB0aGVtZSA9IHBhcnNlSU5JU3RyaW5nKHRoZW1lSW5pKTtcclxuXHR2YXIgY29sb3JzID0gdGhlbWVbXCJDb250cm9sIFBhbmVsXFxcXENvbG9yc1wiXTtcclxuXHRpZiAoIWNvbG9ycykge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0aGVtZSBmaWxlLCBubyBbQ29udHJvbCBQYW5lbFxcXFxDb2xvcnNdIHNlY3Rpb25cIik7XHJcblx0fVxyXG5cdHZhciBwYWxldHRlID0gbmV3IFBhbGV0dGUoKTtcclxuXHRmb3IgKHZhciBrIGluIGNvbG9ycykge1xyXG5cdFx0Ly8gZm9yIC50aGVtZXBhY2sgZmlsZSBzdXBwb3J0LCBqdXN0IGlnbm9yZSBiYWQga2V5cyB0aGF0IHdlcmUgcGFyc2VkXHJcblx0XHRpZiAoIWsubWF0Y2goL1xcVy8pKSB7XHJcblx0XHRcdHZhciBjb21wb25lbnRzID0gY29sb3JzW2tdLnNwbGl0KFwiIFwiKTtcclxuXHRcdFx0aWYgKGNvbXBvbmVudHMubGVuZ3RoID09PSAzKSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0XHRjb21wb25lbnRzW2ldID0gcGFyc2VJbnQoY29tcG9uZW50c1tpXSwgMTApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoY29tcG9uZW50cy5ldmVyeSgoY29tcG9uZW50KT0+IGlzRmluaXRlKGNvbXBvbmVudCkpKSB7XHJcblx0XHRcdFx0XHRwYWxldHRlLmFkZCh7XHJcblx0XHRcdFx0XHRcdHI6IGNvbXBvbmVudHNbMF0sXHJcblx0XHRcdFx0XHRcdGc6IGNvbXBvbmVudHNbMV0sXHJcblx0XHRcdFx0XHRcdGI6IGNvbXBvbmVudHNbMl0sXHJcblx0XHRcdFx0XHRcdG5hbWU6IGssXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiBwYWxldHRlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh7ZGF0YX0pPT4ge1xyXG5cdHJldHVybiBwYXJzZVRoZW1lRmlsZVN0cmluZyhkYXRhKTtcclxufTtcclxuIiwiXHJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi9QYWxldHRlXCJcclxuQ29sb3IgPSByZXF1aXJlIFwiLi9Db2xvclwiXHJcblxyXG5jbGFzcyBSYW5kb21Db2xvciBleHRlbmRzIENvbG9yXHJcblx0Y29uc3RydWN0b3I6IC0+XHJcblx0XHRzdXBlcigpXHJcblx0XHRAcmFuZG9taXplKClcclxuXHRcclxuXHRyYW5kb21pemU6IC0+XHJcblx0XHRAaCA9IE1hdGgucmFuZG9tKCkgKiAzNjBcclxuXHRcdEBzID0gTWF0aC5yYW5kb20oKSAqIDEwMFxyXG5cdFx0QGwgPSBNYXRoLnJhbmRvbSgpICogMTAwXHJcblx0XHJcblx0dG9TdHJpbmc6IC0+XHJcblx0XHRAcmFuZG9taXplKClcclxuXHRcdFwiaHNsKCN7QGh9LCAje0BzfSUsICN7QGx9JSlcIlxyXG5cdFxyXG5cdGlzOiAtPiBub1xyXG5cclxuY2xhc3MgUmFuZG9tUGFsZXR0ZSBleHRlbmRzIFBhbGV0dGVcclxuXHRjb25zdHJ1Y3RvcjogLT5cclxuXHRcdHN1cGVyKClcclxuXHRcdEBsb2FkZXIgPVxyXG5cdFx0XHRuYW1lOiBcIkNvbXBsZXRlbHkgUmFuZG9tIENvbG9yc+KEolwiXHJcblx0XHRcdGZpbGVFeHRlbnNpb25zOiBbXVxyXG5cdFx0XHRmaWxlRXh0ZW5zaW9uc1ByZXR0eTogXCIoLmNyYyBzamYoRGYwOXNqZGZrc2RsZm1ubSAnOyc7XCJcclxuXHRcdEBtYXRjaGVkTG9hZGVyRmlsZUV4dGVuc2lvbnMgPSBub1xyXG5cdFx0QGNvbmZpZGVuY2UgPSAwXHJcblx0XHRAZmluYWxpemUoKVxyXG5cdFx0Zm9yIGkgaW4gWzAuLk1hdGgucmFuZG9tKCkqMTUrNV1cclxuXHRcdFx0QHB1c2ggbmV3IFJhbmRvbUNvbG9yKClcclxuXHJcbmNsYXNzIExvYWRpbmdFcnJvcnMgZXh0ZW5kcyBFcnJvclxyXG5cdGNvbnN0cnVjdG9yOiAoQGVycm9ycyktPlxyXG5cdFx0c3VwZXIoKVxyXG5cdFx0QG1lc3NhZ2UgPSBcIlNvbWUgZXJyb3JzIHdlcmUgZW5jb3VudGVyZWQgd2hlbiBsb2FkaW5nOlwiICtcclxuXHRcdFx0Zm9yIGVycm9yIGluIEBlcnJvcnNcclxuXHRcdFx0XHRcIlxcblxcdFwiICsgZXJyb3IubWVzc2FnZVxyXG5cclxubG9hZF9wYWxldHRlID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0XHJcblx0cGFsZXR0ZV9sb2FkZXJzID0gW1xyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlBhaW50IFNob3AgUHJvIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJwYWxcIiwgXCJwc3BwYWxldHRlXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvUGFpbnRTaG9wUHJvXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJSSUZGIFBBTFwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1JJRkZcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkNvbG9yU2NoZW1lciBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wiY3NcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9Db2xvclNjaGVtZXJcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlBhaW50Lk5FVCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1widHh0XCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvUGFpbnQuTkVUXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJHSU1QIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJncGxcIiwgXCJnaW1wXCIsIFwiY29sb3JzXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvR0lNUFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiS29sb3VyUGFpbnQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImNvbG9yc1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0tvbG91clBhaW50XCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTa2VuY2lsIHBhbGV0dGVcIlxyXG5cdFx0XHRleHRzOiBbXCJzcGxcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9TUExcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIlNrZXRjaCBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wic2tldGNocGFsZXR0ZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL3NrZXRjaHBhbGV0dGVcIlxyXG5cdFx0fVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcInNLMSBwYWxldHRlXCJcclxuXHRcdFx0ZXh0czogW1wic2twXCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvU0tQXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJDU1MgY29sb3JzXCJcclxuXHRcdFx0ZXh0czogW1wiY3NzXCIsIFwic2Nzc1wiLCBcInNhc3NcIiwgXCJsZXNzXCIsIFwic3R5bFwiLCBcImh0bWxcIiwgXCJodG1cIiwgXCJzdmdcIiwgXCJqc1wiLCBcInRzXCIsIFwieG1sXCIsIFwidHh0XCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQ1NTXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJXaW5kb3dzIGRlc2t0b3AgdGhlbWVcIlxyXG5cdFx0XHRleHRzOiBbXCJ0aGVtZVwiLCBcInRoZW1lcGFja1wiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL3RoZW1lXCJcclxuXHRcdH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiS0RFIGRlc2t0b3AgdGhlbWVcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImNvbG9yc1wiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvdGhlbWVcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIFN3YXRjaFwiXHJcblx0XHQjIFx0ZXh0czogW1wiYWNvXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9BZG9iZUNvbG9yU3dhdGNoXCJcclxuXHRcdCMgfVxyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiBcIkFkb2JlIENvbG9yIFRhYmxlXCJcclxuXHRcdFx0ZXh0czogW1wiYWN0XCJdXHJcblx0XHRcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvclRhYmxlXCJcclxuXHRcdH1cclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQWRvYmUgU3dhdGNoIEV4Y2hhbmdlXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhc2VcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0Fkb2JlU3dhdGNoRXhjaGFuZ2VcIlxyXG5cdFx0IyB9XHJcblx0XHQjIHtcclxuXHRcdCMgXHRuYW1lOiBcIkFkb2JlIENvbG9yIEJvb2tcIlxyXG5cdFx0IyBcdGV4dHM6IFtcImFjYlwiXVxyXG5cdFx0IyBcdGxvYWQ6IHJlcXVpcmUgXCIuL2xvYWRlcnMvQWRvYmVDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiSG9tZXNpdGUgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcImhwbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0hvbWVzaXRlXCJcclxuXHRcdH1cclxuXHRcdHtcclxuXHRcdFx0bmFtZTogXCJTdGFyQ3JhZnQgcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcInBhbFwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFwiXHJcblx0XHR9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiU3RhckNyYWZ0IHRlcnJhaW4gcGFsZXR0ZVwiXHJcblx0XHRcdGV4dHM6IFtcIndwZVwiXVxyXG5cdFx0XHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL1N0YXJDcmFmdFBhZGRlZFwiXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdG5hbWU6IFwiQXV0b0NBRCBDb2xvciBCb29rXCJcclxuXHRcdCMgXHRleHRzOiBbXCJhY2JcIl1cclxuXHRcdCMgXHRsb2FkOiByZXF1aXJlIFwiLi9sb2FkZXJzL0F1dG9DQURDb2xvckJvb2tcIlxyXG5cdFx0IyB9XHJcblx0XHRcclxuXHRcdCMge1xyXG5cdFx0IyBcdCMgKHNhbWUgYXMgUGFpbnQgU2hvcCBQcm8gcGFsZXR0ZT8pXHJcblx0XHQjIFx0bmFtZTogXCJDb3JlbERSQVcgcGFsZXR0ZVwiXHJcblx0XHQjIFx0ZXh0czogW1wicGFsXCIsIFwiY3BsXCJdXHJcblx0XHQjIFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy9Db3JlbERSQVdcIlxyXG5cdFx0IyB9XHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwidGFidWxhciBjb2xvcnNcIlxyXG5cdFx0XHRleHRzOiBbXCJjc3ZcIiwgXCJ0c3ZcIiwgXCJ0eHRcIl1cclxuXHRcdFx0bG9hZDogcmVxdWlyZSBcIi4vbG9hZGVycy90YWJ1bGFyXCJcclxuXHRcdH1cclxuXHRdXHJcblx0XHJcblx0IyBmaW5kIHBhbGV0dGUgbG9hZGVycyB0aGF0IHVzZSB0aGlzIGZpbGUgZXh0ZW5zaW9uXHJcblx0Zm9yIHBsIGluIHBhbGV0dGVfbG9hZGVyc1xyXG5cdFx0cGwubWF0Y2hlc19leHQgPSBwbC5leHRzLmluZGV4T2Yoby5maWxlRXh0KSBpc250IC0xXHJcblx0XHJcblx0IyBtb3ZlIHBhbGV0dGUgbG9hZGVycyB0byB0aGUgYmVnaW5uaW5nIHRoYXQgdXNlIHRoaXMgZmlsZSBleHRlbnNpb25cclxuXHRwYWxldHRlX2xvYWRlcnMuc29ydCAocGwxLCBwbDIpLT5cclxuXHRcdHBsMi5tYXRjaGVzX2V4dCAtIHBsMS5tYXRjaGVzX2V4dFxyXG5cdFxyXG5cdCMgdHJ5IGxvYWRpbmcgc3R1ZmZcclxuXHRlcnJvcnMgPSBbXVxyXG5cdGZvciBwbCBpbiBwYWxldHRlX2xvYWRlcnNcclxuXHRcdFxyXG5cdFx0dHJ5XHJcblx0XHRcdHBhbGV0dGUgPSBwbC5sb2FkKG8pXHJcblx0XHRcdGlmIHBhbGV0dGUubGVuZ3RoIGlzIDBcclxuXHRcdFx0XHRwYWxldHRlID0gbnVsbFxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIm5vIGNvbG9ycyByZXR1cm5lZFwiXHJcblx0XHRjYXRjaCBlXHJcblx0XHRcdG1zZyA9IFwiZmFpbGVkIHRvIGxvYWQgI3tvLmZpbGVOYW1lfSBhcyAje3BsLm5hbWV9OiAje2UubWVzc2FnZX1cIlxyXG5cdFx0XHQjIGlmIHBsLm1hdGNoZXNfZXh0IGFuZCBub3QgZS5tZXNzYWdlLm1hdGNoKC9ub3QgYS9pKVxyXG5cdFx0XHQjIFx0Y29uc29sZT8uZXJyb3I/IG1zZ1xyXG5cdFx0XHQjIGVsc2VcclxuXHRcdFx0IyBcdGNvbnNvbGU/Lndhcm4/IG1zZ1xyXG5cdFx0XHRcclxuXHRcdFx0IyBUT0RPOiBtYXliZSB0aGlzIHNob3VsZG4ndCBiZSBhbiBFcnJvciBvYmplY3QsIGp1c3QgYSB7bWVzc2FnZSwgZXJyb3J9IG9iamVjdFxyXG5cdFx0XHQjIG9yIHtmcmllbmRseU1lc3NhZ2UsIGVycm9yfVxyXG5cdFx0XHRlcnIgPSBuZXcgRXJyb3IgbXNnXHJcblx0XHRcdGVyci5lcnJvciA9IGVcclxuXHRcdFx0ZXJyb3JzLnB1c2ggZXJyXHJcblx0XHRcclxuXHRcdGlmIHBhbGV0dGVcclxuXHRcdFx0IyBjb25zb2xlPy5pbmZvPyBcImxvYWRlZCAje28uZmlsZU5hbWV9IGFzICN7cGwubmFtZX1cIlxyXG5cdFx0XHRwYWxldHRlLmNvbmZpZGVuY2UgPSBpZiBwbC5tYXRjaGVzX2V4dCB0aGVuIDAuOSBlbHNlIDAuMDFcclxuXHRcdFx0ZXh0c19wcmV0dHkgPSBcIi4je3BsLmV4dHMuam9pbihcIiwgLlwiKX1cIlxyXG5cdFx0XHRcclxuXHRcdFx0IyBUT0RPOiBwcm9iYWJseSByZW5hbWUgbG9hZGVyIC0+IGZvcm1hdCB3aGVuIDItd2F5IGRhdGEgZmxvdyAocmVhZC93cml0ZSkgaXMgc3VwcG9ydGVkXHJcblx0XHRcdCMgVE9ETzogbWF5YmUgbWFrZSB0aGlzIGEgM3JkIChhbmQgZm91cnRoPykgYXJndW1lbnQgdG8gdGhlIGNhbGxiYWNrXHJcblx0XHRcdHBhbGV0dGUubG9hZGVyID1cclxuXHRcdFx0XHRuYW1lOiBwbC5uYW1lXHJcblx0XHRcdFx0ZmlsZUV4dGVuc2lvbnM6IHBsLmV4dHNcclxuXHRcdFx0XHRmaWxlRXh0ZW5zaW9uc1ByZXR0eTogZXh0c19wcmV0dHlcclxuXHRcdFx0cGFsZXR0ZS5tYXRjaGVkTG9hZGVyRmlsZUV4dGVuc2lvbnMgPSBwbC5tYXRjaGVzX2V4dFxyXG5cdFx0XHRcclxuXHRcdFx0cGFsZXR0ZS5maW5hbGl6ZSgpXHJcblx0XHRcdGNhbGxiYWNrKG51bGwsIHBhbGV0dGUpXHJcblx0XHRcdHJldHVyblxyXG5cdFxyXG5cdGNhbGxiYWNrKG5ldyBMb2FkaW5nRXJyb3JzKGVycm9ycykpXHJcblx0cmV0dXJuXHJcblxyXG5ub3JtYWxpemVfb3B0aW9ucyA9IChvID0ge30pLT5cclxuXHRpZiB0eXBlb2YgbyBpcyBcInN0cmluZ1wiIG9yIG8gaW5zdGFuY2VvZiBTdHJpbmdcclxuXHRcdG8gPSBmaWxlUGF0aDogb1xyXG5cdGlmIEZpbGU/IGFuZCBvIGluc3RhbmNlb2YgRmlsZVxyXG5cdFx0byA9IGZpbGU6IG9cclxuXHRcclxuXHQjIG8ubWluQ29sb3JzID89IDJcclxuXHQjIG8ubWF4Q29sb3JzID89IDI1NlxyXG5cdG8uZmlsZU5hbWUgPz0gby5maWxlPy5uYW1lID8gKGlmIG8uZmlsZVBhdGggdGhlbiByZXF1aXJlKFwicGF0aFwiKS5iYXNlbmFtZShvLmZpbGVQYXRoKSlcclxuXHRvLmZpbGVFeHQgPz0gXCIje28uZmlsZU5hbWV9XCIuc3BsaXQoXCIuXCIpLnBvcCgpXHJcblx0by5maWxlRXh0ID0gXCIje28uZmlsZUV4dH1cIi50b0xvd2VyQ2FzZSgpXHJcblx0b1xyXG5cclxuQW55UGFsZXR0ZSA9IHtcclxuXHRDb2xvclxyXG5cdFBhbGV0dGVcclxuXHRSYW5kb21Db2xvclxyXG5cdFJhbmRvbVBhbGV0dGVcclxuXHQjIExvYWRpbmdFcnJvcnNcclxufVxyXG5cclxuIyBHZXQgcGFsZXR0ZSBmcm9tIGEgZmlsZVxyXG5BbnlQYWxldHRlLmxvYWRQYWxldHRlID0gKG8sIGNhbGxiYWNrKS0+XHJcblx0aWYgbm90IG9cclxuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IgXCJwYXJhbWV0ZXJzIHJlcXVpcmVkOiBBbnlQYWxldHRlLmxvYWRQYWxldHRlKG9wdGlvbnMsIGZ1bmN0aW9uIGNhbGxiYWNrKGVycm9yLCBwYWxldHRlKXt9KVwiXHJcblx0aWYgbm90IGNhbGxiYWNrXHJcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yIFwiY2FsbGJhY2sgcmVxdWlyZWQ6IEFueVBhbGV0dGUubG9hZFBhbGV0dGUob3B0aW9ucywgZnVuY3Rpb24gY2FsbGJhY2soZXJyb3IsIHBhbGV0dGUpe30pXCJcclxuXHRcclxuXHRvID0gbm9ybWFsaXplX29wdGlvbnMgb1xyXG5cdFxyXG5cdGlmIG8uZGF0YVxyXG5cdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdGVsc2UgaWYgby5maWxlXHJcblx0XHRpZiBub3QgKG8uZmlsZSBpbnN0YW5jZW9mIEZpbGUpXHJcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IgXCJvcHRpb25zLmZpbGUgd2FzIHBhc3NlZCBidXQgaXQgaXMgbm90IGEgRmlsZVwiXHJcblx0XHRmciA9IG5ldyBGaWxlUmVhZGVyXHJcblx0XHRmci5vbmVycm9yID0gLT5cclxuXHRcdFx0Y2FsbGJhY2soZnIuZXJyb3IpXHJcblx0XHRmci5vbmxvYWQgPSAtPlxyXG5cdFx0XHRvLmRhdGEgPSBmci5yZXN1bHRcclxuXHRcdFx0bG9hZF9wYWxldHRlKG8sIGNhbGxiYWNrKVxyXG5cdFx0ZnIucmVhZEFzQmluYXJ5U3RyaW5nIG8uZmlsZVxyXG5cdGVsc2UgaWYgby5maWxlUGF0aD9cclxuXHRcdGZzID0gcmVxdWlyZSBcImZzXCJcclxuXHRcdGZzLnJlYWRGaWxlIG8uZmlsZVBhdGgsIChlcnJvciwgZGF0YSktPlxyXG5cdFx0XHRpZiBlcnJvclxyXG5cdFx0XHRcdGNhbGxiYWNrKGVycm9yKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0by5kYXRhID0gZGF0YS50b1N0cmluZyhcImJpbmFyeVwiKVxyXG5cdFx0XHRcdGxvYWRfcGFsZXR0ZShvLCBjYWxsYmFjaylcclxuXHRlbHNlXHJcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yIFwiZWl0aGVyIG9wdGlvbnMuZGF0YSBvciBvcHRpb25zLmZpbGUgb3Igb3B0aW9ucy5maWxlUGF0aCBtdXN0IGJlIHBhc3NlZFwiXHJcblxyXG5cclxuIyBHZXQgYSBwYWxldHRlIGZyb20gYSBmaWxlIG9yIGJ5IGFueSBtZWFucyBuZWNlc3NhcnlcclxuIyAoYXMgaW4gZmFsbCBiYWNrIHRvIGNvbXBsZXRlbHkgcmFuZG9tIGRhdGEpXHJcbkFueVBhbGV0dGUuZ2ltbWVBUGFsZXR0ZSA9IChvLCBjYWxsYmFjayktPlxyXG5cdG8gPSBub3JtYWxpemVfb3B0aW9ucyBvXHJcblx0XHJcblx0QW55UGFsZXR0ZS5sb2FkUGFsZXR0ZSBvLCAoZXJyLCBwYWxldHRlKS0+XHJcblx0XHRjYWxsYmFjayhudWxsLCBwYWxldHRlID8gbmV3IFJhbmRvbVBhbGV0dGUpXHJcblxyXG4jIEV4cG9ydHNcclxubW9kdWxlLmV4cG9ydHMgPSBBbnlQYWxldHRlXHJcbiJdfQ==
