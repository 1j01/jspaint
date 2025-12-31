# MCPaint State Management

**Zustand + IndexedDB** state management system for MCPaint.

## Quick Start

### 1. Initialize Stores (in App.tsx)

```tsx
import { useInitializeStores } from './context/state';

function App() {
  const { isInitialized, error } = useInitializeStores();

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return <YourApp />;
}
```

### 2. Use Stores in Components

```tsx
import { useColors, useBrushSettings, TOOL_IDS, useToolStore } from './context/state';

function MyComponent() {
  // Get color state and actions
  const { primaryColor, setPrimaryColor, swapColors } = useColors();

  // Get brush settings
  const { brushSize, setBrushSize } = useBrushSettings();

  // Get tool state
  const setTool = useToolStore(state => state.setTool);

  return (
    <div>
      <input
        type="color"
        value={primaryColor}
        onChange={(e) => setPrimaryColor(e.target.value)}
      />
      <button onClick={() => setTool(TOOL_IDS.BRUSH)}>Brush</button>
    </div>
  );
}
```

## Features

✅ **Automatic Persistence** - Settings saved to IndexedDB automatically
✅ **Optimized Performance** - Selective re-rendering with Zustand
✅ **Type-Safe** - Full TypeScript support
✅ **Modular** - Separate stores for different concerns
✅ **History Management** - Undo/redo stored in IndexedDB
✅ **Selector Hooks** - Convenient hooks for common state combinations

## Store Architecture

### settingsStore (Persisted)
User preferences and tool settings:
- Colors (primary, secondary, palette)
- Brush settings (size, shape)
- Shape settings (fill style, line width)
- Font settings
- Canvas defaults

### uiStore (Persisted)
UI visibility and view state:
- Panel visibility (tool box, color box, status bar, etc.)
- Magnification level
- Cursor position (ephemeral)

### toolStore (Session-only)
Active tool and drawing state:
- Selected tool
- Drawing state
- Selection state
- Text box state
- Clipboard

### canvasStore (History in IndexedDB)
Document state and undo/redo:
- Canvas dimensions
- File name and saved status
- Undo/redo stacks

## Selector Hooks

Convenient hooks that combine related state:

```tsx
// Colors
const { primaryColor, secondaryColor, setPrimaryColor, swapColors } = useColors();

// Brush settings
const { brushSize, brushShape, setBrushSize } = useBrushSettings();

// Shape settings
const { fillStyle, lineWidth, setFillStyle } = useShapeSettings();

// Font settings
const { fontFamily, fontSize, fontBold, setFontFamily } = useFontSettings();

// History
const { canUndo, canRedo, saveState, undo, redo } = useHistory();
```

## Performance Tips

### ✅ Good: Selective state selection
```tsx
const primaryColor = useSettingsStore(state => state.primaryColor);
```

### ❌ Bad: Selecting entire store
```tsx
const settings = useSettingsStore(); // Re-renders on ANY change
```

### ✅ Good: Multiple values with object selector
```tsx
const { primaryColor, secondaryColor } = useSettingsStore(state => ({
  primaryColor: state.primaryColor,
  secondaryColor: state.secondaryColor,
}));
```

### ✅ Good: Actions don't cause re-renders
```tsx
const setPrimaryColor = useSettingsStore(state => state.setPrimaryColor);
// Component never re-renders (no state selected)
```

## Persistence

### Auto-persisted
- All `settingsStore` state
- All `uiStore` visibility toggles
- Canvas history (undo/redo) in IndexedDB

### Session-only
- Current tool
- Drawing state
- Selection/text box
- Clipboard
- Cursor position

### Manual persistence
```tsx
import { saveSetting, loadSetting } from './context/state';

await saveSetting('customKey', value);
const value = await loadSetting('customKey', defaultValue);
```

## File Structure

```
src/react/context/state/
├── index.ts                    # Main exports and selector hooks
├── settingsStore.ts            # User preferences (persisted)
├── uiStore.ts                  # UI visibility (persisted)
├── toolStore.ts                # Tool state (session-only)
├── canvasStore.ts              # Canvas and history (IndexedDB)
├── persistence.ts              # IndexedDB layer
└── useInitializeStores.ts      # Initialization hook
```

## Migration from AppContext

See [ZUSTAND_MIGRATION.md](../../../ZUSTAND_MIGRATION.md) for detailed migration guide.

### Before
```tsx
const { state, dispatch } = useAppState();
dispatch({ type: 'SET_PRIMARY_COLOR', payload: '#ff0000' });
```

### After
```tsx
const { primaryColor, setPrimaryColor } = useColors();
setPrimaryColor('#ff0000'); // Auto-persists!
```

## Testing

```tsx
import { useSettingsStore } from './context/state';

// Get/set state without component
const state = useSettingsStore.getState();
useSettingsStore.getState().setPrimaryColor('#ff0000');

// Reset between tests
beforeEach(() => {
  useSettingsStore.setState({ primaryColor: '#000000' });
});
```

## Examples

See [StoreDemo.tsx](../../components/StoreDemo.tsx) for a working demo component.

## Dependencies

- `zustand` - State management
- `idb` - IndexedDB wrapper
