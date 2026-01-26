/**
 * Initial state for the application
 */
import { DEFAULT_PALETTE } from "../../data/palette";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from "../../constants/canvas";
import { AppState, TOOL_IDS } from "./types";

export const initialState: AppState = {
  // Colors
  primaryColor: DEFAULT_PALETTE[0],
  secondaryColor: DEFAULT_PALETTE[14], // White - matches original MS Paint
  palette: DEFAULT_PALETTE,

  // Tool
  selectedToolId: TOOL_IDS.PENCIL,

  // Canvas dimensions (Windows XP defaults)
  canvasWidth: DEFAULT_CANVAS_WIDTH,
  canvasHeight: DEFAULT_CANVAS_HEIGHT,

  // Drawing state
  isDrawing: false,

  // Cursor position (for status bar)
  cursorPosition: null,

  // Brush settings
  brushSize: 4,
  brushShape: "circle",
  pencilSize: 1,
  eraserSize: 8,
  airbrushSize: 9,

  // Shape settings (outline, fill, both)
  fillStyle: "outline",
  lineWidth: 1,

  // Selection state
  selection: null,

  // Text box state
  textBox: null,

  // Text settings
  fontFamily: "Arial",
  fontSize: 12,
  fontBold: false,
  fontItalic: false,
  fontUnderline: false,
  fontVertical: false,
  textTransparent: false, // Transparency mode for text/select tools

  // Magnification
  magnification: 1,

  // Clipboard
  clipboard: null,

  // History
  undoStack: [],
  redoStack: [],
  maxHistorySize: 50,

  // File state
  fileName: "untitled",
  saved: true,

  // View state - visibility toggles
  showToolBox: true,
  showColorBox: true,
  showStatusBar: true,
  showTextToolbar: false,
  showGrid: false,
  showThumbnail: false,

  // Image mode
  drawOpaque: true,
};
