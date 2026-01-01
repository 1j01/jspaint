/**
 * Settings Store - User preferences and configuration
 * Persisted to IndexedDB for cross-session consistency
 */

import { create } from "zustand";
import { saveSetting, loadSetting } from "./persistence";
import { DEFAULT_PALETTE } from "../../data/palette";

/**
 * Settings state interface
 * Stores all user preferences that should persist across sessions
 */
export interface SettingsState {
	/**
	 * Primary (left-click) drawing color
	 */
	primaryColor: string;

	/**
	 * Secondary (right-click) drawing color
	 */
	secondaryColor: string;

	/**
	 * Color palette (array of hex color strings)
	 */
	palette: string[];

	/**
	 * Brush tool size in pixels
	 */
	brushSize: number;

	/**
	 * Brush shape style
	 */
	brushShape: "circle" | "square" | "reverse_diagonal" | "diagonal";

	/**
	 * Pencil tool size in pixels
	 */
	pencilSize: number;

	/**
	 * Eraser tool size in pixels
	 */
	eraserSize: number;

	/**
	 * Airbrush tool size in pixels
	 */
	airbrushSize: number;

	/**
	 * Shape fill style (outline, fill, or both)
	 */
	fillStyle: "outline" | "fill" | "both";

	/**
	 * Line width for shape tools
	 */
	lineWidth: number;

	/**
	 * Font family for text tool
	 */
	fontFamily: string;

	/**
	 * Font size for text tool in pixels
	 */
	fontSize: number;

	/**
	 * Whether text should be bold
	 */
	fontBold: boolean;

	/**
	 * Whether text should be italic
	 */
	fontItalic: boolean;

	/**
	 * Whether text should be underlined
	 */
	fontUnderline: boolean;

	/**
	 * Whether text background should be transparent
	 */
	textTransparent: boolean;

	/**
	 * Default canvas width in pixels
	 */
	defaultCanvasWidth: number;

	/**
	 * Default canvas height in pixels
	 */
	defaultCanvasHeight: number;

	/**
	 * Whether to draw in opaque mode (vs transparent)
	 */
	drawOpaque: boolean;

	/**
	 * Set the primary drawing color
	 * @param {string} color - Hex color string
	 */
	setPrimaryColor: (color: string) => void;

	/**
	 * Set the secondary drawing color
	 * @param {string} color - Hex color string
	 */
	setSecondaryColor: (color: string) => void;

	/**
	 * Swap primary and secondary colors
	 */
	swapColors: () => void;

	/**
	 * Set brush size
	 * @param {number} size - Brush size in pixels
	 */
	setBrushSize: (size: number) => void;

	/**
	 * Set brush shape
	 * @param {("circle" | "square" | "reverse_diagonal" | "diagonal")} shape - Brush shape style
	 */
	setBrushShape: (shape: "circle" | "square" | "reverse_diagonal" | "diagonal") => void;

	/**
	 * Set eraser size
	 * @param {number} size - Eraser size in pixels
	 */
	setEraserSize: (size: number) => void;

	/**
	 * Set airbrush size
	 * @param {number} size - Airbrush size in pixels
	 */
	setAirbrushSize: (size: number) => void;

	/**
	 * Set shape fill style
	 * @param {("outline" | "fill" | "both")} style - Fill style
	 */
	setFillStyle: (style: "outline" | "fill" | "both") => void;

	/**
	 * Set line width for shape tools
	 * @param {number} width - Line width in pixels
	 */
	setLineWidth: (width: number) => void;

	/**
	 * Set font family
	 * @param {string} family - Font family name
	 */
	setFontFamily: (family: string) => void;

	/**
	 * Set font size
	 * @param {number} size - Font size in pixels
	 */
	setFontSize: (size: number) => void;

	/**
	 * Set font style (bold, italic, underline)
	 * @param {boolean} bold - Whether text should be bold
	 * @param {boolean} italic - Whether text should be italic
	 * @param {boolean} underline - Whether text should be underlined
	 */
	setFontStyle: (bold: boolean, italic: boolean, underline: boolean) => void;

	/**
	 * Set text transparency mode
	 * @param {boolean} transparent - Whether text background should be transparent
	 */
	setTextTransparent: (transparent: boolean) => void;

	/**
	 * Toggle draw opaque mode
	 */
	toggleDrawOpaque: () => void;

	/**
	 * Load all persisted settings from IndexedDB
	 * @returns {Promise<void>}
	 */
	loadPersistedSettings: () => Promise<void>;
}

