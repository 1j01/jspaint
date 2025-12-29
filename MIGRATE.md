# Migration Roadmap

## Current State (Updated December 2024)

The project has successfully completed Phase 1 (Vite adoption) and begun Phase 2 (React migration):

- **Build System**: Vite is fully configured with multi-page app support
- **Legacy App**: Moved to `/old/` subdirectory, fully functional
- **React Preview**: Available at `/new/` with basic UI components
- **Entry Points**: `index.html` (selector), `old/index.html` (legacy), `new/index.html` (React)

## Architecture Overview

### Legacy Architecture (`/old/`)
- `old/index.html` loads 20+ `<script type="module">` tags
- `src/app.js` orchestrates runtime behavior (~3400 lines)
- Heavy reliance on jQuery-style helpers (`$Component`, `$ToolWindow`, `$G`)
- Global variables on `window` for cross-module communication
- CSS in `styles/layout.css` with dynamic theme loading

### React Architecture (`/new/`)
- `src/new/main.jsx` - React entry point
- `src/new/App.jsx` - Main app component with basic state
- `src/react/components/` - UI components (Frame, ToolBox, ColorBox, FontBox)
- Reuses legacy CSS from `styles/`

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

## Phase 2 – React Migration (IN PROGRESS)

### 1. Foundational groundwork

#### Completed ✅
- React 18 and React DOM installed
- JSX components created in `src/react/components/`
- React entry point at `src/new/main.jsx`
- Basic state management with `useState` in App.jsx

#### TODO
- [x] Decide on state management strategy (Context + hooks vs Zustand vs Redux) - **Using React Context + useReducer**
- [ ] Create migration spreadsheet mapping globals to React state
- [x] Establish TypeScript or stricter JSDoc conventions - **Using TypeScript (.tsx files)**

### 2. Incremental componentization

#### Completed ✅
| Legacy Module | React Component | Status |
|---------------|-----------------|--------|
| `$Component.js` | `Component.tsx` | Wrapper created |
| `$ToolBox.js` | `ToolBox.tsx` | Full implementation |
| `$ColorBox.js` | `ColorBox.tsx` | Full implementation |
| `$FontBox.js` | `FontBox.tsx` | Partial implementation |
| Layout chrome | `Frame.tsx` | Basic layout with menu bar |
| Canvas | `Canvas.tsx` | Full implementation with all tools |

#### TODO - UI Components
- [ ] Port menu system to React (currently bridged via legacy MenuBar)
- [ ] Create StatusBar component
- [ ] Create ToolOptions component (fill style, line width selector)
- [ ] Create dialog components (About, Help, etc.)

#### TODO - Canvas Components
- [x] Create Canvas component with imperative ref API
- [ ] Port Handles.js for resize/selection handles
- [x] Port OnCanvasSelection.js - **Implemented in Canvas.tsx**
- [x] Port OnCanvasTextBox.js - **Implemented in Canvas.tsx**
- [ ] Port OnCanvasHelperLayer.js

### 3. State migration

#### Core State - Implemented ✅
- [x] Create AppContext with core state:
  - `selectedTool` / `selectedTools`
  - `primaryColor` / `secondaryColor`
  - `palette`
  - `canvasSize` (width/height)
  - `brushSize` / `pencilSize` / `eraserSize`
  - `fileName` / `saved` status
- [x] Create basic undo/redo history (linear stack)
- [x] Create shared canvas ref via context

#### Advanced State - Implemented ✅
- [ ] Port tree-based history from `functions.js` (branching undo/redo)
- [x] Add `magnification` state
- [x] Add Selection state (rectangular and free-form)
- [x] Add active text box state
- [x] Add shape settings (fillStyle, lineWidth)

#### TODO - Tool State
- [x] Create tools registry/context
- [ ] Port tool implementations from `tools.js`
- [ ] Connect tools to canvas via context

### 4. Core functionality migration

#### Drawing Functions - Implemented ✅
Key functions ported to `src/react/utils/drawingUtils.ts` and hooks:
- [x] `bresenhamLine()` - Bresenham algorithm for pixel-perfect lines
- [x] `drawPolygon()` - Polygon rendering with fill support
- [x] `drawEllipse()` - Canvas ellipse API
- [x] `drawRectangle()` - With fill style support
- [x] `drawRoundedRectangle()` - Rounded rectangle with fill support
- [x] `floodFill()` - Scanline-based flood fill algorithm
- [x] `sprayAirbrush()` - Random spray pattern
- [x] `getBrushPoints()` - Brush shape calculations
- [x] `getRgbaFromColor()` - Color parsing utility
- [x] Selection tools - Rectangular and free-form with marching ants (in `useCanvasSelection`)

#### TODO - Drawing Functions
- [x] `drawRoundedRectangle()` - ✅ Implemented in `drawingUtils.ts`
- [ ] `select_all()`, `delete_selection()`
- [ ] `crop_to_selection()`
- [ ] `image_invert_colors()`, `image_flip_horizontal/vertical()`

#### TODO - Image Manipulation
From `src/image-manipulation.js`:
- [ ] Canvas rotation algorithms
- [ ] Stretch/skew operations
- [ ] Color quantization
- [ ] Image tracing

#### TODO - File Operations
- [ ] File open/save dialogs
- [ ] Format encoding/decoding (PNG, BMP, GIF, JPEG)
- [ ] Palette import/export

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

