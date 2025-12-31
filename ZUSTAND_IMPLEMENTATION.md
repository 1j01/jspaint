# Zustand + IndexedDB State Management Implementation

## What Was Built

A complete, production-ready state management system for MCPaint using **Zustand** and **IndexedDB**, replacing the previous React Context + useReducer approach.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ settingsStore  │  │   uiStore     │  │   toolStore    ││
│  │  (Persisted)   │  │ (Persisted)   │  │ (Session-only) ││
│  │                │  │               │  │                ││
│  │ • Colors       │  │ • Visibility  │  │ • Active tool  ││
│  │ • Brush size   │  │ • Panels      │  │ • Drawing      ││
│  │ • Shape style  │  │ • Magnify     │  │ • Selection    ││
│  │ • Fonts        │  │ • Grid        │  │ • Clipboard    ││
│  └───────┬────────┘  └───────┬───────┘  └────────────────┘│
│          │                   │                             │
│          └───────────────────┴─────────────────┐           │
│                                                 │           │
│  ┌──────────────────────────────────────────────▼──────┐   │
│  │              canvasStore                            │   │
│  │            (History in IndexedDB)                   │   │
│  │                                                     │   │
│  │  • Canvas dimensions  • Undo/Redo                  │   │
│  │  • File name          • Save state                 │   │
│  └──────────────────────────┬──────────────────────────┘   │
│                             │                              │
└─────────────────────────────┼──────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   IndexedDB       │
                    │  (Browser Storage)│
                    │                   │
                    │ • Settings        │
                    │ • UI State        │
                    │ • Canvas History  │
                    └───────────────────┘
```

## Files Created

### Core State Management
1. **`src/react/context/state/persistence.ts`** (169 lines)
   - IndexedDB wrapper using `idb` library
   - Clean API for saving/loading settings
   - Canvas history storage with cleanup
   - Type-safe database schema

2. **`src/react/context/state/settingsStore.ts`** (189 lines)
   - User preferences (colors, brush, shape, font settings)
   - Auto-persists all changes to IndexedDB
   - Default values matching original MS Paint

3. **`src/react/context/state/uiStore.ts`** (104 lines)
   - UI visibility toggles (toolbox, colorbox, status bar, etc.)
   - Magnification level
   - Auto-persists preferences

4. **`src/react/context/state/toolStore.ts`** (95 lines)
   - Active tool selection
   - Drawing state (isDrawing flag)
   - Selection and text box state
   - Clipboard (session-only, not persisted)

5. **`src/react/context/state/canvasStore.ts`** (122 lines)
   - Canvas dimensions and file metadata
   - Undo/redo with IndexedDB storage
   - Automatic cleanup of old history entries
   - Async undo/redo operations

6. **`src/react/context/state/index.ts`** (141 lines)
   - Main exports and type re-exports
   - Convenient selector hooks (`useColors()`, `useBrushSettings()`, etc.)
   - Store initialization function
   - Performance-optimized selectors

7. **`src/react/context/state/useInitializeStores.ts`** (32 lines)
   - React hook for app initialization
   - Loads persisted state on mount
   - Error handling with fallback to defaults

### Documentation
8. **`ZUSTAND_MIGRATION.md`** (585 lines)
   - Complete migration guide from AppContext
   - Before/after code examples
   - Common migration patterns
   - Performance tips and troubleshooting

9. **`src/react/context/state/README.md`** (191 lines)
   - Quick start guide
   - API reference
   - Performance best practices
   - File structure overview

### Demo & Examples
10. **`src/react/components/StoreDemo.tsx`** (138 lines)
    - Interactive demo component
    - Shows all store features
    - Persistence testing UI

## Key Features

### 🚀 Performance Optimizations
- **Selective Re-rendering**: Components only re-render when their selected state changes
- **Granular Subscriptions**: Zustand's subscription model beats Context performance
- **Computed Selectors**: Derive state without re-rendering parents
- **No Provider Hell**: Direct imports, no wrapper components needed

### 💾 Smart Persistence
- **Auto-save**: Settings automatically persist to IndexedDB on change
- **Async Storage**: Undo/redo stored in IndexedDB (unlimited history)
- **Automatic Cleanup**: Old history entries pruned automatically
- **Error Resilient**: Falls back to defaults if storage fails

### 🎯 Developer Experience
- **Type-Safe**: Full TypeScript support with exported types
- **Modular**: Separate stores for different concerns
- **Selector Hooks**: Convenient hooks for common state combinations
- **Easy Testing**: Access stores without components
- **Zero Boilerplate**: No actions, reducers, or dispatch needed

### 📦 Modular Architecture
- **settingsStore**: User preferences (persisted)
- **uiStore**: UI state (persisted)
- **toolStore**: Active tool state (session-only)
- **canvasStore**: Document and history (IndexedDB)

## Usage Examples

### Basic Usage
```tsx
import { useColors, useBrushSettings, TOOL_IDS, useToolStore } from './context/state';

