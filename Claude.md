# MCPaint - Project Summary

## Overview

MCPaint is a pixel-perfect MS Paint clone web application (jspaint.app) currently undergoing migration from jQuery to React. The project uses Vite as its build system and has both legacy (`/old/`) and React preview (`/new/`) versions. The React version has achieved **feature parity** with the legacy app and uses modern state management with Zustand stores and IndexedDB persistence.

## Project Structure

```
mcpaint/
├── index.html                 # Workspace selector (routes to /new/ or /old/)
├── old/index.html            # Legacy jQuery-based app
├── new/index.html            # React app (feature-complete!)
├── src/
│   ├── new/                  # React entry point
│   │   ├── main.tsx          # React initialization with i18next
│   │   └── App.tsx           # Main app component (~350 lines)
│   ├── react/
│   │   ├── components/       # React components
│   │   │   ├── Canvas.tsx              # Main canvas (~272 lines, refactored)
│   │   │   ├── CanvasOverlay.tsx       # Selection marching ants
│   │   │   ├── CanvasTextBox.tsx       # Text input overlay
│   │   │   ├── CanvasResizeHandles.tsx # Canvas edge handles
│   │   │   ├── SelectionHandles.tsx    # Selection resize handles
│   │   │   ├── HelperLayer.tsx         # Drawing hints overlay
│   │   │   ├── ColorBox.tsx            # Color palette (~244 lines)
│   │   │   ├── Component.tsx           # Legacy wrapper
│   │   │   ├── DialogManager.tsx       # Centralized dialog renderer
│   │   │   ├── ErrorBoundary.tsx       # React error boundary
│   │   │   ├── FontBox.tsx             # Font selector (legacy, unused)
│   │   │   ├── FontBoxWindow.tsx       # Floating font window (~376 lines)
│   │   │   ├── Frame.tsx               # Layout with menu bar (~240 lines)
│   │   │   ├── ToolBox.tsx             # Tool grid (~123 lines)
│   │   │   ├── ToolOptions.tsx         # Tool settings (~404 lines)
│   │   │   ├── ThumbnailWindow.tsx     # Canvas thumbnail (~203 lines)
│   │   │   ├── dialogs/                # Dialog components
│   │   │   │   ├── Dialog.tsx              # Base modal
│   │   │   │   ├── AboutDialog.tsx         # About Paint
│   │   │   │   ├── AttributesDialog.tsx    # Canvas size
│   │   │   │   ├── ColorInputs.tsx         # RGB/HSL inputs
│   │   │   │   ├── ColorPickerCanvas.tsx   # Gradient canvas
│   │   │   │   ├── CustomZoomDialog.tsx    # Zoom level
│   │   │   │   ├── EditColorsDialog.tsx    # Color editor (~350 lines)
│   │   │   │   ├── FlipRotateDialog.tsx    # Flip/Rotate
│   │   │   │   ├── HistoryDialog.tsx       # Linear history (legacy)
│   │   │   │   ├── HistoryTreeDialog.tsx   # Tree history (~430 lines)
│   │   │   │   ├── ImgurUploadDialog.tsx   # Imgur upload
│   │   │   │   ├── LoadFromUrlDialog.tsx   # Load from URL
│   │   │   │   ├── ManageStorageDialog.tsx # Storage manager
│   │   │   │   ├── MessageBoxDialog.tsx    # Windows MessageBox
│   │   │   │   ├── SaveAsDialog.tsx        # Save with format
│   │   │   │   └── StretchSkewDialog.tsx   # Stretch/Skew
│   │   │   └── help/                   # Help system
│   │   │       ├── HelpWindow.tsx          # Help container
│   │   │       ├── HelpContents.tsx        # TOC tree
│   │   │       ├── HelpContent.tsx         # Content display
│   │   │       ├── HelpToolbar.tsx         # Navigation
│   │   │       └── ResizableSplitPane.tsx  # Split pane
│   │   ├── context/state/    # Zustand state management
│   │   │   ├── types.ts                    # Type definitions
│   │   │   ├── initialState.ts             # Default state
│   │   │   ├── persistence.ts              # IndexedDB utilities
│   │   │   ├── useInitializeStores.ts      # Store initialization
│   │   │   ├── toolStore.ts                # Tool state (~200 lines)
│   │   │   ├── settingsStore.ts            # Settings (~150 lines)
│   │   │   ├── uiStore.ts                  # UI state (~250 lines)
│   │   │   ├── historyStore.ts             # History tree (~300 lines)
│   │   │   ├── canvasStore.ts              # Canvas metadata (~150 lines)
│   │   │   ├── useApp.ts                   # Combined selectors (legacy)
│   │   │   ├── useColors.ts                # Color selectors
│   │   │   ├── useBrushSettings.ts         # Brush selectors
│   │   │   ├── useShapeSettings.ts         # Shape selectors
│   │   │   ├── useFontSettings.ts          # Font selectors
│   │   │   ├── useTool.ts                  # Tool selectors
│   │   │   ├── useSelection.ts             # Selection selectors
│   │   │   ├── useClipboard.ts             # Clipboard selectors
│   │   │   ├── useTextBox.ts               # TextBox selectors
│   │   │   ├── useTextBoxState.ts          # TextBox read-only
│   │   │   ├── useTextBoxActions.ts        # TextBox actions
│   │   │   ├── useViewState.ts             # View toggles
│   │   │   ├── useMagnification.ts         # Zoom selectors
│   │   │   ├── useCursorPosition.ts        # Cursor selectors
│   │   │   ├── useCanvasDimensions.ts      # Canvas size
│   │   │   ├── useHistory.ts               # Linear history
│   │   │   ├── useTreeHistory.ts           # Tree history
│   │   │   ├── useCurrentHistoryNode.ts    # Current node
│   │   │   └── useDrawingColor.ts          # Drawing color helper
│   │   ├── hooks/            # Custom hooks
│   │   │   ├── useCanvasDrawing.ts         # Drawing ops (~250 lines)
│   │   │   ├── useCanvasSelection.ts       # Selection (~300 lines)
│   │   │   ├── useCanvasTextBox.ts         # Text tool (~200 lines)
│   │   │   ├── useCanvasShapes.ts          # Shapes (~350 lines)
│   │   │   ├── useCanvasCurvePolygon.ts    # Curve/Polygon (~250 lines)
│   │   │   ├── useCanvasEventHandlers.ts   # Events (~400 lines)
│   │   │   ├── useCanvasLifecycle.ts       # Init/cleanup (~150 lines)
│   │   │   ├── useAirbrushEffect.ts        # Airbrush (~100 lines)
│   │   │   ├── useSelectionOperations.ts   # Selection ops (~180 lines)
│   │   │   ├── useKeyboardShortcuts.ts     # Shortcuts (~200 lines)
│   │   │   ├── useMenuActions.ts           # Menu actions (~350 lines)
│   │   │   ├── useDialogHandlers.ts        # Dialog handlers (~300 lines)
│   │   │   ├── useFontState.ts             # Font state (~120 lines)
│   │   │   ├── useDraggable.ts             # Drag behavior (~100 lines)
│   │   │   ├── useResizable.ts             # Resize behavior (~120 lines)
│   │   │   ├── useHelpNavigation.ts        # Help navigation (~150 lines)
│   │   │   ├── useColorPicker.ts           # Color picker (~180 lines)
│   │   │   └── useColorCanvases.ts         # Color gradients (~250 lines)
│   │   ├── menus/            # Menu system
│   │   │   └── menuDefinitions.ts          # All 6 menus (~600 lines)
│   │   ├── utils/            # Pure utilities
│   │   │   ├── drawingUtils.ts             # Algorithms (~460 lines)
│   │   │   ├── imageTransforms.ts          # Transforms (~300 lines)
│   │   │   ├── historyTree.ts              # History tree (~350 lines)
│   │   │   ├── imageFormats.ts             # Image I/O (~400 lines)
│   │   │   ├── paletteFormats.ts           # Palette I/O (~350 lines)
│   │   │   ├── viewBitmap.ts               # Bitmap view (~80 lines)
│   │   │   ├── colorUtils.ts               # Color conversion (~200 lines)
│   │   │   ├── helpParser.ts               # Help parser (~150 lines)
│   │   │   └── canvasHelpers.ts            # Canvas helpers (~200 lines)
│   │   ├── i18n/             # Internationalization
│   │   │   ├── i18n.ts                     # i18next config
│   │   │   └── languages.ts                # 26+ languages
│   │   └── data/             # Static data
│   │       ├── palette.ts                  # Default palette
│   │       ├── basicColors.ts              # Basic swatches
│   │       └── toolboxItems.ts             # Tool definitions
│   ├── $Component.js         # jQuery helpers (legacy)
│   ├── $ToolBox.js
│   ├── $ColorBox.js
│   ├── $FontBox.js
│   ├── $ToolWindow.js
│   ├── app.js                # Main orchestration (~3400 lines)
│   ├── functions.js          # Drawing functions (~2200 lines)
│   ├── tools.js              # Tool implementations (~1600 lines)
│   ├── menus.js              # Menu system (~1547 lines)
│   ├── image-manipulation.js # Canvas algorithms (~1740 lines)
│   ├── sessions.js           # Multi-user support
│   ├── helpers.js            # Utilities
│   └── ... (50+ JS files total)
├── styles/
│   ├── layout.css            # Main layout (26.7KB)
│   ├── layout.rtl.css        # RTL version
│   ├── react-preview.css     # React overrides
│   └── themes/               # 8 theme variants
├── lib/                      # Third-party libraries
│   ├── jquery-3.4.1.min.js
│   ├── font-detective.js     # Font enumeration
│   ├── os-gui/               # Windows-style GUI
│   ├── 98.css/               # Windows 98 CSS
│   └── ... (image libs, etc.)
├── images/                   # UI assets
├── localization/             # 26 languages (JSON)
├── help/                     # 90+ help pages (HTML)
├── tests/                    # Playwright tests
└── cypress/                  # Cypress E2E tests
```

