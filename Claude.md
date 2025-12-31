# MCPaint - Project Summary

## Overview

MCPaint is a pixel-perfect MS Paint clone web application (jspaint.app) currently undergoing migration from jQuery to React. The project uses Vite as its build system and has both legacy (`/old/`) and React preview (`/new/`) versions.

## Project Structure

```
mcpaint/
├── index.html                 # Workspace selector (routes to /new/ or /old/)
├── old/index.html            # Legacy jQuery-based app (primary)
├── new/index.html            # React preview (prototype)
├── src/
│   ├── new/                  # React entry point
│   │   ├── main.jsx
│   │   └── App.jsx
│   ├── react/
│   │   ├── components/       # React components
│   │   │   ├── Canvas.tsx         # Main drawing canvas orchestrator (~250 lines after refactoring)
│   │   │   ├── CanvasOverlay.tsx  # Selection overlay with marching ants
│   │   │   ├── CanvasTextBox.tsx  # Text input overlay
│   │   │   ├── ColorBox.tsx       # Color palette
│   │   │   ├── Component.tsx      # Legacy $Component wrapper
│   │   │   ├── FontBox.tsx        # Font selector
│   │   │   ├── FontBoxWindow.tsx  # Floating font selector window
│   │   │   ├── Frame.tsx          # Main layout with menu bar
│   │   │   ├── ToolBox.tsx        # Tool selection grid
│   │   │   ├── ToolOptions.tsx    # Tool-specific options panel
│   │   │   ├── ThumbnailWindow.tsx# Real-time canvas thumbnail preview (~200 lines)
│   │   │   ├── SelectionHandles.tsx # Resize handles for selections
│   │   │   ├── CanvasResizeHandles.tsx # Resize handles for canvas
│   │   │   ├── help/              # Help system components
│   │   │   │   ├── HelpWindow.tsx
│   │   │   │   ├── HelpContents.tsx
│   │   │   │   └── HelpToolbar.tsx
│   │   │   └── dialogs/           # Dialog components
│   │   │       ├── Dialog.tsx           # Base modal dialog
│   │   │       ├── AboutDialog.tsx      # About Paint dialog
│   │   │       ├── FlipRotateDialog.tsx # Flip/Rotate options
│   │   │       ├── StretchSkewDialog.tsx# Stretch/Skew values
│   │   │       ├── AttributesDialog.tsx # Canvas attributes
│   │   │       ├── CustomZoomDialog.tsx # Custom zoom level
│   │   │       ├── LoadFromUrlDialog.tsx# Load image from URL
│   │   │       ├── SaveAsDialog.tsx     # Save with format selection
│   │   │       ├── EditColorsDialog.tsx # Color editor with HSL controls
│   │   │       ├── HistoryDialog.tsx    # Linear undo/redo history (legacy)
│   │   │       ├── HistoryTreeDialog.tsx# Tree-based history visualization (~430 lines)
│   │   │       ├── ImgurUploadDialog.tsx# Upload to Imgur
│   │   │       └── ManageStorageDialog.tsx # Storage management
│   │   ├── context/
│   │   │   └── AppContext.tsx     # Global state management (~700 lines)
│   │   ├── hooks/            # Custom hooks for canvas operations
│   │   │   ├── useCanvasDrawing.ts      # Core drawing logic
│   │   │   ├── useCanvasSelection.ts    # Selection tools
│   │   │   ├── useCanvasTextBox.ts      # Text tool logic
│   │   │   ├── useCanvasShapes.ts       # Shape tools (line, rect, ellipse)
│   │   │   ├── useCanvasCurvePolygon.ts # Curve and polygon tools
│   │   │   ├── useCanvasEventHandlers.ts# Event handling logic (pointer, text, context menu)
│   │   │   ├── useCanvasLifecycle.ts    # Canvas initialization and cleanup
│   │   │   ├── useAirbrushEffect.ts     # Airbrush continuous spray effect
│   │   │   ├── useMenuActions.ts        # Menu action handlers
│   │   │   └── useSelectionOperations.ts# Selection manipulation (cut, copy, paste)
│   │   ├── menus/            # Menu system
│   │   │   └── menuDefinitions.ts # Full menu structure for all 6 menus
│   │   ├── utils/            # Pure utility functions
│   │   │   ├── drawingUtils.ts    # Drawing algorithms (~460 lines)
│   │   │   ├── imageTransforms.ts # Image transformations (flip, rotate, etc.)
│   │   │   ├── historyTree.ts     # Tree-based history system (~350 lines)
│   │   │   ├── imageFormats.ts    # Image format read/write utilities
│   │   │   ├── paletteFormats.ts  # Palette format read/write utilities
│   │   │   ├── canvasHelpers.ts   # Canvas utility functions (cursor, resize, selection)
│   │   │   └── viewBitmap.ts      # View bitmap in new window
│   │   ├── i18n/             # Internationalization
│   │   │   ├── i18n.ts            # i18next configuration
│   │   │   └── languages.ts       # Language metadata for 26+ languages
│   │   └── data/
│   │       └── palette.ts         # Color palette data
│   ├── $Component.js         # jQuery component helpers (legacy)
│   ├── $ToolBox.js
│   ├── $ColorBox.js
│   ├── $FontBox.js
│   ├── $ToolWindow.js
│   ├── app.js                # Main app (~3400 lines)
│   ├── functions.js          # Core paint functionality (~2200 lines)
│   ├── tools.js              # Tool implementations (~1600 lines)
│   ├── menus.js              # Menu system (~1547 lines)
│   ├── image-manipulation.js # Canvas algorithms (~1740 lines)
│   ├── sessions.js           # Multi-user support
│   ├── helpers.js            # Utilities
│   └── ... (50+ JS files total)
├── styles/
│   ├── layout.css            # Main layout (26.7KB)
│   ├── layout.rtl.css        # RTL version
│   ├── react-preview.css
│   └── themes/               # 8 theme variants
├── lib/                      # Third-party libraries
│   ├── jquery-3.4.1.min.js
│   ├── os-gui/               # Windows-style GUI
│   ├── 98.css/               # Windows 98 CSS
│   └── ... (image format libs, etc.)
├── images/                   # UI assets
├── localization/             # 26 languages
├── help/                     # 90+ help pages
└── cypress/                  # E2E tests
```

