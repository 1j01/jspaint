# Migration Roadmap

## Current State (Updated January 24, 2026)

The project has successfully completed Phase 1 (Vite adoption) and Phase 2 (React migration) is **feature complete**:

- **Build System**: Vite is fully configured with multi-page app support
- **Legacy App**: Moved to `/old/` subdirectory, fully functional
- **React Preview**: Available at `/new/` with **feature parity to legacy app**
- **Entry Points**: `index.html` (selector), `old/index.html` (legacy), `new/index.html` (React)
- **State Management**: Migrated to Zustand with IndexedDB persistence
- **All 16 Tools**: Fully implemented with all drawing operations
- **Full Menu System**: All 6 menus (File, Edit, View, Image, Colors, Help) working
- **Dialogs**: All major dialogs implemented (About, Attributes, FlipRotate, StretchSkew, CustomZoom, LoadFromUrl, SaveAs, EditColors, ManageStorage, ImgurUpload, History, HistoryTree)
- **Help System**: Complete help viewer with table of contents and navigation
- **i18n Support**: Internationalization with i18next, 26+ languages supported
- **Recent Refactoring**: Canvas component cleaned up through hook extraction

## Architecture Overview

### Legacy Architecture (`/old/`)
- `old/index.html` loads 20+ `<script type="module">` tags
- `src/app.js` orchestrates runtime behavior (~3400 lines)
- Heavy reliance on jQuery-style helpers (`$Component`, `$ToolWindow`, `$G`)
- Global variables on `window` for cross-module communication
- CSS in `styles/layout.css` with dynamic theme loading

### React Architecture (`/new/`)
- `src/new/main.jsx` - React entry point
- `src/new/App.tsx` - Main app component with Zustand state management
- `src/react/components/` - UI components (Frame, ToolBox, ColorBox, Canvas, etc.)
- `src/react/context/state/` - Zustand stores with IndexedDB persistence
- `src/react/hooks/` - Custom hooks for canvas operations (drawing, selection, shapes, lifecycle, events)
- `src/react/utils/` - Pure utility functions (drawing algorithms, image transforms, canvas helpers)
- `src/react/i18n/` - Internationalization with i18next (26+ languages)
- Reuses legacy CSS from `styles/` with React-specific overrides in `styles/react-preview.css`

## Phase 1 – Vite Adoption ✅ COMPLETE

### 1. Preparation and inventory ✅
- Entry points catalogued: `index.html`, `old/index.html`, `new/index.html`, `about.html`, `privacy.html`
- Global variables documented in legacy code
- Asset paths configured for Vite

### 2. Vite scaffolding ✅
- `vite.config.mjs` configured with:
  - Multi-page app support (rollupOptions.input)
  - Static asset copying (images, styles, lib, localization, etc.)
  - Dev server on port 1999
- Legacy app isolated in `/old/` subdirectory

### 3. HTML entry migration ✅
- Legacy app preserved in `old/index.html`
- React app uses `new/index.html` with single entry point
- Workspace selector at root `index.html`

### 4. Asset loading ✅
- CSS served from `styles/` directory
- Themes load dynamically via `src/theme.js`
- Static assets copied to dist during build

### 5. Development workflows ✅
- `npm run dev` - Vite dev server + CSS watch
- `npm run build` - Production build
- `npm run preview` - Preview built output
- Cypress configured for Vite dev server

### 6. Hardening ✅
- Production builds working
- Legacy and React apps coexist

## Phase 2 – React Migration ✅ MOSTLY COMPLETE

### 1. Foundational groundwork ✅ COMPLETE

#### Completed ✅
- React 18 and React DOM installed
- JSX components created in `src/react/components/`
- React entry point at `src/new/main.jsx`
- **State management: Migrated to Zustand** with modular stores:
  - `settingsStore` - User preferences (colors, brush sizes, fonts) with IndexedDB persistence
  - `uiStore` - View state (toolbar visibility, grid, thumbnail) with persistence
  - `toolStore` - Active tool, selection, text box state (session-only)
  - `canvasStore` - Canvas dimensions, undo/redo history with IndexedDB
  - `historyStore` - Tree-based history with non-linear undo/redo
- Established TypeScript (.tsx files)
- Created migration spreadsheet mapping globals to React state
- **Optimized state hooks with useShallow** for better performance and preventing unnecessary re-renders

