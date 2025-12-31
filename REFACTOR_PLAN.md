# React Codebase Refactoring Plan

## Overview

This document outlines a systematic refactoring plan for the MCPaint React codebase to address component bloat and improve maintainability. The refactoring will extract **2,488 lines** of code from 6 large files into **32 focused, single-responsibility files**.

## Current State

### Files Requiring Refactoring

| File | Lines | Main Issues |
|------|-------|-------------|
| Canvas.tsx | 848 | Event handlers, lifecycle, tool orchestration mixed |
| App.tsx | 620 | Dialog handlers, constants, state extraction mixed |
| EditColorsDialog.tsx | 496 | Canvas rendering, color logic, UI rendering mixed |
| ToolOptions.tsx | 463 | 7 different option renderers inline |
| useCanvasSelection.ts | 440 | Selection logic, animation, drawing mixed |
| useMenuActions.ts | 381 | All menu actions in one monolithic hook |

### Target State

- **38 focused files** averaging ~85 lines each
- Clear separation: Utils (pure functions) / Hooks (state + effects) / Components (UI)
- Improved testability and maintainability
- No functional changes - pure refactoring

---

## Refactoring Phases

### Phase 1: Canvas.tsx (Priority: HIGH)
**Estimated Time**: 2-3 hours
**Risk Level**: Medium (core functionality)
**Files to Create**: 5

#### 1.1 Extract useCanvasLifecycle.ts
**Status**: ✅ COMPLETE
**Lines**: 120
**Location**: `src/react/hooks/useCanvasLifecycle.ts`

#### 1.2 Extract useAirbrushEffect.ts
**Status**: ✅ COMPLETE
**Lines**: 65
**Location**: `src/react/hooks/useAirbrushEffect.ts`

#### 1.3 Extract useCanvasEventHandlers.ts
**Status**: 🔲 TODO
**Lines**: ~350
**Location**: `src/react/hooks/useCanvasEventHandlers.ts`

**What to extract**:
- `handlePointerDown` (~120 lines)
- `handlePointerMove` (~80 lines)
- `handlePointerUp` (~120 lines)
- `handlePointerLeave` (~30 lines)

**Interface**:
```typescript
export function useCanvasEventHandlers({
  canvasRef,
  drawing,
  selectionHook,
  textBoxHook,
  shapes,
  curvePolygon,
  selectedToolId,
  saveHistoryState,
  setCursorPosition
}): {
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: (e: React.PointerEvent) => void;
  handlePointerLeave: (e: React.PointerEvent) => void;
}
```

#### 1.4 Extract canvasHelpers.ts
**Status**: 🔲 TODO
**Lines**: ~140
**Location**: `src/react/utils/canvasHelpers.ts`

**What to extract**:
- `getCursorForTool(toolId: string): string` (~40 lines)
- `handleSelectionResize()` (~50 lines)
- `handleCanvasResize()` (~50 lines)

#### 1.5 Update Canvas.tsx
**Status**: 🔲 TODO
**Result**: 848 → ~200 lines

**Changes**:
```typescript
// Before: All logic inline

// After: Composed from hooks
export function Canvas({ canvasRef, className = "" }) {
  useCanvasLifecycle(canvasRef);

  const drawing = useCanvasDrawing(canvasRef);
  const shapes = useCanvasShapes(canvasRef, drawing);
  const selectionHook = useCanvasSelection({ canvasRef, ... });
  const textBoxHook = useCanvasTextBox(canvasRef);
  const curvePolygon = useCanvasCurvePolygon(canvasRef, drawing);

  useAirbrushEffect({ canvasRef, selectedToolId, drawing, shapes });

  const eventHandlers = useCanvasEventHandlers({
    canvasRef,
    drawing,
    selectionHook,
    textBoxHook,
    shapes,
    curvePolygon,
    selectedToolId,
    saveHistoryState,
    setCursorPosition
  });

  return <canvas ref={canvasRef} {...eventHandlers} />;
}
```

---

### Phase 2: App.tsx (Priority: HIGH)
**Estimated Time**: 1-2 hours
**Risk Level**: Low (mostly orchestration)
**Files to Create**: 5

#### 2.1 Extract useDialogHandlers.ts
**Status**: 🔲 TODO
**Lines**: ~200
**Location**: `src/react/hooks/useDialogHandlers.ts`

**What to extract**:
- `handleFlipRotate`
- `handleStretchSkew`
- `handleAttributes`
- `handleLoadFromUrl`
- `handleSaveAs`
- `handleInvertColors`
- `handleColorSelect`
- `handleClearImage`
- `handleSelectAll`
- `handleHistoryNavigate`

#### 2.2 Extract toolboxItems.ts
**Status**: 🔲 TODO
**Lines**: ~100
**Location**: `src/react/data/toolboxItems.ts`

