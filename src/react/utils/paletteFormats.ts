/**
 * Palette utilities for importing and exporting color palettes.
 *
 * Supported formats:
 * - RIFF PAL (.pal) - Windows palette format
 * - JASC PAL (.pal) - Paint Shop Pro palette format
 * - GIMP GPL (.gpl) - GIMP palette format
 * - Adobe ACO (.aco) - Photoshop color swatches
 * - Hex text (.txt) - Simple hex color list
 */

export interface PaletteFormat {
  formatID: string;
  name: string;
  extensions: string[];
}

/**
 * Available palette formats
 */
export const PALETTE_FORMATS: PaletteFormat[] = [
  {
    formatID: "riff",
    name: "Windows Palette",
    extensions: ["pal"],
  },
  {
    formatID: "jasc",
    name: "JASC Palette",
    extensions: ["pal"],
  },
  {
    formatID: "gpl",
    name: "GIMP Palette",
    extensions: ["gpl"],
  },
  {
    formatID: "hex",
    name: "Hex Color List",
    extensions: ["txt", "hex"],
  },
];

/**
 * Parse a color string to RGB values.
 * Supports hex colors (#RGB, #RRGGBB) and rgb() format.
 *
 * @param color - CSS color string to parse
 * @returns Object with {r, g, b} values (0-255), or null if parsing fails
 *
 * @example
 * parseColor("#ff0000"); // Returns {r: 255, g: 0, b: 0}
 * parseColor("#f00"); // Returns {r: 255, g: 0, b: 0}
 * parseColor("rgb(255, 0, 0)"); // Returns {r: 255, g: 0, b: 0}
 */
export function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle hex colors
  const hexMatch = color.match(/^#?([0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }

  // Handle short hex colors
  const shortHexMatch = color.match(/^#?([0-9a-f]{3})$/i);
  if (shortHexMatch) {
    const hex = shortHexMatch[1];
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }

  // Handle rgb() colors
  const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  return null;
}

/**
 * Convert RGB to hex color string.
 * Values are clamped and rounded to 0-255 range.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string with # prefix (e.g., "#ff0000")
 *
 * @example
 * rgbToHex(255, 0, 0); // Returns "#ff0000"
 * rgbToHex(128, 128, 128); // Returns "#808080"
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => {
        const hex = Math.round(c).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * Export palette to GIMP GPL format.
 * Creates text file with GIMP Palette header and color list.
 * Each color is on its own line with RGB values and name.
 *
 * @param colors - Array of color strings (hex or rgb format)
 * @param name - Palette name for header (default: "Untitled")
 * @returns GPL format string with newline separators
 *
 * @example
 * const gpl = exportToGPL(["#ff0000", "#00ff00", "#0000ff"], "Primary Colors");
 * // Returns multiline string with GIMP Palette header
 */
export function exportToGPL(colors: string[], name: string = "Untitled"): string {
  const lines: string[] = ["GIMP Palette", `Name: ${name}`, "Columns: 16", "#"];

  for (const color of colors) {
    const rgb = parseColor(color);
    if (rgb) {
      lines.push(
        `${rgb.r.toString().padStart(3)} ${rgb.g.toString().padStart(3)} ${rgb.b.toString().padStart(3)}\tUntitled`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Import palette from GIMP GPL format.
 * Parses GPL text format and extracts RGB color values.
 * Skips header lines and comments.
 *
 * @param content - GPL file content as string
 * @returns Array of hex color strings
 *
 * @example
 * const colors = importFromGPL(gplContent);
 * // Returns ["#ff0000", "#00ff00", "#0000ff", ...]
 */
export function importFromGPL(content: string): string[] {
  const colors: string[] = [];
  const lines = content.split("\n");

  // Skip header lines
  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line.startsWith("#") ||
      line === "" ||
      line.startsWith("GIMP") ||
      line.startsWith("Name:") ||
      line.startsWith("Columns:")
    ) {
      startIndex = i + 1;
    } else {
      break;
    }
  }

  // Parse color lines
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    // Match RGB values at the start of line
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      colors.push(rgbToHex(r, g, b));
    }
  }

  return colors;
}

/**
 * Export palette to JASC PAL format (Paint Shop Pro).
 * Creates text file with JASC-PAL header, version, count, and RGB values.
 * Uses Windows line endings (CRLF).
 *
 * @param colors - Array of color strings (hex or rgb format)
 * @returns JASC PAL format string with CRLF line endings
 *
 * @example
 * const jasc = exportToJASC(["#ff0000", "#00ff00"]);
 * // Returns "JASC-PAL\r\n0100\r\n2\r\n255 0 0\r\n0 255 0\r\n"
 */
export function exportToJASC(colors: string[]): string {
  const lines: string[] = ["JASC-PAL", "0100", colors.length.toString()];

  for (const color of colors) {
    const rgb = parseColor(color);
    if (rgb) {
      lines.push(`${rgb.r} ${rgb.g} ${rgb.b}`);
    }
  }

  return lines.join("\r\n");
}

/**
 * Import palette from JASC PAL format.
 * Verifies JASC-PAL header and parses RGB color values.
 *
 * @param content - JASC PAL file content as string
 * @returns Array of hex color strings
 * @throws Error if header is invalid or color count is missing
 *
 * @example
 * const colors = importFromJASC(jascContent);
 * // Returns ["#ff0000", "#00ff00", ...]
 */
export function importFromJASC(content: string): string[] {
  const colors: string[] = [];
  const lines = content.split(/\r?\n/);

  // Verify JASC header
  if (lines.length < 3 || !lines[0].startsWith("JASC-PAL")) {
    throw new Error("Invalid JASC palette file");
  }

  // Get color count
  const colorCount = parseInt(lines[2], 10);
  if (isNaN(colorCount)) {
    throw new Error("Invalid color count in JASC palette");
  }

  // Parse colors
  for (let i = 3; i < Math.min(lines.length, 3 + colorCount); i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length >= 3) {
      const r = parseInt(parts[0], 10);
      const g = parseInt(parts[1], 10);
      const b = parseInt(parts[2], 10);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        colors.push(rgbToHex(r, g, b));
      }
    }
  }

  return colors;
}