function MyComponent() {
  const { primaryColor, setPrimaryColor } = useColors();
  const { brushSize, setBrushSize } = useBrushSettings();
  const setTool = useToolStore(state => state.setTool);

  return (
    <div>
      <input
        type="color"
        value={primaryColor}
        onChange={(e) => setPrimaryColor(e.target.value)} // Auto-persists!
      />
      <button onClick={() => setTool(TOOL_IDS.BRUSH)}>Brush</button>
    </div>
  );
}
```

### App Initialization
```tsx
import { useInitializeStores } from './context/state';

function App() {
  const { isInitialized, error } = useInitializeStores();

  if (!isInitialized) return <div>Loading...</div>;

  return <YourApp />;
}
```

### Undo/Redo with IndexedDB
```tsx
import { useHistory } from './context/state';

function Canvas() {
  const { saveState, undo, redo, canUndo, canRedo } = useHistory();

  const handleDraw = async (ctx, imageData) => {
    await saveState(imageData); // Saves to IndexedDB
  };

  const handleUndo = async () => {
    const prevState = await undo(); // Loads from IndexedDB
    if (prevState) ctx.putImageData(prevState, 0, 0);
  };

  return (
    <div>
      <button onClick={handleUndo} disabled={!canUndo}>Undo</button>
      <button onClick={handleRedo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

## Performance Comparison

### Before (React Context)
```tsx
// ❌ Re-renders on ANY state change
const { state, dispatch } = useAppState();

// ❌ Manual dispatch with action types
dispatch({ type: 'SET_PRIMARY_COLOR', payload: color });

// ❌ No persistence - manual localStorage calls
localStorage.setItem('primaryColor', color);
```

### After (Zustand)
```tsx
// ✅ Re-renders only when primaryColor changes
const primaryColor = useSettingsStore(state => state.primaryColor);

// ✅ Direct action calls
setPrimaryColor(color);

// ✅ Auto-persists to IndexedDB
// No manual storage calls needed!
```

## Migration Path

The new stores are **100% compatible** with existing `AppContext`. You can:

1. Keep `AppContext` for now
2. Gradually migrate components to use Zustand stores
3. Remove `AppContext` once all components are migrated

See `ZUSTAND_MIGRATION.md` for detailed migration steps.

## Dependencies Added

```json
{
  "dependencies": {
    "zustand": "^5.x",  // State management
    "idb": "^8.x"       // IndexedDB wrapper
  }
}
```

## Testing

All stores can be tested without components:

```tsx
import { useSettingsStore } from './context/state';

// Get state
const state = useSettingsStore.getState();

// Set state
useSettingsStore.getState().setPrimaryColor('#ff0000');

// Reset for tests
beforeEach(() => {
  useSettingsStore.setState({ primaryColor: '#000000' });
});
```

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 87+
- ✅ Safari 14+
- ✅ All modern browsers with IndexedDB support

## Future Enhancements

Potential additions:
- [ ] Canvas thumbnails in IndexedDB
- [ ] Recent files list with preview
- [ ] Import/export settings JSON
- [ ] Sync settings across tabs (BroadcastChannel)
- [ ] Compression for large history entries
- [ ] Cloud sync (optional)

## Conclusion

This implementation provides:
- ✅ **Better Performance** - Selective re-rendering
- ✅ **Automatic Persistence** - No manual storage code
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Developer Experience** - Clean, simple API
- ✅ **Scalability** - Easy to add new stores
- ✅ **Testability** - Access stores without components

Ready to use in production! 🎨