**What to extract**:
```typescript
export const TOOLBOX_ITEMS: Tool[] = [ /* 16 tools */ ];
```

#### 2.3 Extract ErrorBoundary.tsx
**Status**: 🔲 TODO
**Lines**: ~30
**Location**: `src/react/components/ErrorBoundary.tsx`

#### 2.4 Extract useFontState.ts
**Status**: 🔲 TODO
**Lines**: ~60
**Location**: `src/react/hooks/useFontState.ts`

#### 2.5 Simplify useMenuActions.ts
**Status**: 🔲 TODO
**Changes**: Move store access inside the hook instead of passing massive params object

#### 2.6 Update App.tsx
**Status**: 🔲 TODO
**Result**: 620 → ~180 lines

---

### Phase 3: EditColorsDialog.tsx (Priority: MEDIUM)
**Estimated Time**: 2-3 hours
**Risk Level**: Medium (complex canvas operations)
**Files to Create**: 3

#### 3.1 Extract useColorPicker.ts
**Status**: 🔲 TODO
**Lines**: ~100

#### 3.2 Extract useColorCanvases.ts
**Status**: 🔲 TODO
**Lines**: ~140

#### 3.3 Extract ColorPickerCanvas.tsx
**Status**: 🔲 TODO
**Lines**: ~80

#### 3.4 Extract ColorInputs.tsx
**Status**: 🔲 TODO
**Lines**: ~100

#### 3.5 Update EditColorsDialog.tsx
**Status**: 🔲 TODO
**Result**: 496 → ~170 lines

---

### Phase 4: ToolOptions.tsx (Priority: MEDIUM)
**Estimated Time**: 2-3 hours
**Risk Level**: Low (UI only)
**Files to Create**: 9

#### 4.1 Create tooloptions/ directory
**Status**: 🔲 TODO

#### 4.2 Extract option components
**Status**: 🔲 TODO
- FillStyleOptions.tsx (~50 lines)
- LineWidthOptions.tsx (~50 lines)
- BrushSizeOptions.tsx (~60 lines)
- EraserSizeOptions.tsx (~50 lines)
- AirbrushSizeOptions.tsx (~70 lines)
- TextOptions.tsx (~60 lines)
- TransparencyModeOptions.tsx (~60 lines)

#### 4.3 Extract toolOptionsData.ts
**Status**: 🔲 TODO
**Lines**: ~50

#### 4.4 Extract toolOptionsHelpers.ts
**Status**: 🔲 TODO
**Lines**: ~40

#### 4.5 Update ToolOptions.tsx
**Status**: 🔲 TODO
**Result**: 463 → ~60 lines

---

### Phase 5: useCanvasSelection.ts (Priority: LOW)
**Estimated Time**: 1-2 hours
**Risk Level**: Medium (complex selection logic)
**Files to Create**: 4

#### 5.1 Extract selectionDrawing.ts
**Status**: 🔲 TODO
**Lines**: ~140

#### 5.2 Extract useSelectionAnimation.ts
**Status**: 🔲 TODO
**Lines**: ~80

#### 5.3 Extract useRectangularSelection.ts
**Status**: 🔲 TODO
**Lines**: ~120

#### 5.4 Extract useFreeFormSelection.ts
**Status**: 🔲 TODO
**Lines**: ~120

#### 5.5 Update useCanvasSelection.ts
**Status**: 🔲 TODO
**Result**: 440 → ~100 lines (facade hook)

---

### Phase 6: useMenuActions.ts (Priority: LOW)
**Estimated Time**: 1-2 hours
**Risk Level**: Low (straightforward split)
**Files to Create**: 6

#### 6.1 Extract menu-specific hooks
**Status**: 🔲 TODO
- useFileMenuActions.ts (~140 lines)
- useEditMenuActions.ts (~110 lines)
- useViewMenuActions.ts (~90 lines)
- useImageMenuActions.ts (~60 lines)
- useColorsMenuActions.ts (~40 lines)

#### 6.2 Extract fileOperations.ts
**Status**: 🔲 TODO
**Lines**: ~60

#### 6.3 Update useMenuActions.ts
**Status**: 🔲 TODO
**Result**: 381 → ~50 lines (facade pattern)

---

## Testing Strategy

After each phase:

1. **Compile check**: `npm run tsc`
2. **Manual testing**: Test all affected tools/features
3. **Git commit**: Atomic commits per phase
4. **Rollback plan**: Revert if issues found

### Test Cases by Phase

#### Phase 1 (Canvas.tsx)
- ✅ All 16 tools still work
- ✅ Undo/redo works
- ✅ Selection + resize works
- ✅ Text tool works
- ✅ Airbrush continuous spray works

#### Phase 2 (App.tsx)
- ✅ All dialogs open and function
- ✅ Menu actions work
- ✅ Font box updates correctly

#### Phase 3 (EditColorsDialog.tsx)
- ✅ Color picker works
- ✅ HSL/RGB inputs update correctly
- ✅ Color selection works

