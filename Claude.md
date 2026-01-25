# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MCPaint is a pixel-perfect MS Paint clone web application with both legacy jQuery (`/old/`) and modern React (`/new/`) versions. The React version uses Vite with React Compiler enabled, Zustand for state management, and IndexedDB for persistence. Based on [jspaint.app](https://jspaint.app), it recreates every tool and menu of MS Paint with high fidelity. Deployed on Vercel with Edge Functions for AI features.

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

# Testing (Playwright - runs against React app at port 11822)
npm run test                              # Run all Playwright tests
npm run test -- tests/tools.spec.ts       # Run single test file
npm run test -- tests/dialogs/            # Run all dialog tests
npm run test -- -g "pencil tool"          # Run tests matching pattern
npm run test:headed                       # Run tests with visible browser
npm run test:ui                           # Open Playwright UI
npm run test:debug                        # Debug tests
npm run test:update-snapshots             # Update visual snapshots

# Test organization:
#   tests/*.spec.ts - Core tool and menu tests
#   tests/dialogs/  - Dialog-specific tests (about, attributes, flip-rotate, etc.)
#   tests/tools/    - Tool-specific test helpers
#   tests/utils/    - Shared test utilities

# Localization
npm run update-localization  # Preprocess Windows .rc files to JSON

# Code statistics
npm run sloc                 # Compare legacy vs React implementation line counts
```

## Architecture

### React App (`src/react/` and `src/new/`)

**State Management (Zustand)** - 6 modular stores in `src/react/context/state/`:
- `toolStore.ts` - Active tool, selection, text box, clipboard
- `settingsStore.ts` - Drawing settings (brush, eraser, shapes, fonts)
- `uiStore.ts` - UI visibility, magnification, open dialogs
- `historyStore.ts` - Tree-based undo/redo with branching
- `canvasStore.ts` - Canvas metadata (dimensions, file name)
- `aiStore.ts` - AI chat state (messages, streaming, execution progress)

**Selector Hooks** - Located alongside stores (e.g., `useColors.ts`, `useBrushSettings.ts`). Use `useShallow` from Zustand to prevent unnecessary re-renders.

**Persistence** - `persistence.ts` provides IndexedDB storage via the `idb` library. Stores are auto-saved: settings, UI state, and canvas history. Database name: `mcpaint-db`. See [docs/CANVAS_PERSISTENCE.md](docs/CANVAS_PERSISTENCE.md) for the two-tier persistence strategy (module-level + IndexedDB) and why canvas data must NOT be saved to IndexedDB in React cleanup functions.

**Canvas Architecture** (`src/react/components/Canvas.tsx`):
- Orchestrates specialized hooks for drawing, selection, shapes, text
- `useCanvasEventHandlers` - Centralized event delegation to tool-specific hooks
- `useCanvasLifecycle` - Initialization and cleanup
- Module-level state persists canvas data across React remounts

**Canvas Hooks** (`src/react/hooks/`) - Organized by domain:
- Drawing: `useCanvasDrawing`, `useAirbrushEffect`
- Selection: `useCanvasSelection`, `useRectangularSelection`, `useFreeFormSelection`, `useSelectionOperations`, `useSelectionAnimation`
- Shapes: `useCanvasShapes`, `useCanvasCurvePolygon`
- Text: `useCanvasTextBox`, `useFontState`, `useSystemFonts`
- Events/Lifecycle: `useCanvasEventHandlers`, `useCanvasLifecycle`, `useKeyboardShortcuts`
- UI: `useDraggable`, `useResizable`, `useColorPicker`, `useColorCanvases`, `useDialogHandlers`
- AI: `useAIChat`, `useCommandExecutor`

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

**i18n** - Uses i18next with JSON translations in `/public/locales/` (one `translation.json` per language). The `/localization/` directory contains legacy Windows .rc resource files used as source material; run `npm run update-localization` to regenerate JSON from .rc files. All UI text uses `useTranslation()` hook. 26 languages supported including RTL (Arabic, Hebrew).

### Legacy jQuery App (`src/` root-level `.js` files)

- `app.js` - Main orchestration (~3400 lines)
- `functions.js` - Drawing functions (~2200 lines)
- `tools.js` - Tool implementations (~1600 lines)
- `menus.js` - Menu system (~1550 lines)
- `$*.js` files - jQuery component wrappers

### Build System

Vite multi-page app (`vite.config.js`) with React Compiler enabled (`babel-plugin-react-compiler`). Entry points:
- `/index.html` - Workspace selector
- `/new/index.html` - React app
- `/old/` - Legacy app (copied as static files, not processed by Vite)

**CSS RTL** - `styles/layout.css` is auto-processed by RTLCSS to generate `layout.rtl.css`. When editing layout styles, test RTL by switching language to Arabic or Hebrew.

### AI Integration

Natural language canvas control via Claude API with Server-Sent Events (SSE). See [docs/AI.md](docs/AI.md) for full command specifications.

**Architecture**:
- `api/ai/draw.ts` - Vercel Edge Function proxying Claude API with tool calling
- `src/react/services/aiService.ts` - SSE client handling streaming responses
- `src/react/hooks/useCommandExecutor.ts` - Maps AI commands to drawing utilities
- `src/react/hooks/useAIChat.ts` - Combines store, service, and command execution
- `src/react/components/ai/` - Chat UI components (AIChatPanel, MessageList, ChatInput)

**50+ Drawing Commands** including pencil, brush, shapes, selection, transforms, canvas operations, color management, and batch operations for complex drawings.

**Environment Variables**:
```env
ANTHROPIC_API_KEY=sk-ant-...  # Required for AI features
```

**Access**: View > AI Assistant

## Testing

Playwright tests run against the React app at `http://localhost:11822/new/`. The test server starts automatically.

