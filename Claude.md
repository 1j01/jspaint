# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MCPaint is a pixel-perfect MS Paint clone web application with both legacy jQuery (`/old/`) and modern React (`/new/`) versions. The React version uses Vite, Zustand for state management, and IndexedDB for persistence.

## Commands

```bash
# Development
npm run dev              # Dev server with CSS watch (starts at port 1999)
npm run build            # Production build to /dist/
npm run preview          # Preview production build (port 4173)

# Linting (runs all: cspell, tsc, eslint)
npm run lint             # Run all linters
npm run lint-tsc         # TypeScript checking for legacy code
npm run lint-tsc-react   # TypeScript checking for React code
npm run lint-eslint      # ESLint only
npm run format           # Format React code with Prettier

# Testing (Playwright)
npm run test                     # Run all Playwright tests
npm run test -- tests/tools.spec.ts              # Run single test file
npm run test -- -g "pencil tool"                 # Run tests matching pattern
npm run test:headed              # Run tests with visible browser
npm run test:ui                  # Open Playwright UI
npm run test:debug               # Debug tests
npm run test:update-snapshots    # Update visual snapshots
```

## Architecture

### React App (`src/react/` and `src/new/`)

**State Management (Zustand)** - 5 modular stores in `src/react/context/state/`:
- `toolStore.ts` - Active tool, selection, text box, clipboard
- `settingsStore.ts` - Drawing settings (brush, eraser, shapes, fonts)
- `uiStore.ts` - UI visibility, magnification, open dialogs
- `historyStore.ts` - Tree-based undo/redo with branching
- `canvasStore.ts` - Canvas metadata (dimensions, file name)

**Selector Hooks** - Located alongside stores (e.g., `useColors.ts`, `useBrushSettings.ts`). Use `useShallow` from Zustand to prevent unnecessary re-renders.

**Canvas Architecture** (`src/react/components/Canvas.tsx`):
- Orchestrates specialized hooks for drawing, selection, shapes, text
- `useCanvasEventHandlers` - Centralized event delegation to tool-specific hooks
- `useCanvasLifecycle` - Initialization and cleanup
- Module-level state persists canvas data across React remounts

**Key Hook Pattern**:
```typescript
const drawingOps = useCanvasDrawing(canvasRef);
const shapeOps = useCanvasShapes(canvasRef);
const selectionOps = useCanvasSelection(canvasRef);
// Event handler delegates to appropriate ops based on active tool
useCanvasEventHandlers({ canvasRef, drawingOps, shapeOps, selectionOps, ... });
```

**Pure Utilities** (`src/react/utils/`):
- `drawingUtils.ts` - Bresenham line, flood fill, shape algorithms
- `imageTransforms.ts` - Flip, rotate, stretch, skew
- `historyTree.ts` - Non-linear undo/redo tree structure
- `imageFormats.ts` / `paletteFormats.ts` - File I/O for images and palettes
- `colorUtils.ts` - Color space conversion (RGB, HSL, hex)

**Dialogs** - Portal-based in `src/react/components/dialogs/`. Rendered via `DialogManager` component based on `uiStore.dialogs` state.

### Legacy jQuery App (`src/` root-level `.js` files)

- `app.js` - Main orchestration
- `functions.js` - Drawing functions
- `tools.js` - Tool implementations
- `menus.js` - Menu system
- `$*.js` files - jQuery component wrappers

## Code Conventions

**Naming**:
- React: `camelCase` for functions/variables, `PascalCase` for components
- Legacy: `snake_case` for functions/variables
- Files: `*.tsx` for React components, `*.ts` for utilities/hooks

**JSDoc** - All React functions require JSDoc with `@param` and `@returns` types.

**TypeScript** - Uses JSDoc type annotations (not `.d.ts` files). Run `npm run lint-tsc-react` to check.

**Path Aliases** (in tsconfig.json):
- `@/*` → `src/*`
- `@react/*` → `src/react/*`

## 16 Drawing Tools

Free-Form Select, Rectangular Select, Eraser, Fill (flood fill), Pick Color (eyedropper), Magnifier (1x-8x zoom), Pencil, Brush, Airbrush, Text, Line (Bresenham), Curve (cubic bezier), Rectangle, Polygon, Ellipse, Rounded Rectangle.

## Access Points

- http://localhost:1999/ - Workspace selector
- http://localhost:1999/new/ - React app
- http://localhost:1999/old/ - Legacy jQuery app