## Key Technologies

- **Frontend**: React 18, TypeScript (via JSDoc)
- **State**: Zustand with IndexedDB persistence
- **Build**: Vite 7 with multi-page support
- **Testing**: Playwright, Cypress
- **i18n**: i18next (26+ languages)
- **Linting**: ESLint 9, cspell
- **Legacy**: jQuery 3.4.1 (in `/old/` only)

## Commands

```bash
npm run dev          # Dev server with CSS watch (ports 1999+)
npm run build        # Production build to /dist/
npm run preview      # Preview build (port 4173)
npm run lint         # Run cspell, tsc, eslint
npm run lint:tsc     # TypeScript checking only
npm run test         # Playwright tests
npm run cy:open      # Open Cypress UI
```

## React Architecture

### State Management (Zustand)

The React app uses **Zustand** with 5 modular stores:

1. **toolStore** - Active tool, selection, text box, clipboard
2. **settingsStore** - Drawing settings (brush, eraser, shapes, fonts)
3. **uiStore** - UI state (visibility toggles, magnification, dialogs)
4. **historyStore** - Tree-based undo/redo with branching
5. **canvasStore** - Canvas metadata (dimensions, file name)

**Persistence**: Settings, UI state, and history are auto-saved to IndexedDB.

**Selectors**: Custom hooks (e.g., `useColors`, `useBrushSettings`) provide cleaner API.