### 2. Incremental componentization

#### Completed ✅
| Legacy Module | React Component | Status |
|---------------|-----------------|--------|
| `$Component.js` | `Component.tsx` | Wrapper created |
| `$ToolBox.js` | `ToolBox.tsx` | ✅ Full implementation |
| `$ColorBox.js` | `ColorBox.tsx` | ✅ Full implementation |
| `$FontBox.js` | `FontBox.tsx` + `FontBoxWindow.tsx` | ✅ Full implementation with floating window |
| Layout chrome | `Frame.tsx` | ✅ Complete with menu bar and status bar |
| Canvas | `Canvas.tsx` | ✅ Full implementation (all tools) |
| Help System | `HelpWindow.tsx`, `HelpContents.tsx`, `HelpToolbar.tsx` | ✅ Complete with navigation |
| Thumbnail | `ThumbnailWindow.tsx` | ✅ Real-time canvas preview |

#### UI Components ✅ COMPLETE
- [x] Port menu system to React - **Full menu definitions in `menuDefinitions.ts`**
- [x] Create StatusBar component - **Integrated in Frame.tsx**
- [x] Create ToolOptions component - **`ToolOptions.tsx` with all tool-specific options**
- [x] Create dialog components - **All dialogs implemented (see below)**
- [x] Create Help System - **Complete with table of contents, navigation, search**

#### Canvas Components ✅ COMPLETE
- [x] Create Canvas component with imperative ref API
- [x] Port Handles.js for resize/selection handles - **`SelectionHandles.tsx`, `CanvasResizeHandles.tsx`**
- [x] Port OnCanvasSelection.js - **Integrated in `useCanvasSelection.ts`**
- [x] Port OnCanvasTextBox.js - **Integrated in `useCanvasTextBox.ts`**
- [x] Port OnCanvasHelperLayer.js - **`HelperLayer.tsx`**
- [x] Fix layout positioning - **Canvas and overlays properly aligned with .canvas-area padding**
- [x] Extract canvas hooks - **`useCanvasLifecycle.ts`, `useAirbrushEffect.ts`, `useCanvasEventHandlers.ts`**
- [x] Create canvas helpers - **`canvasHelpers.ts` for cursor, resize, selection operations**
- [x] Refactor Canvas.tsx - **Reduced through better separation of concerns**

### 3. State migration ✅ COMPLETE

#### State Architecture - Zustand Stores ✅
The application uses **Zustand** for state management with modular stores:

**settingsStore** (persisted to IndexedDB):
- Colors: `primaryColor`, `secondaryColor`, `palette`, `customColors`
- Tool sizes: `brushSize`, `brushShape`, `pencilSize`, `eraserSize`, `airbrushSize`
- Shape settings: `fillStyle`, `lineWidth`
- Font settings: `fontFamily`, `fontSize`, `fontBold`, `fontItalic`, `fontUnderline`, `textTransparent`

**uiStore** (persisted to IndexedDB):
- View state: `showToolBox`, `showColorBox`, `showStatusBar`, `showGrid`, `showThumbnail`
- Draw mode: `drawOpaque` (transparent selection mode)

**toolStore** (session-only):
- Active tool: `selectedToolId`, `selectedToolIds`
- Selection state: `selection` (with `imageData`, position, dimensions, path for free-form)
- Text box state: `textBox` (position, dimensions, text, font settings, `isActive`)
- Cursor position: `cursorPosition` for status bar

**canvasStore** (history persisted to IndexedDB):
- Canvas: `canvasWidth`, `canvasHeight`, `magnification`
- File state: `fileName`, `saved`
- History: `undoStack`, `redoStack` (linear undo/redo with canvas snapshots)
- Clipboard: `clipboard` (ImageData for copy/paste)

**historyStore** (NEW - tree-based history):
- History tree: Non-linear undo/redo with branching timelines
- Smart redo: Prefers branches you came from (matches jQuery implementation)
- Operation names: Each state labeled with tool name (Pencil, Brush, Fill, etc.)
- Tree navigation: Jump to any state via history dialog
- Soft states: Skippable intermediate states during undo/redo

