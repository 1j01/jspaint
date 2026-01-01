# Comprehensive Strategy: Fixing Infinite Loop Issues with Zustand

## Problem Analysis

### Root Causes Identified

1. **`useShallow` with Actions in Dependencies**
   - `useShallow` creates a new object reference on every store update
   - When these objects are used in `useEffect`/`useCallback` dependencies, they trigger re-renders
   - Location: `hooks.ts` - lines 27-129 (all `useShallow` calls)

2. **`useMemo` Combining Multiple `useShallow` Results**
   - `useClipboard()` (line 205): memoizes based on clipboard changes but includes `useShallow` objects
   - `useTextBox()` (line 238): combines two `useShallow` results with `useMemo`
   - `useViewState()` (line 282): merges two stores with `useMemo`

3. **Actions in `useCallback` Dependencies**
   - `useMenuActions.ts`: Many callbacks depend on store selectors (e.g., lines 150-364)
   - `useCanvasTextBox.ts`: line 86 includes `setTextBox` in dependencies
   - Components: `ToolOptions.tsx`, `useCanvasTextBox.ts` use `useShallow` heavily

### Current Problem Files

- ✅ **FIXED**: `src/react/hooks/useCanvasLifecycle.ts` - removed `pushTreeState` from deps
- ❌ **BROKEN**: `src/react/context/state/hooks.ts` - all custom hooks using `useShallow`
- ❌ **BROKEN**: `src/react/components/ToolOptions.tsx` - direct `useShallow` usage (lines 93, 101, 115)
- ❌ **BROKEN**: `src/react/hooks/useCanvasTextBox.ts` - direct `useShallow` usage (lines 25, 33)

## Comprehensive Refactoring Strategy

### Phase 1: Eliminate `useShallow` for Actions (HIGHEST PRIORITY)

**Principle**: Actions in Zustand are stable references and DON'T need `useShallow`.

#### Pattern to Replace

```typescript
// ❌ BAD - Creates new object every render
const { action1, action2 } = useStore(useShallow(state => ({
  action1: state.action1,
  action2: state.action2
})));
```

```typescript
// ✅ GOOD - Individual selectors (stable references)
const action1 = useStore(state => state.action1);
const action2 = useStore(state => state.action2);
```

```typescript
// ✅ BEST - Direct store access in effects (no re-renders)
useEffect(() => {
  useStore.getState().action1();
}, []); // Empty deps!
```

#### Files to Update (Priority Order)

1. **hooks.ts**: Remove ALL `useShallow` from custom hooks
2. **ToolOptions.tsx**: Replace `useShallow` with individual selectors
3. **useCanvasTextBox.ts**: Replace `useShallow` with individual selectors

### Phase 2: Fix Helper Hooks Architecture

#### Problem: Combining Multiple Stores

Current hooks like `useTextBox()`, `useViewState()`, and `useClipboard()` combine multiple stores with `useMemo`, which is fragile.

#### Solution: Split Hooks by Store

```typescript
// ❌ BAD - Combines multiple stores
export function useTextBox() {
  const toolStoreData = useToolStore(useShallow(...));
  const settingsStoreData = useSettingsStore(useShallow(...));
  return useMemo(() => ({ ...toolStoreData, ...settingsStoreData }), [...]); // fragile!
}

// ✅ GOOD - Separate hooks per store
export function useTextBoxState() {
  return useToolStore(state => state.textBox);
}

export function useTextBoxActions() {
  const setTextBox = useToolStore(state => state.setTextBox);
  const clearTextBox = useToolStore(state => state.clearTextBox);
  return { setTextBox, clearTextBox };
}

export function useTextBoxFontSettings() {
  const fontFamily = useSettingsStore(state => state.fontFamily);
  const fontSize = useSettingsStore(state => state.fontSize);
  // ... etc
  return { fontFamily, fontSize, ... };
}
```

### Phase 3: Fix `useCallback` Dependencies

#### Problem: Actions in Dependencies

```typescript
// ❌ BAD - Action in dependency array
const handleClick = useCallback(() => {
  setColor('#fff');
}, [setColor]); // setColor causes re-render loop
```

#### Solution A: Remove from Dependencies (when safe)

```typescript
// ✅ GOOD - Use getState() for stable reference
const handleClick = useCallback(() => {
  useSettingsStore.getState().setColor('#fff');
}, []); // No deps needed!
```

#### Solution B: Accept the dependency (when needed)

```typescript
// ✅ OK - Only if you NEED the action reference to change
const handleClick = useCallback(() => {
  setColor('#fff');
}, [setColor]); // Zustand actions are stable, so this won't cause loops
```

