/**
 * Color utility functions
 */

/**
 * Parse a CSS color string and return RGBA values.
 * Uses canvas to normalize any valid CSS color to RGBA.
 * This handles named colors, hex, rgb(), rgba(), hsl(), etc.
 *
 * @param color - Any valid CSS color string
 * @returns Tuple of [red, green, blue, alpha] where RGB are 0-255 and alpha is 0-255
 *
 * @example
 * getRgbaFromColor("red"); // Returns [255, 0, 0, 255]
 * getRgbaFromColor("#ff0000"); // Returns [255, 0, 0, 255]
 * getRgbaFromColor("rgba(255, 0, 0, 0.5)"); // Returns [255, 0, 0, 128]
 */
export function getRgbaFromColor(color: string): [number, number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [0, 0, 0, 255];

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a];
}

/**
 * Convert RGB to HSL color space.
 * Useful for color picker sliders and color manipulation.
 * All values are normalized to 0-1 range.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Tuple of [hue, saturation, lightness] where all values are 0-1
 *
 * @example
 * rgbToHsl(255, 0, 0); // Returns [0, 1, 0.5] (pure red)
 * rgbToHsl(128, 128, 128); // Returns [0, 0, 0.502] (gray)
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h, s, l];
}

/**
 * Convert HSL to RGB color space.
 * Inverse of rgbToHsl, used for color picker updates.
 * All input values should be in 0-1 range.
 *
 * @param h - Hue (0-1, where 0=red, 0.33=green, 0.67=blue, 1=red)
 * @param s - Saturation (0-1, where 0=gray, 1=full color)
 * @param l - Lightness (0-1, where 0=black, 0.5=full color, 1=white)
 * @returns Tuple of [red, green, blue] where all values are 0-255
 *
 * @example
 * hslToRgb(0, 1, 0.5); // Returns [255, 0, 0] (pure red)
 * hslToRgb(0.33, 1, 0.5); // Returns [0, 255, 0] (pure green)
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