/**
 * Zustand store for user settings
 * All settings are automatically persisted to IndexedDB on change
 * @returns {SettingsState} The settings store
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
	// Initial values
	primaryColor: DEFAULT_PALETTE[0],
	secondaryColor: DEFAULT_PALETTE[14],
	palette: DEFAULT_PALETTE,
	brushSize: 4,
	brushShape: "circle",
	pencilSize: 1,
	eraserSize: 8,
	airbrushSize: 9,
	fillStyle: "outline",
	lineWidth: 1,
	fontFamily: "Arial",
	fontSize: 12,
	fontBold: false,
	fontItalic: false,
	fontUnderline: false,
	textTransparent: false,
	defaultCanvasWidth: 480,
	defaultCanvasHeight: 320,
	drawOpaque: true,

	// Actions with persistence
	setPrimaryColor: (color) => {
		set({ primaryColor: color });
		saveSetting("primaryColor", color);
	},

	setSecondaryColor: (color) => {
		set({ secondaryColor: color });
		saveSetting("secondaryColor", color);
	},

	swapColors: () => {
		const { primaryColor, secondaryColor } = get();
		set({ primaryColor: secondaryColor, secondaryColor: primaryColor });
		saveSetting("primaryColor", secondaryColor);
		saveSetting("secondaryColor", primaryColor);
	},

	setBrushSize: (size) => {
		set({ brushSize: size });
		saveSetting("brushSize", size);
	},

	setBrushShape: (shape) => {
		set({ brushShape: shape });
		saveSetting("brushShape", shape);
	},

	setEraserSize: (size) => {
		set({ eraserSize: size });
		saveSetting("eraserSize", size);
	},

	setAirbrushSize: (size) => {
		set({ airbrushSize: size });
		saveSetting("airbrushSize", size);
	},

	setFillStyle: (style) => {
		set({ fillStyle: style });
		saveSetting("fillStyle", style);
	},

	setLineWidth: (width) => {
		set({ lineWidth: width });
		saveSetting("lineWidth", width);
	},

	setFontFamily: (family) => {
		set({ fontFamily: family });
		saveSetting("fontFamily", family);
	},

	setFontSize: (size) => {
		set({ fontSize: size });
		saveSetting("fontSize", size);
	},

	setFontStyle: (bold, italic, underline) => {
		set({ fontBold: bold, fontItalic: italic, fontUnderline: underline });
		saveSetting("fontBold", bold);
		saveSetting("fontItalic", italic);
		saveSetting("fontUnderline", underline);
	},

	setTextTransparent: (transparent) => {
		set({ textTransparent: transparent });
		saveSetting("textTransparent", transparent);
	},

	toggleDrawOpaque: () => {
		const newValue = !get().drawOpaque;
		set({ drawOpaque: newValue });
		saveSetting("drawOpaque", newValue);
	},

	// Load persisted settings on app initialization
	loadPersistedSettings: async () => {
		const primaryColor = await loadSetting("primaryColor", DEFAULT_PALETTE[0]);
		const secondaryColor = await loadSetting("secondaryColor", DEFAULT_PALETTE[14]);
		const brushSize = await loadSetting("brushSize", 4);
		const brushShape = await loadSetting<"circle" | "square" | "reverse_diagonal" | "diagonal">("brushShape", "circle");
		const eraserSize = await loadSetting("eraserSize", 8);
		const airbrushSize = await loadSetting("airbrushSize", 9);
		const fillStyle = await loadSetting<"outline" | "fill" | "both">("fillStyle", "outline");
		const lineWidth = await loadSetting("lineWidth", 1);
		const fontFamily = await loadSetting("fontFamily", "Arial");
		const fontSize = await loadSetting("fontSize", 12);
		const fontBold = await loadSetting("fontBold", false);
		const fontItalic = await loadSetting("fontItalic", false);
		const fontUnderline = await loadSetting("fontUnderline", false);
		const textTransparent = await loadSetting("textTransparent", false);
		const drawOpaque = await loadSetting("drawOpaque", true);

		set({
			primaryColor,
			secondaryColor,
			brushSize,
			brushShape,
			eraserSize,
			airbrushSize,
			fillStyle,
			lineWidth,
			fontFamily,
			fontSize,
			fontBold,
			fontItalic,
			fontUnderline,
			textTransparent,
			drawOpaque,
		});
	},
}));