**Note**: Zustand actions ARE actually stable, so including them in deps won't cause loops. The problem is when you wrap them with `useShallow`!

### Phase 4: Refactor Individual Hook Patterns

#### 1. `useColors()` - REMOVE `useShallow`

```typescript
// Current (BROKEN):
export function useColors() {
  return useSettingsStore(useShallow(state => ({
    primaryColor: state.primaryColor,
    secondaryColor: state.secondaryColor,
    palette: state.palette,
    setPrimaryColor: state.setPrimaryColor,
    setSecondaryColor: state.setSecondaryColor,
    swapColors: state.swapColors,
  })));
}

// Fixed (STABLE):
export function useColors() {
  const primaryColor = useSettingsStore(state => state.primaryColor);
  const secondaryColor = useSettingsStore(state => state.secondaryColor);
  const palette = useSettingsStore(state => state.palette);
  const setPrimaryColor = useSettingsStore(state => state.setPrimaryColor);
  const setSecondaryColor = useSettingsStore(state => state.setSecondaryColor);
  const swapColors = useSettingsStore(state => state.swapColors);

  return {
    primaryColor,
    secondaryColor,
    palette,
    setPrimaryColor,
    setSecondaryColor,
    swapColors,
  };
}

// OR split into two hooks:
export function useColorValues() {
  const primaryColor = useSettingsStore(state => state.primaryColor);
  const secondaryColor = useSettingsStore(state => state.secondaryColor);
  const palette = useSettingsStore(state => state.palette);
  return { primaryColor, secondaryColor, palette };
}

export function useColorActions() {
  const setPrimaryColor = useSettingsStore(state => state.setPrimaryColor);
  const setSecondaryColor = useSettingsStore(state => state.setSecondaryColor);
  const swapColors = useSettingsStore(state => state.swapColors);
  return { setPrimaryColor, setSecondaryColor, swapColors };
}
```

#### 2. `useClipboard()` - REMOVE `useMemo`

```typescript
// Current (BROKEN):
export function useClipboard() {
  const clipboard = useToolStore(state => state.clipboard);

  return useMemo(() => ({
    clipboard,
    hasClipboard: clipboard !== null,
    ...clipboardHelpers,
  }), [clipboard]); // useMemo is unnecessary here!
}

// Fixed (STABLE):
export function useClipboard() {
  const clipboard = useToolStore(state => state.clipboard);
  const hasClipboard = clipboard !== null;

  // Just return directly - no useMemo needed
  return {
    clipboard,
    hasClipboard,
    ...clipboardHelpers, // These are module-level, already stable
  };
}
```

#### 3. `useTextBox()` - SPLIT STORES

```typescript
// Current (BROKEN):
export function useTextBox() {
  const { textBox, setTextBox, clearTextBox } = useToolStore(useShallow(...));
  const { fontFamily, fontSize, ... } = useSettingsStore(useShallow(...));

  return useMemo(() => ({ ...both stores }), [...]); // Fragile!
}

// Fixed (STABLE):
export function useTextBoxState() {
  return useToolStore(state => state.textBox);
}

export function useTextBoxActions() {
  return {
    setTextBox: useToolStore(state => state.setTextBox),
    clearTextBox: useToolStore(state => state.clearTextBox),
  };
}

// Components can call both hooks if needed:
const textBox = useTextBoxState();
const { setTextBox, clearTextBox } = useTextBoxActions();
const { fontFamily, fontSize } = useFontSettings();
```

#### 4. `useTreeHistory()` - ALREADY GOOD (but can improve)

```typescript
// Current approach is OK, but we can make it better:
export function useTreeHistory() {
  return useHistoryStore(useShallow(state => ({
    historyTree: state.historyTree,
    getRoot: state.getRoot,
    // ... all actions
  })));
}

// Better - split state from actions:
export function useHistoryTreeActions() {
  return {
    pushState: useHistoryStore(state => state.pushState),
    undo: useHistoryStore(state => state.undo),
    redo: useHistoryStore(state => state.redo),
    goToNode: useHistoryStore(state => state.goToNode),
    // ...etc
  };
}

export function useHistoryTreeState() {
  return useHistoryStore(state => state.historyTree);
}
```

## Implementation Checklist

### Step 1: Update `hooks.ts` (src/react/context/state/hooks.ts)