#### Tools Registry ✅
- [x] Create tools registry/context - **In `toolStore.ts` with TOOL_IDS constant**
- [x] Port tool implementations from `tools.js` - **All 16 tools in Canvas.tsx and hooks**
- [x] Connect tools to canvas via context - **Via Zustand stores**

### 4. Core functionality migration ✅ COMPLETE

#### Drawing Functions - Implemented ✅
All key functions ported to `src/react/utils/drawingUtils.ts` and hooks:
- [x] `bresenhamLine()` - Bresenham algorithm for pixel-perfect lines
- [x] `drawPolygon()` - Polygon rendering with fill support
- [x] `drawEllipse()` - Canvas ellipse API
- [x] `drawRectangle()` - With fill style support
- [x] `drawRoundedRectangle()` - Rounded rectangle with fill support
- [x] `floodFill()` - Scanline-based flood fill algorithm
- [x] `sprayAirbrush()` - Random spray pattern
- [x] `getBrushPoints()` - Brush shape calculations
- [x] `getRgbaFromColor()` - Color parsing utility
- [x] Selection tools - Rectangular and free-form with marching ants
- [x] `select_all()`, `delete_selection()` - **In App.tsx menu actions**
- [x] `crop_to_selection()` - **In App.tsx menu actions**
- [x] Undo/redo with operation names - **Tree-based history with smart branch selection**

#### Image Manipulation ✅ COMPLETE
From `src/image-manipulation.js` → `src/react/utils/imageTransforms.ts`:
- [x] `image_invert_colors()` - **invertColors()**
- [x] `image_flip_horizontal/vertical()` - **flipHorizontal(), flipVertical()**
- [x] Canvas rotation algorithms - **rotate(), rotateArbitrary()**
- [x] Stretch/skew operations - **stretch(), skew()**
- [x] Color quantization - **Deferred (advanced feature)**
- [x] Image tracing - **Deferred (advanced feature)**

#### File Operations ✅ COMPLETE
- [x] File open/save dialogs - **Using File System Access API with fallback**
- [x] Load from URL dialog - **`LoadFromUrlDialog.tsx`**
- [x] Format encoding/decoding - **`imageFormats.ts` with PNG, BMP, JPEG, WebP, GIF**
- [x] Palette import/export - **`paletteFormats.ts` with GPL, JASC, RIFF PAL, hex formats**
- [x] Save As dialog - **`SaveAsDialog.tsx` with format selection**
- [x] Imgur upload - **`ImgurUploadDialog.tsx`**
- [x] Storage management - **`ManageStorageDialog.tsx`**

### 5. Feature migration priority

#### Priority 1 - Core Drawing ✅ DONE
1. ~~Canvas component with basic mouse events~~
2. ~~Pencil tool (simplest drawing tool)~~
3. ~~Brush tool with sizes~~
4. ~~Eraser tool~~
5. ~~Color selection working~~
6. ~~Undo/redo (single level first, then tree)~~ - Linear undo/redo implemented

#### Priority 2 - Selection & Shapes ✅ DONE
1. ~~Rectangular selection~~ ✅
2. ~~Free-form selection~~ ✅
3. ~~Line tool~~ ✅
4. ~~Rectangle tool~~ ✅ (with fill styles)
5. ~~Ellipse tool~~ ✅ (with fill styles)
6. ~~Fill tool~~ ✅
7. ~~Pick Color tool~~ ✅

#### Priority 3 - Advanced Tools ✅ DONE
1. ~~Curve tool (bezier)~~ ✅
2. ~~Polygon tool~~ ✅ (with fill styles, right-click to close)
3. ~~Text tool~~ ✅
4. ~~Airbrush tool~~ ✅
5. ~~Magnifier/zoom~~ ✅ (1x, 2x, 4x, 6x, 8x)

#### Priority 4 - Polish ✅ COMPLETE
1. ~~Menu system fully in React~~ ✅ (All 6 menus: File, Edit, View, Image, Colors, Help)
2. ~~All dialogs as React components~~ ✅ (11 dialogs total - see Dialogs Implemented below)
3. ~~Keyboard shortcuts~~ ✅ (Ctrl+Z/Y, tool hotkeys, clipboard, F11, Ctrl+I, etc.)
4. ~~File operations~~ ✅ (New, Open, Save, Save As, Load from URL)
5. ~~Clipboard operations~~ ✅ (Copy, Cut, Paste, Copy To, Paste From)
6. ~~Help system~~ ✅ (Complete with table of contents, navigation, toolbar)
7. ~~View toggles~~ ✅ (Tool Box, Color Box, Status Bar, Grid, Thumbnail)