## Key Technologies

- **Current**: jQuery 3.4.1, vanilla JavaScript, CSS
- **Target**: React 18, Vite 7, Zustand (state management)
- **Build**: Vite with multi-page app support
- **Testing**: Cypress E2E, Playwright
- **Linting**: ESLint 9, TypeScript (JSDoc type checking)
- **i18n**: i18next with 26+ language support

## Commands

```bash
npm run dev          # Dev server with CSS watch (port 1999)
npm run build        # Production build to /dist/
npm run preview      # Preview build (port 4173)
npm run lint         # Run cspell, tsc, eslint
npm run test         # Cypress E2E tests
npm run cy:open      # Open Cypress UI
```

## Architecture

### Legacy (jQuery) Pattern
- Heavy use of `window` globals for state
- Modules set up globals at import time
- jQuery event bus (`$G`) for inter-module communication
- Direct DOM manipulation

### Key Globals (in legacy code)
```javascript
main_canvas, main_ctx          // Canvas and context
selected_tool, selected_tools  // Current tool state
primary_color, secondary_color // Color state
undos[], redos[]               // History stacks
selection, textbox             // Current editing objects
$G                             // jQuery event emitter
```

### React Pattern (target)
- Component-based UI
- State via Zustand stores (modular state management with IndexedDB persistence)
- Canvas accessed via refs with imperative API
- Custom hooks for canvas operations (drawing, selection, shapes, etc.)
- Legacy CSS reused unchanged

## Paint Features