**Writing Tests**:
- Place new tests in `tests/` or `tests/dialogs/` for dialog-specific tests
- Use helpers from `tests/utils/` (e.g., `canvasUtils.ts` for canvas interactions)
- Tests support visual snapshots with `toHaveScreenshot()` (max 100 pixel diff allowed)
- Run `npm run test:update-snapshots` after intentional visual changes

**Test Configuration** (`playwright.config.ts`):
- Chromium only (no Firefox/Safari)
- 30s test timeout, 10s expect timeout
- Screenshots/video captured on failure
- Parallel execution locally, sequential on CI

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

## Supported Formats

**Images**: PNG (recommended), BMP (mono/16/256/24-bit), TIFF, PDF (read), WebP, GIF, JPEG, SVG (read), ICO (read).

**Palettes**: RIFF PAL, GIMP GPL, Adobe ACO/ASE/ACT, Paint.NET TXT, Paint Shop Pro PAL, CSS/HTML color extraction, and more via [AnyPalette.js](https://github.com/1j01/anypalette.js).

## Access Points

- http://localhost:1999/ - Workspace selector
- http://localhost:1999/new/ - React app
- http://localhost:1999/old/ - Legacy jQuery app
- Tests run against http://localhost:11822/new/ (auto-started by Playwright)

## Debugging

**Clear IndexedDB State**: To reset persisted state during development, open browser DevTools > Application > IndexedDB > delete `mcpaint-db`.

**VS Code Debugging**: Launch configuration in `.vscode/launch.json` for attaching to Chrome.

## Key Features Beyond MS Paint

- Unlimited undo/redo with non-linear history tree (Edit > History)
- Transparent image editing (Image > Attributes > Transparent)
- Non-contiguous fill (Shift + Fill tool replaces color everywhere)
- Crop to selection (Ctrl + selection)
- Arbitrary angle rotation and zoom levels
- Themes (Extras > Themes) including dark mode
- Multi-language support (26 languages including RTL)
- Accessibility: Dwell Clicker, Speech Recognition, Head Tracker
- AI Assistant: Natural language drawing control via Claude API (View > AI Assistant)