#### Dialogs Implemented ✅
All major dialogs are implemented in React:
- `AboutDialog.tsx` - About Paint with version info
- `AttributesDialog.tsx` - Canvas size and unit settings
- `FlipRotateDialog.tsx` - Image flip/rotate operations
- `StretchSkewDialog.tsx` - Stretch and skew transformations
- `CustomZoomDialog.tsx` - Custom magnification levels
- `LoadFromUrlDialog.tsx` - Load images from URL
- `SaveAsDialog.tsx` - Save with format selection (PNG, BMP, JPEG, WebP, GIF)
- `EditColorsDialog.tsx` - HSL color picker with custom colors
- `ManageStorageDialog.tsx` - Storage management for saved states
- `ImgurUploadDialog.tsx` - Upload to Imgur integration
- `HistoryDialog.tsx` - Linear undo/redo history viewer
- `HistoryTreeDialog.tsx` - Tree-based history with branching navigation

### 6. Migration sequencing

- [x] **Phase 0**: Vite build working, legacy app preserved
- [x] **Phase 1**: React shell with basic UI components
- [x] **Phase 2**: Canvas integration with drawing capability
- [x] **Phase 3**: Basic tool implementations (Pencil, Brush, Eraser)
- [x] **Phase 4**: State management with undo/redo
- [x] **Phase 5**: Additional tools (shapes, selection, fill, text, magnifier) - ALL DONE
- [x] **Phase 6**: File operations and dialogs - ALL DONE
- [x] **Phase 7**: Zustand state migration - DONE
- [x] **Phase 8**: Help system implementation - DONE
- [x] **Phase 9**: i18n internationalization support - DONE
- [x] **Phase 10**: Canvas refactoring and hook extraction - DONE
- [ ] **Phase 11**: Testing and stabilization - ONGOING
- [ ] **Phase 12**: Performance optimization - AS NEEDED
- [ ] **Phase 13**: jQuery removal (archive `/old/` when React app is production-ready)

## Technical Decisions

### State Management ✅ DECIDED: Zustand
**Decision**: Zustand with modular stores and IndexedDB persistence

**Implementation**:
- Zustand provides simple, hook-based state management with no boilerplate
- State split into 4 logical stores: `settingsStore`, `uiStore`, `toolStore`, `canvasStore`
- IndexedDB persistence for settings, UI state, and history
- Better performance than Context (no unnecessary re-renders)
- Clean selector pattern for optimal component updates

### Canvas Integration Pattern ✅ DECIDED: Hybrid
**Decision**: Hybrid approach - React state for UI, imperative canvas operations

**Implementation**:
- Canvas accessed via `canvasRef` from context
- Drawing operations are imperative (direct canvas manipulation)
- React state manages tool selection, colors, settings
- Custom hooks (`useCanvasDrawing`, `useCanvasSelection`, etc.) encapsulate canvas logic
- No unnecessary re-renders during drawing operations

### Component Library ✅ DECIDED: Keep os-gui + Custom
**Decision**: Use os-gui for Windows 98 UI, custom components for paint-specific features

**Implementation**:
- `os-gui` library for menus, dialogs, windows (preserves classic MS Paint look)
- Custom components for canvas, tools, color picker
- Legacy CSS from `styles/` reused with minimal React-specific overrides
- Maintains authentic Windows 98 aesthetic

**Important Note**:
- **The React app (`/new/`) is already jQuery-free!** No jQuery dependencies in React code
- jQuery only used in legacy app (`/old/`)
- os-gui provides the Windows 98 UI without requiring jQuery
- When "jQuery removal" is mentioned, it refers to archiving the `/old/` directory once React app is production-ready

## Files Reference

### Key Legacy Files to Port
| File | Lines | Purpose |
|------|-------|---------|
| `src/app.js` | ~3400 | Main orchestration |
| `src/functions.js` | ~2200 | Drawing functions |
| `src/tools.js` | ~1600 | Tool implementations |
| `src/menus.js` | ~1550 | Menu definitions |
| `src/image-manipulation.js` | ~1740 | Canvas algorithms |
| `src/sessions.js` | ~1060 | Multi-user |

