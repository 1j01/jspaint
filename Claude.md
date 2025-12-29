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
│   ├── react/components/     # React components
│   │   ├── Component.jsx     # Legacy $Component wrapper
│   │   ├── Frame.jsx         # Main layout with menu bar
│   │   ├── ToolBox.jsx       # Tool selection grid
│   │   ├── ColorBox.jsx      # Color palette
│   │   ├── FontBox.jsx       # Font selector
│   │   └── index.js
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
- **Target**: React 18, Vite 7
- **Build**: Vite with multi-page app support
- **Testing**: Cypress E2E
- **Linting**: ESLint 9, TypeScript (JSDoc type checking)

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
- State via useState/useContext (or Redux/Zustand TBD)
- Canvas accessed via refs with imperative API
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
- **AppContext** for state management (React Context + useReducer)
- **Canvas component** with drawing support
- **Pencil, Brush, Eraser tools** working
- **Basic undo/redo** (linear stack, Ctrl+Z/Ctrl+Y)
- Color selection (primary/secondary with left/right click)

### In Progress
- Additional tools (shapes, selection, fill)

### Not Started
- Tree-based undo/redo (branching history)
- File I/O in React
- Menu actions wired to React
- Selection tools
- Shape tools (rectangle, ellipse, line, etc.)
- jQuery removal

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

| File | Purpose |
|------|---------|
| `src/react/context/AppContext.jsx` | Global state management with useReducer |
| `src/react/components/Canvas.jsx` | Drawing canvas with tool support |

## Testing

Run legacy app: `npm run dev` then visit `http://localhost:1999/old/`
Run React preview: `npm run dev` then visit `http://localhost:1999/new/`
