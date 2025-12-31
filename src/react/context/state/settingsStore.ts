/**
 * Settings Store - User preferences and configuration
 * Persisted to IndexedDB for cross-session consistency
 */

import { create } from "zustand";
import { saveSetting, loadSetting } from "./persistence";
import { DEFAULT_PALETTE } from "../../data/palette";

export interface SettingsState {
	// Color settings
	primaryColor: string;
	secondaryColor: string;
	palette: string[];

	// Tool settings
	brushSize: number;
	brushShape: "circle" | "square" | "reverse_diagonal" | "diagonal";
	pencilSize: number;
	eraserSize: number;
	airbrushSize: number;

	// Shape settings
	fillStyle: "outline" | "fill" | "both";
	lineWidth: number;

	// Text settings
	fontFamily: string;
	fontSize: number;
	fontBold: boolean;
	fontItalic: boolean;
	fontUnderline: boolean;
	textTransparent: boolean;

	// Canvas settings
	defaultCanvasWidth: number;
	defaultCanvasHeight: number;

	// Image mode
	drawOpaque: boolean;

	// Actions
	setPrimaryColor: (color: string) => void;
	setSecondaryColor: (color: string) => void;
	swapColors: () => void;
	setBrushSize: (size: number) => void;
	setBrushShape: (shape: "circle" | "square" | "reverse_diagonal" | "diagonal") => void;
	setEraserSize: (size: number) => void;
	setAirbrushSize: (size: number) => void;
	setFillStyle: (style: "outline" | "fill" | "both") => void;
	setLineWidth: (width: number) => void;
	setFontFamily: (family: string) => void;
	setFontSize: (size: number) => void;
	setFontStyle: (bold: boolean, italic: boolean, underline: boolean) => void;
	setTextTransparent: (transparent: boolean) => void;
	toggleDrawOpaque: () => void;
	loadPersistedSettings: () => Promise<void>;
}

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
