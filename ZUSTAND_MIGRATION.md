# Zustand State Management Migration Guide

## Overview

MCPaint now uses **Zustand** for state management with **IndexedDB** persistence. This replaces the previous React Context + useReducer approach with a more performant, modular solution.

## Architecture

State is split into four specialized stores:

### 1. **settingsStore** (Persisted)
User preferences and tool settings that persist across sessions:
- Colors (primary, secondary, palette)
- Tool settings (brush size, eraser size, airbrush size, etc.)
- Shape settings (fill style, line width)
- Font settings (family, size, bold, italic, underline)
- Canvas defaults

### 2. **uiStore** (Persisted)
UI visibility and view state:
- Panel visibility (tool box, color box, status bar, etc.)
- Magnification level
- Cursor position (not persisted - ephemeral)

### 3. **toolStore** (Session-only)
Active tool and drawing state:
- Selected tool ID
- Drawing state (isDrawing flag)
- Selection state
- Text box state
- Clipboard

### 4. **canvasStore** (IndexedDB for history)
Document state and undo/redo:
- Canvas dimensions
- File name and saved status
- Undo/redo stacks (stored in IndexedDB)

## Migration from AppContext

### Before (AppContext):
```tsx
import { useAppState } from '../context/AppContext';

function MyComponent() {
  const { state, dispatch } = useAppState();

  const handleColorChange = (color) => {
    dispatch({ type: 'SET_PRIMARY_COLOR', payload: color });
  };

  return <div style={{ color: state.primaryColor }}>...</div>;
}
```

### After (Zustand):
```tsx
import { useSettingsStore } from '../context/state';

function MyComponent() {
  // Select only the state you need (automatic re-render on change)
  const primaryColor = useSettingsStore(state => state.primaryColor);
  const setPrimaryColor = useSettingsStore(state => state.setPrimaryColor);

  const handleColorChange = (color) => {
    setPrimaryColor(color); // Automatically persists to IndexedDB
  };

  return <div style={{ color: primaryColor }}>...</div>;
}
```

### Using Selector Hooks (Recommended):
```tsx
import { useColors, useShapeSettings, useBrushSettings } from '../context/state';

function MyComponent() {
  // Get all color-related state and actions
  const { primaryColor, secondaryColor, setPrimaryColor, swapColors } = useColors();

  // Get all shape settings
  const { fillStyle, lineWidth, setFillStyle } = useShapeSettings();

  // Get all brush settings
  const { brushSize, brushShape, setBrushSize } = useBrushSettings();

  // ...
}
```

## Common Migration Patterns

### 1. Reading State
```tsx
// OLD
const { state } = useAppState();
const color = state.primaryColor;

// NEW
const primaryColor = useSettingsStore(state => state.primaryColor);
// OR use selector hook
const { primaryColor } = useColors();
```

### 2. Updating State
```tsx
// OLD
dispatch({ type: 'SET_PRIMARY_COLOR', payload: '#ff0000' });

// NEW
const setPrimaryColor = useSettingsStore(state => state.setPrimaryColor);
setPrimaryColor('#ff0000'); // Auto-persists to IndexedDB
```

### 3. Multiple State Values
```tsx
// OLD
const { state } = useAppState();
const toolId = state.selectedToolId;
const isDrawing = state.isDrawing;

// NEW - Select multiple values efficiently
const { selectedToolId, isDrawing } = useToolStore(state => ({
  selectedToolId: state.selectedToolId,
  isDrawing: state.isDrawing,
}));
```

### 4. Undo/Redo
```tsx
// OLD
dispatch({ type: 'PUSH_UNDO', payload: imageData });
dispatch({ type: 'UNDO', payload: currentImageData });

// NEW
const { saveState, undo, redo, canUndo, canRedo } = useHistory();

// Save state (async - stores in IndexedDB)
await saveState(imageData);

// Undo (async - retrieves from IndexedDB)
const previousImageData = await undo();
if (previousImageData) {
  ctx.putImageData(previousImageData, 0, 0);
}
```

### 5. Tool Selection
```tsx
// OLD
import { TOOL_IDS } from '../context/AppContext';
dispatch({ type: 'SET_TOOL', payload: TOOL_IDS.BRUSH });

// NEW
import { TOOL_IDS, useToolStore } from '../context/state';
const setTool = useToolStore(state => state.setTool);
setTool(TOOL_IDS.BRUSH);
```

## App Initialization

Update your root App component to initialize stores:

```tsx
import { useInitializeStores } from './context/state/useInitializeStores';

function App() {
  const { isInitialized, error } = useInitializeStores();

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.error('Store initialization error:', error);
    // Continue anyway - will use default values
  }

  return <YourApp />;
}
```