/**
 * Export palette to hex text format (one color per line).
 * Simple text format with hex colors, one per line.
 *
 * @param colors - Array of color strings (hex or rgb format)
 * @returns Text string with hex colors separated by newlines
 *
 * @example
 * const hex = exportToHex(["#ff0000", "#00ff00"]);
 * // Returns "#ff0000\n#00ff00"
 */
export function exportToHex(colors: string[]): string {
  return colors
    .map((color) => {
      const rgb = parseColor(color);
      if (rgb) {
        return rgbToHex(rgb.r, rgb.g, rgb.b);
      }
      return color;
    })
    .join("\n");
}

/**
 * Import palette from hex text format.
 * Parses hex colors from text, one per line.
 * Supports both 3-digit and 6-digit hex colors.
 * Skips comments starting with // or #!
 *
 * @param content - Text content with hex colors
 * @returns Array of hex color strings
 *
 * @example
 * const colors = importFromHex("#ff0000\n#00ff00\n#0000ff");
 * // Returns ["#ff0000", "#00ff00", "#0000ff"]
 */
export function importFromHex(content: string): string[] {
  const colors: string[] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#!")) continue;

    // Try to parse as hex color
    const hexMatch = trimmed.match(/#?([0-9a-f]{6}|[0-9a-f]{3})/i);
    if (hexMatch) {
      const rgb = parseColor(hexMatch[0]);
      if (rgb) {
        colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
      }
    }
  }

  return colors;
}

/**
 * Export palette to RIFF PAL format (Windows palette).
 * Creates binary RIFF file with PAL chunk containing RGB color data.
 * Format: RIFF header + PAL type + data chunk with colors.
 *
 * @param colors - Array of color strings (hex or rgb format)
 * @returns Blob containing binary RIFF PAL file
 *
 * @example
 * const blob = exportToRIFF(["#ff0000", "#00ff00"]);
 * // Returns Blob with binary RIFF PAL data
 */