**Optimization**: Uses `useShallow` to prevent unnecessary re-renders.

### Component Architecture

**Canvas Component** (~272 lines after refactoring):
- Uses 8+ specialized hooks for drawing, selection, shapes, text
- Imperative API via `forwardRef` for external operations
- Centralized event handling via `useCanvasEventHandlers`
- Module-level state for canvas persistence across remounts

**Hook Composition Pattern**:
```typescript
// Canvas.tsx orchestrates specialized hooks:
const drawingOps = useCanvasDrawing(canvasRef);
const shapeOps = useCanvasShapes(canvasRef);
const selectionOps = useCanvasSelection(canvasRef);
const textOps = useCanvasTextBox(canvasRef);
const curvePolygonOps = useCanvasCurvePolygon(canvasRef);
const airbrushInterval = useAirbrushEffect(/* ... */);

// Centralized event delegation:
useCanvasEventHandlers({
  canvasRef,
  drawingOps,
  shapeOps,
  selectionOps,
  // ... etc
});

// Lifecycle management:
useCanvasLifecycle(canvasRef, { /* ... */ });
```

**Portal-Based Dialogs**:
- All dialogs use `createPortal(content, document.body)`
- `DialogManager` component renders all dialogs based on `uiStore.dialogs`
- Windows-style MessageBox for confirmations