#### Phase 4 (ToolOptions.tsx)
- ✅ All tool options render correctly
- ✅ Brush shapes render correctly
- ✅ Option changes apply to tools

#### Phase 5 (useCanvasSelection.ts)
- ✅ Rectangular selection works
- ✅ Free-form selection works
- ✅ Marching ants animate
- ✅ Selection resize works

#### Phase 6 (useMenuActions.ts)
- ✅ All menu items work
- ✅ File operations work
- ✅ View zoom works

---

## File Structure After Refactoring

```
src/react/
├── components/
│   ├── Canvas.tsx (848 → 200 lines)
│   ├── ErrorBoundary.tsx (NEW, 30 lines)
│   ├── dialogs/
│   │   ├── EditColorsDialog.tsx (496 → 170 lines)
│   │   ├── ColorPickerCanvas.tsx (NEW, 80 lines)
│   │   └── ColorInputs.tsx (NEW, 100 lines)
│   └── tooloptions/
│       ├── FillStyleOptions.tsx (NEW, 50 lines)
│       ├── LineWidthOptions.tsx (NEW, 50 lines)
│       ├── BrushSizeOptions.tsx (NEW, 60 lines)
│       ├── EraserSizeOptions.tsx (NEW, 50 lines)
│       ├── AirbrushSizeOptions.tsx (NEW, 70 lines)
│       ├── TextOptions.tsx (NEW, 60 lines)
│       └── TransparencyModeOptions.tsx (NEW, 60 lines)
├── hooks/
│   ├── useCanvasLifecycle.ts (NEW, 120 lines)
│   ├── useAirbrushEffect.ts (NEW, 65 lines)
│   ├── useCanvasEventHandlers.ts (NEW, 350 lines)
│   ├── useDialogHandlers.ts (NEW, 200 lines)
│   ├── useFontState.ts (NEW, 60 lines)
│   ├── useColorPicker.ts (NEW, 100 lines)
│   ├── useColorCanvases.ts (NEW, 140 lines)
│   ├── useSelectionAnimation.ts (NEW, 80 lines)
│   ├── useRectangularSelection.ts (NEW, 120 lines)
│   ├── useFreeFormSelection.ts (NEW, 120 lines)
│   ├── useCanvasSelection.ts (440 → 100 lines)
│   ├── useFileMenuActions.ts (NEW, 140 lines)
│   ├── useEditMenuActions.ts (NEW, 110 lines)
│   ├── useViewMenuActions.ts (NEW, 90 lines)
│   ├── useImageMenuActions.ts (NEW, 60 lines)
│   ├── useColorsMenuActions.ts (NEW, 40 lines)
│   └── useMenuActions.ts (381 → 50 lines)
├── utils/
│   ├── canvasHelpers.ts (NEW, 140 lines)
│   ├── selectionDrawing.ts (NEW, 140 lines)
│   ├── toolOptionsHelpers.ts (NEW, 40 lines)
│   └── fileOperations.ts (NEW, 60 lines)
└── data/
    ├── toolboxItems.ts (NEW, 100 lines)
    └── toolOptionsData.ts (NEW, 50 lines)
```

---

## Progress Tracking

### Completed
- ✅ useCanvasLifecycle.ts (120 lines extracted)
- ✅ useAirbrushEffect.ts (65 lines extracted)

### In Progress
- 🔄 Phase 1: Canvas.tsx refactoring

### Todo
- 🔲 Phase 2: App.tsx refactoring
- 🔲 Phase 3: EditColorsDialog.tsx refactoring
- 🔲 Phase 4: ToolOptions.tsx refactoring
- 🔲 Phase 5: useCanvasSelection.ts refactoring
- 🔲 Phase 6: useMenuActions.ts refactoring

---

## Rollback Plan

If any phase introduces bugs:

1. **Immediate**: Revert the phase's commits
2. **Investigate**: Identify the issue in the extracted code
3. **Fix**: Correct the issue in a new branch
4. **Re-test**: Verify fix before re-applying
5. **Re-apply**: Merge the corrected refactoring

---

## Success Criteria

- ✅ All existing functionality works identically
- ✅ No new bugs introduced
- ✅ All TypeScript compilation passes
- ✅ All tests pass (when added)
- ✅ Code is more maintainable and testable
- ✅ Average file size < 250 lines
- ✅ Clear separation of concerns

---

## Next Steps

1. Complete Phase 1 (Canvas.tsx)
2. Test thoroughly
3. Commit Phase 1
4. Move to Phase 2 (App.tsx)
5. Repeat for all phases

---

## Notes

- This is a **pure refactoring** - no functional changes
- Each phase should be independently testable
- Atomic commits for easy rollback
- Focus on maintaining existing behavior
- Prioritize high-impact files first (Canvas.tsx, App.tsx)