### 16 Drawing Tools
1. Free-Form Select
2. Rectangular Select
3. Eraser
4. Fill (Bucket)
5. Pick Color (Eyedropper)
6. Magnifier
7. Pencil
8. Brush
9. Airbrush
10. Text
11. Line
12. Curve
13. Rectangle
14. Polygon
15. Ellipse
16. Rounded Rectangle

### File Formats
- **Read**: PNG, BMP, GIF, JPEG, TIFF, PDF
- **Write**: PNG, BMP, GIF, JPEG
- **Palettes**: PAL, GPL, ACT, and 10+ formats

### Special Features
- Non-linear undo/redo tree
- Transparency support
- 8 theme variants
- 26 language support with RTL
- Accessibility: voice control, eye gaze, head tracking
- Multi-user sessions (experimental)
- Imgur upload integration

## Migration Status

### Completed
- Vite build system
- React component structure (Frame, ToolBox, ColorBox, FontBox, Canvas)
- CSS reuse in React preview
- Multi-page Vite configuration
- **AppContext** for state management (React Context + useReducer, fully documented)
- **Zustand state management** with IndexedDB persistence (migrated from AppContext)
- **Canvas component** with drawing support (~250 lines after refactoring)
- **All 16 drawing tools** working (Pencil, Brush, Eraser, Fill, Pick Color, Magnifier, Line, Curve, Rectangle, Ellipse, Rounded Rectangle, Polygon, Text, Airbrush, Rectangular Select, Free-Form Select)
- **Basic undo/redo** (linear stack, Ctrl+Z/Ctrl+Y)
- Color selection (primary/secondary with left/right click)
- **Full menu system** (File, Edit, View, Image, Colors, Help menus)
- **Dialog components** (About, Flip/Rotate, Stretch/Skew, Attributes, Custom Zoom, Load From URL, Save As, Edit Colors, History, Imgur Upload, Manage Storage)
- **Image transformations** (flip horizontal/vertical, rotate, stretch, skew, invert colors)
- **File operations** (New, Open, Save, Save As, Load from URL)
- **Clipboard operations** (Cut, Copy, Paste, Copy To, Paste From)
- **View state management** (toggle Tool Box, Color Box, Status Bar, Grid, Thumbnail, Text Toolbar)
- **ThumbnailWindow** (real-time canvas preview with device pixel ratio support)
- **Help system** (HelpWindow with navigation and content display)
- **Selection handles** (resize handles for selections)
- **Canvas resize handles** (resize handles for canvas edges)
- **FontBoxWindow** (floating font selector with all text formatting options)
- **Tree-based history system** (`historyTree.ts` - non-linear undo/redo with branching)
- **HistoryTreeDialog** (visual tree navigation with SVG, neo-brutalist design)
- **Image format support** (PNG, BMP, GIF, JPEG read/write utilities)
- **Palette format support** (PAL, GPL, ACT and 10+ format read/write utilities)
- **View Bitmap** functionality (open canvas in new window)
- **Internationalization** (i18next integration with 26+ language support)
- **Canvas refactoring** (extracted hooks: useCanvasLifecycle, useAirbrushEffect, useCanvasEventHandlers)
- **Canvas helpers** (canvasHelpers.ts utility module for cursor, resize, selection operations)
- **State management optimization** (useShallow for better performance in Zustand stores)

### In Progress
- Testing and stabilization
- Performance optimization

### Not Started
- Advanced features (multi-user sessions, eye gaze, speech recognition)
- jQuery removal (planned after React app is fully stable)

## Migration Strategy

1. **Phase 1** (mostly done): Vite adoption
2. **Phase 2** (current): React migration
   - Establish state management
   - Port canvas as React component with imperative ref
   - Incrementally migrate tools
   - Port dialogs as React portals

See [MIGRATE.md](MIGRATE.md) for detailed roadmap.

## Code Conventions

- `$*.js` - jQuery component wrappers
- `On*.js` - Canvas object classes
- `*.jsx` - React components
- `snake_case` - Functions and variables
- `PascalCase` - Classes and React components
- JSDoc type annotations throughout