### React Files Created

#### Entry Points
| File | Purpose |
|------|---------|
| `src/new/main.jsx` | React entry point with store initialization |
| `src/new/App.tsx` | Main app component |

#### State Management (Zustand)
| File | Purpose |
|------|---------|
| `src/react/context/state/settingsStore.ts` | User preferences (colors, sizes, fonts) |
| `src/react/context/state/uiStore.ts` | View state (toolbox, statusbar visibility) |
| `src/react/context/state/toolStore.ts` | Active tool, selection, text box state |
| `src/react/context/state/canvasStore.ts` | Canvas size, history, clipboard |
| `src/react/context/state/historyStore.ts` | Tree-based undo/redo with branching |
| `src/react/context/state/aiStore.ts` | AI-related state and functionality |
| `src/react/context/state/persistence.ts` | IndexedDB persistence layer |
| `src/react/context/state/initialState.ts` | Default state values |
| `src/react/context/state/useInitializeStores.ts` | Store initialization hook |
| `src/react/context/AppContext.tsx` | Legacy context (being phased out) |

#### Components
| File | Purpose |
|------|---------|
| `src/react/components/Frame.tsx` | Layout container with menu bar |
| `src/react/components/ToolBox.tsx` | Tool selection grid (16 tools) |
| `src/react/components/ColorBox.tsx` | Color palette selector |
| `src/react/components/FontBox.tsx` | Font selector (inline) |
| `src/react/components/FontBoxWindow.tsx` | Floating font window |
| `src/react/components/Canvas.tsx` | Main drawing canvas orchestrator |
| `src/react/components/CanvasOverlay.tsx` | Selection marching ants overlay |
| `src/react/components/CanvasTextBox.tsx` | Text input overlay |
| `src/react/components/ToolOptions.tsx` | Tool-specific settings panel |
| `src/react/components/SelectionHandles.tsx` | Resize handles for selections |
| `src/react/components/CanvasResizeHandles.tsx` | Canvas resize handles |
| `src/react/components/HelperLayer.tsx` | Helper layer for overlays |
| `src/react/components/ThumbnailWindow.tsx` | Real-time canvas thumbnail |

#### Help System Components
| File | Purpose |
|------|---------|
| `src/react/components/help/HelpWindow.tsx` | Help viewer window |
| `src/react/components/help/HelpContents.tsx` | Table of contents tree |
| `src/react/components/help/HelpContent.tsx` | Content iframe wrapper |
| `src/react/components/help/HelpToolbar.tsx` | Navigation toolbar |
| `src/react/components/help/ResizableSplitPane.tsx` | Resizable pane splitter |
| `src/react/utils/helpParser.ts` | Help content parser |

#### Dialog Components
| File | Purpose |
|------|---------|
| `src/react/components/dialogs/Dialog.tsx` | Base modal dialog with drag |
| `src/react/components/dialogs/AboutDialog.tsx` | About Paint info |
| `src/react/components/dialogs/AttributesDialog.tsx` | Canvas size/units |
| `src/react/components/dialogs/FlipRotateDialog.tsx` | Flip/Rotate options |
| `src/react/components/dialogs/StretchSkewDialog.tsx` | Stretch/Skew values |
| `src/react/components/dialogs/CustomZoomDialog.tsx` | Custom zoom level |
| `src/react/components/dialogs/LoadFromUrlDialog.tsx` | Load from URL |
| `src/react/components/dialogs/SaveAsDialog.tsx` | Save with format picker |
| `src/react/components/dialogs/EditColorsDialog.tsx` | HSL color picker |
| `src/react/components/dialogs/ColorInputs.tsx` | Color input components |
| `src/react/components/dialogs/ColorPickerCanvas.tsx` | Color picker canvas |
| `src/react/components/dialogs/ManageStorageDialog.tsx` | Storage management |
| `src/react/components/dialogs/ImgurUploadDialog.tsx` | Imgur integration |
| `src/react/components/dialogs/HistoryDialog.tsx` | Linear history viewer |
| `src/react/components/dialogs/HistoryTreeDialog.tsx` | Tree history with branching |
| `src/react/components/dialogs/MessageBoxDialog.tsx` | Message box dialog |