**Font Detection**:
- Uses Local Font Access API (modern browsers)
- Falls back to FontDetective library (200+ fonts tested)
- Progressive dropdown population

### Key Patterns

1. **Pure Utilities**: All drawing algorithms are pure functions in `utils/`
2. **Centralized Events**: `useCanvasEventHandlers` delegates to tool-specific hooks
3. **Persistence Middleware**: Auto-save to IndexedDB on state change
4. **Tree-Based History**: Non-linear undo/redo with branching (like Git)
5. **i18n Integration**: All UI text uses `useTranslation()` hook

## Paint Features

### 16 Drawing Tools

1. **Free-Form Select** - Lasso selection with path tracing
2. **Rectangular Select** - Box selection with marching ants
3. **Eraser** - Configurable size (1-10px)
4. **Fill** - Scanline flood fill algorithm
5. **Pick Color** - Eyedropper (left/right click for primary/secondary)
6. **Magnifier** - Zoom levels: 1x, 2x, 4x, 6x, 8x
7. **Pencil** - 1px pixel-perfect drawing
8. **Brush** - Configurable size and shape
9. **Airbrush** - Spray pattern with continuous effect
10. **Text** - Font selector with bold/italic/underline
11. **Line** - Bresenham algorithm for pixel-perfect lines
12. **Curve** - Cubic bezier with control points
13. **Rectangle** - Fill styles: outline/fill/both
14. **Polygon** - Multi-click polygon (right-click to close)
15. **Ellipse** - Fill styles: outline/fill/both
16. **Rounded Rectangle** - Fill styles: outline/fill/both

### File Formats

- **Read**: PNG, BMP, GIF, JPEG, TIFF, PDF
- **Write**: PNG, BMP, GIF, JPEG, WebP
- **Palettes**: PAL, GPL, ACT, JASC, RIFF PAL, hex (10+ formats)

### Special Features

- **Non-linear undo/redo** - Tree-based history with branching
- **Transparency support** - Opaque/transparent drawing modes
- **8 theme variants** - Classic, Winter, etc.
- **26+ languages** - Full i18n support with RTL
- **Accessibility** - Voice control, eye gaze, head tracking (legacy)
- **Multi-user sessions** - WebRTC/WebSocket (experimental, legacy)
- **Imgur upload** - Direct upload integration
- **Storage management** - IndexedDB browser storage management
- **Help system** - 90+ help pages with navigation
- **Keyboard shortcuts** - Ctrl+Z/Y, Ctrl+C/V/X, tool hotkeys, F11

## Migration Status

### ✅ Completed (99%)

**Infrastructure**:
- Vite build system with multi-page support
- React 18 with TypeScript (JSDoc)
- Zustand state management with IndexedDB persistence
- i18next internationalization (26+ languages)
- Playwright + Cypress E2E testing

**State Management**:
- Migrated from AppContext to Zustand stores
- Optimized with `useShallow` for performance
- IndexedDB persistence for settings/UI/history
- Tree-based history system (HistoryTree class)

**Canvas & Tools**:
- All 16 drawing tools working with full features
- Canvas refactored from ~760 to ~272 lines
- Extracted specialized hooks (drawing, selection, shapes, text, curve/polygon)
- Centralized event handling
- Canvas helpers utility module
- Magnifier coordinate bug fix

**UI Components**:
- Full menu system (File, Edit, View, Image, Colors, Help)
- All dialogs implemented (13 dialogs + MessageBox)
- Help system with navigation
- Floating font selector with FontDetective integration
- Real-time canvas thumbnail
- Selection and canvas resize handles
- Error boundary for crash protection

**Operations**:
- File operations (New, Open, Save, Save As, Load from URL)
- Image transformations (flip, rotate, stretch, skew, invert)
- Clipboard (Cut, Copy, Paste, Copy To, Paste From)
- View toggles (Tool Box, Color Box, Status Bar, Grid, Thumbnail)
- Color editing (HSL color picker)
- Palette import/export (10+ formats)
- Image format I/O (PNG, BMP, GIF, JPEG, WebP)

### 🚧 In Progress (1%)

- Testing and stabilization (comprehensive E2E tests)
- Performance optimization (profiling, memory management)

### ❌ Not Started

- Advanced features (multi-user sessions, eye gaze, speech recognition)
- jQuery removal (planned after React app is production-ready)