## Key Files for Migration

| Legacy File | Purpose | React Target |
|-------------|---------|--------------|
| `src/$ToolBox.js` | Tool grid UI | `src/react/components/ToolBox.jsx` |
| `src/$ColorBox.js` | Color palette | `src/react/components/ColorBox.jsx` |
| `src/$FontBox.js` | Font selector | `src/react/components/FontBox.jsx` |
| `src/app.js` | Main orchestration | State + App.jsx |
| `src/functions.js` | Drawing functions | Hooks/utilities |
| `src/tools.js` | Tool behaviors | Tool hook/context |
| `src/menus.js` | Menu definitions | Menu components |

## New React Files

### Components
| File | Purpose |
|------|---------|
| `src/react/components/Canvas.tsx` | Main drawing canvas orchestrator (~250 lines after refactoring) |
| `src/react/components/CanvasOverlay.tsx` | Selection overlay with marching ants |
| `src/react/components/CanvasTextBox.tsx` | Text input overlay for text tool |
| `src/react/components/ToolOptions.tsx` | Tool-specific settings panel |
| `src/react/components/ThumbnailWindow.tsx` | Real-time canvas thumbnail preview (~200 lines) |
| `src/react/components/SelectionHandles.tsx` | Resize handles for selections |
| `src/react/components/CanvasResizeHandles.tsx` | Resize handles for canvas edges |
| `src/react/components/FontBoxWindow.tsx` | Floating font selector window |
| `src/react/components/help/HelpWindow.tsx` | Help system window |
| `src/react/components/help/HelpContents.tsx` | Help content display |
| `src/react/components/help/HelpToolbar.tsx` | Help navigation toolbar |

### Dialogs
| File | Purpose |
|------|---------|
| `src/react/components/dialogs/Dialog.tsx` | Base modal dialog component |
| `src/react/components/dialogs/AboutDialog.tsx` | About Paint dialog |
| `src/react/components/dialogs/FlipRotateDialog.tsx` | Flip/Rotate options dialog |
| `src/react/components/dialogs/StretchSkewDialog.tsx` | Stretch/Skew values dialog |
| `src/react/components/dialogs/AttributesDialog.tsx` | Canvas attributes dialog |
| `src/react/components/dialogs/CustomZoomDialog.tsx` | Custom zoom level dialog |
| `src/react/components/dialogs/LoadFromUrlDialog.tsx` | Load image from URL dialog |
| `src/react/components/dialogs/SaveAsDialog.tsx` | Save with format selection dialog |
| `src/react/components/dialogs/EditColorsDialog.tsx` | Color editor with HSL controls |
| `src/react/components/dialogs/HistoryDialog.tsx` | Linear undo/redo history (legacy) |
| `src/react/components/dialogs/HistoryTreeDialog.tsx` | Tree-based history visualization (~430 lines) |
| `src/react/components/dialogs/ImgurUploadDialog.tsx` | Upload to Imgur dialog |
| `src/react/components/dialogs/ManageStorageDialog.tsx` | Storage management dialog |

### Menus
| File | Purpose |
|------|---------|
| `src/react/menus/menuDefinitions.ts` | Full menu structure with all 6 menus (File, Edit, View, Image, Colors, Help) |

### Context
| File | Purpose |
|------|---------|
| `src/react/context/AppContext.tsx` | Global state management with useReducer (~700 lines, fully documented) |

### Hooks
| File | Purpose |
|------|---------|
| `src/react/hooks/useCanvasDrawing.ts` | Core drawing operations (drawPoint, drawLine, erase) |
| `src/react/hooks/useCanvasSelection.ts` | Rectangular and free-form selection tools |
| `src/react/hooks/useCanvasTextBox.ts` | Text box creation and commit logic |
| `src/react/hooks/useCanvasShapes.ts` | Shape tools (line, rectangle, ellipse, rounded rect) |
| `src/react/hooks/useCanvasCurvePolygon.ts` | Multi-click tools (curve, polygon) |
| `src/react/hooks/useCanvasEventHandlers.ts` | All canvas event handlers (pointer, text, context menu) |
| `src/react/hooks/useCanvasLifecycle.ts` | Canvas initialization, persistence, cleanup |
| `src/react/hooks/useAirbrushEffect.ts` | Airbrush continuous spray effect with interval |
| `src/react/hooks/useMenuActions.ts` | Menu action handlers for Edit, View, Image menus |
| `src/react/hooks/useSelectionOperations.ts` | Selection manipulation (cut, copy, paste, drag) |