#### Menus
| File | Purpose |
|------|---------|
| `src/react/menus/menuDefinitions.ts` | Full menu structure (File, Edit, View, Image, Colors, Help) |

#### Custom Hooks
| File | Purpose |
|------|---------|
| `src/react/hooks/useCanvasDrawing.ts` | Core drawing (point, line, fill, erase, airbrush, pickColor) |
| `src/react/hooks/useCanvasSelection.ts` | Rectangular/free-form selection with marching ants |
| `src/react/hooks/useCanvasTextBox.ts` | Text box creation and commit to canvas |
| `src/react/hooks/useCanvasShapes.ts` | Shape tools (line, rect, ellipse, rounded rect) with fill styles |
| `src/react/hooks/useCanvasCurvePolygon.ts` | Curve and polygon multi-click tools |
| `src/react/hooks/useCanvasEventHandlers.ts` | All canvas event handlers (pointer, text, context menu, keyboard) |
| `src/react/hooks/useCanvasLifecycle.ts` | Canvas initialization, persistence across remounts, cleanup |
| `src/react/hooks/useAirbrushEffect.ts` | Airbrush continuous spray effect with setInterval |
| `src/react/hooks/useMenuActions.ts` | Menu action handlers for Edit, View, Image menus |
| `src/react/hooks/useSelectionOperations.ts` | Selection manipulation (cut, copy, paste, drag, resize) |

#### Utilities
| File | Purpose |
|------|---------|
| `src/react/utils/drawingUtils.ts` | Drawing algorithms (bresenham, flood fill, etc.) |
| `src/react/utils/imageTransforms.ts` | Image operations (flip, rotate, stretch, skew) |
| `src/react/utils/imageFormats.ts` | Format encoding (PNG, BMP, JPEG, WebP, GIF) |
| `src/react/utils/paletteFormats.ts` | Palette I/O (GPL, JASC, RIFF PAL, hex) |
| `src/react/utils/colorUtils.ts` | Color manipulation (RGB↔HSL) |
| `src/react/utils/historyTree.ts` | Tree-based undo/redo with smart branching |
| `src/react/utils/canvasHelpers.ts` | Canvas utility functions (cursor styles, resize, selection bounds) |
| `src/react/utils/viewBitmap.ts` | Bitmap viewing utilities |
| `src/react/data/palette.ts` | Default color palette |
| `src/react/data/basicColors.ts` | Basic color constants |

#### i18n
| File | Purpose |
|------|---------|
| `src/react/i18n/i18n.ts` | i18next configuration with language detection |
| `src/react/i18n/languages.ts` | Language metadata for 26+ supported languages |

### Key State Interfaces (Zustand Stores)

**From toolStore.ts:**
- `Selection`: `{ x, y, width, height, imageData, path? }` for rect/freeform selection
- `TextBoxState`: `{ x, y, width, height, text, font settings, isActive }`
- `TOOL_IDS`: Constants for all 16 tools

**From settingsStore.ts:**
- Colors, sizes, fonts, shape settings
- All persisted to IndexedDB

**From canvasStore.ts:**
- Canvas dimensions, magnification, history stacks
- File state (name, saved)
- Clipboard (ImageData)

### Store Hooks (from state/index.ts)

Zustand stores provide direct state access:

| Hook | Purpose |
|------|---------|
| `useSettingsStore()` | Access settings (colors, sizes, fonts) |
| `useUIStore()` | Access UI state (visibility toggles) |
| `useToolStore()` | Access active tool, selection, text box |
| `useCanvasStore()` | Access canvas dimensions, history, clipboard |
| `useHistoryStore()` | Access tree-based history (undo/redo/goToNode) |
| `useColors()` | Convenience hook for color state |
| `useShapeSettings()` | Convenience hook for fill/line settings |
| `useBrushSettings()` | Convenience hook for brush sizes |
| `useFontSettings()` | Convenience hook for text formatting |
| `useHistory()` | Convenience hook for undo/redo |