- [ ] Remove ALL `useShallow` imports
- [ ] Refactor `useColors()` - individual selectors
- [ ] Refactor `useShapeSettings()` - individual selectors
- [ ] Refactor `useBrushSettings()` - individual selectors
- [ ] Refactor `useFontSettings()` - individual selectors
- [ ] Refactor `useHistory()` - individual selectors
- [ ] Refactor `useTreeHistory()` - individual selectors
- [ ] Refactor `useCanvasDimensions()` - individual selectors
- [ ] Refactor `useTool()` - individual selectors
- [ ] Refactor `useSelection()` - individual selectors
- [ ] Fix `useClipboard()` - remove `useMemo`
- [ ] Fix `useTextBox()` - split into separate hooks
- [ ] Fix `useViewState()` - split into separate hooks
- [ ] Refactor `useMagnification()` - individual selectors
- [ ] Refactor `useCursorPosition()` - individual selectors
- [ ] Refactor `useApp()` - individual selectors

### Step 2: Update Direct `useShallow` Usage

- [ ] `ToolOptions.tsx` - lines 93-99 (textBox)
- [ ] `ToolOptions.tsx` - lines 101-112 (font settings)
- [ ] `ToolOptions.tsx` - lines 115-120 (drawOpaque)
- [ ] `useCanvasTextBox.ts` - lines 25-31 (textBox)
- [ ] `useCanvasTextBox.ts` - lines 33-41 (font settings)

### Step 3: Verify No Actions in `useEffect`/`useCallback` Dependencies

- [ ] Review all `useCallback` in `useMenuActions.ts`
- [ ] Review all `useEffect` in components
- [ ] Ensure actions are either:
  - Used with `getState()` (preferred)
  - OR included in deps but NOT wrapped in `useShallow`

### Step 4: Testing

- [ ] Test canvas initialization (no infinite loops)
- [ ] Test drawing tools (pencil, brush, etc.)
- [ ] Test selection tools
- [ ] Test text tool
- [ ] Test undo/redo (history tree)
- [ ] Test all dialogs
- [ ] Test color picker
- [ ] Test menu actions
- [ ] Monitor console for re-render warnings

## Migration Guidelines for Developers

### DO ✅

1. **Use individual selectors**
   ```typescript
   const color = useSettingsStore(state => state.primaryColor);
   const setColor = useSettingsStore(state => state.setPrimaryColor);
   ```

2. **Use `getState()` in effects**
   ```typescript
   useEffect(() => {
     useHistoryStore.getState().pushState(...);
   }, []);
   ```

3. **Split complex hooks by concern**
   ```typescript
   const textBox = useTextBoxState();
   const { setTextBox } = useTextBoxActions();
   ```

### DON'T ❌

1. **Don't use `useShallow` for actions**
   ```typescript
   // ❌ NEVER DO THIS
   const { action } = useStore(useShallow(state => ({ action: state.action })));
   ```

2. **Don't combine stores with `useMemo`**
   ```typescript
   // ❌ NEVER DO THIS
   const store1 = useStore1(useShallow(...));
   const store2 = useStore2(useShallow(...));
   return useMemo(() => ({ ...store1, ...store2 }), [store1, store2]);
   ```

3. **Don't wrap store calls in unnecessary hooks**
   ```typescript
   // ❌ NEVER DO THIS
   const setColor = useCallback(() => {
     useSettingsStore.getState().setColor('#fff');
   }, [/* some changing dependency */]); // Wrapping is unnecessary!

   // ✅ DO THIS INSTEAD
   const handleClick = () => {
     useSettingsStore.getState().setColor('#fff');
   }; // No useCallback needed!
   ```

## Alternative: Nuclear Option (if above fails)

If the incremental refactoring doesn't work, consider:

1. **Remove all custom hooks from `hooks.ts`**
2. **Have components call stores directly**
   ```typescript
   const color = useSettingsStore(state => state.primaryColor);
   const setColor = useSettingsStore(state => state.setPrimaryColor);
   ```

This is more verbose but guarantees stability.

## Expected Outcomes

After refactoring:

1. ✅ No infinite render loops
2. ✅ Stable action references
3. ✅ Minimal re-renders (only when state actually changes)
4. ✅ Predictable hook behavior
5. ✅ Better performance

## Timeline

- **Phase 1**: 1-2 hours (remove `useShallow` from hooks.ts)
- **Phase 2**: 1 hour (update direct usage in components)
- **Phase 3**: 30 min (verify deps)
- **Phase 4**: 1 hour (testing)

**Total**: ~4 hours

## Notes

- Zustand actions ARE stable - the problem is wrapping them with `useShallow`
- `useShallow` is ONLY needed for primitive values when you're selecting multiple fields
- For single values or functions, individual selectors are better
- `getState()` is the most stable way to access actions in effects