export function exportToRIFF(colors: string[]): Blob {
  // RIFF PAL format:
  // "RIFF" + size + "PAL " + "data" + size + (version + count) + colors

  const colorCount = colors.length;
  const dataSize = 4 + colorCount * 4; // version (2) + count (2) + colors (4 each)
  const riffSize = 4 + 8 + dataSize; // "PAL " + "data" header + data

  const buffer = new ArrayBuffer(8 + riffSize);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  let offset = 0;

  // "RIFF" signature
  uint8.set([0x52, 0x49, 0x46, 0x46], offset);
  offset += 4;

  // RIFF size (little-endian)
  view.setUint32(offset, riffSize, true);
  offset += 4;

  // "PAL " type
  uint8.set([0x50, 0x41, 0x4c, 0x20], offset);
  offset += 4;

  // "data" chunk
  uint8.set([0x64, 0x61, 0x74, 0x61], offset);
  offset += 4;

  // Data chunk size (little-endian)
  view.setUint32(offset, dataSize, true);
  offset += 4;

  // Version (2 bytes, 0x0300 for Windows 3.0)
  view.setUint16(offset, 0x0300, true);
  offset += 2;

  // Color count (2 bytes)
  view.setUint16(offset, colorCount, true);
  offset += 2;

  // Colors (4 bytes each: R, G, B, flags)
  for (const color of colors) {
    const rgb = parseColor(color);
    if (rgb) {
      uint8[offset++] = rgb.r;
      uint8[offset++] = rgb.g;
      uint8[offset++] = rgb.b;
      uint8[offset++] = 0; // flags (always 0)
    } else {
      // Default to black
      uint8[offset++] = 0;
      uint8[offset++] = 0;
      uint8[offset++] = 0;
      uint8[offset++] = 0;
    }
  }

  return new Blob([buffer], { type: "application/x-palette" });
}

/**
 * Import palette from RIFF PAL format.
 * Parses binary RIFF PAL file and extracts RGB color values.
 * Verifies RIFF and PAL signatures before parsing.
 *
 * @param blob - Blob containing RIFF PAL file data
 * @returns Promise resolving to array of hex color strings
 * @throws Error if file is not valid RIFF PAL or data chunk missing
 *
 * @example
 * const colors = await importFromRIFF(palBlob);
 * // Returns ["#ff0000", "#00ff00", ...]
 */
export async function importFromRIFF(blob: Blob): Promise<string[]> {
  const buffer = await blob.arrayBuffer();
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // Verify RIFF signature
  if (String.fromCharCode(uint8[0], uint8[1], uint8[2], uint8[3]) !== "RIFF") {
    throw new Error("Not a valid RIFF file");
  }

  // Verify PAL type
  if (String.fromCharCode(uint8[8], uint8[9], uint8[10], uint8[11]) !== "PAL ") {
    throw new Error("Not a valid PAL file");
  }

  // Find data chunk
  let offset = 12;
  while (offset < buffer.byteLength - 8) {
    const chunkType = String.fromCharCode(uint8[offset], uint8[offset + 1], uint8[offset + 2], uint8[offset + 3]);
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkType === "data") {
      // Parse palette data
      const colorCount = view.getUint16(offset + 10, true);

      const colors: string[] = [];
      let colorOffset = offset + 12;

      for (let i = 0; i < colorCount && colorOffset + 4 <= buffer.byteLength; i++) {
        const r = uint8[colorOffset++];
        const g = uint8[colorOffset++];
        const b = uint8[colorOffset++];
        colorOffset++; // Skip flags byte
        colors.push(rgbToHex(r, g, b));
      }

      return colors;
    }

    offset += 8 + chunkSize;
    // Pad to word boundary
    if (chunkSize % 2 !== 0) offset++;
  }

  throw new Error("No palette data found in RIFF file");
}

/**
 * Detect palette format from file content.
 * Analyzes text content to identify format type.
 * Checks for GIMP, JASC headers, or hex color patterns.
 *
 * @param content - Text content to analyze
 * @returns Format ID string ("gpl", "jasc", "hex") or null if unknown
 *
 * @example
 * detectPaletteFormat("GIMP Palette\n..."); // Returns "gpl"
 * detectPaletteFormat("JASC-PAL\n..."); // Returns "jasc"
 * detectPaletteFormat("#ff0000\n#00ff00"); // Returns "hex"
 */
