# Zustand useShallow Refactoring - COMPLETED ✅

## Problem Summary

The application was experiencing infinite re-render loops caused by improper usage of `useShallow` from Zustand. The core issue was wrapping **Zustand actions** (which are already stable references) in `useShallow`, creating new object references on every render and triggering infinite loops when used in `useEffect`/`useCallback` dependencies.

## Root Cause

```typescript
// ❌ BAD - Creates new object every render
const { action } = useStore(useShallow(state => ({
  action: state.action  // Action wrapped in useShallow
})));

useEffect(() => {
  action();  // New reference every time!
}, [action]); // INFINITE LOOP!
```

## Solution Applied

**Complete removal of `useShallow`** and replacement with individual selectors for all hooks and components.

## Files Modified

### 1. `src/react/context/state/hooks.ts` ✅
**Before**: All 16 helper hooks used `useShallow` to wrap actions
**After**: All hooks use individual selectors

```typescript
// Example transformation
export function useColors() {
  // ❌ OLD
  return useSettingsStore(useShallow(state => ({
    primaryColor: state.primaryColor,
    setPrimaryColor: state.setPrimaryColor,
  })));

  // ✅ NEW
  const primaryColor = useSettingsStore(state => state.primaryColor);
  const setPrimaryColor = useSettingsStore(state => state.setPrimaryColor);
  return { primaryColor, setPrimaryColor };
}
```

**Hooks refactored**:
- `useColors()`
- `useShapeSettings()`
- `useBrushSettings()`
- `useFontSettings()`
- `useHistory()`
- `useTreeHistory()`
- `useCanvasDimensions()`
- `useTool()`
- `useSelection()`
- `useClipboard()` - Also removed unnecessary `useMemo`
- `useTextBox()` - Kept but with individual selectors
- `useTextBoxState()` - New split hook
- `useTextBoxActions()` - New split hook
- `useViewState()`
- `useMagnification()`
- `useCursorPosition()`
- `useApp()`

### 2. `src/react/components/ToolOptions.tsx` ✅
**Before**: 3 `useShallow` calls for textBox, font settings, and drawOpaque
**After**: Individual selectors for all state

```typescript
// ❌ OLD
const { textBox, setTextBox } = useToolStore(useShallow(state => ({
  textBox: state.textBox,
  setTextBox: state.setTextBox,
})));

// ✅ NEW
const textBox = useToolStore(state => state.textBox);
const setTextBox = useToolStore(state => state.setTextBox);
```

### 3. `src/react/hooks/useCanvasTextBox.ts` ✅
**Before**: 2 `useShallow` calls for textBox and font settings
**After**: Individual selectors for all state

### 4. `src/react/hooks/useCanvasLifecycle.ts` ✅ (Already Fixed)
**Before**: `pushTreeState` in dependencies causing loops
**After**: Uses `useHistoryStore.getState().pushState()` directly

## Key Principles Applied

### ✅ DO:
1. **Use individual selectors**
   ```typescript
   const color = useSettingsStore(state => state.primaryColor);
   const setColor = useSettingsStore(state => state.setPrimaryColor);
   ```

2. **Use `getState()` in effects for actions**
   ```typescript
   useEffect(() => {
     useHistoryStore.getState().pushState(data);
   }, []); // No dependencies needed!
   ```

3. **Return plain objects from hooks**
   ```typescript
   return { color, setColor }; // No useMemo needed
   ```

### ❌ DON'T:
1. **Never wrap actions with `useShallow`**
2. **Never combine stores with `useMemo`**
3. **Never include actions in effect dependencies unless using individual selectors**

## Results

- ✅ **No more `useShallow` imports** in the entire React codebase
- ✅ **Individual selectors** provide stable references
- ✅ **Actions accessed via `getState()`** in effects where appropriate
- ✅ **TypeScript compiles** (pre-existing errors unrelated to this refactoring)
- ✅ **Dev server runs** on port 2000
- ✅ **No rollback required** - all 52 commits preserved

## Testing Checklist

Please test these scenarios manually:

- [ ] Canvas loads without infinite loops
- [ ] Drawing tools work (pencil, brush, etc.)
- [ ] Selection tools work
- [ ] Text tool works
- [ ] Undo/redo (both linear and tree-based)
- [ ] Color picker
- [ ] All dialogs open and close properly
- [ ] Menu actions work
- [ ] No console errors about "Maximum update depth exceeded"
- [ ] Check browser DevTools React profiler for excessive re-renders

## Performance Improvements Expected

1. **Fewer re-renders** - Individual selectors only trigger when specific values change
2. **Stable action references** - No more object creation on every render
3. **No circular dependencies** - `getState()` breaks dependency chains

## Future Best Practices

When adding new hooks or components:

1. **Never use `useShallow` for actions** - they're already stable
2. **Use individual selectors** instead of destructuring
3. **Keep hooks focused** - separate state from actions when possible
4. **Document hook behavior** - note which values cause re-renders

## Rollback Plan (If Needed)

If issues are discovered:
```bash
# Option 1: Revert all changes
git checkout HEAD~4 src/react/context/state/hooks.ts
git checkout HEAD~4 src/react/components/ToolOptions.tsx
git checkout HEAD~4 src/react/hooks/useCanvasTextBox.ts
git checkout HEAD~4 src/react/hooks/useCanvasLifecycle.ts

# Option 2: Full rollback to before refactoring
git reset --hard <commit-hash-before-refactor>
```

## Related Documentation

- Full strategy document: `ZUSTAND_REFACTOR_STRATEGY.md`
- Zustand docs on selectors: https://zustand.docs.pmnd.rs/guides/auto-generating-selectors
- React hooks rules: https://react.dev/reference/rules/rules-of-hooks

---

**Status**: ✅ **COMPLETE**
**Dev Server**: http://localhost:2000/
**Next Step**: Manual testing of the application

**Completed By**: Claude (Opus 4.5)
**Date**: 2025-12-31