### Utils
| File | Purpose |
|------|---------|
| `src/react/utils/drawingUtils.ts` | Pure drawing algorithms (bresenhamLine, floodFill, etc.) |
| `src/react/utils/imageTransforms.ts` | Image transformations (flip, rotate, stretch, skew, invert) |
| `src/react/utils/historyTree.ts` | Tree-based history system (~350 lines) |
| `src/react/utils/imageFormats.ts` | Image format read/write utilities (PNG, BMP, GIF, JPEG) |
| `src/react/utils/paletteFormats.ts` | Palette format read/write utilities (PAL, GPL, ACT, etc.) |
| `src/react/utils/canvasHelpers.ts` | Canvas utility functions (cursor styles, resize, selection ops) |
| `src/react/utils/viewBitmap.ts` | View bitmap in new window |

### i18n
| File | Purpose |
|------|---------|
| `src/react/i18n/i18n.ts` | i18next configuration with language detection |
| `src/react/i18n/languages.ts` | Language metadata for 26+ supported languages |

## Tree-Based History System

MCPaint now implements a sophisticated non-linear undo/redo system inspired by version control systems like Git.

### Architecture

**HistoryTree Class** (`src/react/utils/historyTree.ts`)
- Each canvas state is a **HistoryNode** with:
  - Unique ID, timestamp, operation name
  - ImageData (canvas pixels)
  - Optional selection/text box state
  - Parent node reference
  - Array of child nodes (branches)
  - "Soft" flag for skippable intermediate states

- Tree operations:
  - `push()` - Create new state as child of current node
  - `undo()` - Move to parent (skips soft states)
  - `redo()` - Move to most recent child (skips soft states)
  - `goToNode(id)` - Jump to any node by ID
  - `prune(maxNodes)` - Memory management

### Key Features

1. **Non-destructive branching**: Making a change after undo creates a new branch instead of destroying redo history
2. **Visual navigation**: HistoryTreeDialog displays the full tree with SVG
3. **Soft states**: Intermediate states (like preview frames) can be marked as "soft" and skipped during normal undo/redo
4. **Memory management**: Automatic pruning of old nodes while preserving the current path

### HistoryTreeDialog Component

**Visual Design** (Neo-Brutalist "Tech Archive" aesthetic)
- SVG tree visualization with cubic bezier connections
- Monospace fonts (JetBrains Mono, Fira Code)
- Dark color scheme (#0a0a0a background)
- Green accent (#00ff00) for current state
- Blue (#00aaff) for selected nodes
- Animated glow effects and scanline CRT effect
- Thumbnail previews for each state
- Technical metadata (timestamp, dimensions, branch count)

**Features**:
- Auto-scroll to current node on open
- Click any node to jump to that state
- Interactive hover effects
- Grid pattern background
- Dashed animated connections between nodes
- Real-time layout calculation prevents overlaps

### Integration Status

✅ **Completed**:
- HistoryTree class implementation
- HistoryTreeDialog UI component
- Dialog integrated into App.tsx
- SVG visualization working

⏳ **In Progress**:
- Replace linear undo/redo stacks in AppContext with HistoryTree
- Connect dialog to real history data (currently shows `null` placeholders)
- Implement actual navigation from dialog to canvas states

## Testing

Run legacy app: `npm run dev` then visit `http://localhost:1999/old/`
Run React preview: `npm run dev` then visit `http://localhost:1999/new/`