export function detectPaletteFormat(content: string): string | null {
  const lines = content.trim().split(/\r?\n/);

  if (lines[0].startsWith("GIMP Palette")) {
    return "gpl";
  }

  if (lines[0].startsWith("JASC-PAL")) {
    return "jasc";
  }

  // Check if it looks like a hex color list
  const hexColorRegex = /^#?[0-9a-f]{6}$/i;
  if (lines.every((line) => !line.trim() || hexColorRegex.test(line.trim()) || line.trim().startsWith("//"))) {
    return "hex";
  }

  return null;
}

/**
 * Import palette from string content (auto-detect format).
 * Automatically detects format and uses appropriate parser.
 * Tries GPL, JASC, then hex parsing in sequence.
 *
 * @param content - Palette file content as string
 * @returns Array of hex color strings
 *
 * @example
 * const colors = importPalette(fileContent);
 * // Automatically detects and parses format
 */
export function importPalette(content: string): string[] {
  const format = detectPaletteFormat(content);

  switch (format) {
    case "gpl":
      return importFromGPL(content);
    case "jasc":
      return importFromJASC(content);
    case "hex":
      return importFromHex(content);
    default:
      // Try each format
      try {
        return importFromGPL(content);
      } catch {
        // Continue
      }
      try {
        return importFromJASC(content);
      } catch {
        // Continue
      }
      return importFromHex(content);
  }
}

/**
 * Export palette to specified format.
 * Converts color array to requested palette format.
 *
 * @param colors - Array of color strings (hex or rgb format)
 * @param formatId - Format identifier ("gpl", "jasc", "hex", "riff")
 * @param name - Optional palette name (used for GPL format)
 * @returns String or Blob depending on format (RIFF returns Blob, others return string)
 * @throws Error if format ID is unknown
 *
 * @example
 * const gpl = exportPalette(colors, "gpl", "My Palette");
 * const riffBlob = exportPalette(colors, "riff");
 */
export function exportPalette(colors: string[], formatId: string, name?: string): string | Blob {
  switch (formatId) {
    case "gpl":
      return exportToGPL(colors, name);
    case "jasc":
      return exportToJASC(colors);
    case "hex":
      return exportToHex(colors);
    case "riff":
      return exportToRIFF(colors);
    default:
      throw new Error(`Unknown palette format: ${formatId}`);
  }
}

/**
 * Download palette as file.
 * Exports palette in specified format and triggers browser download.
 * Format is auto-detected from file extension if not specified.
 *
 * @param colors - Array of color strings (hex or rgb format)
 * @param filename - Desired filename for download
 * @param formatId - Optional format override (otherwise determined from extension)
 * @returns Promise that resolves when download is initiated
 *
 * @example
 * await downloadPalette(colors, "mypalette.gpl");
 * await downloadPalette(colors, "colors.pal", "jasc");
 */
export async function downloadPalette(colors: string[], filename: string, formatId?: string): Promise<void> {
  // Determine format from filename or default to hex
  const ext = filename.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
  let format = formatId || "hex";

  if (!formatId && ext) {
    if (ext === "gpl") format = "gpl";
    else if (ext === "pal") format = "jasc";
    else if (ext === "txt" || ext === "hex") format = "hex";
  }

  const result = exportPalette(colors, format, filename.replace(/\.[^.]+$/, ""));

  let blob: Blob;
  if (result instanceof Blob) {
    blob = result;
  } else {
    blob = new Blob([result], { type: "text/plain" });
  }

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Load palette from file.
 * Auto-detects format (binary RIFF or text-based) and parses accordingly.
 * Checks file extension and header bytes to determine format.
 *
 * @param file - File object from input or drag-and-drop
 * @returns Promise resolving to array of hex color strings
 * @throws Error if file cannot be parsed
 *
 * @example
 * const colors = await loadPaletteFile(file);
 * // Returns ["#ff0000", "#00ff00", ...]
 */
export async function loadPaletteFile(file: File): Promise<string[]> {
  // Check for binary RIFF format
  const ext = file.name.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
  if (ext === "pal") {
    // Could be either RIFF or JASC - check first bytes
    const headerBuffer = await file.slice(0, 4).arrayBuffer();
    const header = new Uint8Array(headerBuffer);
    const headerStr = String.fromCharCode(header[0], header[1], header[2], header[3]);

    if (headerStr === "RIFF") {
      return importFromRIFF(file);
    }
  }

  // Text-based format
  const text = await file.text();
  return importPalette(text);
}