## Code Conventions

### File Naming

- `$*.js` - jQuery component wrappers (legacy)
- `On*.js` - Canvas object classes (legacy)
- `*.tsx` - React components with JSX
- `*.ts` - TypeScript utilities/hooks
- `*.jsx` - Legacy React components (being phased out)

### Naming Conventions

- `snake_case` - Legacy JavaScript functions and variables
- `camelCase` - React hooks, functions, and variables
- `PascalCase` - React components, classes, and interfaces
- `UPPER_SNAKE_CASE` - Constants

### JSDoc Requirements

**All React functions must have JSDoc comments** including:
- Brief description
- `@param` for each parameter with type
- `@returns` for return value with type
- `@example` for complex functions

Example:
```typescript
/**
 * Draws a line from (x0, y0) to (x1, y1) using Bresenham's algorithm
 * @param {ImageData} imageData - Canvas ImageData to draw on
 * @param {number} x0 - Starting x coordinate
 * @param {number} y0 - Starting y coordinate
 * @param {number} x1 - Ending x coordinate
 * @param {number} y1 - Ending y coordinate
 * @param {string} color - Color in #RRGGBB format
 * @returns {void}
 * @example
 * bresenhamLine(imageData, 0, 0, 100, 100, '#FF0000');
 */
function bresenhamLine(imageData, x0, y0, x1, y1, color) {
  // ...
}
```

## Testing

### Access Points

- **Workspace Selector**: http://localhost:1999/ (or next available port)
- **Legacy App**: http://localhost:1999/old/
- **React App**: http://localhost:1999/new/

### Test Commands

```bash
npm run test              # Run Playwright tests
npm run test:headed       # Run tests with browser UI
npm run cy:open           # Open Cypress test runner
```

### Test Coverage

- **Magnifier tool** - Coordinate calculations, zoom levels, handle updates
- **Drawing tools** - Pencil, brush, eraser, fill, shapes
- **Selection** - Rectangular, free-form, copy/paste
- **File operations** - Open, save, load from URL
- **Dialogs** - All 13 dialogs + MessageBox

## Performance Considerations

### Optimization Strategies

1. **useShallow** - Prevents re-renders from Zustand store updates
2. **useMemo/useCallback** - Memoizes expensive computations and callbacks
3. **Module-level canvas state** - Persists canvas across React remounts
4. **Incremental font loading** - FontDetective updates dropdown progressively
5. **Tree pruning** - HistoryTree auto-prunes old nodes (configurable limit)
6. **IndexedDB batching** - Debounced writes to prevent excessive I/O

### Memory Management

- Canvas ImageData snapshots stored in HistoryTree
- Configurable history limit (default: 100 nodes)
- Automatic pruning of oldest branches
- Selection ImageData cleared on deselection

## Known Issues

1. **Canvas resize handles** - Only bottom/right edges currently functional
2. **Tree history integration** - Not yet connected to canvas operations (uses linear history)
3. **Legacy dialogs** - Some dialogs still use browser `alert()`/`confirm()` (being migrated to MessageBox)

## Future Work

### Short Term (Next Sprint)

- Complete E2E test coverage
- Performance profiling and optimization
- Replace remaining browser dialogs with MessageBox
- Connect tree history to canvas operations

### Long Term (Post-React Migration)

- Multi-user collaborative sessions (WebRTC)
- Advanced accessibility (eye gaze mode, speech recognition)
- Extended i18n features (RTL improvements)
- jQuery removal and `/old/` cleanup
- Progressive Web App (PWA) support

## Contributing

### Development Workflow

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Access React app: http://localhost:1999/new/
4. Make changes and test
5. Run linters: `npm run lint`
6. Run tests: `npm run test`
7. Build for production: `npm run build`

### Code Quality

- **All React code must have JSDoc comments**
- **TypeScript checking via JSDoc** - Run `npm run lint:tsc`
- **ESLint rules enforced** - Run `npm run lint`
- **No console.log in production** - Use commented out console statements
- **Prefer functional components** - Use hooks over class components
- **Pure utilities** - Keep drawing algorithms in `utils/` as pure functions

---

**Last Updated**: December 31, 2024
**React Migration Progress**: 99% complete
**Status**: Feature parity achieved, testing and stabilization phase