### Canvas Hooks (src/react/hooks/)
| Hook | Purpose |
|------|---------|
| `useCanvasDrawing` | Core drawing logic (drawPoint, drawLine, erase, pickColor, handleFill) |
| `useCanvasSelection` | Rectangular and free-form selection with marching ants animation |
| `useCanvasTextBox` | Text box creation, finalization, and commit to canvas |
| `useCanvasShapes` | Shape preview and finalization (line, rect, ellipse, rounded rect) |
| `useCanvasCurvePolygon` | Multi-click tool state (curve with control points, polygon with vertices) |

### Implemented Tools
Tools are implemented across Canvas.tsx and its associated hooks:

| Tool | Hook/Location | Features |
|------|---------------|----------|
| Pencil | `useCanvasDrawing` | Pixel-perfect drawing |
| Brush | `useCanvasDrawing` | Size options (1-10px) |
| Eraser | `useCanvasDrawing` | Erases to background color |
| Airbrush | `useCanvasDrawing` | Spray pattern |
| Fill | `useCanvasDrawing` | Scanline flood fill |
| Pick Color | `useCanvasDrawing` | Left/right click for fg/bg |
| Line | `useCanvasShapes` | Preview during drag |
| Rectangle | `useCanvasShapes` | Fill styles: outline/fill/both |
| Ellipse | `useCanvasShapes` | Fill styles: outline/fill/both |
| Rounded Rectangle | `useCanvasShapes` | Fill styles: outline/fill/both |
| Curve | `useCanvasCurvePolygon` | Cubic bezier with control points |
| Polygon | `useCanvasCurvePolygon` | Fill styles, right-click to close |
| Rectangular Select | `useCanvasSelection` | Marching ants, drag to move |
| Free-Form Select | `useCanvasSelection` | Lasso selection, marching ants |
| Text | `useCanvasTextBox` | Font family, size, bold, italic, underline |
| Magnifier | `Canvas.tsx` | Zoom levels: 1x, 2x, 4x, 6x, 8x |

## Risk Mitigation

1. **Feature parity**: Keep Cypress tests running throughout
2. **Parallel development**: Legacy app at `/old/` always works
3. **Incremental migration**: One component/feature at a time
4. **State isolation**: New React state doesn't break legacy globals

## Commands

```bash
# Development
npm run dev           # Start dev server (port 1999)

# Access points
http://localhost:1999/        # Workspace selector
http://localhost:1999/old/    # Legacy jQuery app
http://localhost:1999/new/    # React preview (NEARLY FEATURE-COMPLETE!)

# Build & Test
npm run build         # Production build
npm run preview       # Preview build
npm run test          # Cypress E2E tests
npm run lint          # ESLint + TypeScript check
```

## Migration Progress Summary

### ✅ Feature Complete
- **All 16 drawing tools** fully functional with all features
- **State management** migrated to Zustand with IndexedDB persistence and optimized with useShallow
- **All menus and dialogs** implemented in React
- **File operations** (open, save, save as, load from URL)
- **Clipboard operations** (copy, cut, paste, copy to, paste from)
- **Image transformations** (flip, rotate, stretch, skew, invert)
- **Help system** with full navigation and table of contents
- **View toggles** (toolbox, colorbox, status bar, grid, thumbnail)
- **Canvas positioning** fixed (overlays aligned with .canvas-area padding)
- **Keyboard shortcuts** (tools, undo/redo, clipboard, fullscreen)
- **Tree-based history** - Non-linear undo/redo with smart branching
- **i18n Support** - Internationalization with i18next, 26+ languages, language switching via Extras menu
- **Canvas Architecture** - Cleaned up and refactored:
  - Extracted reusable hooks: `useCanvasLifecycle`, `useAirbrushEffect`, `useCanvasEventHandlers`
  - Created `canvasHelpers.ts` utility module for cursor, resize, and selection operations
  - Better separation of concerns between UI, lifecycle, drawing logic, and event handling

### 🚧 Remaining Work
- **Testing and bug fixes** - Thorough testing of all features for edge cases
- **Performance optimization** - Canvas rendering, state updates, memory management (as needed)
- **Legacy cleanup** - Archive `/old/` jQuery app once React version is production-ready

### 🎯 Next Steps
1. **Comprehensive testing** - Test all tools, dialogs, and features for edge cases
2. **Bug fixes** - Address any issues found during testing
3. **Performance review** - Profile and optimize critical paths as needed
4. **Legacy cleanup** - Archive `/old/` jQuery app (keeping os-gui for Windows 98 UI)