#### Priority 4 - Polish (In Progress)
1. ~~Menu system fully in React~~ ✅ (Edit menu with undo/redo/cut/copy/paste)
2. All dialogs as React components
3. ~~Keyboard shortcuts~~ ✅ (Ctrl+Z/Y, tool hotkeys, clipboard shortcuts)
4. File operations
5. ~~Clipboard operations~~ ✅ (Copy, Cut, Paste)

#### Additional UI Components Implemented
- ~~ToolOptions panel~~ ✅ (brush size, line width, fill style per tool)
- ~~Status bar~~ ✅ (cursor position, selection/canvas dimensions)
- ~~Cursor position tracking~~ ✅

#### Priority 5 - Advanced Features
1. Multi-user sessions
2. Speech recognition
3. Eye gaze mode
4. Themes (already CSS-based)
5. Localization

### 6. Migration sequencing

- [x] **Phase 0**: Vite build working, legacy app preserved
- [x] **Phase 1**: React shell with basic UI components
- [x] **Phase 2**: Canvas integration with drawing capability
- [x] **Phase 3**: Basic tool implementations (Pencil, Brush, Eraser)
- [x] **Phase 4**: State management with undo/redo
- [x] **Phase 5**: Additional tools (shapes, selection, fill, text, magnifier) - ALL DONE
- [ ] **Phase 6**: File operations and dialogs
- [ ] **Phase 7**: Remove jQuery, delete legacy code

## Technical Decisions Needed

### State Management
Options to evaluate:
1. **React Context + useReducer** - Simple, no dependencies
2. **Zustand** - Lightweight, good for imperative canvas ops
3. **Redux Toolkit** - Full-featured, good for complex undo/redo

Recommendation: Start with Context + hooks, migrate to Zustand if needed.

### Canvas Integration Pattern
Options:
1. **Imperative ref** - Expose canvas methods via `forwardRef`
2. **Effect-based** - Redraw in `useEffect` based on state
3. **Hybrid** - State for UI, imperative for drawing

Recommendation: Hybrid approach - React manages tool/color state, canvas ops are imperative.

### Component Library
Options:
1. **Keep os-gui** - Already integrated, Windows 98 look
2. **Custom components** - More control, more work
3. **Headless UI** - Accessibility built-in

Recommendation: Keep os-gui for menus/dialogs, custom for paint-specific UI.

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
| `src/new/main.jsx` | React entry point |
| `src/new/App.jsx` | Main app component |

#### Components
| File | Purpose |
|------|---------|
| `src/react/components/Frame.tsx` | Layout container |
| `src/react/components/ToolBox.tsx` | Tool grid |
| `src/react/components/ColorBox.tsx` | Color palette |
| `src/react/components/FontBox.tsx` | Font selector |
| `src/react/components/Component.tsx` | Legacy wrapper |
| `src/react/components/Canvas.tsx` | Main drawing canvas orchestrator (~360 lines) |
| `src/react/components/CanvasOverlay.tsx` | Selection overlay with marching ants |
| `src/react/components/CanvasTextBox.tsx` | Text input overlay for text tool |
| `src/react/components/ToolOptions.tsx` | Tool-specific settings panel |

#### Context
| File | Purpose |
|------|---------|
| `src/react/context/AppContext.tsx` | Global state management with reducer (~600 lines) |

#### Custom Hooks
| File | Purpose |
|------|---------|
| `src/react/hooks/useCanvasDrawing.ts` | Core drawing operations (drawPoint, drawLine, erase) |
| `src/react/hooks/useCanvasSelection.ts` | Rectangular and free-form selection tools (~440 lines) |
| `src/react/hooks/useCanvasTextBox.ts` | Text box creation and commit logic |
| `src/react/hooks/useCanvasShapes.ts` | Shape tools (line, rectangle, ellipse, rounded rect) |
| `src/react/hooks/useCanvasCurvePolygon.ts` | Multi-click tools (curve, polygon) |

#### Utilities
| File | Purpose |
|------|---------|
| `src/react/utils/drawingUtils.ts` | Pure drawing algorithms (~460 lines) |
| `src/react/data/palette.ts` | Color palette data |

### Key State Interfaces (AppContext.tsx)
- `Selection`: `{ x, y, width, height, imageData, path? }` for rect/freeform selection
- `TextBoxState`: `{ x, y, width, height, text, font settings, isActive }`
- State: `selection`, `textBox`, `magnification`, `fillStyle`, `lineWidth`, `clipboard`, `cursorPosition`, font settings

### Context Hooks (AppContext.tsx)
| Hook | Purpose |
|------|---------|
| `useColors()` | Primary/secondary colors, palette |
| `useTool()` | Selected tool, brush/eraser sizes |
| `useCanvas()` | Canvas dimensions, drawing state |
| `useHistory()` | Undo/redo with saveState |
| `useSelection()` | Selection state management |
| `useClipboard()` | Copy, cut, paste operations |
| `useMagnification()` | Zoom level control |
| `useTextBox()` | Text tool state and font settings |
| `useShapeSettings()` | Fill style and line width |
| `useCursorPosition()` | Cursor tracking for status bar |

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
http://localhost:1999/new/    # React preview

# Build & Test
npm run build         # Production build
npm run preview       # Preview build
npm run test          # Cypress E2E tests
npm run lint          # ESLint + TypeScript check
```