## Performance Benefits

### 1. Selective Re-rendering
Components only re-render when their selected state changes:

```tsx
// ✅ Only re-renders when primaryColor changes
const primaryColor = useSettingsStore(state => state.primaryColor);

// ❌ Re-renders on ANY settings change
const settings = useSettingsStore();
```

### 2. Actions Don't Cause Re-renders
Selecting only action functions doesn't subscribe to state:

```tsx
// ✅ Never re-renders (no state selected)
const setPrimaryColor = useSettingsStore(state => state.setPrimaryColor);

// ✅ Re-renders only when primaryColor changes
const primaryColor = useSettingsStore(state => state.primaryColor);
```

### 3. Computed Selectors
Create derived state without re-rendering parent:

```tsx
const fontStyle = useSettingsStore(state =>
  `${state.fontBold ? 'bold' : 'normal'} ${state.fontSize}px ${state.fontFamily}`
);
```

## Persistence

### Auto-persisted Settings
These settings automatically save to IndexedDB:
- All settings in `settingsStore`
- All UI visibility state in `uiStore`
- Canvas history in `canvasStore` (undo/redo)

### Session-only State
These states are NOT persisted:
- Current tool (`toolStore.selectedToolId`)
- Drawing state (`toolStore.isDrawing`)
- Selection and text box state
- Clipboard
- Cursor position

### Manual Persistence
To manually save/load custom data:

```tsx
import { saveSetting, loadSetting } from './context/state';

// Save
await saveSetting('myCustomKey', { foo: 'bar' });

// Load
const value = await loadSetting('myCustomKey', { foo: 'default' });
```

## Testing

### Accessing Store in Tests
```tsx
import { useSettingsStore } from './context/state';

// Get state without component
const state = useSettingsStore.getState();
console.log(state.primaryColor);

// Call actions without component
useSettingsStore.getState().setPrimaryColor('#ff0000');

// Reset store between tests
beforeEach(() => {
  useSettingsStore.setState({
    primaryColor: '#000000',
    // ... reset other state
  });
});
```

## Complete Store Reference

### settingsStore
```tsx
const {
  // Colors
  primaryColor, secondaryColor, palette,
  setPrimaryColor, setSecondaryColor, swapColors,

  // Brush settings
  brushSize, brushShape, pencilSize, eraserSize, airbrushSize,
  setBrushSize, setBrushShape, setEraserSize, setAirbrushSize,

  // Shape settings
  fillStyle, lineWidth,
  setFillStyle, setLineWidth,

  // Font settings
  fontFamily, fontSize, fontBold, fontItalic, fontUnderline, textTransparent,
  setFontFamily, setFontSize, setFontStyle, setTextTransparent,

  // Canvas defaults
  defaultCanvasWidth, defaultCanvasHeight,

  // Image mode
  drawOpaque, toggleDrawOpaque,

  // Initialization
  loadPersistedSettings,
} = useSettingsStore();
```

### uiStore
```tsx
const {
  showToolBox, showColorBox, showStatusBar, showTextToolbar, showGrid, showThumbnail,
  toggleToolBox, toggleColorBox, toggleStatusBar, toggleTextToolbar, toggleGrid, toggleThumbnail,
  magnification, setMagnification,
  cursorPosition, setCursorPosition,
  loadPersistedUIState,
} = useUIStore();
```

### toolStore
```tsx
const {
  selectedToolId, setTool,
  isDrawing, setDrawing,
  selection, setSelection, clearSelection,
  textBox, setTextBox, clearTextBox,
  clipboard, setClipboard,
} = useToolStore();
```

### canvasStore
```tsx
const {
  canvasWidth, canvasHeight, setCanvasSize,
  fileName, setFileName,
  saved, setSaved,
  undoStack, redoStack, maxHistorySize,
  saveState, undo, redo, clearHistory,
} = useCanvasStore();
```

## Cleanup

After migrating all components, you can:

1. Remove `src/react/context/AppContext.tsx`
2. Remove any `AppProvider` wrappers
3. Update imports throughout the codebase

## Troubleshooting

### State not persisting
- Check browser IndexedDB is enabled
- Check for quota errors in console
- Verify `loadPersistedSettings()` and `loadPersistedUIState()` are called on app init

### Components not re-rendering
- Ensure you're selecting state, not just actions
- Use shallow equality for object selections
- Check selector function is correctly accessing state

### Performance issues
- Avoid selecting entire store: `useSettingsStore()`
- Use specific selectors: `useSettingsStore(state => state.primaryColor)`
- Consider using selector hooks: `useColors()`, `useBrushSettings()`, etc.
